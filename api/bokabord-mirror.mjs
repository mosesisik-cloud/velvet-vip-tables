import crypto from 'node:crypto';

// Registry, not user-supplied URLs. Other restaurants can share this adapter.
export const RESTAURANTS = Object.freeze({
  'curated-STO-zink-italian-cuisine': 'https://app.bokabord.se/reservation/?app_type=bokabord&hash=e9d3e6917bc7f05c0df1ae157d9aed5b',
});
const TTL = 10 * 60_000;
const MAX_SESSIONS = 4;
// Exploration only. Unknown mutations fail closed, including final booking.
export function allowedRequest(method, address) {
  const url = new URL(address);
  if (url.protocol !== 'https:') return false;
  if (!['app.bokabord.se', 'www.waiteraid.com'].includes(url.hostname)) return false;
  if (/save|confirm|payment|checkout|login|register|cancel|delete/i.test(url.pathname)) return false;
  if (['GET', 'HEAD'].includes(method)) return true;
  return method === 'POST' && /^\/(booking-widget|reservation)\/api\/(?:booking\/)?(?:getTimes|getProducts|getCalendar|getDates|getMeals|getSettings|getAvailability)$/.test(url.pathname);
}
export class MirrorError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
export class BokabordMirror {
  sessions = new Map();
  browserPromise = null;
  pending = 0;
  pendingOwners = new Set();
  constructor() {
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
        if (!allowedRequest(r.method(), r.url())) {
          if (r.isNavigationRequest() || /saveBooking/i.test(r.url())) s.blocked = true;
          return route.abort();
        }
        return route.continue();
      });
      s.page = await context.newPage();
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
    const text = (await s.page.locator('body').innerText()).slice(0, 16_000);
    const shot = await s.page.screenshot({ type: 'jpeg', quality: 85, animations: 'disabled' });
    s.revision++;
    return { id: s.id, revision: s.revision, width: s.width, height: s.height, image: `data:image/jpeg;base64,${shot.toString('base64')}`, text, contact, blocked: s.blocked, mode: 'inspect', expiresIn: TTL / 1000 };
  }
  async action(id, owner, action) {
    const s = this.owned(id, owner);
    if (s.busy) throw new MirrorError('busy', 409);
    if (action.revision !== s.revision) throw new MirrorError('stale_view', 409);
    if (!['click', 'scroll', 'refresh'].includes(action.type)) throw new MirrorError('inspect_only');
    s.busy = true; s.touched = Date.now();
    try {
      if (action.type === 'click') {
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
    } finally { s.busy = false; }
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
