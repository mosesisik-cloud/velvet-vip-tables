import crypto from 'node:crypto';

// DRAFT: provider DOM/API and a supplier sandbox have not been verified.
// Only the local, network-isolated fixture can advance beyond inspection.
// Never wire fixture mode to a public server or count its result as a booking.
export const ZENCHEF_ARPEGE = Object.freeze({
  restaurantId: 'curated-PAR-arpege', venueId: '354036', name: 'Arpège',
  url: 'https://bookings.zenchef.com/results?rid=354036&lang=fr',
});
const FIXTURE_URL = 'https://zenchef-fixture.invalid/';
const TTL = 10 * 60_000;
const FIELDS = ['firstname', 'lastname', 'email', 'phone'];
const PROVIDER_FIELDS = Object.freeze({ firstname: '[data-testid="firstname-input"]',
  lastname: '[data-testid="lastname-input"]', email: '[data-testid="email-input"]', phone: '[data-testid="phone-input"]' });
export class ZenchefError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}

export function zenchefSearchUrl(query) {
  const { date, party } = query || {};
  const parsed = new Date(String(date) + 'T12:00:00Z');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed)
    || parsed.toISOString().slice(0, 10) !== date || !Number.isInteger(party) || party < 1 || party > 6) {
    throw new ZenchefError('search_fields');
  }
  // day/pax are the provider's own public results-page parameters (2026-10-16).
  return ZENCHEF_ARPEGE.url + `&day=${date}&pax=${party}`;
}

export function zenchefFormUrl(selection) {
  const search = zenchefSearchUrl(selection);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(selection.time)) throw new ZenchefError('time');
  return search.replace('/results?', '/form?') + '&slot=' + encodeURIComponent(selection.time);
}

// Public bundle and rendered form observed 2026-10-16. API reads remain pinned
// to the venue and selected month; authentication is the provider's normal GET.
// No alternate WAF route, token injection, quotation POST or payment resource.
export function allowedZenchefPreparationRequest(request, selection) {
  if (request.method() !== 'GET' || request.redirectedFrom()) return false;
  let expected, u;
  try { expected = zenchefFormUrl(selection); u = new URL(request.url()); } catch { return false; }
  if (request.resourceType() === 'document') return request.url() === expected;
  if (u.origin === 'https://bookings.zenchef.com' && !u.search) {
    return (request.resourceType() === 'script' && /^\/_next\/static\/chunks\/[A-Za-z0-9_./-]+\.js$/.test(u.pathname))
      || (request.resourceType() === 'stylesheet' && /^\/_next\/static\/css\/[A-Za-z0-9_.-]+\.css$/.test(u.pathname))
      || (request.resourceType() === 'font' && /^\/_next\/static\/media\/[A-Za-z0-9_.-]+\.(woff2?|ttf)$/.test(u.pathname))
      || (['fetch', 'xhr'].includes(request.resourceType()) && /^\/locales\/fr\/(translation|validation)\.json$/.test(u.pathname));
  }
  if (u.origin !== 'https://bookings-middleware.zenchef.com' || !['fetch', 'xhr'].includes(request.resourceType())
    || u.hash || u.username || u.password || u.searchParams.getAll('restaurantId').length !== 1
    || u.searchParams.get('restaurantId') !== '354036') return false;
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
export function zenchefAvailabilityEvidence(data, query, observedAt = Date.now()) {
  zenchefSearchUrl(query);
  const state = data?.props?.initialState?.appStoreState;
  const day = state?.dailyAvailabilities?.[query.date];
  if (data?.page !== '/results' || data.query?.rid !== '354036' || data.query?.day !== query.date
    || String(data.query?.pax) !== String(query.party) || state?.restaurantId !== '354036'
    || state.initializedSSR !== true || state.wish?.day !== query.date || state.wish?.pax !== query.party
    || state.wish.waiting_list !== false || state.restaurantTimezone !== 'Europe/Paris'
    || ![false, 0].includes(state.isDisabled) || day?.date !== query.date || !Array.isArray(day.shifts)) {
    throw new ZenchefError('provider_state_unverified', 502);
  }
  const localNow = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(observedAt);
  const inWindow = row => {
    const valid = v => v === null || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v));
    return valid(row.bookable_from) && valid(row.bookable_to)
      && (row.bookable_from === null || row.bookable_from <= localNow)
      && (row.bookable_to === null || row.bookable_to > localNow);
  };
  const candidates = [];
  for (const shift of day.shifts) {
    if (shift.closed !== false || shift.marked_as_full !== false || !inWindow(shift) || !Array.isArray(shift.shift_slots)) continue;
    for (const slot of shift.shift_slots) {
      if (slot.closed !== false || slot.marked_as_full !== false || !inWindow(slot)
        || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.name) || !slot.possible_guests?.includes(query.party)
        || !Array.isArray(slot.available_rooms?.[query.party]) || !slot.available_rooms[query.party].length) continue;
      candidates.push({ time: slot.name, shiftId: shift.id });
    }
  }
  return { source: 'provider_server_rendered', restaurantId: ZENCHEF_ARPEGE.restaurantId,
    date: query.date, party: query.party, observedAt: new Date(observedAt).toISOString(),
    candidates, selectable: false, confirmationVerified: false,
    limitation: 'offer_room_card_and_submission_not_verified' };
}

// Deliberately NOT a generic GET allowlist. Even GET can create supplier state.
// No live scripts, inventory API, redirects, form posts or arbitrary clicks yet.
export function allowedZenchefInspectionRequest(request, query = null) {
  let expected;
  try { expected = query ? zenchefSearchUrl(query) : ZENCHEF_ARPEGE.url; } catch { return false; }
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
  constructor({ browserFactory, mode = 'inspect', fixtureHtml,
    reserveSubmission, recordResult, now = Date.now } = {}) {
    if (!['inspect', 'prepare', 'fixture'].includes(mode)) throw new ZenchefError('live_not_verified');
    if (mode !== 'fixture' && fixtureHtml !== undefined) throw new ZenchefError('fixture_forbidden');
    if (mode === 'fixture' && (typeof fixtureHtml !== 'string' || !fixtureHtml)) throw new ZenchefError('fixture_required');
    this.mode = mode; this.fixtureHtml = fixtureHtml;
    this.reserveSubmission = reserveSubmission; this.recordResult = recordResult;
    this.now = now;
    this.browserFactory = browserFactory || (() => import('playwright').then(({ chromium }) => chromium.launch({ headless: true })));
  }
  async create(owner, restaurantId) {
    if (this.#closed) throw new ZenchefError('closed', 503);
    if (typeof owner !== 'string' || !owner) throw new ZenchefError('auth', 401);
    if (restaurantId !== ZENCHEF_ARPEGE.restaurantId) throw new ZenchefError('unsupported_restaurant');
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
        locale: 'fr-FR', timezoneId: 'Europe/Paris', serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, restaurant: ZENCHEF_ARPEGE.name,
        provider: 'Zenchef', destination: 'Paris', context, revision: 0, touched: this.now(),
        busy: false, attempted: false, state: 'inspect_only', result: null, blockedRequests: 0 };
      await context.route('**/*', async route => {
        const r = route.request();
        if (this.mode === 'fixture') {
          if (r.url() === FIXTURE_URL && r.method() === 'GET' && r.resourceType() === 'document' && !r.redirectedFrom()) {
            return route.fulfill({ status: 200, contentType: 'text/html', body: this.fixtureHtml });
          }
        } else if (s.formSelection ? allowedZenchefPreparationRequest(r, s.formSelection) : allowedZenchefInspectionRequest(r, s.searchQuery)) {
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
      await s.page.goto(this.mode === 'fixture' ? FIXTURE_URL : ZENCHEF_ARPEGE.url,
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
    return structuredClone(this.owned(s.id, owner).lastSnapshot);
  }
  async snapshot(s) {
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
    const snapshot = { id: s.id, restaurantId: s.restaurantId, restaurant: s.restaurant,
      provider: 'Zenchef', mode: this.mode, evidenceMode: this.mode === 'fixture' ? 'local_fixture' : 'readonly_shell',
      revision: ++s.revision, state: s.state, width: 420, height: 760,
      image: `data:image/png;base64,${shot.toString('base64')}`,
      imageHash: crypto.createHash('sha256').update(shot).digest('hex'),
      capturedAt: new Date(this.now()).toISOString(), expiresIn: TTL / 1000,
      liveAvailabilitySupported: false, canSubmit: this.mode === 'fixture' && s.state === 'review'
        && !s.attempted && typeof this.reserveSubmission === 'function' && typeof this.recordResult === 'function',
      details: s.details ? structuredClone(s.details) : null, result: s.result ? { ...s.result } : null,
      availabilityEvidence: s.availabilityEvidence ? structuredClone(s.availabilityEvidence) : null,
      reviewToken: s.review?.revision === s.revision ? s.review.token : null,
      checkoutBlocker: s.formSelection ? 'card_and_supplier_submission_unverified' : null,
      blockedRequests: s.blockedRequests,
      blocker: this.mode === 'inspect' ? 'supplier_dom_endpoints_and_sandbox_unverified' : 'local_fixture_only' };
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
      if (this.mode !== 'fixture' && action.type === 'search') {
        const query = { date: action.date, party: action.party };
        const url = zenchefSearchUrl(query);
        s.searchQuery = query; s.formSelection = null; s.details = null; s.review = null;
        s.availabilityEvidence = null; s.state = 'inspect_only';
        await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
        s.availabilityEvidence = zenchefAvailabilityEvidence(data, query, this.now());
        s.state = 'availability_observed';
        return await this.snapshot(s);
      }
      if (this.mode === 'prepare') {
        if (action.type === 'select' && s.state === 'availability_observed') {
          const evidence = s.availabilityEvidence;
          const matches = evidence?.candidates.filter(row => row.time === action.time);
          if (!matches || matches.length !== 1 || matches[0].shiftId !== action.shiftId
            || this.now() - Date.parse(evidence.observedAt) > 120000) throw new ZenchefError('slot_stale_or_unverified', 409);
          s.formSelection = { ...s.searchQuery, time: action.time };
          const url = zenchefFormUrl(s.formSelection);
          await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({ state: 'visible', timeout: 20000 });
          const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
          const form = data?.props?.initialState?.appStoreState;
          if (s.page.url() !== url || data.page !== '/form' || form?.restaurantId !== '354036'
            || form.wish?.day !== s.searchQuery.date || form.wish?.pax !== s.searchQuery.party
            || form.wish?.slot !== action.time || form.wish?.waiting_list !== false) throw new ZenchefError('provider_form_mismatch', 502);
          const supported = ['firstname', 'lastname', 'email', 'phone_number', 'country', 'civility'];
          if (!form.mandatoryFields || Object.entries(form.mandatoryFields).some(([key, value]) => value === 'required' && !supported.includes(key))) {
            throw new ZenchefError('provider_fields_unverified', 409);
          }
          s.state = 'contact'; s.review = null;
          return await this.snapshot(s);
        }
        if (action.type === 'fill' && ['contact', 'review'].includes(s.state)) {
          const fields = action.fields;
          if (!fields || Object.keys(fields).length !== 5 || FIELDS.some(k => typeof fields[k] !== 'string'
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
          const details = { ...s.formSelection, civility: await s.page.locator('input[name="civility"]:checked').inputValue() };
          for (const k of FIELDS) details[k] = await s.page.locator(PROVIDER_FIELDS[k]).inputValue();
          if (FIELDS.some(k => !details[k]?.trim())) throw new ZenchefError('contact_required');
          s.details = details; s.state = 'review';
          s.review = { token: crypto.randomUUID(), revision: s.revision + 1,
            digest: crypto.createHash('sha256').update(JSON.stringify([s.owner, s.id, s.restaurantId, details])).digest('hex') };
          return await this.snapshot(s);
        }
        if (action.type === 'submit') {
          if (s.state !== 'review' || action.confirm !== true || action.terms !== true
            || !s.review || s.review.revision !== s.revision || action.reviewToken !== s.review.token) throw new ZenchefError('confirmation_required', 409);
          const actual = { ...s.formSelection, civility: await s.page.locator('input[name="civility"]:checked').inputValue() };
          for (const k of FIELDS) actual[k] = await s.page.locator(PROVIDER_FIELDS[k]).inputValue();
          const digest = crypto.createHash('sha256').update(JSON.stringify([s.owner, s.id, s.restaurantId, actual])).digest('hex');
          if (digest !== s.review.digest) throw new ZenchefError('stale_review', 409);
          // Arpège's actual form requires a card imprint; no card/booking request
          // has been verified or authorized. Do not click its validate button.
          throw new ZenchefError('card_and_supplier_submission_unverified', 409);
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
