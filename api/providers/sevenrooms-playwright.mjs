import crypto from 'node:crypto';

// Issue129: master-approved pilot, independently bound to reviewed registry/source.
// Backend browser mirror, NOT the iframe or legacy HTTP srBookSlot implementation.
// Hold and guest controls are observed on the original frontend. Writes are off
// by default; server wiring must explicitly enable them with a durable journal.
// Final submission/proof require a separately verified venue policy.
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
const HOLD_PATH = '/api-yoa/dining/hold/add';
const BOOK_PATH = '/booking/dining/widget/strandvagen1/book';
const GUEST_FIELDS = Object.freeze({ firstname: 'firstName', lastname: 'lastName', email: 'emailAddress', phone: 'phoneNumber' });
const MARKETING_FIELDS = ['agreedToVenueSmsMarketingOptIn', 'agreedToVenueSpecificMarketingOptIn', 'agreedToVenueGroupMarketingOptIn', 'agreedToTailoredCommunicationOptIn'];
const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function sevenRoomsHoldMatches(payload, selection) {
  const keys = ['access_persistent_id','party_size','date','shift_persistent_id','channel','time','venue'];
  return !!(payload && selection && Object.keys(payload).length === keys.length && keys.every(key => Object.hasOwn(payload, key))
    && [SEVENROOMS_PILOT.venueId, SEVENROOMS_PILOT.internalVenueId].includes(payload.venue)
    && payload.date === selection.date && payload.party_size === selection.party
    && typeof payload.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(payload.time)
    && (!selection.time || payload.time.slice(0,5) === selection.time)
    && ['access_persistent_id','shift_persistent_id','channel'].every(key => typeof payload[key] === 'string' && /^[a-zA-Z0-9_-]{1,256}$/.test(payload[key])));
}

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
  constructor({ browserFactory, now = () => Date.now(), prepare = false, writeEnabled = false, reserveAttempt, recordAttempt, submissionPolicy } = {}) {
    this.browserFactory = browserFactory || (() => import('playwright').then(({ chromium }) => chromium.launch({ headless: true })));
    this.now = now;
    this.prepare = prepare;
    this.writeEnabled = writeEnabled;
    this.reserveAttempt = reserveAttempt;
    this.recordAttempt = recordAttempt;
    this.submissionPolicy = submissionPolicy;
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
        const address = new URL(request.url());
        if (this.prepare && request.method() === 'POST' && address.origin === ORIGIN && !address.port && !address.username && !address.password && !address.search && !address.hash) {
          if (address.pathname === HOLD_PATH) return this.#captureHold(s, route);
          if (address.pathname === BOOK_PATH && s.submitApproval) {
            s.submitWork=this.#submitRequest(s,route);
            return s.submitWork;
          }
        }
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
  async #captureHold(s, route) {
    let payload;
    try { payload = route.request().postDataJSON(); } catch {}
    if (s.holdAttempted || s.pendingHold || !sevenRoomsHoldMatches(payload, s.selection)
      || !s.availability || this.now() - Date.parse(s.availability.observedAt) >= 60_000
      || !s.availability.slots.some(slot => slot.time === payload.time.slice(0,5))) return route.abort();
    const details = { restaurantId:s.restaurantId, date:payload.date, time:payload.time.slice(0,5), party:payload.party_size };
    const reviewFingerprint = fingerprint({ sessionId:s.id, phase:'hold', payload });
    s.state = 'hold_review';
    let finish;
    const waiting = new Promise(resolve => { finish = resolve; });
    const pending = { route, details, reviewFingerprint, expiresAt:this.now()+60_000, finish };
    pending.timer = setTimeout(() => {
      if (s.pendingHold === pending) { s.pendingHold=null; s.state='hold_expired'; route.abort().catch(()=>{}); finish(); }
    },60_000);
    pending.timer.unref?.();
    s.pendingHold = pending;
    await waiting;
  }
  async #dispatch(s, phase, details, reviewFingerprint, route) {
    if (!this.writeEnabled || !this.reserveAttempt || !this.recordAttempt) throw new SevenRoomsMirrorError('write_disabled',409);
    const intent = Object.freeze({ owner:s.owner, sessionId:s.id, restaurantId:s.restaurantId, provider:'SevenRooms', phase, reviewFingerprint, details:structuredClone(details) });
    const reservation = await this.reserveAttempt(intent);
    if (reservation?.sendAllowed !== true || !reservation.attempt) throw new SevenRoomsMirrorError('already_attempted',409);
    // From this point a transport exception is ambiguous: never dispatch again.
    s.result = { status:'unknown', phase };
    let outcome = { status:'unknown', phase };
    try {
      const response = await route.fetch({maxRedirects:0,timeout:15_000});
      const body = await response.body();
      let data; try { data=JSON.parse(body.toString()); } catch {}
      if (phase === 'hold' && response.status() === 200 && data?.status === 200
        && typeof data?.data?.reservation_hold_id === 'string' && data.data.reservation_hold_id.length > 0
        && Number.isFinite(data.data.hold_duration_sec) && data.data.hold_duration_sec > 0 && data.data.hold_duration_sec <= 3600) {
        s.hold = { id:data.data.reservation_hold_id, expiresAt:this.now()+data.data.hold_duration_sec*1000, details };
        outcome = {status:'held',phase};
      }
      if (phase === 'booking' && this.submissionPolicy?.verifyConfirmation) {
        // The policy is a server-owned, venue-specific evidence contract, never
        // request input. No generic HTTP success / id heuristic is accepted.
        const proof = await this.submissionPolicy.verifyConfirmation({status:response.status(),data,intent,holdId:s.hold?.id});
        if (proof?.confirmed === true && typeof proof.reference === 'string' && proof.reference && proof.reviewFingerprint === reviewFingerprint
          && proof.restaurantId === s.restaurantId && proof.sessionId === s.id) outcome={status:'confirmed',phase,reference:proof.reference};
      }
      // A hold is not a confirmed booking. Keep its durable attempt non-retriable;
      // provider hold identifiers and expiry remain private to this session.
      await this.recordAttempt({intent,attempt:reservation.attempt,result:outcome.status==='held' ? {status:'unknown',phase:'hold'} : outcome});
      s.result=outcome;
      if (response.status() >= 300 && response.status() < 400) { await route.abort(); return; }
      await route.fulfill({status:response.status(),headers:response.headers(),body});
    } catch {
      s.result={status:'unknown',phase};
      await this.recordAttempt({intent,attempt:reservation.attempt,result:s.result}).catch(()=>{});
      await route.abort().catch(()=>{});
    }
  }
  async #submitRequest(s, route) {
    s.resolveSubmit?.();
    if (s.submitAttempted || !s.hold || this.now() >= s.hold.expiresAt || !this.submissionPolicy?.matchesRequest) return route.abort();
    const approval=s.submitApproval;
    let matches=false;
    try { matches=await this.submissionPolicy.matchesRequest({request:route.request(),details:structuredClone(approval.details),holdId:s.hold.id}); } catch {}
    if (matches !== true) { s.state='payload_mismatch'; return route.abort(); }
    s.submitAttempted=true;
    try { await this.#dispatch(s,'booking',approval.details,approval.reviewFingerprint,route); } catch { s.state='submission_blocked'; await route.abort().catch(()=>{}); }
  }
  async #guest(s) {
    const fields=[];
    for (const [name,inputName] of Object.entries(GUEST_FIELDS)) {
      const input=s.page.locator(`input[name="${inputName}"]:visible`);
      if (await input.count() !== 1) return [];
      fields.push({name,value:await input.inputValue()});
    }
    return fields;
  }
  async #snapshot(s) {
    const text = (await s.page.locator('body').innerText()).slice(0, 12_000);
    if (/captcha|verify you are human|access denied|unusual traffic/i.test(text)) s.state = 'access_blocked';
    const shot = await s.page.screenshot({ type: 'png' });
    s.touched = this.now();
    s.revision++;
    const fields=this.prepare && s.hold ? await this.#guest(s) : [];
    const holdReview=s.pendingHold ? {...s.pendingHold.details,fingerprint:s.pendingHold.reviewFingerprint,expiresAt:s.pendingHold.expiresAt} : null;
    return {
      id: s.id, provider: 'SevenRooms', restaurantId: s.restaurantId, restaurant: SEVENROOMS_PILOT.name,
      revision: s.revision, width: s.width, height: s.height,
      image: `data:image/png;base64,${shot.toString('base64')}`, imageHash: crypto.createHash('sha256').update(shot).digest('hex'),
      capturedAt: new Date(s.touched).toISOString(), text, mode: this.prepare ? 'prepare' : 'inspect', state: s.state,
      phase:s.result?.phase==='booking' ? 'result' : s.pendingHold ? 'hold_review' : s.bookingReview ? 'booking_review' : s.hold ? 'guest' : 'selection',
      canSubmit: !!(s.bookingReview && this.writeEnabled && this.submissionPolicy && !s.submitAttempted && s.hold?.expiresAt > this.now()),
      canHold: !!(holdReview && this.writeEnabled && this.reserveAttempt && this.recordAttempt),
      holdReview, bookingReview:s.bookingReview ? structuredClone(s.bookingReview) : null,
      reviewFingerprint:s.bookingReview?.reviewFingerprint || null,
      result:s.result ? {...s.result} : null, fields, blocked: ['access_blocked','unsupported_navigation','provider_write_required'].includes(s.state), blockedRequests: s.blockedRequests,
      blockedRoutes: s.blockedRoutes.map(route => ({ ...route })),
      readiness: s.availability && this.now() - Date.parse(s.availability.observedAt) < 60_000 ? 'availability_observed' : 'unverified',
      selection: s.selection ? { ...s.selection } : null,
      availability: s.availability ? { ...s.availability, slots: s.availability.slots.map(slot => ({ ...slot })) } : null,
      expiresIn: TTL / 1000, limitation: 'Live activation and venue-specific final request/confirmation policy require verification.',
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
    if (!['click', 'scroll', 'refresh', 'search', ...(this.prepare ? ['hold','fill','review','submit'] : [])].includes(action.type)) throw new SevenRoomsMirrorError('inspect_only');
    if (['access_blocked','unsupported_navigation','provider_write_required'].includes(s.state) && action.type !== 'refresh') throw new SevenRoomsMirrorError(s.state, 409);
    if ((s.pendingHold || s.holdAttempted) && ['click','search'].includes(action.type)) throw new SevenRoomsMirrorError('phase_locked',409);
    if (action.type === 'click' && (![action.x, action.y].every(Number.isFinite) || action.x < 0 || action.x >= s.width || action.y < 0 || action.y >= s.height)) throw new SevenRoomsMirrorError('coordinates');
    if (action.type === 'scroll' && (!Number.isFinite(action.delta) || Math.abs(action.delta) > 760)) throw new SevenRoomsMirrorError('scroll');
    const selection = action.type === 'search' ? sevenRoomsSearchSelection(action) : null;
    s.busy = true;
    try {
      if (action.type === 'hold') {
        const pending=s.pendingHold;
        if (!pending || pending.expiresAt <= this.now()) throw new SevenRoomsMirrorError('hold_expired',409);
        if (action.confirm !== true || action.reviewFingerprint !== pending.reviewFingerprint) throw new SevenRoomsMirrorError('confirmation_required',409);
        if (!this.writeEnabled) throw new SevenRoomsMirrorError('write_disabled',409);
        s.holdAttempted=true; s.pendingHold=null; clearTimeout(pending.timer);
        try { await this.#dispatch(s,'hold',pending.details,pending.reviewFingerprint,pending.route); }
        catch(error) { await pending.route.abort().catch(()=>{}); throw error; }
        finally { pending.finish(); }
        s.state=s.hold ? 'guest_details' : 'hold_unknown';
      }
      if (['fill','review','submit'].includes(action.type)) {
        if (!s.hold || this.now() >= s.hold.expiresAt) throw new SevenRoomsMirrorError('hold_expired',409);
        if (s.submitAttempted) throw new SevenRoomsMirrorError('already_attempted',409);
        if (await s.page.locator('iframe[src*="stripe" i]:visible, input[autocomplete="cc-number"]:visible').count()) throw new SevenRoomsMirrorError('card_required',409);
      }
      if (action.type === 'fill') {
        const entries=Object.entries(action.fields || {});
        if (!entries.length || entries.some(([name,value])=>!Object.hasOwn(GUEST_FIELDS,name)||typeof value!=='string'||value.length>254)) throw new SevenRoomsMirrorError('field');
        s.bookingReview=null;
        for(const [name,value] of entries) { const input=s.page.locator(`input[name="${GUEST_FIELDS[name]}"]:visible`); await input.fill(value); await input.blur(); }
        for(const name of MARKETING_FIELDS) { const input=s.page.locator(`input[name="${name}"]:visible`); if(await input.count()===1) await input.uncheck(); }
      }
      if (action.type === 'review') {
        const fields=await this.#guest(s);
        const button=s.page.locator('[data-test="checkout-button-complete"]:visible');
        if (fields.length!==4 || fields.some(field=>!field.value.trim()) || await button.count()!==1 || !await button.isEnabled()) throw new SevenRoomsMirrorError('provider_validation_required',409);
        const termsText=(await s.page.locator('body').innerText()).slice(0,12000);
        const details={...s.hold.details,guest:Object.fromEntries(fields.map(field=>[field.name,field.value])),termsText};
        s.bookingReview={details,reviewFingerprint:fingerprint({sessionId:s.id,holdId:s.hold.id,details})};
      }
      if (action.type === 'submit') {
        const review=s.bookingReview;
        if (!review || action.confirm!==true || action.terms!==true || action.reviewFingerprint!==review.reviewFingerprint) throw new SevenRoomsMirrorError('confirmation_required',409);
        if (!this.writeEnabled || !this.submissionPolicy?.matchesRequest || !this.submissionPolicy?.verifyConfirmation) throw new SevenRoomsMirrorError('submission_contract_unverified',409);
        const fields=await this.#guest(s);
        if (JSON.stringify(Object.fromEntries(fields.map(field=>[field.name,field.value])))!==JSON.stringify(review.details.guest)
          || (await s.page.locator('body').innerText()).slice(0,12000)!==review.details.termsText) throw new SevenRoomsMirrorError('stale_review',409);
        s.submitApproval=review;
        let timer;
        const arrived=new Promise(resolve=>{s.resolveSubmit=resolve;timer=setTimeout(resolve,10_000);});
        try {
          await s.page.locator('[data-test="checkout-button-complete"]:visible').click(); await arrived;
          // Wait for async request validation/dispatch to finish, not merely the click.
          await this.#settle(s); await s.submitWork;
        } finally { clearTimeout(timer);s.resolveSubmit=null;s.submitApproval=null; }
      }
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
    if(s.pendingHold) {clearTimeout(s.pendingHold.timer);s.pendingHold.finish();}
    await s.context.close();
  }
  async expire() {
    await Promise.all([...this.#sessions.values()].filter(s => !s.busy && this.now() - s.touched >= TTL).map(s => this.remove(s.id, s.owner)));
  }
  async close() {
    this.#closed = true;
    for(const s of this.#sessions.values()) if(s.pendingHold){clearTimeout(s.pendingHold.timer);s.pendingHold.finish();}
    await Promise.all([...this.#sessions.values()].map(s => s.context.close().catch(() => {})));
    this.#sessions.clear();
    if (this.#browserPromise) await (await this.#browserPromise.catch(() => null))?.close();
  }
}
