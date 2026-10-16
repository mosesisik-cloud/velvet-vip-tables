import crypto from 'node:crypto';

// Native form contract observed read-only; submission is disabled by default.
// Fish Corner lunch alone supports explicit, journal-backed submission.
// Never wire fixture mode to a public server or count its result as a booking.
export const ZENCHEF_ARPEGE = Object.freeze({
  restaurantId: 'curated-PAR-arpege', venueId: '354036', name: 'Arpège',
  url: 'https://bookings.zenchef.com/results?rid=354036&lang=fr',
  timezone: 'Europe/Paris', minParty: 1, maxParty: 6,
});
export const ZENCHEF_FISHCORNER = Object.freeze({ restaurantId: 'osm-SBH-fishcorner', venueId: '388090', name: 'Fish Corner',
  url: 'https://bookings.zenchef.com/results?rid=388090&lang=fr', timezone: 'America/Guadeloupe', minParty: 2, maxParty: 2,
  shiftId: 545372, source: 'https://www.fishcornerstbarth.com/en/book-online' });
// Official Gigi Tavola Port de Nice iframe; lunch guest/review verified read-only.
// This venue sends a reservation REQUEST (manual confirmation), not an instant booking.
export const ZENCHEF_GIGI_TAVOLA = Object.freeze({ restaurantId: 'osm-MCO-gigi-tavola', venueId: '353615', name: 'Gigi Tavola',
  url: 'https://bookings.zenchef.com/results?rid=353615&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 30585, source: 'https://www.gigitavola.com/', preparationOnly: true,
  submissionBlocker: 'manual_confirmation_submission_unverified' });
export const ZENCHEF_PESQUIERE = Object.freeze({ restaurantId: 'osm-STT-la-pesquiere-le-mazagran-et-lou-revelen',
  venueId: '362908', name: 'La PeSQui\u00e8re, Le Mazagran et Lou Revelen',
  url: 'https://bookings.zenchef.com/results?rid=362908&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 136503, source: 'https://www.lapesquiere.fr/contact-restaurant-a-saint-tropez-dans-le-var-83/',
  policySource: 'https://bookings.zenchef.com/gtc?rid=362908&lang=fr',
  rooms: Object.freeze([Object.freeze({ id: 51183, name: 'La Pesquiere' }),
    Object.freeze({ id: 52372, name: 'Mazagran salle' }), Object.freeze({ id: 52373, name: 'Mazagran terrasse' })]) });
export const ZENCHEF_POLICY_SOURCE = 'https://bookings.zenchef.com/gtc?rid=388090&lang=fr';
const VENUES = Object.freeze({ [ZENCHEF_ARPEGE.restaurantId]: ZENCHEF_ARPEGE, [ZENCHEF_FISHCORNER.restaurantId]: ZENCHEF_FISHCORNER, [ZENCHEF_GIGI_TAVOLA.restaurantId]: ZENCHEF_GIGI_TAVOLA, [ZENCHEF_PESQUIERE.restaurantId]: ZENCHEF_PESQUIERE });
const FIXTURE_URL = 'https://zenchef-fixture.invalid/';
const TTL = 10 * 60_000;
const FIELDS = ['firstname', 'lastname', 'email', 'phone'];
const PROVIDER_FIELDS = Object.freeze({ firstname: '[data-testid="firstname-input"]',
  lastname: '[data-testid="lastname-input"]', email: '[data-testid="email-input"]', phone: '[data-testid="phone-input"]' });
export class ZenchefError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const bounded = async (operation, ms) => {
  let timer;
  try { return await Promise.race([Promise.resolve().then(operation), new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ZenchefError('deadline', 504)), ms);
  })]); } finally { clearTimeout(timer); }
};

// Exact native Fish Corner lunch request observed with POST aborted before wire.
// The provider enables review invitations by default, outside visible marketing
// controls. Remove those optional invitations; never add consent on the guest's behalf.
export function approvedZenchefPayload(body, approval) {
  const keys = 'day nb_guests time lang firstname lastname civility country phone_number email comment custom_field custom_field_v2 customersheet offers partner_id type'.split(' ');
  const roomRequired = approval?.restaurantId === ZENCHEF_PESQUIERE.restaurantId;
  if (roomRequired) keys.push('wish');
  const sheetKeys = 'firstname lastname civility phone email optins country lang'.split(' ');
  const exactKeys = (o, list) => o && typeof o === 'object' && !Array.isArray(o)
    && Object.keys(o).length === list.length && list.every(k => Object.hasOwn(o, k));
  const emptyArray = a => Array.isArray(a) && a.length === 0;
  if (!approval || !exactKeys(body, keys) || !exactKeys(body.customersheet, sheetKeys)) return null;
  if (roomRequired && (!ZENCHEF_PESQUIERE.rooms.some(room => room.id === approval.roomId && room.name === approval.roomName)
    || !exactKeys(body.wish, ['booking_room_id']) || body.wish.booking_room_id !== approval.roomId)) return null;
  const sheet = body.customersheet, phone = String(approval.phone).replace(/\s/g, '');
  if (body.day !== approval.date || body.time !== approval.time || body.nb_guests !== approval.party
    || body.lang !== 'fr' || body.partner_id !== '1001' || body.type !== 'web' || body.comment !== ''
    || !exactKeys(body.custom_field, []) || !emptyArray(body.custom_field_v2) || !emptyArray(body.offers)
    || body.phone_number !== phone || sheet.phone !== phone || sheet.lang !== 'fr'
    || !/^[a-z]{2}$/.test(approval.country || '') || !Array.isArray(sheet.optins)
    || sheet.optins.some(o => !exactKeys(o, ['type', 'value']) || !['review_mail', 'review_sms'].includes(o.type) || o.value !== true)) return null;
  for (const k of ['firstname', 'lastname', 'email', 'civility', 'country']) {
    if (body[k] !== approval[k]?.trim() || sheet[k] !== approval[k]?.trim()) return null;
  }
  return { ...body, customersheet: { ...sheet, optins: [] } };
}

// Public form/thank_you bundles bind createdCustomerSheet.relatedBookingStatus
// to response.status and render confirmed ONLY for the literal "confirmed".
// This is a source-backed mapping; no successful live booking is claimed here.
export function zenchefBookingResult(status, data, approval = null) {
  if (status < 200 || status >= 300 || !data || typeof data !== 'object') return { status: 'unknown' };
  if (data.requires_action === true || data.charge) return { status: 'payment_required' };
  if (data.error || !/^[1-9]\d*$/.test(String(data.id)) || typeof data.uuid !== 'string' || !data.uuid) return { status: 'unknown' };
  // A room booking cannot be called confirmed without the same room in the supplier receipt.
  // This fail-closed requirement is not a claim that a live receipt has been observed.
  if (approval?.restaurantId === ZENCHEF_PESQUIERE.restaurantId && data.wish?.booking_room_id !== approval.roomId) return { status: 'unknown' };
  if (data.status === 'confirmed') return { status: 'confirmed', reference: String(data.id) };
  if (data.status === 'waiting') return { status: 'pending' };
  return { status: 'unknown' };
}

export function zenchefSearchUrl(query, venue = ZENCHEF_ARPEGE) {
  const { date, party } = query || {};
  const parsed = new Date(String(date) + 'T12:00:00Z');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed)
    || parsed.toISOString().slice(0, 10) !== date || !Number.isInteger(party) || party < venue.minParty || party > venue.maxParty) {
    throw new ZenchefError('search_fields');
  }
  // day/pax are the provider's own public results-page parameters (2026-10-16).
  return venue.url + `&day=${date}&pax=${party}`;
}

export function zenchefFormUrl(selection, venue = ZENCHEF_ARPEGE) {
  const search = zenchefSearchUrl(selection, venue);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(selection.time)) throw new ZenchefError('time');
  if (venue.rooms ? !venue.rooms.some(room => room.id === selection.roomId) : selection.roomId !== undefined) throw new ZenchefError('room_required_or_unverified');
  return search.replace('/results?', '/form?') + '&slot=' + encodeURIComponent(selection.time)
    + (venue.rooms ? '&room_id=' + selection.roomId : '');
}

// Public bundle and rendered form observed 2026-10-16. API reads remain pinned
// to the venue and selected month; authentication is the provider's normal GET.
// No alternate WAF route, token injection, quotation POST or payment resource.
export function allowedZenchefPreparationRequest(request, selection, venue = ZENCHEF_ARPEGE) {
  if (request.method() !== 'GET' || request.redirectedFrom()) return false;
  let expected, u;
  try { expected = zenchefFormUrl(selection, venue); u = new URL(request.url()); } catch { return false; }
  if (request.resourceType() === 'document') return request.url() === expected;
  if (u.origin === 'https://bookings.zenchef.com' && !u.search) {
    return (request.resourceType() === 'script' && /^\/_next\/static\/chunks\/[A-Za-z0-9_./-]+\.js$/.test(u.pathname))
      || (request.resourceType() === 'stylesheet' && /^\/_next\/static\/css\/[A-Za-z0-9_.-]+\.css$/.test(u.pathname))
      || (request.resourceType() === 'font' && /^\/_next\/static\/media\/[A-Za-z0-9_.-]+\.(woff2?|ttf)$/.test(u.pathname))
      || (['fetch', 'xhr'].includes(request.resourceType()) && /^\/locales\/fr\/(translation|validation)\.json$/.test(u.pathname));
  }
  if (u.origin !== 'https://bookings-middleware.zenchef.com' || !['fetch', 'xhr'].includes(request.resourceType())
    || u.hash || u.username || u.password || u.searchParams.getAll('restaurantId').length !== 1
    || u.searchParams.get('restaurantId') !== venue.venueId) return false;
  const keys = [...u.searchParams.keys()];
  if (new Set(keys).size !== keys.length) return false;
  if (u.pathname === '/getAuthToken') return keys.length === 1;
  if (u.pathname !== '/getAvailabilitiesSummary' || keys.length !== 3
    || !keys.every(k => ['restaurantId', 'date_begin', 'date_end'].includes(k))) return false;
  const month = selection.date.slice(0, 7);
  const last = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
  return u.searchParams.get('date_begin') === month + '-01' && u.searchParams.get('date_end') === month + '-' + last;
}

// Read only the server-rendered provider state, never execute or mutate its store.
// Candidate slots are not held, selected, confirmed or guaranteed bookable later.
export function zenchefAvailabilityEvidence(data, query, observedAt = Date.now(), venue = ZENCHEF_ARPEGE) {
  zenchefSearchUrl(query, venue);
  const state = data?.props?.initialState?.appStoreState;
  const day = state?.dailyAvailabilities?.[query.date];
  if (data?.page !== '/results' || data.query?.rid !== venue.venueId || data.query?.day !== query.date
    || String(data.query?.pax) !== String(query.party) || state?.restaurantId !== venue.venueId
    || state.initializedSSR !== true || state.wish?.day !== query.date || state.wish?.pax !== query.party
    || state.wish.waiting_list !== false || state.restaurantTimezone !== venue.timezone
    || ![false, 0].includes(state.isDisabled) || day?.date !== query.date || !Array.isArray(day.shifts)) {
    throw new ZenchefError('provider_state_unverified', 502);
  }
  const localNow = new Intl.DateTimeFormat('sv-SE', { timeZone: venue.timezone, year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(observedAt);
  const inWindow = row => {
    const valid = v => v === null || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v));
    return valid(row.bookable_from) && valid(row.bookable_to)
      && (row.bookable_from === null || row.bookable_from <= localNow)
      && (row.bookable_to === null || row.bookable_to > localNow);
  };
  const candidates = [];
  for (const shift of day.shifts) {
    if (venue.shiftId && shift.id !== venue.shiftId) continue;
    if (shift.closed !== false || shift.marked_as_full !== false || !inWindow(shift) || !Array.isArray(shift.shift_slots)) continue;
    for (const slot of shift.shift_slots) {
      if (slot.closed !== false || slot.marked_as_full !== false || !inWindow(slot)
        || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.name) || !slot.possible_guests?.includes(query.party)
        || (!(venue === ZENCHEF_GIGI_TAVOLA && state.isRoomMandatory === false && slot.available_rooms === undefined)
          && (!Array.isArray(slot.available_rooms?.[query.party]) || !slot.available_rooms[query.party].length))) continue;
      if (venue.rooms) {
        const rooms = venue.rooms.filter(room => slot.available_rooms[query.party].includes(room.id)
          && state.rooms?.some(native => native.id === room.id && native.name === room.name));
        if (state.isRoomMandatory !== true || !rooms.length) continue;
        candidates.push({ time: slot.name, shiftId: shift.id, rooms });
      } else candidates.push({ time: slot.name, shiftId: shift.id });
    }
  }
  return { source: 'provider_server_rendered', restaurantId: venue.restaurantId,
    date: query.date, party: query.party, observedAt: new Date(observedAt).toISOString(),
    candidates, selectable: false, confirmationVerified: false,
    limitation: 'offer_room_card_and_submission_not_verified' };
}

// Deliberately NOT a generic GET allowlist. Even GET can create supplier state.
// No live scripts, inventory API, redirects, form posts or arbitrary clicks yet.
export function allowedZenchefInspectionRequest(request, query = null, venue = ZENCHEF_ARPEGE) {
  let expected;
  try { expected = query ? zenchefSearchUrl(query, venue) : venue.url; } catch { return false; }
  return request.method() === 'GET' && request.resourceType() === 'document'
    && !request.redirectedFrom() && request.url() === expected;
}

/** Bokabord-shaped lifecycle; shared routing, auth and journal remain integrator-owned.
 * reserveSubmission(details, session) must durably exclude duplicates before submit.
 * recordResult(session) must persist unknown outcomes, never retry them automatically.
 * Fixture selectors describe ONLY the local test protocol, not Zenchef's actual DOM.
 */
export class ZenchefPlaywright {
  #sessions = new Map();
  #pending = new Set();
  #browserPromise;
  #closed = false;
  constructor({ browserFactory, mode = 'inspect', fixtureHtml, enableSubmission = false,
    reserveSubmission, recordResult, now = Date.now } = {}) {
    if (!['inspect', 'prepare', 'fixture'].includes(mode)) throw new ZenchefError('live_not_verified');
    if (mode !== 'fixture' && fixtureHtml !== undefined) throw new ZenchefError('fixture_forbidden');
    if (mode === 'fixture' && (typeof fixtureHtml !== 'string' || !fixtureHtml)) throw new ZenchefError('fixture_required');
    this.mode = mode; this.fixtureHtml = fixtureHtml;
    this.enableSubmission = enableSubmission === true;
    this.reserveSubmission = reserveSubmission; this.recordResult = recordResult;
    this.now = now;
    this.browserFactory = browserFactory || (() => import('playwright').then(({ chromium }) => chromium.launch({ headless: true })));
  }
  async create(owner, restaurantId) {
    if (this.#closed) throw new ZenchefError('closed', 503);
    if (typeof owner !== 'string' || !owner) throw new ZenchefError('auth', 401);
    const venue = Object.hasOwn(VENUES, restaurantId) ? VENUES[restaurantId] : null;
    if (!venue) throw new ZenchefError('unsupported_restaurant');
    await this.expire();
    if (this.#pending.has(owner) || [...this.#sessions.values()].some(s => s.owner === owner)) throw new ZenchefError('session_exists', 409);
    if (this.#pending.size + this.#sessions.size >= 4) throw new ZenchefError('capacity', 429);
    this.#pending.add(owner);
    let context;
    try {
      this.#browserPromise ||= Promise.resolve().then(() => this.browserFactory()).catch(e => { this.#browserPromise = null; throw e; });
      const browser = await this.#browserPromise;
      if (this.#closed) throw new ZenchefError('closed', 503);
      context = await browser.newContext({ viewport: { width: 420, height: 760 },
        locale: 'fr-FR', timezoneId: venue.timezone, serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, restaurant: venue.name, venue,
        provider: 'Zenchef', destination: venue === ZENCHEF_ARPEGE ? 'Paris' : venue === ZENCHEF_GIGI_TAVOLA ? 'Nice' : venue === ZENCHEF_PESQUIERE ? 'Saint-Tropez' : 'St. Barts', context, revision: 0, touched: this.now(),
        busy: false, attempted: false, state: 'inspect_only', result: null, blockedRequests: 0 };
      await context.route('**/*', async route => {
        const r = route.request();
        const bookingUrl = `https://bookings-middleware.zenchef.com/booking?restaurantId=${venue.venueId}`;
        if (this.mode === 'prepare' && r.method() === 'POST' && r.url() === bookingUrl && s.armed && !s.attempted && s.noCardAllowed
          && [ZENCHEF_FISHCORNER, ZENCHEF_PESQUIERE].includes(venue)) {
          s.attempted = true;
          try {
            const payload = approvedZenchefPayload(r.postDataJSON(), s.approval);
            if (!payload || r.redirectedFrom()) throw new ZenchefError('payload_mismatch');
            const reserved = await bounded(() => this.reserveSubmission(s.approval, s), 5000);
            if (reserved?.sendAllowed !== true || !reserved.attempt?.attemptId || !reserved.attempt?.idempotencyKey || this.#closed) throw new ZenchefError('attempt_not_authorized');
            s.attempt = reserved.attempt;
            // Exactly one transmission, no redirects/retries. Unknown stays locked.
            const response = await route.fetch({ maxRedirects: 0, maxRetries: 0, timeout: 20000, postData: JSON.stringify(payload) });
            const data = await response.json().catch(() => null);
            s.result = zenchefBookingResult(response.status(), data, s.approval);
            s.result.verification = { verified: ['confirmed', 'pending', 'payment_required'].includes(s.result.status), source: 'provider', provider: 'Zenchef', mode: 'live', phase: 'booking', restaurantId,
              policySource: venue.policySource || ZENCHEF_POLICY_SOURCE, reviewFingerprint: s.review.digest,
              sessionId: s.id, attemptId: reserved.attempt.attemptId, idempotencyKey: reserved.attempt.idempotencyKey,
              detailsDigest: s.review.digest,
              ...(venue.rooms ? { roomId: s.approval.roomId, roomName: s.approval.roomName } : {}) };
            try { await bounded(() => this.recordResult(s), 5000); }
            catch { s.result = { status: 'unknown', reason: 'result_persistence_failed' }; }
            await route.fulfill({ response });
          } catch { s.result = { status: 'unknown' }; await route.abort().catch(() => {}); }
          finally { s.state = 'result'; s.submitDone?.(); }
          return;
        }
        if (this.mode === 'fixture') {
          if (r.url() === FIXTURE_URL && r.method() === 'GET' && r.resourceType() === 'document' && !r.redirectedFrom()) {
            return route.fulfill({ status: 200, contentType: 'text/html', body: this.fixtureHtml });
          }
        } else if (s.formSelection ? allowedZenchefPreparationRequest(r, s.formSelection, venue) : allowedZenchefInspectionRequest(r, s.searchQuery, venue)) {
          // fetch with redirects disabled, then fulfill: route.continue can follow an
          // unreviewed redirect without running this route guard a second time.
          try {
            const response = await route.fetch({ maxRedirects: 0, timeout: 10000 });
            if (response.status() >= 200 && response.status() < 300) return route.fulfill({ response });
          } catch { /* fail closed */ }
        }
        s.blockedRequests++;
        return route.abort();
      });
      await context.routeWebSocket('**/*', socket => socket.close());
      s.page = await context.newPage();
      context.on('page', page => { if (page !== s.page) page.close().catch(() => {}); });
      s.page.setDefaultTimeout(3000);
      await s.page.goto(this.mode === 'fixture' ? FIXTURE_URL : venue.url,
        { waitUntil: 'domcontentloaded', timeout: 12000 });
      if (this.#closed) throw new ZenchefError('closed', 503);
      if (this.mode === 'fixture') s.state = 'search';
      const snapshot = await this.snapshot(s);
      this.#sessions.set(s.id, s);
      return snapshot;
    } catch (error) { await context?.close(); throw error; }
    finally { this.#pending.delete(owner); }
  }
  owned(id, owner) {
    const s = this.#sessions.get(id);
    if (!s || s.owner !== owner || this.now() - s.touched >= TTL) throw new ZenchefError('session_expired', 404);
    return s;
  }
  current(owner) {
    const s = [...this.#sessions.values()].find(s => s.owner === owner);
    if (!s) throw new ZenchefError('session_expired', 404);
    this.owned(s.id, owner);
    return structuredClone({ ...s.lastSnapshot, ...(s.submissionStarted ? { state: s.state, canSubmit: false, result: s.result } : {}) });
  }
  async verifyNativeRoom(s) {
    if (!s.venue.rooms) return;
    const { roomId, roomName } = s.formSelection;
    const form = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent())?.props?.initialState?.appStoreState;
    if (s.page.url() !== zenchefFormUrl(s.formSelection, s.venue) || form?.wish?.room_id !== roomId
      || !await s.page.getByText(roomName, { exact: true }).isVisible()) throw new ZenchefError('provider_room_mismatch', 409);
  }
  async nativeCountry(s) {
    const phoneWidget = s.page.locator(PROVIDER_FIELDS.phone).locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," iti ")][1]');
    const flag = phoneWidget.locator('.iti__selected-country .iti__flag');
    if (await flag.count() !== 1) return '';
    const codes = ((await flag.getAttribute('class')) || '').split(/\s+/).filter(c => /^iti__[a-z]{2}$/.test(c));
    if (codes.length !== 1) return '';
    const code = codes[0].slice(5);
    // At the mobile viewport the country list is not mounted until opened.
    // Read the selected visible control, not a possibly absent dropdown option.
    const selected = phoneWidget.locator('.iti__selected-country');
    return await selected.count() === 1 && await selected.getAttribute('title')
      && await selected.getAttribute('aria-label') ? code : '';
  }
  async snapshot(s) {
    let fields = null;
    if (this.mode === 'prepare' && ['contact', 'review'].includes(s.state)) {
      fields = [];
      for (const name of FIELDS) fields.push({ name, value: await s.page.locator(PROVIDER_FIELDS[name]).inputValue() });
      const selected = s.page.locator('input[name="civility"]:checked');
      fields.push({ name: 'civility', value: await selected.count() === 1 ? await selected.inputValue() : '', options: ['mr', 'mrs', 'mx'] });
      fields.push({ name: 'country', value: await this.nativeCountry(s), readOnly: true, source: 'provider_phone_country', label: 'Telephone country (selected by provider from phone number)' });
    }
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
      const snapshot = { id: s.id, restaurantId: s.restaurantId, restaurant: s.restaurant,
      provider: 'Zenchef', mode: this.mode, evidenceMode: this.mode === 'fixture' ? 'local_fixture' : this.mode === 'prepare' ? 'native_provider_form' : 'readonly_shell',
      revision: ++s.revision, state: s.state, width: 420, height: 760,
      image: `data:image/png;base64,${shot.toString('base64')}`,
      imageHash: crypto.createHash('sha256').update(shot).digest('hex'),
      capturedAt: new Date(this.now()).toISOString(), expiresIn: TTL / 1000,
      liveAvailabilitySupported: false, canSubmit: s.state === 'review' && !s.attempted && !s.submissionStarted
        && typeof this.reserveSubmission === 'function' && typeof this.recordResult === 'function'
        && (this.mode === 'fixture' || (this.mode === 'prepare' && this.enableSubmission && s.noCardAllowed
          && !!s.details?.country && s.review?.revision === s.revision)),
      fields, details: s.details ? structuredClone(s.details) : null, result: s.result ? structuredClone(s.result) : null,
      availabilityEvidence: s.availabilityEvidence ? structuredClone(s.availabilityEvidence) : null,
      phase: 'booking', reviewFingerprint: s.review?.digest || null,
      reviewToken: s.review?.revision === s.revision ? s.review.token : null,
      terms: s.terms ? { ...s.terms } : null,
      checkoutBlocker: s.formSelection && s.venue.preparationOnly ? s.venue.submissionBlocker : s.formSelection && !s.noCardAllowed ? 'card_and_supplier_submission_unverified'
        : s.formSelection && !this.enableSubmission ? 'submission_disabled' : null,
      blockedRequests: s.blockedRequests,
      blocker: this.mode === 'fixture' ? 'local_fixture_only' : this.mode === 'inspect' ? 'inspection_only' : null };
    s.lastSnapshot = snapshot;
    return structuredClone(snapshot);
  }
  async action(id, owner, action) {
    const s = this.owned(id, owner);
    if (s.busy) throw new ZenchefError('busy', 409);
    if (!action || action.revision !== s.revision) throw new ZenchefError('stale_view', 409);
    if (this.mode === 'inspect' && !['refresh', 'search'].includes(action.type)) throw new ZenchefError('inspect_only', 409);
    s.busy = true; s.touched = this.now();
    try {
      if (action.type === 'refresh') return await this.snapshot(s);
      if (s.submissionStarted) throw new ZenchefError('already_attempted', 409);
      if (this.mode !== 'fixture' && action.type === 'search') {
        const query = { date: action.date, party: action.party };
        const url = zenchefSearchUrl(query, s.venue);
        s.searchQuery = query; s.formSelection = null; s.details = null; s.review = null; s.noCardAllowed = false; s.terms = null;
        s.availabilityEvidence = null; s.state = 'inspect_only';
        await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
        s.availabilityEvidence = zenchefAvailabilityEvidence(data, query, this.now(), s.venue);
        s.state = 'availability_observed';
        return await this.snapshot(s);
      }
      if (this.mode === 'prepare') {
        if (action.type === 'select' && s.state === 'availability_observed') {
          const evidence = s.availabilityEvidence;
          const matches = evidence?.candidates.filter(row => row.time === action.time);
          if (!matches || matches.length !== 1 || matches[0].shiftId !== action.shiftId
            || this.now() - Date.parse(evidence.observedAt) > 120000) throw new ZenchefError('slot_stale_or_unverified', 409);
          const room = s.venue.rooms ? matches[0].rooms?.find(room => room.id === action.roomId) : null;
          if (s.venue.rooms ? !room : action.roomId !== undefined) throw new ZenchefError('room_required_or_unverified', 409);
          s.formSelection = { ...s.searchQuery, time: action.time, ...(room ? { roomId: room.id, roomName: room.name } : {}) };
          const url = zenchefFormUrl(s.formSelection, s.venue);
          await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({ state: 'visible', timeout: 20000 });
          const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
          const form = data?.props?.initialState?.appStoreState;
          if (s.page.url() !== url || data.page !== '/form' || form?.restaurantId !== s.venue.venueId
            || form.wish?.day !== s.searchQuery.date || form.wish?.pax !== s.searchQuery.party
            || form.wish?.slot !== action.time || form.wish?.waiting_list !== false) throw new ZenchefError('provider_form_mismatch', 502);
          if (room && (form.wish.room_id !== room.id || form.isRoomMandatory !== true
            || !form.rooms?.some(native => native.id === room.id && native.name === room.name)
            || !await s.page.getByText(room.name, { exact: true }).isVisible())) throw new ZenchefError('provider_room_mismatch', 502);
          const supported = ['firstname', 'lastname', 'email', 'phone_number', 'country', 'civility'];
          if (!form.mandatoryFields || Object.entries(form.mandatoryFields).some(([key, value]) => value === 'required' && !supported.includes(key))) {
            throw new ZenchefError('provider_fields_unverified', 409);
          }
          const shift = form.dailyAvailabilities?.[s.searchQuery.date]?.shifts?.find(row => row.id === s.venue.shiftId);
          if (s.venue === ZENCHEF_GIGI_TAVOLA && (shift?.charge_param?.is_web_booking_askable !== true
            || shift.charge_param.min_guests !== 8 || shift.prepayment_param !== null || shift.confirmation?.is_auto !== false
            || shift.is_offer_required !== false || form.isRoomMandatory !== false || form.wish.room_id !== null
            || !Array.isArray(form.wish.offers) || form.wish.offers.length)) throw new ZenchefError('provider_form_mismatch', 502);
          s.noCardAllowed = s.venue === ZENCHEF_FISHCORNER && shift?.id === 545372 && shift.charge_param === null
            && shift.shift_slots?.some(slot => slot.name === action.time && slot.closed === false && slot.marked_as_full === false && slot.possible_guests?.includes(s.searchQuery.party))
            && shift.closed === false && shift.marked_as_full === false && shift.prepayment_param === null && shift.is_offer_required === false && shift.confirmation?.is_auto === true
            && form.isRoomMandatory === false && Array.isArray(form.wish.offers) && !form.wish.offers.length && form.wish.room_id === null;
          if (s.venue === ZENCHEF_PESQUIERE) s.noCardAllowed = shift?.id === 136503
            && shift.charge_param?.is_web_booking_askable === false && shift.prepayment_param === null
            && shift.is_offer_required === false && shift.confirmation?.is_auto === true
            && shift.closed === false && shift.marked_as_full === false
            && shift.shift_slots?.some(slot => slot.name === action.time && slot.closed === false && slot.marked_as_full === false
              && slot.possible_guests?.includes(s.searchQuery.party) && slot.available_rooms?.[s.searchQuery.party]?.includes(room.id))
            && Array.isArray(form.wish.offers) && !form.wish.offers.length;
          const termsLabel = s.page.locator('[data-testid="eula-checkbox"]');
          const text = await termsLabel.count() === 1 ? await termsLabel.innerText() : '';
          s.terms = { text, version: digest([text, form.restaurantComment || null, shift || null]),
            url: `https://bookings.zenchef.com/gtc?rid=${s.venue.venueId}&lang=fr`,
            ...(s.venue === ZENCHEF_GIGI_TAVOLA ? { venueNotice: typeof shift?.comment?.fr === 'string' ? shift.comment.fr : '',
              confirmationMode: 'request', providerConfirmationVerified: false } : {}) };
          if (!text.trim()) s.noCardAllowed = false;
          s.state = 'contact'; s.review = null;
          return await this.snapshot(s);
        }
        if (action.type === 'fill' && ['contact', 'review'].includes(s.state)) {
          const fields = action.fields;
          if (!fields || ![5, 6].includes(Object.keys(fields).length) || Object.keys(fields).some(k => ![...FIELDS, 'civility', 'country'].includes(k))
            || (fields.country !== undefined && !/^[a-z]{2}$/.test(fields.country)) || FIELDS.some(k => typeof fields[k] !== 'string'
            || !fields[k].trim() || fields[k].length > 200) || !['mr', 'mrs', 'mx'].includes(fields.civility)
            || !/^\+\d{7,15}$/.test(fields.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new ZenchefError('contact_fields');
          s.review = null; s.state = 'contact';
          for (const k of FIELDS) {
            await s.page.locator(PROVIDER_FIELDS[k]).fill(fields[k]);
            await s.page.locator(PROVIDER_FIELDS[k]).blur();
          }
          const radio = s.page.locator(`input[name="civility"][value="${fields.civility}"]`);
          // Zenchef hides the native radio and handles clicks on its visible label.
          await radio.locator('xpath=ancestor::label[1]').click();
          if (!await radio.isChecked()) throw new ZenchefError('provider_field_not_applied', 409);
          // Never opt into storage/marketing or infer acceptance of provider terms.
          for (const box of await s.page.locator('input[type="checkbox"]').all()) if (await box.isChecked()) {
            await box.locator('xpath=ancestor::label[1]').click();
            if (await box.isChecked()) throw new ZenchefError('provider_consent_not_cleared', 409);
          }
          return await this.snapshot(s);
        }
        if (action.type === 'review' && ['contact', 'review'].includes(s.state)) {
          await this.verifyNativeRoom(s);
          const details = { ...s.formSelection, civility: await s.page.locator('input[name="civility"]:checked').inputValue() };
          for (const k of FIELDS) details[k] = await s.page.locator(PROVIDER_FIELDS[k]).inputValue();
          details.country = await this.nativeCountry(s);
          if (FIELDS.some(k => !details[k]?.trim())) throw new ZenchefError('contact_required');
          s.details = details; s.state = 'review';
          s.review = { token: crypto.randomUUID(), revision: s.revision + 1,
            digest: digest([s.owner, s.id, s.restaurantId, details, s.terms?.version]) };
          return await this.snapshot(s);
        }
        if (action.type === 'submit') {
          if (s.state !== 'review' || action.confirm !== true || action.terms !== true
            || !s.review || s.review.revision !== s.revision || action.reviewToken !== s.review.token) throw new ZenchefError('confirmation_required', 409);
          await this.verifyNativeRoom(s);
          const actual = { ...s.formSelection, civility: await s.page.locator('input[name="civility"]:checked').inputValue() };
          for (const k of FIELDS) actual[k] = await s.page.locator(PROVIDER_FIELDS[k]).inputValue();
          actual.country = await this.nativeCountry(s);
          if (digest([s.owner, s.id, s.restaurantId, actual, s.terms?.version]) !== s.review.digest) throw new ZenchefError('stale_review', 409);
          // Arpège's actual form requires a card imprint; no card/booking request
          // has been verified or authorized. Do not click its validate button.
          if (s.venue.preparationOnly) throw new ZenchefError(s.venue.submissionBlocker, 409);
          if (!s.noCardAllowed) throw new ZenchefError('card_and_supplier_submission_unverified', 409);
          if (!this.enableSubmission || !s.lastSnapshot.canSubmit) throw new ZenchefError('submission_disabled', 409);
          if (action.termsVersion !== s.terms.version || !/^[a-zA-Z0-9_-]{16,100}$/.test(action.idempotencyKey || '')) throw new ZenchefError('confirmation_required', 409);
          if (await s.page.locator('[data-testid="eula-checkbox"]').innerText() !== s.terms.text) throw new ZenchefError('stale_review', 409);
          s.approval = { ...actual, terms: true, termsVersion: s.terms.version, reviewToken: s.review.token,
            revision: s.revision, idempotencyKey: action.idempotencyKey, reviewFingerprint: s.review.digest,
            provider: 'Zenchef', restaurantId: s.restaurantId, phase: 'booking', mode: 'live', sessionId: s.id, owner: s.owner,
            details: { date: actual.date, time: actual.time, party: actual.party,
              ...(s.venue.rooms ? { roomId: actual.roomId, roomName: actual.roomName } : {}) } };
          s.submissionStarted = true; s.result = { status: 'unknown' }; s.state = 'result';
          try {
            // Never preserve invisible/default marketing or storage opt-ins.
            for (const box of await s.page.locator('input[type="checkbox"]').all()) if (await box.isChecked()) {
              await box.locator('xpath=ancestor::label[1]').click();
            }
            await s.page.locator('[data-testid="eula-checkbox"]').click();
            if (!await s.page.locator('[data-testid="eula-checkbox"] input').isChecked()) throw new ZenchefError('confirmation_required');
            const done = new Promise(resolve => { s.submitDone = resolve; });
            s.armed = true;
            await s.page.locator('[data-testid="validate-btn"]').click();
            await bounded(() => done, 32000);
          } catch { s.result = { status: 'unknown' }; }
          finally { s.armed = false; s.state = 'result'; }
          return await this.snapshot(s);
        }
        throw new ZenchefError('invalid_transition', 409);
      }
      if (s.attempted) throw new ZenchefError('already_attempted', 409);
      const click = name => s.page.locator(`[data-zenchef-test="${name}"]`).click();
      if (action.type === 'search' && s.state === 'search') {
        const date = String(action.date || '');
        const parsed = new Date(date + 'T12:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed)
          || parsed.toISOString().slice(0, 10) !== date || !Number.isInteger(action.party)
          || action.party < 1 || action.party > 20) throw new ZenchefError('search_fields');
        await s.page.locator('[data-zenchef-test="date"]').fill(date);
        await s.page.locator('[data-zenchef-test="party"]').fill(String(action.party));
        await click('search');
        s.details = { date, party: action.party }; s.state = 'slots';
      } else if (action.type === 'select' && s.state === 'slots') {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(action.time)) throw new ZenchefError('time');
        const slot = s.page.locator(`[data-zenchef-test="slot"][data-time="${action.time}"]`);
        if (await slot.count() !== 1 || !await slot.isEnabled() || !await slot.isVisible()) throw new ZenchefError('slot_unavailable');
        const kind = await slot.getAttribute('data-kind');
        if (kind !== 'reservation') throw new ZenchefError(kind === 'waitlist' ? 'waitlist_unsupported' : 'slot_unverified');
        await slot.click(); s.details.time = action.time; s.state = 'contact';
      } else if (action.type === 'contact' && s.state === 'contact') {
        const fields = action.fields;
        if (!fields || Object.keys(fields).length !== FIELDS.length || FIELDS.some(k => typeof fields[k] !== 'string'
          || !fields[k].trim() || fields[k].length > 200)) throw new ZenchefError('contact_fields');
        for (const k of FIELDS) await s.page.locator(`[data-zenchef-test="${k}"]`).fill(fields[k]);
        await click('review'); s.details = { ...s.details, ...fields }; s.state = 'review';
      } else if (action.type === 'submit' && s.state === 'review') {
        if (!s.lastSnapshot.canSubmit || action.confirm !== true || action.terms !== true) throw new ZenchefError('confirmation_required', 409);
        // Attempt stays consumed if the durable hook fails or a response is lost.
        s.attempted = true; s.state = 'unknown'; s.result = { status: 'sandbox_unknown' };
        try {
          const reservation = await this.reserveSubmission({ ...s.details, terms: true }, s);
          // The provider-neutral journal (PR146) returns an explicit decision.
          // Keep legacy throwing hooks compatible, but never ignore a denial.
          if (reservation !== undefined && reservation?.sendAllowed !== true) {
            throw new ZenchefError('attempt_not_authorized', 409);
          }
          if (this.#closed) throw new ZenchefError('closed', 503);
          await click('submit');
          const result = s.page.locator('[data-zenchef-test="result"]');
          await result.waitFor({ state: 'visible' });
          const status = await result.getAttribute('data-status');
          const reference = await result.getAttribute('data-reference');
          if (status === 'confirmed' && reference) {
            s.result = { status: 'sandbox_confirmed', reference }; s.state = 'sandbox_confirmed';
          } else if (status === 'rejected') { s.result = { status: 'sandbox_rejected' }; s.state = 'rejected'; }
          else if (status === 'payment_required') { s.result = { status: 'sandbox_payment_required' }; s.state = 'payment_required'; }
        } catch { /* unknown, no automatic retry */ }
        try { await this.recordResult(s); }
        catch { s.state = 'unknown'; s.result = { status: 'sandbox_unknown', reason: 'result_persistence_failed' }; }
      } else throw new ZenchefError('invalid_transition', 409);
      return await this.snapshot(s);
    } catch (error) {
      // Invalidate screenshots after any partially completed browser interaction.
      try { await this.snapshot(s); }
      catch { this.#sessions.delete(s.id); await s.context.close().catch(() => {}); }
      throw error;
    } finally { s.busy = false; }
  }
  async remove(id, owner) {
    const s = this.#sessions.get(id);
    if (!s || s.owner !== owner) throw new ZenchefError('session_expired', 404);
    if (s.busy) throw new ZenchefError('busy', 409);
    this.#sessions.delete(id); await s.context.close();
  }
  async expire() {
    for (const s of this.#sessions.values()) if (!s.busy && this.now() - s.touched >= TTL) await this.remove(s.id, s.owner);
  }
  async close() {
    this.#closed = true;
    await Promise.all([...this.#sessions.values()].map(s => s.context.close().catch(() => {})));
    const browser = await this.#browserPromise?.catch(() => null);
    await browser?.close(); this.#sessions.clear();
  }
}
