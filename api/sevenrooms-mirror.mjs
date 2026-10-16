import crypto from 'node:crypto';
import fs from 'node:fs';
import { BookingAssetCache } from './booking-asset-cache.mjs';

// Registry, not user-supplied URLs. Only reviewed restaurants with an official
// SevenRooms route are mirrored. Same ownership/session model as the Bokabord pilot.
export const RESTAURANT_DETAILS = Object.freeze(JSON.parse(fs.readFileSync(new URL('./sevenrooms-restaurants.json', import.meta.url), 'utf8')));
export const RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(RESTAURANT_DETAILS).map(([id, row]) => [id, row.url])));
const TTL = 10 * 60_000;
const MAX_SESSIONS = 4;
const ASSET_HOSTS = ['cdn.sevenrooms.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'use.fontawesome.com', 'js.stripe.com', 'm.stripe.network'];
const PROVIDER_HOSTS = ['www.sevenrooms.com', 'sevenrooms.com'];
// Reservation-creating or account paths fail closed, including any POST.
const WRITE_PATH = /create|hold|confirm|cancel|delete|checkout|payment|login|register|book|reserve|gift/i;
// The exact provider endpoints of an approved live submission (from the provider's
// own widget source, not observed by submitting anything).
const BOOK_PATH = /^\/booking\/dining\/widget\/[^/]+\/book\/?$/;
const HOLD_PATH = /^\/api-yoa\/dining\/hold\/add\/?$/;
// Guest-detail step detection: interaction stops here unless a live submission is armed.
const CONTACT_SELECTOR = 'input[type="email"]:visible, input[name*="first" i]:visible, input[name*="last" i]:visible, input[name*="phone" i]:visible, input[type="tel"]:visible';
const CONTACT_TEXT = /guest details|your details|contact information|gästuppgifter|dina uppgifter|vos coordonnées|su contacto/i;
const CONTACT_FIELDS = {
  firstname: 'input[name="first_name"]:visible, input[name*="first" i]:visible',
  lastname: 'input[name="last_name"]:visible, input[name*="last" i]:visible',
  phone: 'input[name="phone_number"]:visible, input[type="tel"]:visible',
  email: 'input[name="email"]:visible, input[type="email"]:visible',
  comment: 'textarea[name="reservation_notes"]:visible, textarea:visible',
};

// Inspection default. Unknown mutations fail closed; outside an armed, approved
// submission no reservation, hold or payment request is ever allowed through.
export function allowedRequest(method, address) {
  let url;
  try { url = new URL(address); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  if (ASSET_HOSTS.includes(url.hostname)) return method === 'GET';
  if (!PROVIDER_HOSTS.includes(url.hostname)) return false;
  if (!['GET', 'HEAD'].includes(method)) return false;
  if (WRITE_PATH.test(url.pathname)) return false;
  return true;
}

export class MirrorError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

// The provider request must reproduce the approved booking exactly. Unknown or
// extra guest-changing fields, marketing opt-ins, upgrades and gift cards fail closed.
export function matchesApprovedReservation(payload, approved, venueId) {
  if (!payload || typeof payload !== 'object' || !approved || approved.terms !== true) return false;
  const phone = normalizePhone(approved.phone);
  if (phone.length < 7 || phone.length > 15) return false;
  const data = payload.reservationData && typeof payload.reservationData === 'object' ? { ...payload, ...payload.reservationData } : payload;
  if (venueId && data.venueId && String(data.venueId) !== String(venueId)) return false;
  const marketingKeys = Object.keys(data).filter(k => /opt_?in|newsletter|marketing|sms|promo/i.test(k));
  if (marketingKeys.some(k => data[k] === true || data[k] === 'true')) return false;
  if (data.gift_card || data.giftCard || data.giftcard) return false;
  if (Array.isArray(data.upgrades) && data.upgrades.length) return false;
  if (Array.isArray(data.products) && data.products.length) return false;
  const notes = data.reservation_notes ?? data.reservationNotes ?? '';
  return String(data.date) === approved.date
    && String(data.time) === approved.time
    && Number(data.party_size ?? data.partySize) === approved.party
    && String(data.first_name ?? data.firstName) === approved.firstname
    && String(data.last_name ?? data.lastName) === approved.lastname
    && String(data.email) === approved.email
    && normalizePhone(data.phone_number ?? data.phoneNumber) === phone
    && (approved.comment === undefined ? !notes : String(notes) === approved.comment);
}

export class SevenroomsMirror {
  sessions = new Map();
  assets = new BookingAssetCache();
  browserPromise = null;
  pending = 0;
  pendingOwners = new Set();
  constructor({ prepare = false, live = false, authorizeSubmission = null, reserveSubmission = null, recordResult = null } = {}) {
    this.prepare = prepare;
    this.authorizeSubmission = authorizeSubmission;
    this.reserveSubmission = reserveSubmission;
    this.live = live;
    this.recordResult = recordResult;
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
    const address = RESTAURANTS[restaurantId];
    if (!address) throw new MirrorError('pilot_only');
    if (this.sessions.size + this.pending >= MAX_SESSIONS) throw new MirrorError('capacity', 429);
    if (this.pendingOwners.has(owner) || [...this.sessions.values()].some(s => s.owner === owner)) throw new MirrorError('session_exists', 409);
    this.pending++;
    this.pendingOwners.add(owner);
    let context;
    let sessionId;
    try {
      const browser = await this.browser();
      width = Math.max(320, Math.min(760, Math.round(Number(width) || 420)));
      context = await browser.newContext({ viewport: { width, height: 760 }, locale: 'en-US', serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, restaurant: RESTAURANT_DETAILS[restaurantId].name, context, width, height: 760, revision: 0, busy: false, touched: Date.now(), blocked: false, contact: false, inFlight: 0 };
      sessionId = s.id;
      await context.route('**/*', async route => {
        const r = route.request();
        const path = new URL(r.url()).pathname;
        if (r.method() === 'POST' && PROVIDER_HOSTS.includes(new URL(r.url()).hostname) && (BOOK_PATH.test(path) || HOLD_PATH.test(path))) {
          // A hold or a booking may only leave the browser inside one armed, approved submission.
          if (!s.armed || s.submitted) { s.blocked = true; if (BOOK_PATH.test(path)) s.result = { status: 'payload_mismatch' }; return route.abort(); }
          if (HOLD_PATH.test(path)) return route.continue();
          let payload;
          try { payload = r.postDataJSON(); } catch {}
          if (!matchesApprovedReservation(payload, s.approval, RESTAURANT_DETAILS[s.restaurantId].venueId)) { s.blocked = true; s.result = { status: 'payload_mismatch' }; return route.abort(); }
          try { await this.reserveSubmission(s.approval, s); } catch { s.result = { status: 'already_attempted' }; return route.abort(); }
          s.submitted = true; s.result = { status: 'unknown' };
          return route.continue();
        }
        if (!allowedRequest(r.method(), r.url())) {
          if ((r.isNavigationRequest() && r.frame() === s.page?.mainFrame()) || r.method() !== 'GET') s.blocked = true;
          return route.abort();
        }
        return this.assets.handle(route);
      });
      s.page = await context.newPage();
      s.page.on('request', r => { if (/\/api-yoa\//.test(r.url())) s.inFlight++; });
      s.page.on('requestfinished', r => { if (/\/api-yoa\//.test(r.url())) s.inFlight = Math.max(0, s.inFlight - 1); });
      s.page.on('requestfailed', r => { if (/\/api-yoa\//.test(r.url())) s.inFlight = Math.max(0, s.inFlight - 1); });
      s.page.on('response', response => {
        this.assets.capture(response).catch(() => {});
        if (!s.submitted || !BOOK_PATH.test(new URL(response.url()).pathname)) return;
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
      await s.page.goto(address, { waitUntil: 'domcontentloaded' });
      // Language-independent: wait for the widget's first interactive control.
      await s.page.locator('button:visible').first().waitFor();
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
    if (Date.now() - s.touched > TTL) { this.remove(id, owner); throw new MirrorError('session_expired', 404); }
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
    const byField = await s.page.locator(CONTACT_SELECTOR).first().isVisible().catch(() => false);
    const byText = await s.page.getByText(CONTACT_TEXT).first().isVisible().catch(() => false);
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
    }, CONTACT_FIELDS).catch(() => ({}));
    const date = q.get('date') || '';
    const time = q.get('time') || q.get('time_slot') || '';
    const party = Number(q.get('party_size') || q.get('partySize') || 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(time) || !(party > 0)) return null;
    if (!fields.firstname || !fields.lastname || !fields.email || !fields.phone) return null;
    return { date, time: time.slice(0, 5), party, firstname: fields.firstname, lastname: fields.lastname, email: fields.email, phone: fields.phone, comment: fields.comment || '', terms: true };
  }
  async cardRequired(s) {
    // Card guarantees are completed in the provider's own secure form, never here.
    return await s.page.locator('iframe[src*="stripe" i]:visible, iframe[name*="card" i]:visible, [class*="card" i] input[name*="number" i]:visible').first().isVisible().catch(() => false);
  }
  async snapshot(s) {
    // No screenshot or session data is persisted to disk.
    const text = (await s.page.locator('body').innerText()).slice(0, 16_000);
    const title = await s.page.title().catch(() => '');
    // Observed selectable times are read-only evidence, never a reservation.
    const times = await s.page.locator('button:visible').evaluateAll(els =>
      els.map(e => (e.innerText || '').trim()).filter(t => /^\d{1,2}:\d{2}\s?(am|pm)$/i.test(t))).catch(() => []);
    const fields = s.contact && this.prepare ? await s.page.evaluate(selectors => {
      return Object.entries(selectors).flatMap(([name, selector]) => {
        const inputs = [...document.querySelectorAll(selector.replace(/:visible/g, ''))].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
        if (inputs.length !== 1) return [];
        const input = inputs[0], rect = input.getBoundingClientRect();
        return [{ name, value: input.value, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }];
      });
    }, CONTACT_FIELDS) : [];
    const details = this.live && s.contact ? await this.bookingDetails(s) : null;
    const card = s.contact ? await this.cardRequired(s) : false;
    if (card) s.handoffReason = 'card_required';
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
    s.revision++;
    const canSubmit = !!(s.contact && this.reserveSubmission && !s.submitted && !s.result && !card && (this.live ? details : await this.authorizeSubmission?.()));
    const snapshot = { id: s.id, restaurantId: s.restaurantId, restaurant: s.restaurant, revision: s.revision, width: s.width, height: s.height, image: `data:image/png;base64,${shot.toString('base64')}`, imageHash: crypto.createHash('sha256').update(shot).digest('hex'), capturedAt: new Date().toISOString(), title, text, times: [...new Set(times)], fields, contact: s.contact, details, blocked: s.blocked, mode: this.prepare ? 'prepare' : 'inspect', canSubmit, result: s.result ? { status: s.result.status, reference: s.result.reference } : null, expiresIn: TTL / 1000 };
    snapshot.handoff = { reason: s.handoffReason || 'inspect_only', url: RESTAURANTS[s.restaurantId] };
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
    if (!['click', 'scroll', 'refresh', ...(this.prepare ? ['fill'] : []), ...((this.live || this.authorizeSubmission) && this.reserveSubmission ? ['submit'] : [])].includes(action.type)) throw new MirrorError('inspect_only');
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
        const confirmButton = s.page.locator('button:visible').filter({ hasText: /book now|confirm|complete|boka|slutför|réserver|reservar/i }).last();
        const response = s.page.waitForResponse(r => BOOK_PATH.test(new URL(r.url()).pathname), { timeout: 20_000 }).catch(() => null);
        await confirmButton.click();
        if (s.submitted) await response;
        await s.resultPromise;
        s.armed = false;
      } else if (action.type === 'fill') {
        if (!s.contact) throw new MirrorError('contact_required');
        const entries = action.fields && typeof action.fields === 'object' && !Array.isArray(action.fields) ? Object.entries(action.fields) : [[action.field, action.value]];
        if (!entries.length || entries.length > 5 || entries.some(([field, value]) => !Object.hasOwn(CONTACT_FIELDS, field) || typeof value !== 'string' || value.length > 300)) throw new MirrorError('field');
        for (const [field, value] of entries) {
          const input = s.page.locator(CONTACT_FIELDS[field]).first();
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
    for (const s of this.sessions.values()) if (!s.busy && Date.now() - s.touched > TTL) await this.remove(s.id, s.owner).catch(() => {});
  }
  async close() {
    clearInterval(this.timer);
    await Promise.all([...this.sessions.values()].map(s => this.remove(s.id, s.owner)));
    if (this.browserPromise) await (await this.browserPromise).close();
  }
}
