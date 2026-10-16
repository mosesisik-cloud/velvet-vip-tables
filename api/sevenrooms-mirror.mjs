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
// Guest-detail step detection: the pilot stops before personal data.
const CONTACT_SELECTOR = 'input[type="email"]:visible, input[name*="first" i]:visible, input[name*="last" i]:visible, input[name*="phone" i]:visible, input[type="tel"]:visible';
const CONTACT_TEXT = /guest details|your details|contact information|gästuppgifter|dina uppgifter|vos coordonnées|su contacto/i;

// Inspection only. Unknown mutations fail closed; no reservation, hold or payment
// request is ever allowed through this adapter.
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

export class SevenroomsMirror {
  sessions = new Map();
  assets = new BookingAssetCache();
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
      context = await browser.newContext({ viewport: { width, height: 760 }, locale: 'en-US', serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, restaurant: RESTAURANT_DETAILS[restaurantId].name, context, width, height: 760, revision: 0, busy: false, touched: Date.now(), blocked: false, contact: false, inFlight: 0 };
      sessionId = s.id;
      await context.route('**/*', route => {
        const r = route.request();
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
      s.page.on('response', response => { this.assets.capture(response).catch(() => {}); });
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
    // The pilot never enters personal data: reaching the guest-detail step stops interaction.
    const byField = await s.page.locator(CONTACT_SELECTOR).first().isVisible().catch(() => false);
    const byText = await s.page.getByText(CONTACT_TEXT).first().isVisible().catch(() => false);
    s.contact = !!(byField || byText);
  }
  async snapshot(s) {
    // No screenshot or session data is persisted to disk.
    const text = (await s.page.locator('body').innerText()).slice(0, 16_000);
    const title = await s.page.title().catch(() => '');
    // Observed selectable times are read-only evidence, never a reservation.
    const times = await s.page.locator('button:visible').evaluateAll(els =>
      els.map(e => (e.innerText || '').trim()).filter(t => /^\d{1,2}:\d{2}\s?(am|pm)$/i.test(t))).catch(() => []);
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
    s.revision++;
    const snapshot = { id: s.id, restaurantId: s.restaurantId, restaurant: s.restaurant, revision: s.revision, width: s.width, height: s.height, image: `data:image/png;base64,${shot.toString('base64')}`, imageHash: crypto.createHash('sha256').update(shot).digest('hex'), capturedAt: new Date().toISOString(), title, text, times: [...new Set(times)], contact: s.contact, blocked: s.blocked, mode: 'inspect', canSubmit: false, result: null, expiresIn: TTL / 1000 };
    snapshot.handoff = { reason: 'inspect_only', url: RESTAURANTS[s.restaurantId] };
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
    // Inspection pilot: no fill, no submit, no personal data, ever.
    if (!['click', 'scroll', 'refresh'].includes(action.type)) throw new MirrorError('inspect_only');
    s.busy = true; s.touched = Date.now();
    try {
      if (action.type === 'click') {
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
