import crypto from 'node:crypto';

// Issue129: master-approved pilot, independently bound to reviewed registry/source.
// Backend browser mirror, NOT the iframe or legacy HTTP srBookSlot implementation.
// Checkout selectors, authorized sandbox and hold/submit contracts are unverified.
// Consequently this draft has NO live-write switch and NEVER reports confirmation.
export const SEVENROOMS_PILOT = Object.freeze({
  restaurantId: 'curated-STO-strandvagen-1', name: 'Strandvägen 1',
  venueId: 'strandvagen1', source: 'https://strandvagen1.se/',
  // Confirmed by the venue's public widget_info response, 2026-10-16.
  internalVenueId: 'ahNzfnNldmVucm9vbXMtc2VjdXJlchwLEg9uaWdodGxvb3BfVmVudWUYgIDZkpLMxQkM',
  url: 'https://www.sevenrooms.com/explore/strandvagen1/reservations/create/search/',
});
const ORIGIN = 'https://www.sevenrooms.com';
const TTL = 10 * 60_000;
const RANGE_KEYS = new Set(['venue', 'party_size', 'halo_size_interval', 'start_date', 'num_days', 'channel', 'exclude_pdr', 'intent', 'time_slot', 'selected_lang_code', 'actual_id', 'analytics_session_id']);
const MUTATION = /hold|\/book(?:\/|$)|cancel|payment|checkout|login|register|otp|verify|confirm|actuals|waitlist/i;
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
const validTime = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');

export function sevenRoomsSearchSelection(input) {
  if (!input || !validDate(input.date) || !Number.isInteger(input.party) || input.party < 1 || input.party > 20 || (input.time !== undefined && !validTime(input.time))) throw new SevenRoomsMirrorError('invalid_search');
  return { date: input.date, party: input.party, ...(input.time === undefined ? {} : { time: input.time }) };
}

// Explicit endpoint/type allowlist: GET alone is not a read-only guarantee.
export function sevenRoomsReadAllowed(method, address, resourceType = 'document') {
  try {
    const u = new URL(address);
    if (!['GET', 'HEAD'].includes(method) || u.origin !== ORIGIN || u.username || u.password || u.hash || u.port) return false;
    if (MUTATION.test(u.pathname) || /%|\\/.test(u.pathname)) return false;
    const keys = [...u.searchParams.keys()];
    if (new Set(keys).size !== keys.length) return false;
    if (resourceType === 'document') {
      return ['/reservations/strandvagen1', '/reservations/strandvagen1/', '/explore/strandvagen1/reservations/create/search', '/explore/strandvagen1/reservations/create/search/'].includes(u.pathname)
        && keys.every(key => ['lang', 'date', 'party_size', 'start_time'].includes(key))
        && (!u.searchParams.has('lang') || /^(sv|en|es|fr)$/.test(u.searchParams.get('lang')))
        && (!u.searchParams.has('date') || validDate(u.searchParams.get('date')))
        && (!u.searchParams.has('party_size') || /^(?:[1-9]|1\d|20)$/.test(u.searchParams.get('party_size')))
        && (!u.searchParams.has('start_time') || validTime(u.searchParams.get('start_time')));
    }
    if (['script', 'stylesheet', 'font', 'image'].includes(resourceType)) {
      return /^\/static2\/[a-zA-Z0-9_./-]+\.(?:js|css|woff2?|ttf|png|jpe?g|svg|webp|ico)$/.test(u.pathname) && !u.search;
    }
    if (!['fetch', 'xhr'].includes(resourceType)) return false;
    // Read-only locale resources observed on the approved pilot, 2026-10-16.
    if (/^\/static2\/reservations\/(?:sv-SE|en-US|es-ES|fr-FR)-[a-zA-Z0-9_-]+\.json$/.test(u.pathname)) return !u.search;
    if (u.pathname === '/api-yoa/languagestrings/strandvagen1/all') return keys.length === 1 && u.searchParams.get('widget_type') === 'res_widget';
    if (u.pathname === '/api-yoa/upgrades/widget') return keys.length === 1 && u.searchParams.get('venue_id') === SEVENROOMS_PILOT.internalVenueId;
    if (['sv','en','es','fr'].some(lang => u.pathname === `/api-yoa/tags/translated/${SEVENROOMS_PILOT.internalVenueId}/${lang}/`)) return !u.search;
    if (u.pathname === '/api-yoa/availability/dates') return keys.length === 3 && keys.every(key => ['venue','start_date','num_days'].includes(key))
      && u.searchParams.get('venue') === SEVENROOMS_PILOT.venueId && validDate(u.searchParams.get('start_date'))
      && /^[1-9]\d{0,2}$/.test(u.searchParams.get('num_days')) && Number(u.searchParams.get('num_days')) <= 366;
    if (u.pathname === '/api-yoa/dining/widget_info') {
      return keys.length === 1 && u.searchParams.get('venue_url_key') === SEVENROOMS_PILOT.venueId;
    }
    if (!['/api-yoa/availability/widget/range', '/api-yoa/availability/ng/widget/range'].includes(u.pathname)) return false;
    return keys.every(key => RANGE_KEYS.has(key)) && u.searchParams.get('venue') === SEVENROOMS_PILOT.venueId
      && (!u.searchParams.has('start_date') || /^\d{4}-\d{2}-\d{2}$/.test(u.searchParams.get('start_date')))
      && /^(?:[1-9]|1\d|20)$/.test(u.searchParams.get('party_size') || '')
      && u.searchParams.get('num_days') === '1'
      && (!u.searchParams.has('actual_id') || u.searchParams.get('actual_id') === '');
  } catch { return false; }
}

export class SevenRoomsMirrorError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

// Same ownership/revision/PNG hash pattern as BokabordMirror. Provider-specific
// Angular selectors, write gates and anti-bot workarounds are deliberately absent.
export class SevenRoomsPlaywright {
  #sessions = new Map();
  #pendingOwners = new Set();
  #browserPromise;
  #closed = false;
  constructor({ browserFactory, now = () => Date.now() } = {}) {
    this.browserFactory = browserFactory || (() => import('playwright').then(({ chromium }) => chromium.launch({ headless: true })));
    this.now = now;
  }
  async #browser() {
    this.#browserPromise ??= Promise.resolve().then(this.browserFactory).catch(error => { this.#browserPromise = null; throw error; });
    return this.#browserPromise;
  }
  async create(owner, restaurantId, width = 420) {
    if (this.#closed) throw new SevenRoomsMirrorError('closed', 503);
    if (typeof owner !== 'string' || !owner.trim() || owner.length > 256) throw new SevenRoomsMirrorError('auth', 401);
    if (restaurantId !== SEVENROOMS_PILOT.restaurantId) throw new SevenRoomsMirrorError('pilot_only');
    await this.expire();
    if (this.#pendingOwners.has(owner) || [...this.#sessions.values()].some(s => s.owner === owner)) throw new SevenRoomsMirrorError('session_exists', 409);
    if (this.#sessions.size + this.#pendingOwners.size >= 4) throw new SevenRoomsMirrorError('capacity', 429);
    this.#pendingOwners.add(owner);
    let context;
    try {
      width = Math.max(320, Math.min(760, Math.round(Number(width) || 420)));
      const browser = await this.#browser();
      if (this.#closed) throw new SevenRoomsMirrorError('closed', 503);
      context = await browser.newContext({ viewport: { width, height: 760 }, locale: 'sv-SE', timezoneId: 'Europe/Stockholm', serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, context, width, height: 760, revision: 0, touched: this.now(), busy: true, state: 'read_only', blockedRequests: 0, blockedRoutes: [] };
      await context.route('**/*', async route => {
        const request = route.request();
        if (!sevenRoomsReadAllowed(request.method(), request.url(), request.resourceType())) {
          s.blockedRequests++;
          let u;
          try { u = new URL(request.url()); } catch {}
          // Diagnostics omit query strings, payloads and tokens. Analytics being
          // blocked is not evidence that the provider tried to create a hold.
          if (s.blockedRoutes.length < 30) s.blockedRoutes.push({ method: request.method(), origin: u?.origin || 'invalid', type: request.resourceType(), kind: u?.origin === ORIGIN ? MUTATION.test(u.pathname) ? 'write_boundary' : 'unreviewed_provider_request' : 'external_resource' });
          if (u?.origin === ORIGIN && MUTATION.test(u.pathname)) s.state = 'provider_write_required';
          else if (request.isNavigationRequest() && request.frame() === s.page?.mainFrame()) s.state = 'unsupported_navigation';
          return route.abort();
        }
        // Do not follow redirects inside fetch: a permitted read must not turn
        // into an unreviewed destination/GET mutation through a 30x response.
        const searchEpoch = s.searchEpoch;
        try {
          const response = await route.fetch({ maxRedirects: 0, timeout: 10_000 });
          if (response.status() >= 300 && response.status() < 400) {
            s.blockedRequests++; s.state = 'unsupported_navigation';
            return route.abort();
          }
          const body = await response.body();
          const requestUrl = new URL(request.url());
          if (response.status() === 200 && searchEpoch === s.searchEpoch && requestUrl.pathname === '/api-yoa/availability/ng/widget/range' && s.selection
            && requestUrl.searchParams.get('start_date') === s.selection.date && Number(requestUrl.searchParams.get('party_size')) === s.selection.party) {
            let data;
            try { data = JSON.parse(body.toString()); } catch {}
            const shifts = data?.data?.availability?.[s.selection.date];
            if (data?.status === 200 && Array.isArray(shifts)) {
              const slots = [];
              for (const shift of shifts) for (const slot of Array.isArray(shift.times) ? shift.times : []) {
                const iso = String(slot.time_iso || '');
                const time = iso ? iso.slice(11, 16) : slot.time;
                if (slot.type !== 'book' || !validTime(time) || (iso && (!/^\d{4}-\d{2}-\d{2}[T ]/.test(iso) || iso.slice(0, 10) !== s.selection.date))) continue;
                // Expose only observed public time/requirements, never provider IDs,
                // tokens or a promise that this read can be submitted as a booking.
                slots.push({ time, paymentRequirement: slot.cc_payment_rule === 'advanced_payment' ? 'prepayment' : slot.require_credit_card === true ? 'card' : 'not_specified' });
              }
              s.availability = { source: 'provider', observedAt: new Date(this.now()).toISOString(), date: s.selection.date, party: s.selection.party, slots };
              s.resolveRange?.();
            }
          }
          return route.fulfill({ status: response.status(), headers: response.headers(), body });
        } catch { s.blockedRequests++; return route.abort(); }
      });
      await context.routeWebSocket('**/*', socket => { s.blockedRequests++; socket.close(); });
      s.page = await context.newPage();
      s.page.setDefaultTimeout(10_000);
      context.on('page', page => { if (page !== s.page) page.close().catch(() => {}); });
      s.page.on('download', download => download.cancel().catch(() => {}));
      s.page.on('dialog', dialog => dialog.dismiss().catch(() => {}));
      const response = await s.page.goto(SEVENROOMS_PILOT.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (response && [401, 403, 429].includes(response.status())) s.state = 'access_blocked';
      await this.#settle(s);
      if (this.#closed) throw new SevenRoomsMirrorError('closed', 503);
      this.#sessions.set(s.id, s);
      const snapshot = await this.#snapshot(s);
      s.busy = false;
      return snapshot;
    } catch (error) { if (context) { for (const [id, s] of this.#sessions) if (s.context === context) this.#sessions.delete(id); await context.close(); } throw error; }
    finally { this.#pendingOwners.delete(owner); }
  }
  async #owned(id, owner) {
    const s = this.#sessions.get(id);
    if (!owner || !s || s.owner !== owner) throw new SevenRoomsMirrorError('session_expired', 404);
    if (this.now() - s.touched >= TTL && !s.busy) { await this.remove(id, owner); throw new SevenRoomsMirrorError('session_expired', 404); }
    if (s.busy) throw new SevenRoomsMirrorError('busy', 409);
    return s;
  }
  async #settle(s) {
    // Render synchronization only; not proof that provider inventory is ready.
    await s.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  async #snapshot(s) {
    const text = (await s.page.locator('body').innerText()).slice(0, 12_000);
    if (/captcha|verify you are human|access denied|unusual traffic/i.test(text)) s.state = 'access_blocked';
    const shot = await s.page.screenshot({ type: 'png' });
    s.touched = this.now();
    s.revision++;
    return {
      id: s.id, provider: 'SevenRooms', restaurantId: s.restaurantId, restaurant: SEVENROOMS_PILOT.name,
      revision: s.revision, width: s.width, height: s.height,
      image: `data:image/png;base64,${shot.toString('base64')}`, imageHash: crypto.createHash('sha256').update(shot).digest('hex'),
      capturedAt: new Date(s.touched).toISOString(), text, mode: 'inspect', state: s.state,
      canSubmit: false, result: null, fields: [], blocked: s.state !== 'read_only', blockedRequests: s.blockedRequests,
      blockedRoutes: s.blockedRoutes.map(route => ({ ...route })),
      readiness: s.availability && this.now() - Date.parse(s.availability.observedAt) < 60_000 ? 'availability_observed' : 'unverified',
      selection: s.selection ? { ...s.selection } : null,
      availability: s.availability ? { ...s.availability, slots: s.availability.slots.map(slot => ({ ...slot })) } : null,
      expiresIn: TTL / 1000, limitation: 'Checkout/hold contract unverified; no submission or confirmation supported.',
    };
  }
  async current(id, owner) {
    const s = await this.#owned(id, owner);
    if (this.#sessions.get(id) !== s) throw new SevenRoomsMirrorError('session_expired', 404);
    // Acquire synchronously after lookup; action/current recheck after await below.
    if (s.busy) throw new SevenRoomsMirrorError('busy', 409);
    s.busy = true;
    try { return await this.#snapshot(s); } finally { s.busy = false; }
  }
  async action(id, owner, action) {
    const s = await this.#owned(id, owner);
    if (this.#sessions.get(id) !== s) throw new SevenRoomsMirrorError('session_expired', 404);
    if (s.busy) throw new SevenRoomsMirrorError('busy', 409);
    if (!action || action.revision !== s.revision) throw new SevenRoomsMirrorError('stale_view', 409);
    if (!['click', 'scroll', 'refresh', 'search'].includes(action.type)) throw new SevenRoomsMirrorError('inspect_only');
    if (s.state !== 'read_only' && action.type !== 'refresh') throw new SevenRoomsMirrorError(s.state, 409);
    if (action.type === 'click' && (![action.x, action.y].every(Number.isFinite) || action.x < 0 || action.x >= s.width || action.y < 0 || action.y >= s.height)) throw new SevenRoomsMirrorError('coordinates');
    if (action.type === 'scroll' && (!Number.isFinite(action.delta) || Math.abs(action.delta) > 760)) throw new SevenRoomsMirrorError('scroll');
    const selection = action.type === 'search' ? sevenRoomsSearchSelection(action) : null;
    s.busy = true;
    try {
      if (selection) {
        s.searchEpoch = (s.searchEpoch || 0) + 1;
        s.selection = selection; s.availability = null;
        const url = new URL(SEVENROOMS_PILOT.url);
        url.searchParams.set('date', selection.date);
        url.searchParams.set('party_size', String(selection.party));
        if (selection.time) url.searchParams.set('start_time', selection.time);
        let timer;
        const ready = new Promise(resolve => { s.resolveRange = resolve; timer = setTimeout(resolve, 10_000); });
        try { await s.page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30_000 }); await ready; }
        finally { clearTimeout(timer); s.resolveRange = null; }
      }
      if (action.type === 'click') await s.page.mouse.click(action.x, action.y);
      if (action.type === 'scroll') await s.page.mouse.wheel(0, action.delta);
      await this.#settle(s);
      return await this.#snapshot(s);
    } catch (error) {
      // A failed interaction invalidates the old revision; never replay blindly.
      s.revision++;
      throw error;
    } finally { s.busy = false; }
  }
  async remove(id, owner) {
    const s = this.#sessions.get(id);
    if (!owner || !s || s.owner !== owner) throw new SevenRoomsMirrorError('session_expired', 404);
    if (s.busy) throw new SevenRoomsMirrorError('busy', 409);
    this.#sessions.delete(id);
    await s.context.close();
  }
  async expire() {
    await Promise.all([...this.#sessions.values()].filter(s => !s.busy && this.now() - s.touched >= TTL).map(s => this.remove(s.id, s.owner)));
  }
  async close() {
    this.#closed = true;
    await Promise.all([...this.#sessions.values()].map(s => s.context.close().catch(() => {})));
    this.#sessions.clear();
    if (this.#browserPromise) await (await this.#browserPromise.catch(() => null))?.close();
  }
}
