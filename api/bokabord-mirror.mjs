import crypto from 'node:crypto';

// Registry, not user-supplied URLs. Other restaurants can share this adapter.
export const RESTAURANTS = Object.freeze({
  'curated-STO-zink-italian-cuisine': 'https://app.bokabord.se/reservation/?app_type=bokabord&hash=e9d3e6917bc7f05c0df1ae157d9aed5b',
});
const TTL = 10 * 60_000;
const MAX_SESSIONS = 4;
const CONTACT_FIELDS = {
  firstname: 'input[name="firstname"]:visible', lastname: 'input[name="lastname"]:visible',
  phone: 'input[name="phone"]:visible', email: 'input[name="email"]:visible',
  comment: 'textarea[ng-model="booking.comment"]:visible',
};
// Exploration only. Unknown mutations fail closed, including final booking.
export function allowedRequest(method, address) {
  const url = new URL(address);
  if (url.protocol !== 'https:') return false;
  if (['unpkg.com', 'cdnjs.cloudflare.com', 'js.stripe.com', 'use.fontawesome.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return method === 'GET';
  if (!['app.bokabord.se', 'www.waiteraid.com'].includes(url.hostname)) return false;
  if (/save|confirm|payment|checkout|login|register|cancel|delete/i.test(url.pathname)) return false;
  if (['GET', 'HEAD'].includes(method)) return true;
  return method === 'POST' && /^\/(booking-widget|reservation)\/api\/(?:booking\/)?(?:getTimes|getProducts|getCalendar|getDates|getMeals|getSettings|getAvailability)$/.test(url.pathname);
}
export class MirrorError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
export function matchesApprovedBooking(query, approved) {
  if (!query || !approved || approved.terms !== true) return false;
  const phone = value => String(value || '').replace(/\D/g, '').replace(/^0046/, '46').replace(/^0/, '46');
  return String(query.date) === approved.date && String(query.time) === approved.time && Number(query.amount) === approved.party
    && query.firstname === approved.firstname && query.lastname === approved.lastname && query.email === approved.email
    && phone(query.phone) === phone(approved.phone) && query.waitlist === false && query.terms?.general === true
    && query.terms?.restaurant === false && query.terms?.bokabord === false
    && Array.isArray(query.products) && query.products.length === 0;
}
export class BokabordMirror {
  sessions = new Map();
  browserPromise = null;
  pending = 0;
  pendingOwners = new Set();
  constructor({ prepare = false, authorizeSubmission = null, reserveSubmission = null } = {}) {
    this.prepare = prepare;
    this.authorizeSubmission = authorizeSubmission;
    this.reserveSubmission = reserveSubmission;
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
      context = await browser.newContext({ viewport: { width, height: 760 }, locale: 'sv-SE', timezoneId: 'Europe/Stockholm', serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, context, width, height: 760, revision: 0, busy: false, touched: Date.now(), blocked: false };
      sessionId = s.id;
      await context.route('**/*', async route => {
        const r = route.request();
        if (r.method() === 'POST' && r.url() === 'https://app.bokabord.se/reservation/api/booking/saveBooking' && s.armed && !s.submitted) {
          let query;
          try { query = r.postDataJSON(); } catch {}
          if (!matchesApprovedBooking(query, s.approval)) { s.blocked = true; s.result = { status: 'payload_mismatch' }; return route.abort(); }
          try { await this.reserveSubmission(s.approval); } catch { s.result = { status: 'already_attempted' }; return route.abort(); }
          s.submitted = true; s.result = { status: 'unknown' };
          return route.continue();
        }
        if (!allowedRequest(r.method(), r.url())) {
          if ((r.isNavigationRequest() && r.frame() === s.page?.mainFrame()) || /saveBooking/i.test(r.url())) s.blocked = true;
          return route.abort();
        }
        return route.continue();
      });
      s.page = await context.newPage();
      s.page.on('response', async response => {
        if (!s.submitted || response.url() !== 'https://app.bokabord.se/reservation/api/booking/saveBooking') return;
        const data = await response.json().catch(() => null);
        if (data?.success === true && Number(data.booking?.id) > 0) {
          s.result = { status: Number(data.booking.status) === 0 ? 'payment_required' : 'confirmed', reference: String(data.booking.id), booking: data.booking };
        } else if (data?.success === false) s.result = { status: 'rejected' };
      });
      s.page.setDefaultTimeout(12_000);
      context.on('page', page => { if (page !== s.page) page.close().catch(() => {}); });
      await s.page.goto(address, { waitUntil: 'domcontentloaded' });
      await s.page.getByRole('heading', { name: /Zink/i }).waitFor();
      await s.page.getByRole('heading', { name: 'Middag', exact: true }).waitFor();
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
  async snapshot(s) {
    // No screenshot or personal fields are persisted to disk.
    const contact = await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible();
    if (contact && this.prepare && !s.contactInitialized) {
      // No marketing opt-in is inferred from a booking request.
      for (const box of await s.page.locator('input[type="checkbox"]:visible').all()) await box.uncheck();
      s.contactInitialized = true;
    }
    const fields = [];
    if (contact && this.prepare) {
      for (const [name, selector] of Object.entries(CONTACT_FIELDS)) {
        const input = s.page.locator(selector);
        if (await input.count() === 1) fields.push({ name, value: await input.inputValue(), rect: await input.boundingBox() });
      }
    }
    const review = await s.page.getByRole('heading', { name: 'Kontrollera din bokning', exact: true }).isVisible();
    const text = (await s.page.locator('body').innerText()).slice(0, 16_000);
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
    s.revision++;
    const canSubmit = !!(this.prepare && this.reserveSubmission && !s.submitted && await this.authorizeSubmission?.());
    const snapshot = { id: s.id, revision: s.revision, width: s.width, height: s.height, image: `data:image/png;base64,${shot.toString('base64')}`, imageHash: crypto.createHash('sha256').update(shot).digest('hex'), capturedAt: new Date().toISOString(), fields, text, contact, review, blocked: s.blocked, mode: this.prepare ? 'prepare' : 'inspect', canSubmit, result: s.result || null, expiresIn: TTL / 1000 };
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
    if (!['click', 'scroll', 'refresh', ...(this.prepare ? ['fill'] : []), ...(this.authorizeSubmission && this.reserveSubmission ? ['submit'] : [])].includes(action.type)) throw new MirrorError('inspect_only');
    s.busy = true; s.touched = Date.now();
    try {
      if (action.type === 'submit') {
        if (s.submitted || s.armed) throw new MirrorError('already_attempted', 409);
        if (action.confirm !== true) throw new MirrorError('confirmation_required', 409);
        const approval = await this.authorizeSubmission();
        if (!approval) throw new MirrorError('confirmation_required', 409);
        const review = await s.page.getByRole('heading', { name: 'Kontrollera din bokning', exact: true }).isVisible();
        if (!review && !await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible()) throw new MirrorError('contact_required');
        s.approval = approval; s.armed = true;
        const response = s.page.waitForResponse(r => r.url() === 'https://app.bokabord.se/reservation/api/booking/saveBooking', { timeout: 20_000 }).catch(() => null);
        await s.page.getByRole('button', { name: review ? /Slutför bokningen/i : 'Nästa', exact: !review }).click();
        await response;
        await s.page.waitForURL(/\/reservation\/booking\//, { timeout: 5000 }).catch(() => {});
        s.armed = false;
      } else if (action.type === 'fill') {
        if (!await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible()) throw new MirrorError('contact_required');
        const selector = CONTACT_FIELDS[action.field];
        if (!selector || typeof action.value !== 'string' || action.value.length > 300) throw new MirrorError('field');
        await s.page.locator(selector).fill(action.value);
        await s.page.locator(selector).blur();
      } else if (action.type === 'click') {
        if (await s.page.getByRole('heading', { name: 'Kontaktuppgifter', exact: true }).isVisible()) throw new MirrorError('contact_stop', 409);
        const { x, y } = action;
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= s.width || y >= s.height) throw new MirrorError('coordinates');
        await s.page.mouse.click(x, y);
      } else if (action.type === 'scroll') {
        const dy = Number(action.dy);
        if (!Number.isFinite(dy) || Math.abs(dy) > 760) throw new MirrorError('scroll');
        await s.page.mouse.move(s.width / 2, s.height / 2);
        await s.page.mouse.wheel(0, dy);
      }
      // Wait for the provider's asynchronous redraw, without waiting indefinitely on analytics.
      await s.page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
      await s.page.waitForTimeout(350); // Angular may schedule a redraw after the network becomes idle.
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
