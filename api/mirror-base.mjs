import crypto from 'node:crypto';
import fs from 'node:fs';
import { BookingAssetCache } from './booking-asset-cache.mjs';

// Shared Playwright mirror core for booking providers. Each provider module supplies
// a config; the core owns sessions, ownership, revisions, network guards and the
// armed-submission protocol. Registry, not user-supplied URLs, in every provider.
export class MirrorError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

// Provider config shape:
// {
//   name, registryFile (URL relative to the provider module is resolved by caller),
//   assetHosts: [], providerHosts: [], writePath: RegExp, bookable: bool,
//   readySignal: '/api-fragment/' | null,
//   contactSelector, contactText: RegExp, contactFields: {name: selector},
//   matches(payload, approved, venueId, path) -> bool — every provider POST during an
//   armed submission must pass; required when bookable is true
// }
export function baseAllowedRequest(config, method, address) {
  let url;
  try { url = new URL(address); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  if (config.assetHosts.includes(url.hostname)) return method === 'GET';
  if (!config.providerHosts.includes(url.hostname)) return false;
  if (!['GET', 'HEAD'].includes(method)) {
    // Some providers echo UI selections via session-scoped POSTs. Only explicitly
    // reviewed, non-reserving read-state endpoints may pass.
    return method === 'POST' && (config.allowReadPosts || []).some(re => re.test(url.pathname));
  }
  if (config.writePath.test(url.pathname)) return false;
  return true;
}

export class ProviderMirror {
  constructor(config, { prepare = false, live = false, authorizeSubmission = null, reserveSubmission = null, recordResult = null } = {}) {
    this.config = config;
    this.RESTAURANT_DETAILS = Object.freeze(JSON.parse(fs.readFileSync(config.registryFile, 'utf8')));
    this.RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(this.RESTAURANT_DETAILS).map(([id, row]) => [id, row.url])));
    this.prepare = prepare;
    this.authorizeSubmission = authorizeSubmission;
    this.reserveSubmission = reserveSubmission;
    this.live = live;
    this.recordResult = recordResult;
    this.sessions = new Map();
    this.assets = new BookingAssetCache();
    this.browserPromise = null;
    this.pending = 0;
    this.pendingOwners = new Set();
    this.timer = setInterval(() => this.expire(), 30_000);
    this.timer.unref();
  }
  async browser() {
    if (!this.browserPromise) {
      this.browserPromise = import('playwright').then(({ chromium }) => chromium.launch({ headless: true }))
        .catch(error => { this.browserPromise = null; throw error; });
    }
    return this.browserPromise;
  }
  async create(owner, restaurantId, width = 420) {
    if (!owner) throw new MirrorError('auth', 401);
    const address = this.RESTAURANTS[restaurantId];
    if (!address) throw new MirrorError('pilot_only');
    if (this.sessions.size + this.pending >= 4) throw new MirrorError('capacity', 429);
    if (this.pendingOwners.has(owner) || [...this.sessions.values()].some(s => s.owner === owner)) throw new MirrorError('session_exists', 409);
    this.pending++;
    this.pendingOwners.add(owner);
    let context;
    let sessionId;
    try {
      const browser = await this.browser();
      width = Math.max(320, Math.min(760, Math.round(Number(width) || 420)));
      context = await browser.newContext({ viewport: { width, height: 760 }, locale: 'en-US', serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, restaurant: this.RESTAURANT_DETAILS[restaurantId].name, context, width, height: 760, revision: 0, busy: false, touched: Date.now(), blocked: false, contact: false, inFlight: 0 };
      sessionId = s.id;
      const config = this.config;
      await context.route('**/*', async route => {
        const r = route.request();
        const path = new URL(r.url()).pathname;
        const isProvider = config.providerHosts.includes(new URL(r.url()).hostname);
        const isReadPost = (config.allowReadPosts || []).some(re => re.test(path));
        if (isProvider && r.method() === 'POST' && !isReadPost && !/telemetry|metrics|collect|log|sentry|analytics/i.test(path)) {
          // No provider mutation may leave the browser outside one armed, approved
          // submission. Inside it, every POST must match the approval exactly.
          if (!s.armed || s.submitted) { s.blocked = true; return route.abort(); }
          let payload;
          try { payload = r.postDataJSON(); } catch {}
          if (!config.matches(payload, s.approval, this.RESTAURANT_DETAILS[s.restaurantId].venueId, path)) { s.blocked = true; s.result = { status: 'payload_mismatch' }; return route.abort(); }
          try { await this.reserveSubmission(s.approval, s); } catch { s.result = { status: 'already_attempted' }; return route.abort(); }
          s.submitted = true; s.result = { status: 'unknown' };
          return route.continue();
        }
        if (!baseAllowedRequest(config, r.method(), r.url())) {
          if ((r.isNavigationRequest() && r.frame() === s.page?.mainFrame()) || r.method() !== 'GET') s.blocked = true;
          return route.abort();
        }
        return this.assets.handle(route);
      });
      s.page = await context.newPage();
      if (config.readySignal) {
        s.page.on('request', r => { if (r.url().includes(config.readySignal)) s.inFlight++; });
        s.page.on('requestfinished', r => { if (r.url().includes(config.readySignal)) s.inFlight = Math.max(0, s.inFlight - 1); });
        s.page.on('requestfailed', r => { if (r.url().includes(config.readySignal)) s.inFlight = Math.max(0, s.inFlight - 1); });
      }
      s.page.on('response', response => {
        this.assets.capture(response).catch(() => {});
        if (!s.submitted) return;
        const url = new URL(response.url());
        if (!config.providerHosts.includes(url.hostname) || response.request().method() !== 'POST') return;
        if (/telemetry|metrics|collect|log|sentry|analytics/i.test(url.pathname)) return;
        s.resultPromise = (async () => {
          const data = await response.json().catch(() => null);
          const id = data?.reservation?.id ?? data?.reservation_id ?? data?.id ?? data?.confirmation_number;
          if (response.ok() && id) s.result = { status: 'confirmed', reference: String(id) };
          else if (response.ok()) s.result = { status: 'unknown' };
          else s.result = { status: 'rejected' };
          await this.recordResult?.(s);
        })().catch(() => { s.result = { status: 'unknown' }; });
      });
      s.page.setDefaultTimeout(12_000);
      context.on('page', page => { if (page !== s.page) page.close().catch(() => {}); });
      await s.page.goto(address, { waitUntil: 'domcontentloaded' }).catch(async error => {
        // Some providers keep loading when their trackers are blocked; a committed
        // navigation with content is still inspectable.
        await s.page.goto(address, { waitUntil: 'commit' }).catch(() => { throw error; });
      });
      // Language-independent: wait for the first interactive control, else any content.
      await s.page.locator('button:visible, select:visible, input:visible').first().waitFor()
        .catch(() => s.page.waitForFunction(() => document.body?.innerText?.length > 100, null, { timeout: 12_000 }));
      await this.settle(s);
      await this.detectContact(s);
      this.sessions.set(s.id, s);
      return await this.snapshot(s);
    } catch (error) { this.sessions.delete(sessionId); await context?.close(); throw error; }
    finally { this.pending--; this.pendingOwners.delete(owner); }
  }
  owned(id, owner) {
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner) throw new MirrorError('session_expired', 404);
    if (Date.now() - s.touched > 10 * 60_000) { this.remove(id, owner); throw new MirrorError('session_expired', 404); }
    return s;
  }
  async settle(s) {
    // Wait for the provider's own API queue to drain, not a fixed delay.
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (s.inFlight === 0 && await s.page.evaluate(() => document.readyState === 'complete').catch(() => true)) break;
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    await s.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))).catch(() => {});
  }
  async detectContact(s) {
    // Interaction stops at the guest-detail step unless a live submission is armed.
    const byField = await s.page.locator(this.config.contactSelector).first().isVisible().catch(() => false);
    const byText = await s.page.getByText(this.config.contactText).first().isVisible().catch(() => false);
    s.contact = !!(byField || byText);
  }
  // Read the provider's own checkout state; never alter it or call its save method.
  async bookingDetails(s) {
    const url = new URL(s.page.url());
    const q = url.searchParams;
    const fields = await s.page.evaluate(selectors => {
      const out = {};
      for (const [name, selector] of Object.entries(selectors)) {
        const input = [...document.querySelectorAll(selector.replace(/:visible/g, ''))].find(el => el.getClientRects().length);
        if (input) out[name] = input.value;
      }
      return out;
    }, this.config.contactFields).catch(() => ({}));
    const date = q.get('date') || '';
    const time = q.get('time') || q.get('time_slot') || '';
    const party = Number(q.get('party_size') || q.get('partySize') || q.get('covers') || 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(time) || !(party > 0)) return null;
    if (!fields.firstname || !fields.lastname || !fields.email || !fields.phone) return null;
    return { date, time: time.slice(0, 5), party, firstname: fields.firstname, lastname: fields.lastname, email: fields.email, phone: fields.phone, comment: fields.comment || '', terms: true };
  }
  async cardRequired(s) {
    // Card guarantees are completed in the provider's own secure form, never here.
    return await s.page.locator('iframe[src*="stripe" i]:visible, iframe[src*="adyen" i]:visible, iframe[name*="card" i]:visible, [class*="card" i] input[name*="number" i]:visible').first().isVisible().catch(() => false);
  }
  async snapshot(s) {
    // No screenshot or session data is persisted to disk.
    const text = (await s.page.locator('body').innerText()).slice(0, 16_000);
    const title = await s.page.title().catch(() => '');
    // Observed selectable times are read-only evidence, never a reservation.
    const times = await s.page.locator('button:visible').evaluateAll(els =>
      els.map(e => (e.innerText || '').trim()).filter(t => /^\d{1,2}[:.]\d{2}\s?(am|pm)?$/i.test(t))).catch(() => []);
    const fields = s.contact && this.prepare ? await s.page.evaluate(selectors => {
      return Object.entries(selectors).flatMap(([name, selector]) => {
        const inputs = [...document.querySelectorAll(selector.replace(/:visible/g, ''))].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        if (inputs.length !== 1) return [];
        const input = inputs[0], rect = input.getBoundingClientRect();
        return [{ name, value: input.value, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }];
      });
    }, this.config.contactFields) : [];
    const details = this.live && s.contact ? await this.bookingDetails(s) : null;
    const card = s.contact ? await this.cardRequired(s) : false;
    if (card) s.handoffReason = 'card_required';
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
    s.revision++;
    const canSubmit = !!(s.contact && this.config.bookable && this.reserveSubmission && !s.submitted && !s.result && !card && (this.live ? details : await this.authorizeSubmission?.()));
    const snapshot = { id: s.id, restaurantId: s.restaurantId, restaurant: s.restaurant, revision: s.revision, width: s.width, height: s.height, image: `data:image/png;base64,${shot.toString('base64')}`, imageHash: crypto.createHash('sha256').update(shot).digest('hex'), capturedAt: new Date().toISOString(), url: s.page.url(), title, text, times: [...new Set(times)], fields, contact: s.contact, details, blocked: s.blocked, mode: this.prepare ? 'prepare' : 'inspect', canSubmit, result: s.result ? { status: s.result.status, reference: s.result.reference } : null, expiresIn: 600 };
    snapshot.handoff = { reason: s.handoffReason || 'inspect_only', url: this.RESTAURANTS[s.restaurantId] };
    s.lastSnapshot = snapshot;
    return snapshot;
  }
  current(owner) {
    const s = [...this.sessions.values()].find(row => row.owner === owner);
    if (!s) return { error: 'session_expired' };
    this.owned(s.id, owner);
    return s.lastSnapshot;
  }
  async action(id, owner, action) {
    const s = this.owned(id, owner);
    if (s.busy) throw new MirrorError('busy', 409);
    if (action.revision !== s.revision) throw new MirrorError('stale_view', 409);
    if (!['click', 'scroll', 'refresh', ...(this.prepare ? ['fill'] : []), ...((this.live || this.authorizeSubmission) && this.reserveSubmission && this.config.bookable ? ['submit'] : [])].includes(action.type)) throw new MirrorError('inspect_only');
    s.busy = true; s.touched = Date.now();
    try {
      if (action.type === 'submit') {
        if (s.submitted || s.armed || s.result) throw new MirrorError('already_attempted', 409);
        if (action.confirm !== true) throw new MirrorError('confirmation_required', 409);
        if (this.live && action.terms !== true) throw new MirrorError('confirmation_required', 409);
        if (!s.contact) throw new MirrorError('contact_required');
        if (await this.cardRequired(s)) { s.handoffReason = 'card_required'; throw new MirrorError('card_required', 409); }
        const approval = this.live ? s.lastSnapshot.details : await this.authorizeSubmission();
        if (!approval) throw new MirrorError('confirmation_required', 409);
        if (this.live && JSON.stringify(approval) !== JSON.stringify(await this.bookingDetails(s))) throw new MirrorError('stale_view', 409);
        s.approval = approval; s.armed = true;
        // The provider's own final booking button; its request is verified field-by-field
        // against the approval before it may leave the browser, exactly once.
        const confirmButton = s.page.locator('button:visible').filter({ hasText: /book now|confirm|complete|boka|slutför|réserver|reservar|reservieren|prenota/i }).last();
        const providerHosts = this.config.providerHosts;
        const response = s.page.waitForResponse(r => { try { const u = new URL(r.url()); return r.method() === 'POST' && providerHosts.includes(u.hostname) && !/telemetry|metrics|collect|log|sentry|analytics/i.test(u.pathname); } catch { return false; } }, { timeout: 20_000 }).catch(() => null);
        await confirmButton.click();
        if (s.submitted) await response;
        await s.resultPromise;
        s.armed = false;
      } else if (action.type === 'fill') {
        if (!s.contact) throw new MirrorError('contact_required');
        const entries = action.fields && typeof action.fields === 'object' && !Array.isArray(action.fields) ? Object.entries(action.fields) : [[action.field, action.value]];
        if (!entries.length || entries.length > 5 || entries.some(([field, value]) => !Object.hasOwn(this.config.contactFields, field) || typeof value !== 'string' || value.length > 300)) throw new MirrorError('field');
        for (const [field, value] of entries) {
          const input = s.page.locator(this.config.contactFields[field]).first();
          await input.fill(value);
          await input.blur();
        }
      } else if (action.type === 'click') {
        if (s.contact) throw new MirrorError('contact_stop', 409);
        const { x, y } = action;
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= s.width || y >= s.height) throw new MirrorError('coordinates');
        await s.page.mouse.click(x, y);
      } else if (action.type === 'scroll') {
        const dy = Number(action.dy);
        if (!Number.isFinite(dy) || Math.abs(dy) > 760) throw new MirrorError('scroll');
        await s.page.mouse.move(s.width / 2, s.height / 2);
        await s.page.mouse.wheel(0, dy);
      }
      await this.settle(s);
      await this.detectContact(s);
      return await this.snapshot(s);
    } finally { s.armed = false; s.busy = false; }
  }
  async remove(id, owner) {
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner) return;
    this.sessions.delete(id);
    await s.context.close();
  }
  async expire() {
    for (const s of this.sessions.values()) if (!s.busy && Date.now() - s.touched > 10 * 60_000) await this.remove(s.id, s.owner).catch(() => {});
  }
  async close() {
    clearInterval(this.timer);
    await Promise.all([...this.sessions.values()].map(s => this.remove(s.id, s.owner)));
    if (this.browserPromise) await (await this.browserPromise).close();
  }
}
