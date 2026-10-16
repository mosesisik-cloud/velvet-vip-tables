// Local fixture only. No real Zenchef availability, hold or reservation is tested.
// Run: node --test scripts/test-zenchef-playwright.mjs
import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { ZenchefPlaywright, ZENCHEF_ARPEGE, ZENCHEF_FISHCORNER, ZENCHEF_PESQUIERE, ZENCHEF_PIROUETTE, approvedZenchefPayload, zenchefBookingResult, allowedZenchefInspectionRequest,
  zenchefSearchUrl, zenchefAvailabilityEvidence, zenchefFormUrl, allowedZenchefPreparationRequest } from '../api/providers/zenchef-playwright.mjs';

const fixture = (status = 'confirmed', reference = 'LOCAL-TEST-ONLY') => `<!doctype html><html><body>
<h1>LOCAL FIXTURE — not supplier availability</h1>
<input data-zenchef-test="date" type="date"><input data-zenchef-test="party" type="number">
<button data-zenchef-test="search">Search fixture</button>
<button data-zenchef-test="slot" data-time="19:00" data-kind="reservation">19:00 fixture</button>
<button data-zenchef-test="slot" data-time="20:00" data-kind="waitlist">Waitlist fixture</button>
${['firstname', 'lastname', 'email', 'phone'].map(k => `<input data-zenchef-test="${k}">`).join('')}
<button data-zenchef-test="review">Review fixture</button>
<button data-zenchef-test="submit" onclick="document.querySelector('[data-zenchef-test=result]').hidden=false">Submit fixture</button>
<div hidden data-zenchef-test="result" data-status="${status}" data-reference="${reference}">Fixture result</div>
<script>fetch('https://bookings.zenchef.com/unreviewed-hold',{method:'POST'}).catch(()=>{});</script>
</body></html>`;
let browser;
// Use the backend's pinned Chromium rather than the OS-managed Edge version.
before(async () => { browser = await chromium.launch({ headless: true }); });
const adapters = [];
function adapter(options = {}) {
  // The adapter owns only contexts; this test suite owns the shared browser.
  const a = new ZenchefPlaywright({ mode: 'fixture', fixtureHtml: fixture(),
    browserFactory: async () => ({ newContext: opts => browser.newContext(opts), close: async () => {} }),
    reserveSubmission: async () => {}, recordResult: async () => {}, ...options });
  adapters.push(a); return a;
}
// Release contexts per case instead of retaining every page until suite shutdown.
afterEach(async () => {
  await Promise.all(adapters.splice(0).map(a => a.close()));
  assert.equal(browser.contexts().length, 0, 'each test must release all browser contexts');
});
after(async () => { await browser?.close(); });
const create = (a, owner = 'owner') => a.create(owner, ZENCHEF_ARPEGE.restaurantId);
const act = (a, s, action, owner = 'owner') => a.action(s.id, owner, { revision: s.revision, ...action });
async function review(a, owner = 'owner') {
  let s = await create(a, owner);
  s = await act(a, s, { type: 'search', date: '2030-10-16', party: 2 }, owner);
  s = await act(a, s, { type: 'select', time: '19:00' }, owner);
  return act(a, s, { type: 'contact', fields: { firstname: 'Fixture', lastname: 'Guest', email: 'fixture@example.invalid', phone: '+33000000000' } }, owner);
}

test('live network guard binds exact document/method and rejects redirects, scripts and writes', () => {
  const request = (url = ZENCHEF_ARPEGE.url, method = 'GET', type = 'document', redirect = null) =>
    ({ url: () => url, method: () => method, resourceType: () => type, redirectedFrom: () => redirect });
  assert.equal(allowedZenchefInspectionRequest(request()), true);
  for (const r of [request(ZENCHEF_ARPEGE.url, 'POST'), request(ZENCHEF_ARPEGE.url, 'GET', 'fetch'),
    request(ZENCHEF_ARPEGE.url, 'GET', 'document', {}), request(ZENCHEF_ARPEGE.url + '&hold=1'),
    request(ZENCHEF_ARPEGE.url.replace('354036', '123')), request('https://evil.example/'),
    request('http://bookings.zenchef.com/results?rid=354036&lang=fr')]) assert.equal(allowedZenchefInspectionRequest(r), false);
  assert.throws(() => new ZenchefPlaywright({ mode: 'live' }), /live_not_verified/);
  assert.throws(() => new ZenchefPlaywright({ fixtureHtml: fixture() }), /fixture_forbidden/);
});

test('real local browser flow has owner/revision checks, image hash, no network and sandbox-only confirmation', async () => {
  const events = [];
  const a = adapter({ reserveSubmission: async (details, session) => {
    assert.equal(session.provider, 'Zenchef'); assert.equal(session.destination, 'Paris');
    assert.equal(details.terms, true); events.push('reserved');
  }, recordResult: async s => events.push(s.result.status) });
  const s = await review(a);
  assert.equal(s.evidenceMode, 'local_fixture'); assert.equal(s.canSubmit, true);
  assert.equal(s.liveAvailabilitySupported, false); assert.ok(s.blockedRequests >= 1);
  assert.equal(s.imageHash, crypto.createHash('sha256').update(Buffer.from(s.image.split(',')[1], 'base64')).digest('hex'));
  await assert.rejects(act(a, s, { type: 'submit', confirm: true, terms: true }, 'intruder'), /session_expired/);
  await assert.rejects(a.action(s.id, 'owner', { revision: 0, type: 'submit' }), /stale_view/);
  const result = await act(a, s, { type: 'submit', confirm: true, terms: true });
  assert.equal(result.result.status, 'sandbox_confirmed'); assert.equal(result.canSubmit, false);
  assert.deepEqual(events, ['reserved', 'sandbox_confirmed']);
  await assert.rejects(act(a, result, { type: 'submit', confirm: true, terms: true }), /already_attempted/);
});

test('waitlist, missing consent and invalid dates cannot advance; current recovers fresh revision', async () => {
  const a = adapter(); let s = await create(a);
  await assert.rejects(act(a, s, { type: 'search', date: '2030-02-30', party: 2 }), /search_fields/);
  s = a.current('owner'); s = await act(a, s, { type: 'search', date: '2030-10-16', party: 2 });
  await assert.rejects(act(a, s, { type: 'select', time: '20:00' }), /waitlist_unsupported/);
  s = a.current('owner'); assert.equal(s.state, 'slots');
  await a.remove(s.id, 'owner'); s = await review(a);
  await assert.rejects(act(a, s, { type: 'submit', confirm: true }), /confirmation_required/);
  assert.equal(a.current('owner').state, 'review');
});

test('failed durable reservation prevents submit and consumes attempt', async () => {
  let recorded;
  const a = adapter({ reserveSubmission: async () => { throw Error('already_exists'); }, recordResult: async s => { recorded = s.result.status; } });
  const s = await review(a);
  const r = await act(a, s, { type: 'submit', confirm: true, terms: true });
  assert.equal(r.result.status, 'sandbox_unknown'); assert.equal(recorded, 'sandbox_unknown');
  assert.equal(r.result.reference, undefined);
  await assert.rejects(act(a, r, { type: 'submit', confirm: true, terms: true }), /already_attempted/);
});

test('journal sendAllowed false is enforced without relying on a wrapper throwing', async () => {
  const a = adapter({ reserveSubmission: async () => ({ sendAllowed: false, reason: 'already_attempted' }) });
  const s = await review(a);
  const r = await act(a, s, { type: 'submit', confirm: true, terms: true });
  assert.equal(r.result.status, 'sandbox_unknown');
  assert.equal(r.result.reference, undefined); // fixture click would reveal a reference
  assert.equal(r.canSubmit, false);
  await assert.rejects(act(a, r, { type: 'submit', confirm: true, terms: true }), /already_attempted/);
});

test('unverified confirmation without a reference remains unknown; payment is not confirmation', async () => {
  for (const [status, reference, expected] of [['confirmed', '', 'sandbox_unknown'], ['payment_required', '', 'sandbox_payment_required'], ['rejected', '', 'sandbox_rejected']]) {
    const a = adapter({ fixtureHtml: fixture(status, reference) });
    const s = await review(a); const r = await act(a, s, { type: 'submit', confirm: true, terms: true });
    assert.equal(r.result.status, expected); assert.equal(r.canSubmit, false);
  }
});

test('durable result failure yields unknown and duplicate submit remains blocked', async () => {
  const a = adapter({ recordResult: async () => { throw Error('disk_full'); } });
  const s = await review(a); const r = await act(a, s, { type: 'submit', confirm: true, terms: true });
  assert.equal(r.result.status, 'sandbox_unknown'); assert.equal(r.result.reason, 'result_persistence_failed');
  await assert.rejects(act(a, r, { type: 'submit', confirm: true, terms: true }), /already_attempted/);
});

test('concurrent submits are serialized while durable hook is pending', async () => {
  let release, entered;
  const ready = new Promise(resolve => { entered = resolve; });
  const hold = new Promise(resolve => { release = resolve; });
  const a = adapter({ reserveSubmission: async () => { entered(); await hold; } });
  const s = await review(a); const pending = act(a, s, { type: 'submit', confirm: true, terms: true });
  await ready;
  await assert.rejects(act(a, s, { type: 'submit', confirm: true, terms: true }), /busy/);
  await assert.rejects(a.remove(s.id, 'owner'), /busy/);
  release(); assert.equal((await pending).result.status, 'sandbox_confirmed');
});

test('TTL, owner uniqueness and immutable snapshots', async () => {
  let now = 0; const a = adapter({ now: () => now }); const s = await create(a);
  await assert.rejects(create(a), /session_exists/);
  await assert.rejects(a.create('other', 'wrong-restaurant'), /unsupported_restaurant/);
  s.state = 'sandbox_confirmed'; assert.equal(a.current('owner').state, 'search');
  now = 600000; assert.throws(() => a.current('owner'), /session_expired/);
  await a.expire(); const replacement = await create(a); assert.notEqual(replacement.id, s.id);
  await a.remove(replacement.id, 'owner'); assert.throws(() => a.current('owner'), /session_expired/);
});

test('inspect mode cannot select or submit; redirects fail closed', async () => {
  for (const status of [200, 302]) {
    let fetches = 0;
    const a = new ZenchefPlaywright({ browserFactory: async () => ({
      close: async () => {}, newContext: async opts => {
        const context = await browser.newContext(opts);
        const route = context.route.bind(context);
        context.route = (pattern, handler) => route(pattern, original => handler({
          request: () => original.request(), abort: () => original.abort(),
          fetch: async options => { assert.equal(options.maxRedirects, 0); fetches++; return { status: () => status }; },
          fulfill: () => original.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Locally intercepted inspection shell</h1>' }),
        }));
        return context;
      },
    }) });
    adapters.push(a);
    if (status === 302) await assert.rejects(create(a));
    else {
      const s = await create(a); assert.equal(s.mode, 'inspect'); assert.equal(s.canSubmit, false);
      assert.equal(s.details, null); assert.equal(s.result, null);
      for (const type of ['select', 'contact', 'click', 'submit']) await assert.rejects(act(a, s, { type }), /inspect_only/);
    }
    assert.equal(fetches, 1);
  }
});

test('readonly SSR search binds venue/day/party and excludes waitlist, closed and expired candidates', () => {
  const query = { date: '2030-11-16', party: 2 };
  const slot = { name: '19:00', closed: false, marked_as_full: false, bookable_from: null,
    bookable_to: '2030-11-16 19:00:00', possible_guests: [2], available_rooms: { 2: [15529] } };
  const state = { restaurantId: '354036', initializedSSR: true, restaurantTimezone: 'Europe/Paris', isDisabled: 0,
    wish: { day: query.date, pax: 2, waiting_list: false }, dailyAvailabilities: { [query.date]: {
      date: query.date, shifts: [{ id: 40058, closed: false, marked_as_full: false, bookable_from: null,
        bookable_to: '2030-11-16 22:00:00', shift_slots: [slot, { ...slot, name: '20:00', possible_guests: [], waitlist_possible_guests: [2] },
          { ...slot, name: '21:00', closed: true }] }] } } };
  const data = { page: '/results', query: { rid: '354036', day: query.date, pax: '2' }, props: { initialState: { appStoreState: state } } };
  const now = Date.parse('2030-11-15T12:00:00Z');
  const evidence = zenchefAvailabilityEvidence(data, query, now);
  assert.deepEqual(evidence.candidates, [{ time: '19:00', shiftId: 40058 }]);
  assert.equal(evidence.selectable, false); assert.equal(evidence.confirmationVerified, false);
  assert.equal(zenchefAvailabilityEvidence(data, query, Date.parse('2030-11-16T21:01:00Z')).candidates.length, 0);
  for (const mutate of [d => { d.query.rid = '1'; }, d => { d.props.initialState.appStoreState.wish.pax = 3; },
    d => { d.props.initialState.appStoreState.wish.waiting_list = true; }, d => { delete d.props.initialState.appStoreState.dailyAvailabilities[query.date]; }]) {
    const invalid = structuredClone(data); mutate(invalid);
    assert.throws(() => zenchefAvailabilityEvidence(invalid, query, now), /provider_state_unverified/);
  }
  assert.throws(() => zenchefSearchUrl({ date: '2030-02-30', party: 2 }), /search_fields/);
  assert.throws(() => zenchefSearchUrl({ date: query.date, party: 7 }), /search_fields/);
  const url = zenchefSearchUrl(query);
  const request = address => ({ method: () => 'GET', resourceType: () => 'document', redirectedFrom: () => null, url: () => address });
  assert.equal(allowedZenchefInspectionRequest(request(url), query), true);
  assert.equal(allowedZenchefInspectionRequest(request(url + '&hold=1'), query), false);
  assert.equal(allowedZenchefInspectionRequest(request(url.replace('pax=2', 'pax=3')), query), false);
});

test('preparation guard permits only observed venue/month reads and static resources', () => {
  const selection = { date: '2030-11-16', party: 2, time: '19:30' };
  const request = (url, type = 'fetch', method = 'GET', redirect = null) => ({ url: () => url, method: () => method,
    resourceType: () => type, redirectedFrom: () => redirect });
  const base = 'https://bookings-middleware.zenchef.com';
  assert.equal(allowedZenchefPreparationRequest(request(zenchefFormUrl(selection), 'document'), selection), true);
  assert.equal(allowedZenchefPreparationRequest(request(base + '/getAuthToken?restaurantId=354036'), selection), true);
  assert.equal(allowedZenchefPreparationRequest(request(base + '/getAvailabilitiesSummary?restaurantId=354036&date_begin=2030-11-01&date_end=2030-11-30'), selection), true);
  for (const r of [request(base + '/booking?restaurantId=354036', 'fetch', 'POST'), request(base + '/quotation-preview?restaurantId=354036', 'fetch', 'POST'),
    request(base + '/getAuthToken?restaurantId=1'), request(base + '/getAuthToken?restaurantId=354036&restaurantId=1'),
    request(base + '/getAuthToken?restaurantId=354036&email=test'), request(base + '/getAuthToken?restaurantId=354036', 'fetch', 'GET', {}),
    request(base + '/getAvailabilitiesSummary?restaurantId=354036&date_begin=2030-11-01&date_end=2030-12-31'),
    request('https://js.stripe.com/v3', 'script'), request('https://evil.example/a.js', 'script')]) {
    assert.equal(allowedZenchefPreparationRequest(r, selection), false);
  }
});

test('actual provider field contract replay reaches review but never sends booking or card writes', async () => {
  const date = '2030-11-16'; let providerPage; let reserveCalls = 0;
  // Sanitized DOM contract from observed Arpège fields; synthetic data, no supplier JS.
  const document = url => {
    const u = new URL(url), isForm = u.pathname === '/form';
    const state = { restaurantId: '354036', initializedSSR: true, isDisabled: 0, restaurantTimezone: 'Europe/Paris',
      wish: { day: date, pax: 2, waiting_list: false, ...(isForm ? { slot: '19:30' } : {}) },
      mandatoryFields: { firstname: 'required', lastname: 'required', email: 'required', phone_number: 'required', country: 'required', civility: 'required' },
      dailyAvailabilities: { [date]: { date, shifts: [{ id: 40058, closed: false, marked_as_full: false, bookable_from: null, bookable_to: date + ' 22:00:00',
        shift_slots: [{ name: '19:30', closed: false, marked_as_full: false, bookable_from: null, bookable_to: date + ' 19:30:00', possible_guests: [2], available_rooms: { 2: [15529] } }] }] } } };
    const data = { page: isForm ? '/form' : '/results', query: Object.fromEntries(u.searchParams), props: { initialState: { appStoreState: state } } };
    return `<html><body><h1>Sanitized provider field replay, not live</h1><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>
      ${isForm ? '<input data-testid="firstname-input"><input data-testid="lastname-input"><input data-testid="email-input"><input data-testid="phone-input"><label>Mr<input style="display:none" type="radio" name="civility" value="mr"></label><label>Marketing<input type="checkbox" checked></label><button data-testid="validate-btn">Continue to card imprint</button>' : ''}</body></html>`;
  };
  const a = new ZenchefPlaywright({ mode: 'prepare', now: () => Date.parse('2030-11-15T12:00:00Z'), reserveSubmission: async () => { reserveCalls++; },
    browserFactory: async () => ({ close: async () => {}, newContext: async opts => {
      const context = await browser.newContext(opts); context.on('page', page => { providerPage = page; });
      const route = context.route.bind(context);
      context.route = (pattern, handler) => route(pattern, original => handler({ request: () => original.request(), abort: () => original.abort(),
        fetch: async options => { assert.equal(options.maxRedirects, 0); return { status: () => 200 }; },
        fulfill: () => original.fulfill({ status: 200, contentType: 'text/html', body: document(original.request().url()) }) }));
      return context;
    } }) });
  adapters.push(a);
  let s = await create(a);
  s = await act(a, s, { type: 'search', date, party: 2 });
  s = await act(a, s, { type: 'select', time: '19:30', shiftId: 40058 }); assert.equal(s.state, 'contact');
  const fields = { firstname: 'Fixture', lastname: 'Guest', email: 'fixture@example.invalid', phone: '+33100000000', civility: 'mr' };
  s = await act(a, s, { type: 'fill', fields });
  assert.equal(await providerPage.locator('input[type=checkbox]').isChecked(), false);
  s = await act(a, s, { type: 'review' }); assert.ok(s.reviewToken); assert.equal(s.canSubmit, false); assert.equal(s.details.firstname, 'Fixture');
  await providerPage.locator('[data-testid="firstname-input"]').fill('Changed');
  await assert.rejects(act(a, s, { type: 'submit', reviewToken: s.reviewToken, confirm: true, terms: true }), /stale_review/);
  s = a.current('owner'); s = await act(a, s, { type: 'review' });
  await assert.rejects(act(a, s, { type: 'submit', reviewToken: s.reviewToken, confirm: true, terms: true }), /card_and_supplier_submission_unverified/);
  assert.equal(reserveCalls, 0);
});


// Entire transport intercepted locally, including synthetic supplier receipts.
test('native booking and own-booking readback bind approval without duplicate POSTs', async () => {
  for (const scenario of ['confirmed', 'denied', 'persistence', 'payment', 'country', 'swedish', 'pesquiere', 'pesquiere-receipt', 'pesquiere-echo-bad-uuid', 'pesquiere-echo-date', 'pesquiere-echo-time', 'pesquiere-echo-party',
    'pesquiere-readback', 'pesquiere-readback-native-metadata', 'pesquiere-readback-room', 'pesquiere-readback-missing', 'pesquiere-readback-error',
    'pesquiere-readback-challenge', 'pesquiere-readback-redirect', 'pesquiere-readback-id', 'pesquiere-readback-date',
    'pesquiere-readback-time', 'pesquiere-readback-party', 'pesquiere-readback-pending', 'pesquiere-readback-uuid',
    'pesquiere-readback-bad-uuid', 'pesquiere-readback-metadata', 'pesquiere-readback-cross-before', 'pesquiere-readback-cross-after',
    'pirouette', 'pirouette-receipt', 'pirouette-card', 'pirouette-prepayment', 'pirouette-manual', 'pirouette-gift', 'pirouette-seating']) {
    const venue = scenario.startsWith('pirouette') ? ZENCHEF_PIROUETTE : scenario.startsWith('pesquiere') ? ZENCHEF_PESQUIERE : ZENCHEF_FISHCORNER;
    const chosenRoom = venue === ZENCHEF_PIROUETTE ? 52521 : 52372, otherRoom = venue === ZENCHEF_PIROUETTE ? 65674 : 51183;
    const roomName = venue.rooms?.find(room=>room.id===chosenRoom)?.name;
    const blockedPolicy = ['pirouette-card','pirouette-prepayment','pirouette-manual'].includes(scenario);
    let providerPage;
    const date = '2030-11-16'; let sends = 0, reads = 0, reserves = 0, recorded, liveSession;
    const readCase = scenario.startsWith('pesquiere-readback');
    const fields = { firstname: 'Fixture', lastname: 'Guest', email: 'fixture@example.invalid', phone: scenario === 'swedish' ? '+46701234567' : '+33612345678', civility: 'mr', country: 'fr' };
    const payload = { day: date, nb_guests: 2, time: '12:30', lang: 'fr', firstname: fields.firstname, lastname: fields.lastname,
      civility: 'mr', country: scenario === 'swedish' ? 'se' : 'fr', phone_number: fields.phone, email: fields.email, comment: '', custom_field: scenario === 'pirouette-gift' ? {'numero-de-bon-cadeau':'UNSUPPORTED'} : {}, custom_field_v2: [],
      customersheet: { firstname: fields.firstname, lastname: fields.lastname, civility: 'mr', phone: fields.phone,
        email: fields.email, optins: [{ type: 'review_mail', value: true }, { type: 'review_sms', value: true }], country: scenario === 'swedish' ? 'se' : 'fr', lang: 'fr' },
      offers: [], partner_id: '1001', type: 'web', ...(venue.rooms ? { wish: { booking_room_id: chosenRoom } } : {}) };
    if (venue.rooms) {
      const approval={...fields,date,party:2,time:'12:30',restaurantId:venue.restaurantId,roomId:chosenRoom,roomName};
      assert.equal(!!approvedZenchefPayload(payload,approval),scenario !== 'pirouette-gift');
      assert.equal(approvedZenchefPayload({...payload,wish:{booking_room_id:otherRoom}},approval),null);
      assert.equal(approvedZenchefPayload({...payload,wish:{booking_room_id:chosenRoom,fee:10}},approval),null);
      assert.equal(approvedZenchefPayload(payload,{...approval,roomName:'Different room'}),null);
    }
    const document = url => {
      const u = new URL(url), isForm = u.pathname === '/form';
      const slot = { name: '12:30', closed: false, marked_as_full: false, bookable_from: null, bookable_to: null, possible_guests: [2], available_rooms: { 2: venue.rooms ? venue.rooms.map(room=>room.id) : [1] } };
      const shift = { id: venue.shiftId, closed: false, marked_as_full: false, bookable_from: null, bookable_to: null, shift_slots: [slot],
        charge_param: venue === ZENCHEF_PIROUETTE ? { is_web_booking_askable:true,min_guests:scenario === 'pirouette-card' ? 2 : 3,charge_per_guests:50 } : venue.rooms ? { is_web_booking_askable: false, min_guests: 1, charge_per_guests: 10 } : null,
        prepayment_param: scenario === 'pirouette-prepayment' ? {is_web_booking_askable:true} : null, is_offer_required: false, confirmation: { is_auto: scenario !== 'pirouette-manual', is_auto_until:null } };
      const state = { restaurantId: venue.venueId, initializedSSR: true, restaurantTimezone: venue.timezone, isDisabled: 0,
        wish: { day: date, pax: 2, waiting_list: false, offers: [], room_id: venue.rooms && isForm ? Number(u.searchParams.get('room_id')) : null, ...(isForm ? { slot: '12:30' } : {}) },
        rooms: venue.rooms, mandatoryFields: { firstname: 'required' }, isRoomMandatory: !!venue.rooms, dailyAvailabilities: { [date]: { date, shifts: [shift, { ...shift, id: 545347 }] } } };
      const data = { page: isForm ? '/form' : '/results', query: Object.fromEntries(u.searchParams), props: { initialState: { appStoreState: state } } };
      return `<html><body><h1>LOCAL NATIVE CONTRACT REPLAY</h1>${venue.rooms && isForm ? `<div>${roomName}</div>` : ''}${venue === ZENCHEF_PIROUETTE && isForm ? '<div id=seating>Jusqu&#39;&#224; 14:30</div>' : ''}<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>
        ${isForm ? ['firstname','lastname','email'].map(k=>`<input data-testid="${k}-input">`).join('') + `<div class="iti"><button type="button" class="iti__selected-country" title="Selected country" aria-label="Change country"><span class="iti__flag iti__${['swedish','country'].includes(scenario) ? 'se' : 'fr'}"></span></button><input data-testid="phone-input"></div>` +
        `<label>Mr<input type="radio" name="civility" value="mr" style="display:none"></label><label data-testid="eula-checkbox"><input type="checkbox">Test terms</label>
        <button data-testid="validate-btn" onclick='fetch("https://bookings-middleware.zenchef.com/booking?restaurantId=${venue.venueId}",{method:"POST",body:JSON.stringify(${JSON.stringify(payload)})}).catch(()=>{})'>Reserve</button>` : ''}${scenario === 'pesquiere-readback-metadata' ? '<script>window.AwsWafIntegration={getToken:()=>Promise.reject(Error("local metadata error"))}</script>' : scenario === 'pesquiere-readback-native-metadata' ? '<script>window.AwsWafIntegration={getToken:async()=>"local-synthetic-metadata"}</script>' : ''}</body></html>`;
    };
    const a = new ZenchefPlaywright({ mode: 'prepare', enableSubmission: true, now: () => Date.parse('2030-11-15T12:00:00Z'),
      reserveSubmission: async (intent,session) => { liveSession=session; reserves++; assert.equal(intent.mode, 'live'); assert.equal(intent.phase, 'booking');
        assert.match(intent.reviewFingerprint, /^[a-f0-9]{64}$/); return { sendAllowed: scenario !== 'denied', attempt: { ...intent, sessionId: scenario === 'pesquiere-readback-cross-before' ? 'another-session' : intent.sessionId, attemptId: 'synthetic-attempt', idempotencyKey: 'journal-owned-key' } }; },
      recordResult: async session => { recorded = structuredClone(session.result); if (scenario === 'persistence') throw Error('disk'); },
      browserFactory: async () => ({ close: async () => {}, newContext: async opts => {
        const context = await browser.newContext(opts); context.on('page',page=>{providerPage=page;}); const route = context.route.bind(context);
        context.route = (pattern, handler) => route(pattern, original => {
          const request = original.request(), isPost = request.method() === 'POST';
          const isRead = new URL(request.url()).pathname.startsWith('/bookings/');
          let responseStatus=200, responseData={};
          return handler({ request: () => request, abort: () => original.abort(),
            fetch: async options => {
              assert.equal(options.maxRedirects, 0);
              if (isPost) { sends++; assert.equal(options.maxRetries, 0);
                assert.deepEqual(JSON.parse(options.postData).customersheet.optins, []);
                responseData={ id:12345,uuid:['pesquiere-readback-bad-uuid','pesquiere-echo-bad-uuid'].includes(scenario) ? '../other' : 'synthetic-own-booking',status:'confirmed',
                  ...(scenario === 'payment' ? {requires_action:true} : {}),
                  ...(venue.rooms && !readCase ? {wish:{booking_room_id:scenario.endsWith('-receipt') ? otherRoom : chosenRoom}} : {}) };
                if (scenario === 'pesquiere-echo-date') responseData.day='2030-11-17';
                if (scenario === 'pesquiere-echo-time') responseData.time='13:00';
                if (scenario === 'pesquiere-echo-party') responseData.nb_guests=3;
                if (scenario === 'pesquiere-readback-cross-after') liveSession.review.digest='f'.repeat(64);
              } else if (isRead && request.method() === 'OPTIONS') {
                assert.equal(options.maxRetries,0); responseStatus=204;
              } else if (isRead) {
                reads++; assert.equal(request.method(),'GET'); assert.equal(options.maxRetries,0);
                assert.equal(options.postData,undefined);
                assert.equal(request.url(),`https://bookings-middleware.zenchef.com/bookings/synthetic-own-booking?restaurantId=${venue.venueId}`);
                if(scenario === 'pesquiere-readback-native-metadata') assert.equal(request.headers()['x-aws-waf-token'],'local-synthetic-metadata');
                assert.equal(request.headers()['auth-token'],undefined); assert.equal(request.headers().timestamp,undefined);
                responseData={ id:12345,status:'confirmed',day:date,time:'12:30',nb_guests:2,wish:{booking_room_id:chosenRoom} };
                if(scenario.endsWith('-room')) responseData.wish.booking_room_id=51183;
                if(scenario.endsWith('-missing')) delete responseData.time;
                if(scenario.endsWith('-id')) responseData.id=999;
                if(scenario.endsWith('-date')) responseData.day='2030-11-17';
                if(scenario.endsWith('-time')) responseData.time='13:00';
                if(scenario.endsWith('-party')) responseData.nb_guests=3;
                if(scenario.endsWith('-pending')) responseData.status='waiting';
                if(scenario.endsWith('-uuid')) responseData.uuid='other-booking';
                if(scenario.endsWith('-error')) throw Error('local transport error');
                if(scenario.endsWith('-challenge')) responseStatus=405;
                if(scenario.endsWith('-redirect')) responseStatus=302;
              }
              return {status:()=>responseStatus,json:async()=>responseData};
            },
            fulfill: () => original.fulfill({ status:responseStatus,headers:{'access-control-allow-origin':'https://bookings.zenchef.com','access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'x-aws-waf-token'},
              contentType:isPost || isRead ? 'application/json' : 'text/html',
              body:request.method() === 'OPTIONS' ? '' : isPost || isRead ? JSON.stringify(responseData) : document(request.url()) })
          });
        }); return context;
      } }) });
    adapters.push(a);
    let s = await a.create('owner', venue.restaurantId);
    s = await act(a,s,{type:'search',date,party:2}); assert.deepEqual(s.availabilityEvidence.candidates,[{time:'12:30',shiftId:venue.shiftId,...(venue.rooms ? {rooms:venue.rooms} : {})}]);
    if (venue.rooms) {
      await assert.rejects(act(a,s,{type:'select',time:'12:30',shiftId:venue.shiftId}),/room_required_or_unverified/);
      s=a.current('owner');
      await assert.rejects(act(a,s,{type:'select',time:'12:30',shiftId:venue.shiftId,roomId:999}),/room_required_or_unverified/);
      s=a.current('owner');
    }
    s = await act(a,s,{type:'select',time:'12:30',shiftId:venue.shiftId,...(venue.rooms ? {roomId:chosenRoom} : {})}); assert.equal(s.fields.length,6);
    s = await act(a,s,{type:'fill',fields}); s = await act(a,s,{type:'review'}); assert.equal(s.canSubmit,!blockedPolicy); assert.equal(s.details.country,['swedish','country'].includes(scenario) ? 'se' : 'fr');
    const command = {type:'submit',reviewToken:s.reviewToken,termsVersion:s.terms.version,terms:true,confirm:true,idempotencyKey:'local-synthetic-key-1234',uuid:'untrusted-client-uuid-ignored'};
    if (venue === ZENCHEF_PIROUETTE) assert.equal(s.terms.seatingNotice,"Jusqu'\u00e0 14:30");
    if (blockedPolicy) {
      await assert.rejects(act(a,s,command),/card_and_supplier_submission_unverified/);
      assert.equal(sends,0); assert.equal(reads,0); assert.equal(reserves,0); await a.close(); continue;
    }
    if (scenario === 'pirouette-seating') {
      await providerPage.locator('#seating').evaluate(el=>{el.textContent="Jusqu'\u00e0 13:30";});
      await assert.rejects(act(a,s,command),/stale_review/);
      assert.equal(sends,0); assert.equal(reads,0); assert.equal(reserves,0); await a.close(); continue;
    }
    const r = await act(a,s,command);
    assert.equal(r.result.status, ['confirmed','swedish','pesquiere','pesquiere-readback','pesquiere-readback-native-metadata','pirouette'].includes(scenario) ? 'confirmed' : scenario === 'payment' ? 'payment_required' : 'unknown');
    assert.equal(sends, ['denied','country','pesquiere-readback-cross-before','pirouette-gift'].includes(scenario) ? 0 : 1); assert.equal(reserves, ['country','pirouette-gift'].includes(scenario) ? 0 : 1);
    assert.equal(reads,['pesquiere','pirouette'].includes(scenario) || readCase && !['pesquiere-readback-bad-uuid','pesquiere-readback-metadata','pesquiere-readback-cross-before','pesquiere-readback-cross-after'].includes(scenario) ? 1 : 0,scenario);
    if(scenario === 'pesquiere-readback') { assert.equal(r.result.verification.roomEvidence,'own_booking_readback'); assert.equal(r.result.reference,'12345'); }
    assert.equal(r.canSubmit,false); assert.equal(a.current('owner').canSubmit,false);
    if (['pesquiere','pirouette'].includes(scenario)) { assert.equal(recorded.verification.roomEvidence,'own_booking_readback'); assert.equal(r.details.roomName,roomName); assert.equal(recorded.verification.roomId,chosenRoom); assert.equal(recorded.verification.policySource,venue.policySource); }
    if (scenario === 'confirmed') { assert.equal(recorded.verification.attemptId,'synthetic-attempt'); assert.equal(recorded.verification.mode,'live'); assert.equal(recorded.verification.idempotencyKey,'journal-owned-key');
      r.result.verification.verified=false; assert.equal(a.current('owner').result.verification.verified,true); }
    await assert.rejects(act(a,r,command), /already_attempted/);
    await a.close();
  }
});

test('supplier receipt never promotes missing reference, payment or unknown status to confirmed', () => {
  for (const data of [{status:'confirmed'}, {id:1,uuid:'x',status:'pending'}, {id:1,uuid:'x',status:'confirmed',charge:{}}])
    assert.notEqual(zenchefBookingResult(200,data).status,'confirmed');
  assert.equal(zenchefBookingResult(500,{id:1,uuid:'x',status:'confirmed'}).status,'unknown');
  assert.equal(approvedZenchefPayload({unexpected:true},{}),null);
});


test('Pesquiere binds room in exact document URL, payload and supplier receipt', () => {
  const venue=ZENCHEF_PESQUIERE, selection={date:'2030-11-16',party:2,time:'19:00',roomId:52372};
  assert.match(zenchefFormUrl(selection,venue), /slot=19%3A00&room_id=52372$/);
  assert.throws(()=>zenchefFormUrl({...selection,roomId:999},venue),/room_required_or_unverified/);
  assert.throws(()=>zenchefFormUrl(selection,ZENCHEF_FISHCORNER),/room_required_or_unverified/);
  const req=url=>({url:()=>url,method:()=>'GET',resourceType:()=>'document',redirectedFrom:()=>null});
  const expected=zenchefFormUrl(selection,venue);
  assert.equal(allowedZenchefPreparationRequest(req(expected),selection,venue),true);
  for(const url of [expected.replace('52372','51183'),expected+'&room_id=51183',expected.replace('362908','388090')])
    assert.equal(allowedZenchefPreparationRequest(req(url),selection,venue),false);
  const approval={restaurantId:venue.restaurantId,roomId:52372,roomName:'Mazagran salle'};
  for(const data of [{id:1,uuid:'x',status:'confirmed'}, {id:1,uuid:'x',status:'confirmed',wish:{booking_room_id:51183}}])
    assert.equal(zenchefBookingResult(200,data,approval).status,'unknown');
  assert.equal(zenchefBookingResult(200,{id:1,uuid:'synthetic-own-booking',status:'confirmed',wish:{booking_room_id:52372},day:selection.date,time:selection.time,nb_guests:2},approval).status,'unknown');
});


test('Pirouette scope is Nice dinner for two, with exact venue/room and no POST-only confirmation', () => {
  const venue=ZENCHEF_PIROUETTE, selection={date:'2030-11-16',party:2,time:'19:00',roomId:52521};
  assert.equal(venue.venueId,'363313'); assert.equal(venue.shiftId,189024);
  assert.throws(()=>zenchefSearchUrl({...selection,party:3},venue),/search_fields/);
  assert.throws(()=>zenchefFormUrl({...selection,roomId:52372},venue),/room_required_or_unverified/);
  const url=zenchefFormUrl(selection,venue), request=url=>({url:()=>url,method:()=>'GET',resourceType:()=>'document',redirectedFrom:()=>null});
  assert.match(url,/rid=363313.*room_id=52521$/);
  assert.equal(allowedZenchefPreparationRequest(request(url.replace('363313','362908')),selection,venue),false);
  assert.equal(zenchefBookingResult(200,{id:1,uuid:'synthetic-own-booking',status:'confirmed',wish:{booking_room_id:52521}},
    {restaurantId:venue.restaurantId,roomId:52521}).status,'unknown');
});
