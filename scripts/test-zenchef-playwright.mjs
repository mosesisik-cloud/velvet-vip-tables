// Local fixture only. No real Zenchef availability, hold or reservation is tested.
// Run: node --test scripts/test-zenchef-playwright.mjs
import { test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const auxSource = JSON.parse(fs.readFileSync(new URL('./fixtures/aux-bons-crus-native.json', import.meta.url)));
const bourgogneSource = JSON.parse(fs.readFileSync(new URL('./fixtures/aux-crus-bourgogne-source.json', import.meta.url)));
const moulinSource = JSON.parse(fs.readFileSync(new URL('./fixtures/moulin-vent-source.json', import.meta.url)));
const retroSource = JSON.parse(fs.readFileSync(new URL('./fixtures/petit-retro-source.json', import.meta.url)));
const marlySource = JSON.parse(fs.readFileSync(new URL('./fixtures/cafe-marly-source.json', import.meta.url)));
const pontoiseSource = JSON.parse(fs.readFileSync(new URL('./fixtures/petit-pontoise-source.json', import.meta.url)));
const marthaSource = JSON.parse(fs.readFileSync(new URL('./fixtures/martha-source.json', import.meta.url)));
const florentinSource = JSON.parse(fs.readFileSync(new URL('./fixtures/le-florentin-source.json', import.meta.url)));
const bistrotSource = JSON.parse(fs.readFileSync(new URL('./fixtures/bistrot-paris-source.json', import.meta.url)));
const reneSource = JSON.parse(fs.readFileSync(new URL('./fixtures/chez-rene-source.json', import.meta.url)));
const savySource = JSON.parse(fs.readFileSync(new URL('./fixtures/chez-savy-source.json', import.meta.url)));
const sommelierSource = JSON.parse(fs.readFileSync(new URL('./fixtures/petit-sommelier-source.json', import.meta.url)));
const jolieSource = JSON.parse(fs.readFileSync(new URL('./fixtures/rosie-jolie-source.json', import.meta.url)));
const louSource = JSON.parse(fs.readFileSync(new URL('./fixtures/rosie-lou-source.json', import.meta.url)));
const rosieSource = JSON.parse(fs.readFileSync(new URL('./fixtures/rosie-source.json', import.meta.url)));
const republiqueSource = JSON.parse(fs.readFileSync(new URL('./fixtures/bouillon-republique-source.json', import.meta.url)));
const racineSource = JSON.parse(fs.readFileSync(new URL('./fixtures/bouillon-racine-source.json', import.meta.url)));
const bouillonSource = JSON.parse(fs.readFileSync(new URL('./fixtures/bouillon-julien-source.json', import.meta.url)));
const vagenendeSource = JSON.parse(fs.readFileSync(new URL('./fixtures/vagenende-source.json', import.meta.url)));
const grandCafeSource = JSON.parse(fs.readFileSync(new URL('./fixtures/grand-cafe-source.json', import.meta.url)));
const piedSource = JSON.parse(fs.readFileSync(new URL('./fixtures/pied-de-cochon-source.json', import.meta.url)));
const laLorraineSource = JSON.parse(fs.readFileSync(new URL('./fixtures/la-lorraine-source.json', import.meta.url)));
const procopeSource = JSON.parse(fs.readFileSync(new URL('./fixtures/procope-source.json', import.meta.url)));
const terminusNordSource = JSON.parse(fs.readFileSync(new URL('./fixtures/terminus-nord-source.json', import.meta.url)));
const laCoupoleSource = JSON.parse(fs.readFileSync(new URL('./fixtures/la-coupole-source.json', import.meta.url)));
const bofingerSource = JSON.parse(fs.readFileSync(new URL('./fixtures/bofinger-source.json', import.meta.url)));

import { chromium } from 'playwright';
import { ZenchefPlaywright, ZENCHEF_ARPEGE, ZENCHEF_FISHCORNER, ZENCHEF_PESQUIERE, ZENCHEF_PIROUETTE, ZENCHEF_DEKAS, ZENCHEF_BOFINGER, ZENCHEF_LACOUPOLE, ZENCHEF_TERMINUSNORD, ZENCHEF_PROCOPE, ZENCHEF_LALORRAINE, ZENCHEF_PIEDDECOCHON, ZENCHEF_GRANDCAFE, ZENCHEF_VAGENENDE, ZENCHEF_BOUILLONJULIEN, ZENCHEF_BOUILLONRACINE, ZENCHEF_BOUILLONREPUBLIQUE, ZENCHEF_ROSIE, ZENCHEF_ROSIELOU, ZENCHEF_ROSIEJOLIE, ZENCHEF_PETITSOMMELIER, ZENCHEF_CHEZSAVY, ZENCHEF_CHEZRENE, ZENCHEF_BISTROTPARIS, ZENCHEF_LEFLORENTIN, leFlorentinPolicy, ZENCHEF_MARTHA, marthaPolicy, ZENCHEF_PETITPONTOISE, petitPontoisePolicy, ZENCHEF_CAFEMARLY, cafeMarlyPolicy, ZENCHEF_PETITRETRO, petitRetroPolicy, ZENCHEF_MOULINVENT, moulinVentPolicy, ZENCHEF_AUXCRUSBOURGOGNE, auxCrusBourgognePolicy, ZENCHEF_AUXBONSCRUS, auxBonsCrusPolicy, bistrotParisPolicy, chezRenePolicy, chezSavyPolicy, petitSommelierPolicy, rosieJoliePolicy, rosieLouPolicy, rosiePolicy, bouillonRepubliquePolicy, bouillonRacinePolicy, bouillonJulienPolicy, vagenendePolicy, grandCafePolicy, piedDeCochonPolicy, laLorrainePolicy, procopePolicy, terminusNordPolicy, laCoupolePolicy, bofingerPolicy, approvedZenchefPayload, zenchefBookingResult, allowedZenchefInspectionRequest,
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
// Minimal synthetic replay of the observed De Kas Nov16 lunch structure.
// Saved receipt tests below use only source-read booking_offers offer_id/count.
function deKasState(date) {
  const offer={id:118785,name:'Lunch',name_translations:{en:'Lunch'},description:{en:'Native menu terms'},
    has_prepayment:false,payment_type:'none',charge_per_guests:null,has_duration:false,
    config:{is_same_for_all:true,is_limited_to_pax:true,min_pax_available:1,max_pax_available:null},
    stock:6,possible_guests:[2],available_rooms:{2:[138396,138397]},bookable_from:null,bookable_to:null};
  const slot={name:'12:30',closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,possible_guests:[],available_rooms:[],offers:[{id:offer.id,stock:offer.stock,config:{...offer.config},possible_guests:[2],available_rooms:{2:[138396,138397]},has_prepayment:false,payment_type:'none',has_duration:false,bookable_from:null,bookable_to:null}]};
  const shift={id:494748,name:'Lunch',closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,shift_slots:[slot],offers:[offer],
    charge_param:null,prepayment_param:{is_web_booking_askable:true,min_guests:7,charge_per_guests:5000,deposit_type:'fixed'},
    is_offer_required:true,offer_required_from_pax:null,confirmation:{is_auto:true,is_auto_until:null}};
  return {restaurantId:'386643',initializedSSR:true,restaurantTimezone:'Europe/Amsterdam',isDisabled:0,currency:'EUR',language:'en',isRoomMandatory:false,
    wish:{day:date,pax:2,waiting_list:false,offers:[],room_id:null},mandatoryFields:{firstname:'required'},
    offers:[{id:118785,is_active:true,is_private:false,has_prepayment:false,has_duration:false}],dailyAvailabilities:{[date]:{date,shifts:[shift]}}};
}
function deKasDocument(u,date,payload) {
  const state=deKasState(date),offers=u.pathname==='/offers';if(offers)state.wish.slot='12:30';
  const data={page:offers?'/offers':'/results',query:Object.fromEntries(u.searchParams),props:{initialState:{appStoreState:state}}};
  const form=`<div id=menu-name>Lunch</div><span id=offer-count> &#215; 2</span><div>Until 3:30 PM</div>`+
    ['firstname','lastname','email'].map(k=>`<input data-testid="${k}-input">`).join('')+
    `<div class="iti"><button class="iti__selected-country" title="Selected country" aria-label="Change country"><span class="iti__flag iti__fr"></span></button><input data-testid="phone-input"></div>
    <label>Mr<input type="radio" name="civility" value="mr" style="display:none"></label><label data-testid="eula-checkbox"><input type="checkbox">Test terms</label>
    <button data-testid="validate-btn" onclick='fetch("https://bookings-middleware.zenchef.com/booking?restaurantId=386643",{method:"POST",body:JSON.stringify(${JSON.stringify(payload)})}).catch(()=>{})'>Reserve</button>`;
  return `<html><body><h1>LOCAL OFFER CONTRACT REPLAY</h1><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`+
    (offers?`<div id=controls><span>Lunch</span><span>Native menu terms</span><button data-testid="add-to-cart-btn" onclick="this.remove();document.querySelector('[data-testid=disabled-continue-btn]').remove();document.querySelector('[data-testid=go-to-form-btn]').hidden=false">Add</button><button disabled data-testid="disabled-continue-btn">Continue</button><button hidden data-testid="go-to-form-btn">Validate</button></div>
    <script>document.querySelector('[data-testid=go-to-form-btn]').onclick=()=>{history.replaceState(null,'',location.href.replace('/offers?','/form?'));document.getElementById('controls').innerHTML=${JSON.stringify(form)};};</script>`:'')+'</body></html>';
}

test('native booking and own-booking readback bind approval without duplicate POSTs', async () => {
  for (const scenario of ['moulin-seating','aux-roomreceipt','aux-roomdrift','aux-selected','aux-mandatory','aux-custom','bouillon','bouillon-missing','bouillon-pending','bouillon-date','bouillon-party','bouillon-offer','bouillon-card','bouillon-manual','bouillon-stale','bouillon-attempt', 'vagenende','rosie','lou','savy','rene','bistrot','florentin','martha','pontoise','marly','retro','moulin','bourgogne','aux','vagenende-missing','rosie-missing','lou-missing','savy-missing','rene-missing','bistrot-missing','florentin-missing','martha-missing','pontoise-missing','marly-missing','retro-missing','moulin-missing','bourgogne-missing','aux-missing','vagenende-pending','rosie-pending','lou-pending','savy-pending','rene-pending','bistrot-pending','florentin-pending','martha-pending','pontoise-pending','marly-pending','retro-pending','moulin-pending','bourgogne-pending','aux-pending','vagenende-date','rosie-date','lou-date','savy-date','rene-date','bistrot-date','florentin-date','martha-date','pontoise-date','marly-date','retro-date','moulin-date','bourgogne-date','aux-date','vagenende-party','rosie-party','lou-party','savy-party','rene-party','bistrot-party','florentin-party','martha-party','pontoise-party','marly-party','retro-party','moulin-party','bourgogne-party','aux-party','vagenende-offer','rosie-offer','lou-offer','savy-offer','rene-offer','bistrot-offer','florentin-offer','martha-offer','pontoise-offer','marly-offer','retro-offer','moulin-offer','bourgogne-offer','aux-offer','vagenende-card','rosie-card','lou-card','savy-card','rene-card','bistrot-card','pontoise-card','marly-card','retro-card','moulin-card','bourgogne-card','aux-card','vagenende-manual','rosie-manual','lou-manual','savy-manual','rene-manual','bistrot-manual','florentin-manual','martha-manual','pontoise-manual','marly-manual','retro-manual','moulin-manual','bourgogne-manual','aux-manual','vagenende-stale','rosie-stale','lou-stale','savy-stale','rene-stale','bistrot-stale','florentin-stale','martha-stale','pontoise-stale','marly-stale','retro-stale','moulin-stale','bourgogne-stale','aux-stale','vagenende-attempt','rosie-attempt','lou-attempt','savy-attempt','rene-attempt','bistrot-attempt','florentin-attempt','martha-attempt','pontoise-attempt','marly-attempt','retro-attempt','moulin-attempt','bourgogne-attempt','aux-attempt', 'grandcafe','racine','sommelier','jolie','republique','grandcafe-missing','racine-missing','sommelier-missing','jolie-missing','republique-missing','grandcafe-pending','racine-pending','sommelier-pending','jolie-pending','republique-pending','grandcafe-date','racine-date','sommelier-date','jolie-date','republique-date','grandcafe-party','racine-party','sommelier-party','jolie-party','republique-party','grandcafe-offer','racine-offer','sommelier-offer','jolie-offer','republique-offer','grandcafe-card','racine-card','sommelier-card','jolie-card','republique-card','grandcafe-manual','racine-manual','sommelier-manual','jolie-manual','republique-manual','grandcafe-stale','racine-stale','sommelier-stale','jolie-stale','republique-stale','grandcafe-attempt','racine-attempt','sommelier-attempt','jolie-attempt','republique-attempt', 'pied','pied-missing','pied-pending','pied-date','pied-party','pied-offer','pied-card','pied-manual','pied-stale','pied-attempt', 'lorraine','lorraine-missing','lorraine-pending','lorraine-date','lorraine-party','lorraine-offer','lorraine-card','lorraine-manual','lorraine-stale','lorraine-attempt', 'procope','procope-missing','procope-pending','procope-date','procope-party','procope-offer','procope-card','procope-manual','procope-stale','procope-attempt', 'terminus','terminus-missing','terminus-pending','terminus-date','terminus-party','terminus-offer','terminus-card','terminus-manual','terminus-stale','terminus-attempt', 'lacoupole','lacoupole-missing','lacoupole-pending','lacoupole-date','lacoupole-party','lacoupole-offer','lacoupole-card','lacoupole-manual','lacoupole-stale','lacoupole-attempt', 'bofinger','bofinger-missing','bofinger-pending','bofinger-date','bofinger-party','bofinger-offer','bofinger-card','bofinger-manual','bofinger-stale','bofinger-attempt', 'confirmed', 'denied', 'persistence', 'payment', 'country', 'swedish', 'pesquiere', 'pesquiere-receipt', 'pesquiere-echo-bad-uuid', 'pesquiere-echo-date', 'pesquiere-echo-time', 'pesquiere-echo-party',
    'pesquiere-readback', 'pesquiere-readback-native-metadata', 'pesquiere-readback-room', 'pesquiere-readback-missing', 'pesquiere-readback-error',
    'pesquiere-readback-challenge', 'pesquiere-readback-redirect', 'pesquiere-readback-id', 'pesquiere-readback-date',
    'pesquiere-readback-time', 'pesquiere-readback-party', 'pesquiere-readback-pending', 'pesquiere-readback-uuid',
    'pesquiere-readback-bad-uuid', 'pesquiere-readback-metadata', 'pesquiere-readback-cross-before', 'pesquiere-readback-cross-after',
    'dekas', 'dekas-offer-id', 'dekas-offer-count', 'dekas-offer-missing', 'dekas-echo-only', 'dekas-attempt', 'dekas-stale-menu', 'dekas-stale-count', 'dekas-post-offer', 'dekas-stale-terms',
    'pirouette', 'pirouette-receipt', 'pirouette-card', 'pirouette-prepayment', 'pirouette-manual', 'pirouette-gift', 'pirouette-seating']) {
    if (process.env.ZENCHEF_TEST_SCENARIO_PREFIX && !scenario.startsWith(process.env.ZENCHEF_TEST_SCENARIO_PREFIX)) continue;
    const deKas = scenario.startsWith('dekas'); const bofinger = scenario.startsWith('bofinger'); const laCoupole = scenario.startsWith('lacoupole'); const terminus = scenario.startsWith('terminus'); const procope = scenario.startsWith('procope'); const lorraine = scenario.startsWith('lorraine'); const pied = scenario.startsWith('pied'); const grandCafe = scenario.startsWith('grandcafe'); const vagenende = scenario.startsWith('vagenende'); const bouillon = scenario.startsWith('bouillon'); const racine = scenario.startsWith('racine'); const republique = scenario.startsWith('republique'); const rosie = scenario.startsWith('rosie'); const lou = scenario.startsWith('lou'); const jolie = scenario.startsWith('jolie'); const sommelier = scenario.startsWith('sommelier'); const savy = scenario.startsWith('savy'); const rene = scenario.startsWith('rene'); const bistrot = scenario.startsWith('bistrot'); const aux = scenario.startsWith('aux'); const bourgogne = scenario.startsWith('bourgogne'); const retro = scenario.startsWith('retro'); const moulin = scenario.startsWith('moulin'); const pontoise = scenario.startsWith('pontoise'); const florentin = scenario.startsWith('florentin'); const martha = scenario.startsWith('martha'); const marly = scenario.startsWith('marly'); const noRoomLunch = bofinger || laCoupole || terminus || procope || lorraine || pied || grandCafe || vagenende || bouillon || racine || republique || rosie || lou || jolie || sommelier || savy || rene || bistrot || aux || bourgogne || retro || moulin || pontoise || florentin || martha || marly;
    const venue = marly ? ZENCHEF_CAFEMARLY : martha ? ZENCHEF_MARTHA : florentin ? ZENCHEF_LEFLORENTIN : pontoise ? ZENCHEF_PETITPONTOISE : moulin ? ZENCHEF_MOULINVENT : retro ? ZENCHEF_PETITRETRO : bourgogne ? ZENCHEF_AUXCRUSBOURGOGNE : aux ? ZENCHEF_AUXBONSCRUS : bistrot ? ZENCHEF_BISTROTPARIS : rene ? ZENCHEF_CHEZRENE : savy ? ZENCHEF_CHEZSAVY : sommelier ? ZENCHEF_PETITSOMMELIER : jolie ? ZENCHEF_ROSIEJOLIE : lou ? ZENCHEF_ROSIELOU : rosie ? ZENCHEF_ROSIE : republique ? ZENCHEF_BOUILLONREPUBLIQUE : racine ? ZENCHEF_BOUILLONRACINE : bouillon ? ZENCHEF_BOUILLONJULIEN : vagenende ? ZENCHEF_VAGENENDE : grandCafe ? ZENCHEF_GRANDCAFE : pied ? ZENCHEF_PIEDDECOCHON : lorraine ? ZENCHEF_LALORRAINE : procope ? ZENCHEF_PROCOPE : terminus ? ZENCHEF_TERMINUSNORD : laCoupole ? ZENCHEF_LACOUPOLE : bofinger ? ZENCHEF_BOFINGER : deKas ? ZENCHEF_DEKAS : scenario.startsWith('pirouette') ? ZENCHEF_PIROUETTE : scenario.startsWith('pesquiere') ? ZENCHEF_PESQUIERE : ZENCHEF_FISHCORNER;
    const chosenRoom = venue === ZENCHEF_PIROUETTE ? 52521 : 52372, otherRoom = venue === ZENCHEF_PIROUETTE ? 65674 : 51183;
    const roomName = venue.rooms?.find(room=>room.id===chosenRoom)?.name;
    const blockedPolicy = ['pirouette-card','pirouette-prepayment','pirouette-manual','bofinger-card','bofinger-manual','lacoupole-card','lacoupole-manual','terminus-card','terminus-manual','procope-card','procope-manual','lorraine-card','lorraine-manual','pied-card','pied-manual','grandcafe-card','racine-card','sommelier-card','jolie-card','republique-card','grandcafe-manual','racine-manual','sommelier-manual','jolie-manual','republique-manual','vagenende-card','rosie-card','lou-card','savy-card','rene-card','bistrot-card','florentin-card','martha-card','pontoise-card','marly-card','retro-card','moulin-card','bourgogne-card','aux-card','vagenende-manual','rosie-manual','lou-manual','savy-manual','rene-manual','bistrot-manual','florentin-manual','martha-manual','pontoise-manual','marly-manual','retro-manual','moulin-manual','bourgogne-manual','aux-manual','bouillon-card','bouillon-manual'].includes(scenario);
    let providerPage;
    const date = '2030-11-16'; let sends = 0, reads = 0, reserves = 0, recorded, liveSession;
    const readCase = scenario.startsWith('pesquiere-readback');
    const fields = { firstname: 'Fixture', lastname: 'Guest', email: 'fixture@example.invalid', phone: scenario === 'swedish' ? '+46701234567' : '+33612345678', civility: 'mr', country: 'fr' };
    const payload = { day: date, nb_guests: 2, time: '12:30', lang: 'fr', firstname: fields.firstname, lastname: fields.lastname,
      civility: 'mr', country: scenario === 'swedish' ? 'se' : 'fr', phone_number: fields.phone, email: fields.email, comment: '', custom_field: scenario === 'pirouette-gift' ? {'numero-de-bon-cadeau':'UNSUPPORTED'} : {}, custom_field_v2: [],
      customersheet: { firstname: fields.firstname, lastname: fields.lastname, civility: 'mr', phone: fields.phone,
        email: fields.email, optins: [{ type: 'review_mail', value: true }, { type: 'review_sms', value: true }], country: scenario === 'swedish' ? 'se' : 'fr', lang: 'fr' },
      offers: [], partner_id: '1001', type: 'web', ...(venue.rooms ? { wish: { booking_room_id: chosenRoom } } : {}) };
    if (deKas) { payload.lang = payload.customersheet.lang = 'en'; payload.offers = [{offer_id:scenario === 'dekas-post-offer' ? 999 : 118785,count:2}]; }
    if (venue.rooms) {
      const approval={...fields,date,party:2,time:'12:30',restaurantId:venue.restaurantId,roomId:chosenRoom,roomName};
      assert.equal(!!approvedZenchefPayload(payload,approval),scenario !== 'pirouette-gift');
      assert.equal(approvedZenchefPayload({...payload,wish:{booking_room_id:otherRoom}},approval),null);
      assert.equal(approvedZenchefPayload({...payload,wish:{booking_room_id:chosenRoom,fee:10}},approval),null);
      assert.equal(approvedZenchefPayload(payload,{...approval,roomName:'Different room'}),null);
    }
    const document = url => {
      const u = new URL(url), isForm = u.pathname === '/form';
      if (deKas) return deKasDocument(u, date, payload);
      const slot = { name: '12:30', closed: false, marked_as_full: false, bookable_from: null, bookable_to: null, possible_guests: [2], available_rooms: { 2: venue.rooms ? venue.rooms.map(room=>room.id) : [1] } };
      const shift = { id: venue.shiftId, closed: false, marked_as_full: false, bookable_from: null, bookable_to: null, shift_slots: [slot],
        charge_param: venue === ZENCHEF_PIROUETTE ? { is_web_booking_askable:true,min_guests:scenario === 'pirouette-card' ? 2 : 3,charge_per_guests:50 } : venue.rooms ? { is_web_booking_askable: false, min_guests: 1, charge_per_guests: 10 } : null,
        prepayment_param: scenario === 'pirouette-prepayment' ? {is_web_booking_askable:true} : null, is_offer_required: false, confirmation: { is_auto: scenario !== 'pirouette-manual', is_auto_until:null } };
      const state = { restaurantId: venue.venueId, initializedSSR: true, restaurantTimezone: venue.timezone, isDisabled: 0,
        wish: { day: date, pax: 2, waiting_list: false, offers: [], room_id: venue.rooms && isForm ? Number(u.searchParams.get('room_id')) : null, ...(isForm ? { slot: '12:30' } : {}) },
        rooms: venue.rooms, mandatoryFields: { firstname: 'required' }, isRoomMandatory: !!venue.rooms, dailyAvailabilities: { [date]: { date, shifts: [shift, { ...shift, id: 545347 }] } } };
      if (noRoomLunch) {
        const policy = structuredClone((marly ? marlySource : martha ? marthaSource : florentin ? florentinSource : pontoise ? pontoiseSource : moulin ? moulinSource : retro ? retroSource : bourgogne ? bourgogneSource : aux ? auxSource : bistrot ? bistrotSource : rene ? reneSource : savy ? savySource : sommelier ? sommelierSource : jolie ? jolieSource : lou ? louSource : rosie ? rosieSource : republique ? republiqueSource : racine ? racineSource : bouillon ? bouillonSource : vagenende ? vagenendeSource : grandCafe ? grandCafeSource : pied ? piedSource : lorraine ? laLorraineSource : procope ? procopeSource : terminus ? terminusNordSource : laCoupole ? laCoupoleSource : bofingerSource).dailyAvailabilities['2026-10-23'].shifts[0]);
        if (pontoise || martha || marly) state.partner_id='1001';
        Object.assign(shift, policy, {bookable_from:null,bookable_to:null,shift_slots:[slot]});
        if (aux) { slot.available_rooms = {2:[10289]}; state.rooms=structuredClone(auxSource.rooms); } else delete slot.available_rooms;
        Object.assign(state,{name:venue.name,currency:'EUR',language:'fr',hasRoomSelection:aux,restaurantComment:(marly ? marlySource : martha ? marthaSource : florentin ? florentinSource : pontoise ? pontoiseSource : moulin ? moulinSource : retro ? retroSource : bourgogne ? bourgogneSource : aux ? auxSource : bistrot ? bistrotSource : rene ? reneSource : savy ? savySource : sommelier ? sommelierSource : jolie ? jolieSource : lou ? louSource : rosie ? rosieSource : republique ? republiqueSource : racine ? racineSource : bouillon ? bouillonSource : vagenende ? vagenendeSource : grandCafe ? grandCafeSource : pied ? piedSource : lorraine ? laLorraineSource : procope ? procopeSource : terminus ? terminusNordSource : laCoupole ? laCoupoleSource : bofingerSource).restaurantComment});
        if (isForm && ['terminus-card','lorraine-card','pied-card','vagenende-card','rosie-card','lou-card','savy-card','rene-card','bistrot-card','florentin-card','martha-card','pontoise-card','marly-card','retro-card','republique-card'].includes(scenario)) shift.charge_param.min_guests=2;
        if (isForm && ['lacoupole-card','procope-card','grandcafe-card','racine-card','sommelier-card','jolie-card','florentin-card','martha-card','moulin-card','bourgogne-card','aux-card','bouillon-card'].includes(scenario)) shift.charge_param={is_web_booking_askable:true,min_guests:1,charge_per_guests:10};
        if (isForm && scenario === 'bofinger-card') shift.charge_param.is_web_booking_askable=true;
        if (isForm && ['grandcafe-manual','racine-manual','sommelier-manual','jolie-manual','republique-manual','vagenende-manual','rosie-manual','lou-manual','savy-manual','rene-manual','bistrot-manual','florentin-manual','martha-manual','pontoise-manual','marly-manual','retro-manual','moulin-manual','bourgogne-manual','aux-manual'].includes(scenario)) shift.confirmation.is_auto=false;
        if (isForm && ['bofinger-manual','lacoupole-manual','terminus-manual','procope-manual','lorraine-manual','pied-manual','bouillon-manual','rene-manual','bistrot-manual','florentin-manual','martha-manual','pontoise-manual','marly-manual','retro-manual','moulin-manual','bourgogne-manual','aux-manual'].includes(scenario)) shift.confirmation.is_auto_until=null;
      }
      const data = { page: isForm ? '/form' : '/results', query: Object.fromEntries(u.searchParams), props: { initialState: { appStoreState: state } } };
      return `<html><head><meta charset="utf-8"></head><body><h1>LOCAL NATIVE CONTRACT REPLAY</h1>${venue.rooms && isForm ? `<div>${roomName}</div>` : ''}${venue === ZENCHEF_PIROUETTE && isForm ? '<div id=seating>Jusqu&#39;&#224; 14:30</div>' : ''}<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>
        ${isForm ? ['firstname','lastname','email'].map(k=>`<input data-testid="${k}-input">`).join('') + `<div class="iti"><button type="button" class="iti__selected-country" title="Selected country" aria-label="Change country"><span class="iti__flag iti__${['swedish','country'].includes(scenario) ? 'se' : 'fr'}"></span></button><input data-testid="phone-input"></div>` +
        `<label>Mr<input type="radio" name="civility" value="mr" style="display:none"></label><label data-testid="eula-checkbox"><input type="checkbox">Test terms</label>
        <button data-testid="validate-btn" onclick='fetch("https://bookings-middleware.zenchef.com/booking?restaurantId=${venue.venueId}",{method:"POST",body:JSON.stringify(${JSON.stringify(payload)})}).catch(()=>{})'>Reserve</button>` : ''}${scenario === 'pesquiere-readback-metadata' ? '<script>window.AwsWafIntegration={getToken:()=>Promise.reject(Error("local metadata error"))}</script>' : scenario === 'pesquiere-readback-native-metadata' ? '<script>window.AwsWafIntegration={getToken:async()=>"local-synthetic-metadata"}</script>' : ''}</body></html>`;
    };
    const a = new ZenchefPlaywright({ mode: 'prepare', enableSubmission: true, now: () => Date.parse('2030-11-15T12:00:00Z'),
      reserveSubmission: async (intent,session) => { liveSession=session; reserves++; assert.equal(intent.mode, 'live'); assert.equal(intent.phase, 'booking');
        assert.match(intent.reviewFingerprint, /^[a-f0-9]{64}$/); if (['bofinger-attempt','lacoupole-attempt','terminus-attempt','procope-attempt','lorraine-attempt','pied-attempt','grandcafe-attempt','racine-attempt','sommelier-attempt','jolie-attempt','republique-attempt','vagenende-attempt','rosie-attempt','lou-attempt','savy-attempt','rene-attempt','bistrot-attempt','florentin-attempt','martha-attempt','pontoise-attempt','marly-attempt','retro-attempt','moulin-attempt','bourgogne-attempt','aux-attempt','bouillon-attempt'].includes(scenario)) return {sendAllowed:true,attempt:{...intent,details:{...intent.details,shiftId:19173},attemptId:'synthetic-attempt',idempotencyKey:'journal-owned-key'}}; if (scenario === 'dekas-attempt') return {sendAllowed:true,attempt:{...intent,details:{...intent.details,offer:{...intent.offer,count:1}},attemptId:'synthetic-attempt',idempotencyKey:'journal-owned-key'}}; return { sendAllowed: scenario !== 'denied', attempt: { ...intent, sessionId: scenario === 'pesquiere-readback-cross-before' ? 'another-session' : intent.sessionId, attemptId: 'synthetic-attempt', idempotencyKey: 'journal-owned-key' } }; },
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
                if (scenario === 'aux-roomreceipt') responseData.wish={booking_room_id:10289};
                if(noRoomLunch) {if (scenario !== 'aux-roomreceipt') delete responseData.wish;responseData.booking_offers=scenario.endsWith('-offer') ? [{offer_id:1,count:2}] : [];}
                if(deKas) { delete responseData.wish; responseData.booking_offers=[{offer_id:118785,count:2}]; }
                if(scenario === 'dekas-offer-id') responseData.booking_offers[0].offer_id=999;
                if(scenario === 'dekas-offer-count') responseData.booking_offers[0].count=1;
                if(['dekas-offer-missing','dekas-echo-only'].includes(scenario)) delete responseData.booking_offers;
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
    s = await act(a,s,{type:'search',date,party:2}); assert.deepEqual(s.availabilityEvidence.candidates,[{time:'12:30',shiftId:venue.shiftId,...(venue.rooms ? {rooms:venue.rooms} : {}),...(deKas ? {offers:s.availabilityEvidence.candidates[0].offers} : {})}]);
    if (venue.rooms) {
      await assert.rejects(act(a,s,{type:'select',time:'12:30',shiftId:venue.shiftId}),/room_required_or_unverified/);
      s=a.current('owner');
      await assert.rejects(act(a,s,{type:'select',time:'12:30',shiftId:venue.shiftId,roomId:999}),/room_required_or_unverified/);
      s=a.current('owner');
    }
    s = await act(a,s,{type:'select',time:'12:30',shiftId:venue.shiftId,...(venue.rooms ? {roomId:chosenRoom} : {})});
    if (moulin) assert.equal(s.terms.seatingNotice, moulinSource.dailyAvailabilities['2026-10-23'].shifts[0].comment.fr);
    if (deKas) {
      assert.equal(s.state,'offers'); assert.equal(s.canSubmit,false); const offer=s.offerChoices[0];
      assert.equal(offer.mealPrice,null); assert.equal(offer.priceStatus,'not_provided_by_booking_form');
      for (const bad of [{}, {offerId:offer.offerId,count:1,offerVersion:offer.version}, {offerId:offer.offerId,count:2,offerVersion:'old'}]) {
        await assert.rejects(act(a,s,{type:'select_offer',...bad}),/explicit_offer_required/); s=a.current('owner');
      }
      s=await act(a,s,{type:'select_offer',offerId:offer.offerId,count:2,offerVersion:offer.version});
    }
    assert.equal(s.fields.length,6);
    s = await act(a,s,{type:'fill',fields}); s = await act(a,s,{type:'review'}); assert.equal(s.canSubmit,!blockedPolicy); assert.equal(s.details.country,['swedish','country'].includes(scenario) ? 'se' : 'fr');
    const command = {type:'submit',reviewToken:s.reviewToken,termsVersion:s.terms.version,terms:true,confirm:true,idempotencyKey:'local-synthetic-key-1234',uuid:'untrusted-client-uuid-ignored'};
    if (venue === ZENCHEF_PIROUETTE) assert.equal(s.terms.seatingNotice,"Jusqu'\u00e0 14:30");
    if (blockedPolicy) {
      await assert.rejects(act(a,s,command),/card_and_supplier_submission_unverified/);
      assert.equal(sends,0); assert.equal(reads,0); assert.equal(reserves,0); await a.close(); continue;
    }
    if (deKas && scenario.startsWith('dekas-stale-')) {
      if (scenario === 'dekas-stale-count') await providerPage.locator('#offer-count').evaluate(e=>e.textContent='\u00d7 1');
      if (scenario === 'dekas-stale-terms') await providerPage.locator('[data-testid="eula-checkbox"]').evaluate(e=>e.lastChild.textContent='Changed terms');
      if (scenario === 'dekas-stale-menu') await providerPage.locator('script#__NEXT_DATA__').evaluate(e=>{const d=JSON.parse(e.textContent); d.props.initialState.appStoreState.dailyAvailabilities['2030-11-16'].shifts[0].offers[0].description.en='Changed menu';e.textContent=JSON.stringify(d);});
      await assert.rejects(act(a,s,command),/stale_review|offer_changed/);assert.equal(sends,0);assert.equal(reads,0);assert.equal(reserves,0);await a.close();continue;
    }
    if (['bofinger-stale','lacoupole-stale','terminus-stale','procope-stale','lorraine-stale','pied-stale','grandcafe-stale','racine-stale','sommelier-stale','jolie-stale','republique-stale','vagenende-stale','rosie-stale','lou-stale','savy-stale','rene-stale','bistrot-stale','florentin-stale','martha-stale','pontoise-stale','marly-stale','retro-stale','moulin-stale','bourgogne-stale','aux-stale','bouillon-stale'].includes(scenario)) {
      await providerPage.locator('script#__NEXT_DATA__').evaluate(e=>{const d=JSON.parse(e.textContent);d.props.initialState.appStoreState.restaurantComment.fr='Changed terms';e.textContent=JSON.stringify(d);});
      await assert.rejects(act(a,s,command),/stale_review/);assert.equal(sends,0);assert.equal(reads,0);await a.close();continue;
    }
    if (['aux-roomdrift','aux-selected','aux-mandatory','aux-custom'].includes(scenario)) {
      await providerPage.locator('script#__NEXT_DATA__').evaluate((e, scenario) => {
        const d=JSON.parse(e.textContent), state=d.props.initialState.appStoreState;
        if (scenario==='aux-roomdrift') state.rooms[0].id=999;
        if (scenario==='aux-selected') state.wish.room_id=10289;
        if (scenario==='aux-mandatory') state.isRoomMandatory=true;
        if (scenario==='aux-custom') state.mandatoryFields['custom_field.test']='required';
        e.textContent=JSON.stringify(d);
      },scenario);
      await assert.rejects(act(a,s,command), /stale_review|provider_fields_unverified/);
      assert.equal(sends,0);assert.equal(reads,0);assert.equal(reserves,0);await a.close();continue;
    }
    if (scenario === 'moulin-seating') {
      await providerPage.locator('script#__NEXT_DATA__').evaluate(e=>{const d=JSON.parse(e.textContent);const state=d.props.initialState.appStoreState;Object.values(state.dailyAvailabilities)[0].shifts[0].comment.fr='Changed seating time';e.textContent=JSON.stringify(d);});
      await assert.rejects(act(a,s,command),/stale_review/);assert.equal(sends,0);assert.equal(reads,0);assert.equal(reserves,0);await a.close();continue;
    }
    if (scenario === 'pirouette-seating') {
      await providerPage.locator('#seating').evaluate(el=>{el.textContent="Jusqu'\u00e0 13:30";});
      await assert.rejects(act(a,s,command),/stale_review/);
      assert.equal(sends,0); assert.equal(reads,0); assert.equal(reserves,0); await a.close(); continue;
    }
    const r = await act(a,s,command);
    assert.equal(r.result.status, ['bouillon','vagenende','rosie','lou','savy','rene','bistrot','florentin','martha','pontoise','marly','retro','moulin','bourgogne','aux','grandcafe','racine','sommelier','jolie','republique','pied','lorraine','procope','terminus','lacoupole','bofinger','confirmed','swedish','pesquiere','pesquiere-readback','pesquiere-readback-native-metadata','pirouette','dekas'].includes(scenario) ? 'confirmed' : scenario === 'payment' ? 'payment_required' : 'unknown');
    assert.equal(sends, ['bouillon-attempt','vagenende-attempt','rosie-attempt','lou-attempt','savy-attempt','rene-attempt','bistrot-attempt','florentin-attempt','martha-attempt','pontoise-attempt','marly-attempt','retro-attempt','moulin-attempt','bourgogne-attempt','aux-attempt','grandcafe-attempt','racine-attempt','sommelier-attempt','jolie-attempt','republique-attempt','pied-attempt','lorraine-attempt','procope-attempt','terminus-attempt','lacoupole-attempt','bofinger-attempt','denied','country','pesquiere-readback-cross-before','pirouette-gift','dekas-attempt','dekas-post-offer'].includes(scenario) ? 0 : 1); assert.equal(reserves, ['country','pirouette-gift','dekas-post-offer'].includes(scenario) ? 0 : 1);
    assert.equal(reads,(noRoomLunch && !scenario.endsWith('-attempt')) || (deKas && !['dekas-attempt','dekas-post-offer'].includes(scenario)) || ['pesquiere','pirouette'].includes(scenario) || readCase && !['pesquiere-readback-bad-uuid','pesquiere-readback-metadata','pesquiere-readback-cross-before','pesquiere-readback-cross-after'].includes(scenario) ? 1 : 0,scenario);
    if(['bofinger','lacoupole','terminus','procope','lorraine','pied','grandcafe','racine','sommelier','jolie','republique','vagenende','rosie','lou','savy','rene','bistrot','florentin','martha','pontoise','marly','retro','moulin','bourgogne','aux','bouillon'].includes(scenario)) {assert.equal(recorded.verification.bookingEvidence,'own_booking_readback');assert.equal(recorded.verification.policySource,venue.policySource);assert.equal(recorded.verification.shiftId,venue.shiftId);}
    if(scenario === 'dekas') {assert.equal(r.result.verification.offerEvidence,'own_booking_readback');assert.equal(r.result.verification.offerCount,2);assert.equal(recorded.verification.offerVersion,r.details.offer.version);assert.equal(r.result.reference,'12345');}
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

test('De Kas admits only observed unpaid lunch for two and versions menu, price and policy changes', () => {
  const date='2030-11-16',query={date,party:2},now=Date.parse('2030-11-15T12:00:00Z');
  const document=()=>({page:'/results',query:{rid:'386643',day:date,pax:'2'},props:{initialState:{appStoreState:deKasState(date)}}});
  const evidence=d=>zenchefAvailabilityEvidence(d,query,now,ZENCHEF_DEKAS);
  const original=evidence(document()).candidates[0].offers[0];assert.equal(original.mealPrice,null);assert.equal(original.depositApplies,false);
  for(const mutate of [
    s=>s.prepayment_param.min_guests=2,s=>s.prepayment_param.min_guests=8,s=>s.prepayment_param.deposit_type='demand_based',
    s=>s.charge_param={is_web_booking_askable:true,min_guests:1},s=>s.confirmation.is_auto=false,s=>s.confirmation.is_auto_until='12:00',
    s=>s.offers[0].has_prepayment=true,s=>s.offers[0].charge_per_guests=5000,s=>s.offers[0].payment_type='prepayment',
    s=>s.shift_slots[0].offers[0].possible_guests=[],s=>s.shift_slots[0].offers[0].stock=1,
    s=>s.shift_slots[0].offers[0].config.is_same_for_all=false,s=>s.shift_slots[0].offers[0].available_rooms={},
    s=>s.id=500609]) {
    const d=document();mutate(d.props.initialState.appStoreState.dailyAvailabilities[date].shifts[0]);
    assert.deepEqual(evidence(d).candidates,[]);
  }
  const d=document();d.props.initialState.appStoreState.dailyAvailabilities[date].shifts[0].offers[0].description.en='Changed menu';
  assert.notEqual(evidence(d).candidates[0].offers[0].version,original.version);
  assert.throws(()=>zenchefSearchUrl({...query,party:7},ZENCHEF_DEKAS),/search_fields/);
  const selection={...query,time:'12:30'},url=zenchefFormUrl(selection,ZENCHEF_DEKAS).replace('/form?','/offers?');
  const req=(url,method='GET',type='document')=>({url:()=>url,method:()=>method,resourceType:()=>type,redirectedFrom:()=>null});
  assert.equal(allowedZenchefPreparationRequest(req(url),selection,ZENCHEF_DEKAS),true);
  for(const target of [url.replace('386643','363313'),url.replace('/offers?','/form?'),url+'&shxpid=118785'])
    assert.equal(allowedZenchefPreparationRequest(req(target),selection,ZENCHEF_DEKAS),false);
  assert.equal(allowedZenchefPreparationRequest(req(url,'POST'),selection,ZENCHEF_DEKAS),false);
  for(const path of ['/quotation-preview','/bookings/synthetic-own-booking','/prepayment'])
    assert.equal(allowedZenchefPreparationRequest(req('https://bookings-middleware.zenchef.com'+path+'?restaurantId=386643','GET','fetch'),selection,ZENCHEF_DEKAS),false);
  assert.equal(zenchefBookingResult(200,{id:1,uuid:'synthetic-own-booking',status:'confirmed',booking_offers:[{offer_id:118785,count:2}]},{restaurantId:ZENCHEF_DEKAS.restaurantId}).status,'unknown');
});

test('Bofinger captured lunch threshold is automatic only for the pinned scope, without room availability arrays', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'84941',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(bofingerSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_BOFINGER);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['12:00','12:30','13:00','14:30']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(bofingerPolicy(bofingerSource,changed,2),false);
  }
  for(const threshold of [null,0,1,'6',undefined]) {shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=6;shift.prepayment_param={is_web_booking_askable:true};assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_BOFINGER),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_BOFINGER.restaurantId}).status,'unknown');
});

test('La Coupole captured ordinary lunch excludes breakfast/dinner and unknown or changed policy', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'83871',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(laCoupoleSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_LACOUPOLE);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['12:00','12:15','12:30','12:45','13:00','14:15','14:30','15:00','15:30','16:00','16:30']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(laCoupolePolicy(laCoupoleSource,changed,2),false);
  }
  for(const threshold of [null,0,1,'6',undefined]) {shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=6;
  for(const id of [107056,20149,412131,19170]) {shift.id=id;assert.equal(evidence().candidates.length,0);}
  shift.id=20148;shift.charge_param={is_web_booking_askable:false};assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_LACOUPOLE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_LACOUPOLE.restaurantId}).status,'unknown');
});

test('Terminus Nord uses its own lunch and exact card threshold, separate from Vaudeville', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'82241',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(terminusNordSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_TERMINUSNORD);
  assert.equal(evidence().candidates.length,25);assert.equal(evidence().candidates[0].time,'11:00');assert.equal(evidence().candidates.at(-1).time,'17:00');
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(terminusNordPolicy(terminusNordSource,changed,2),false);
  }
  for(const threshold of [null,0,1,'6',undefined]) {shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=6;
  for(const min of [2,11,13,'12',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}
  shift.charge_param.min_guests=12;
  for(const id of [57186,19383,20148,19170]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_TERMINUSNORD),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_TERMINUSNORD.restaurantId}).status,'unknown');
});

test('Procope first lunch for two excludes later services and exact auto threshold changes', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'250682',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(procopeSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_PROCOPE);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['12:00','12:15','12:30','12:45','13:00']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(procopePolicy(procopeSource,changed,2),false);
  }
  for(const threshold of [null,0,1,6,'4',undefined]) {shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=4;
  for(const id of [54002,18192,56212,119485,19380]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  shift.id=18190;shift.charge_param={is_web_booking_askable:false};assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_PROCOPE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_PROCOPE.restaurantId}).status,'unknown');
});

test('La Lorraine ordinary lunch binds its own service, card threshold and cancellation policy', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'478',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(laLorraineSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_LALORRAINE);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['12:00','12:15','12:30','12:45','13:00','13:15','14:00','14:30']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(laLorrainePolicy(laLorraineSource,changed,2),false);
  }
  for(const threshold of [null,0,1,'6',undefined]) {shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=6;
  for(const min of [2,7,9,12,'8',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}
  shift.charge_param.min_guests=8;
  for(const id of [44594,52174,52177,153187,19380]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_LALORRAINE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_LALORRAINE.restaurantId}).status,'unknown');
});

test('Au Pied de Cochon lunch for two binds own service and card policy', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'247',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(piedSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_PIEDDECOCHON);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['11:30','12:00','12:30','13:00']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(piedDeCochonPolicy(piedSource,changed,2),false);
  }
  for(const threshold of [null,0,1,'6',undefined]) {shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=6;
  for(const min of [2,4,6,'5',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}
  shift.charge_param.min_guests=5;
  for(const id of [48044,18378,16674]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_PIEDDECOCHON),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_PIEDDECOCHON.restaurantId}).status,'unknown');
});

test('Grand Café Capucines pins automatic true/null ordinary lunch for two', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'101232',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(grandCafeSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_GRANDCAFE);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['12:00','12:30','13:00','13:30','14:00','14:30']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(grandCafePolicy(grandCafeSource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto=true;
  for(const threshold of [0,4,6,'6',undefined]){shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=null;
  for(const id of [19589,48070,19595,29]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_GRANDCAFE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_GRANDCAFE.restaurantId}).status,'unknown');
});

test('Vagenende lunch binds exact own policy including booking-relative cancellation', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'356807',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(vagenendeSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_VAGENENDE);
  assert.equal(evidence().candidates.length,19);assert.equal(evidence().candidates[0].time,'12:00');assert.equal(evidence().candidates.at(-1).time,'16:30');
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(vagenendePolicy(vagenendeSource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto=true;
  for(const min of [2,4,6,'5',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}shift.charge_param.min_guests=5;
  shift.cancelation_param.enduser_cancelable_reference='shift';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='booking';
  shift.id=63973;assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_VAGENENDE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_VAGENENDE.restaurantId}).status,'unknown');
});

test('Bouillon Julien ordinary lunch excludes special dates and pins 10860-second shift policy', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'350246',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(bouillonSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_BOUILLONJULIEN);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['11:45','14:30','15:00','15:30','16:00','16:30','17:00']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(bouillonJulienPolicy(bouillonSource,changed,2),false);
  }
  for(const threshold of [null,0,1,6,'8',undefined]){shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto_until=8;
  shift.cancelation_param.enduser_cancelable_before=10800;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=10860;
  shift.id=15702;assert.equal(evidence().candidates.length,0);
  for(const date of ['2026-12-24','2026-12-25','2026-12-31','2030-12-24','2030-12-25','2030-12-31']) {
    assert.throws(()=>zenchefSearchUrl({date,party:2},ZENCHEF_BOUILLONJULIEN),/special_date_unsupported/);
    assert.throws(()=>zenchefFormUrl({date,party:2,time:'12:00'},ZENCHEF_BOUILLONJULIEN),/special_date_unsupported/);
  }
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_BOUILLONJULIEN),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_BOUILLONJULIEN.restaurantId}).status,'unknown');
});

test('Bouillon Racine pins first lunch and own 10800-second shift policy', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'132',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(racineSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_BOUILLONRACINE);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['12:00','12:15','12:30']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(bouillonRacinePolicy(racineSource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto=true;
  for(const threshold of [0,4,6,'6',undefined]){shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=null;
  shift.cancelation_param.enduser_cancelable_before=10860;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=10800;
  shift.cancelation_param.enduser_cancelable_reference='booking';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='shift';
  for(const id of [371604,515773,95695,12711]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_BOUILLONRACINE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_BOUILLONRACINE.restaurantId}).status,'unknown');
});

test('République limits the all-day Friday service to seven lunch times and exact own policy', () => {
 const query={date:'2026-10-23',party:2};const data={page:'/results',query:{rid:'357115',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(republiqueSource)}}};
 const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_BOUILLONREPUBLIQUE);
 assert.deepEqual(evidence().candidates.map(x=>x.time),[...ZENCHEF_BOUILLONREPUBLIQUE.lunchTimes]);
 const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
 for(const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']){const changed=structuredClone(shift);delete changed[field];assert.equal(bouillonRepubliquePolicy(republiqueSource,changed,2),false);}
 for(const min of [2,3,5,'4',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}shift.charge_param.min_guests=4;
 shift.confirmation.is_auto=false;assert.equal(evidence().candidates.length,0);shift.confirmation.is_auto=true;
 shift.cancelation_param.enduser_cancelable_reference='booking';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='shift';
 shift.cancelation_param.enduser_cancelable_before=28800;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=21600;
 for(const time of ['11:00','15:00','15:30','17:30','22:00','23:30'])assert.throws(()=>zenchefFormUrl({...query,time},ZENCHEF_BOUILLONREPUBLIQUE),/time_outside_lunch_scope/);
 for(const time of ZENCHEF_BOUILLONREPUBLIQUE.lunchTimes)assert.match(zenchefFormUrl({...query,time},ZENCHEF_BOUILLONREPUBLIQUE),/rid=357115/);
 shift.id=531429;assert.equal(evidence().candidates.length,0);
 assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_BOUILLONREPUBLIQUE),/search_fields/);
 assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_BOUILLONREPUBLIQUE.restaurantId}).status,'unknown');
});

test('Rosie weekday lunch binds exact own policy including booking-relative cancellation', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'355132',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(rosieSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_ROSIE);
  assert.equal(evidence().candidates.length,10);assert.equal(evidence().candidates[0].time,'12:00');assert.equal(evidence().candidates.at(-1).time,'14:15');
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(rosiePolicy(rosieSource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto=true;
  for(const min of [2,4,6,'5',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}shift.charge_param.min_guests=5;
  shift.cancelation_param.enduser_cancelable_reference='shift';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='booking';
  shift.cancelation_param.enduser_cancelable_before=10800;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=21600;
  shift.id=80093;assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_ROSIE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_ROSIE.restaurantId}).status,'unknown');
});

test('Rosie Lou weekday lunch binds exact own policy including booking-relative cancellation', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'361941',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(louSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_ROSIELOU);
  assert.equal(evidence().candidates.length,10);assert.equal(evidence().candidates[0].time,'12:00');assert.equal(evidence().candidates.at(-1).time,'14:15');
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(rosieLouPolicy(louSource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto=true;
  for(const min of [2,4,6,'5',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}shift.charge_param.min_guests=5;
  shift.cancelation_param.enduser_cancelable_reference='shift';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='booking';
  shift.cancelation_param.enduser_cancelable_before=10800;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=43200;
  shift.id=118508;assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_ROSIELOU),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_ROSIELOU.restaurantId}).status,'unknown');
});

test('Rosie Jolie pins lunch, booking cancellation and conservative summer exclusion', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'376490',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(jolieSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_ROSIEJOLIE);
  assert.deepEqual(evidence().candidates.map(x=>x.time),['12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00','14:15']);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(rosieJoliePolicy(jolieSource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto=true;
  for(const threshold of [0,4,6,'6',undefined]){shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=null;
  shift.cancelation_param.enduser_cancelable_before=10860;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=21600;
  shift.cancelation_param.enduser_cancelable_reference='shift';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='booking';
  for(const id of [411615,118503,43203]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  for(const year of ['2026','2030']) {
    for(const md of ['08-03','08-12','08-23']) {
      const date=year+'-'+md;
      assert.throws(()=>zenchefSearchUrl({date,party:2},ZENCHEF_ROSIEJOLIE),/summer_date_unsupported/);
      assert.throws(()=>zenchefFormUrl({date,party:2,time:'12:00'},ZENCHEF_ROSIEJOLIE),/summer_date_unsupported/);
    }
    for(const md of ['08-02','08-24'])assert.match(zenchefFormUrl({date:year+'-'+md,party:2,time:'12:00'},ZENCHEF_ROSIEJOLIE),/rid=376490/);
  }
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_ROSIEJOLIE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_ROSIEJOLIE.restaurantId}).status,'unknown');
});

test('Petit Sommelier pins MIDI, partner context and own 21600-second shift policy', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'1404',pid:'1001',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(sommelierSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_PETITSOMMELIER);
  assert.equal(evidence().candidates.length,29);assert.equal(evidence().candidates[0].time,'11:00');assert.equal(evidence().candidates.at(-1).time,'18:00');
  for(const pid of [undefined,'9999']){data.query.pid=pid;assert.throws(evidence,/provider_state_unverified/);}data.query.pid='1001';
  assert.equal(new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_PETITSOMMELIER)).searchParams.get('pid'),'1001');
  for(const notice of [undefined,{}, {fr:null}, {fr:'Changed terms'}]){data.props.initialState.appStoreState.restaurantComment=notice;assert.equal(evidence().candidates.length,0);}data.props.initialState.appStoreState.restaurantComment={fr:''};
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(petitSommelierPolicy(sommelierSource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto=true;
  for(const threshold of [0,4,6,'6',undefined]){shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}
  shift.confirmation.is_auto_until=null;
  shift.cancelation_param.enduser_cancelable_before=10860;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=21600;
  shift.cancelation_param.enduser_cancelable_reference='booking';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='shift';
  for(const id of [37614,298043,441859]){shift.id=id;assert.equal(evidence().candidates.length,0);}
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_PETITSOMMELIER),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_PETITSOMMELIER.restaurantId}).status,'unknown');
});

test('Chez Savy lunch binds own card threshold, shift cancellation and iframe context', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'357117',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(savySource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_CHEZSAVY);
  assert.equal(evidence().candidates.length,5);assert.equal(evidence().candidates[0].time,'12:00');assert.equal(evidence().candidates.at(-1).time,'14:00');
  const formUrl=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_CHEZSAVY));assert.equal(formUrl.searchParams.get('fullscreen'),'1');assert.equal(formUrl.searchParams.has('pid'),false);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(chezSavyPolicy(savySource,changed,2),false);
  }
  for(const auto of [false,1,'true',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto=true;
  for(const min of [2,4,5,'6',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}shift.charge_param.min_guests=6;
  shift.cancelation_param.enduser_cancelable_reference='booking';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='shift';
  shift.cancelation_param.enduser_cancelable_before=21600;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=10800;
  shift.id=68280;assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_CHEZSAVY),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_CHEZSAVY.restaurantId}).status,'unknown');
});

test('Chez René lunch pins own automatic threshold, card policy and service', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'357076',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(reneSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_CHEZRENE);
  assert.equal(evidence().candidates.length,5);assert.equal(evidence().candidates[0].time,'12:00');assert.equal(evidence().candidates.at(-1).time,'14:00');
  const formUrl=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_CHEZRENE));assert.equal(formUrl.searchParams.get('fullscreen'),'1');assert.equal(formUrl.searchParams.has('pid'),false);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(chezRenePolicy(reneSource,changed,2),false);
  }
  for(const auto of [true,1,'false',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto=false;
  for(const min of [2,4,6,'5',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}shift.charge_param.min_guests=5;
  shift.cancelation_param.enduser_cancelable_reference='booking';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='shift';
  shift.cancelation_param.enduser_cancelable_before=21600;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=10800;
  for(const threshold of [null,0,1,6,'4',undefined]){shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto_until=4;
  shift.id=68278;assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_CHEZRENE),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_CHEZRENE.restaurantId}).status,'unknown');
});

test('Bistrot de Paris pins own lunch threshold, 1800-second cutoff and service', () => {
  const query={date:'2026-10-23',party:2};
  const data={page:'/results',query:{rid:'357075',day:query.date,pax:'2'},props:{initialState:{appStoreState:structuredClone(bistrotSource)}}};
  const evidence=()=>zenchefAvailabilityEvidence(data,query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_BISTROTPARIS);
  assert.equal(evidence().candidates.length,5);assert.equal(evidence().candidates[0].time,'12:00');assert.equal(evidence().candidates.at(-1).time,'14:00');
  const formUrl=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_BISTROTPARIS));assert.equal(formUrl.searchParams.get('fullscreen'),'1');assert.equal(formUrl.searchParams.has('pid'),false);
  const shift=data.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','cancelation_param']) {
    const changed=structuredClone(shift);delete changed[field];assert.equal(bistrotParisPolicy(bistrotSource,changed,2),false);
  }
  for(const auto of [true,1,'false',null,undefined]){shift.confirmation.is_auto=auto;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto=false;
  for(const min of [2,4,5,'6',null,undefined]){shift.charge_param.min_guests=min;assert.equal(evidence().candidates.length,0);}shift.charge_param.min_guests=6;
  shift.cancelation_param.enduser_cancelable_reference='booking';assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_reference='shift';
  shift.cancelation_param.enduser_cancelable_before=21600;assert.equal(evidence().candidates.length,0);shift.cancelation_param.enduser_cancelable_before=1800;
  for(const threshold of [null,0,1,6,'4',undefined]){shift.confirmation.is_auto_until=threshold;assert.equal(evidence().candidates.length,0);}shift.confirmation.is_auto_until=4;
  shift.id=68148;assert.equal(evidence().candidates.length,0);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_BISTROTPARIS),/search_fields/);
  assert.equal(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},{restaurantId:ZENCHEF_BISTROTPARIS.restaurantId}).status,'unknown');
});

test('Bistrot fresh form requirements are rechecked after review', async () => {
  const form = structuredClone(bistrotSource);
  const query = { date: '2026-10-23', party: 2 };
  const selection = { ...query, time: '12:00' };
  form.wish.slot = selection.time;
  const text = 'Synthetic EULA';
  const shift = form.dailyAvailabilities[query.date].shifts[0];
  const session = {
    venue: ZENCHEF_BISTROTPARIS, searchQuery: query, formSelection: selection, noCardAllowed: true,
    terms: { version: crypto.createHash('sha256').update(JSON.stringify([text, form.restaurantComment || null, shift])).digest('hex') },
    page: {
      url: () => zenchefFormUrl(selection, ZENCHEF_BISTROTPARIS),
      locator: selector => selector === 'script#__NEXT_DATA__'
        ? { textContent: async () => JSON.stringify({ props: { initialState: { appStoreState: form } } }) }
        : { innerText: async () => text }
    }
  };
  const verify = () => ZenchefPlaywright.prototype.verifyNativeRoom.call({}, session);
  await verify();
  form.mandatoryFields['custom_field.test'] = 'required';
  await assert.rejects(verify(), error => error.message === 'provider_fields_unverified' && error.status === 409);
  form.mandatoryFields['custom_field.test'] = 'hidden';
  await verify();
  form.mandatoryFields['custom_field_v2.1093'] = 'required';
  await assert.rejects(verify(), /provider_fields_unverified/);
  delete form.mandatoryFields;
  await assert.rejects(verify(), /provider_fields_unverified/);
});

test('Fresh required fields guard covers FishCorner and room venues without weakening seating', async () => {
  for (const venue of [ZENCHEF_FISHCORNER, ZENCHEF_PESQUIERE, ZENCHEF_PIROUETTE]) {
    const room = venue.rooms?.[0];
    const selection = { date: '2026-10-23', party: 2, time: '19:00', ...(room ? { roomId: room.id, roomName: room.name } : {}) };
    const form = { mandatoryFields: { firstname: 'required', 'custom_field.test': 'hidden' }, wish: { room_id: room?.id } };
    let seating = "Jusqu'à 21:00";
    const session = {
      venue, formSelection: selection, terms: { seatingNotice: seating },
      page: {
        url: () => zenchefFormUrl(selection, venue),
        locator: () => ({ textContent: async () => JSON.stringify({ props: { initialState: { appStoreState: form } } }) }),
        getByText: () => ({ count: async () => 1, isVisible: async () => true, innerText: async () => seating })
      }
    };
    const verify = () => ZenchefPlaywright.prototype.verifyNativeRoom.call({}, session);
    await verify(); // unchanged form at review
    form.mandatoryFields['custom_field.test'] = 'required';
    await assert.rejects(verify(), /provider_fields_unverified/); // changed after selection
    form.mandatoryFields['custom_field.test'] = 'hidden';
    await verify(); // fresh review accepted
    form.mandatoryFields['custom_field_v2.1093'] = 'required';
    await assert.rejects(verify(), /provider_fields_unverified/); // changed after review
    delete form.mandatoryFields['custom_field_v2.1093'];
    await verify();
    if (venue === ZENCHEF_PIROUETTE) {
      seating = "Jusqu'à 22:00";
      await assert.rejects(verify(), /stale_review/);
    }
    delete form.mandatoryFields;
    await assert.rejects(verify(), /provider_fields_unverified/);
  }
});

test('Aux Bons Crus permits only the evidenced optional-room-null lunch', () => {
  const query={date:'2026-10-23',party:2};
  const evidence=state=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'352718',day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_AUXBONSCRUS);
  assert.equal(evidence(auxSource).candidates.length,10);
  const mutations=[
    s=>s.hasRoomSelection=false,s=>s.hasRoomSelection='true',s=>s.isRoomMandatory=true,s=>delete s.isRoomMandatory,
    s=>s.wish.room_id=10289,s=>delete s.wish.room_id,s=>s.wish.offers=[{offer_id:1,count:2}],
    s=>s.rooms=[],s=>s.rooms.push({id:999,name:'Other'}),s=>s.rooms[0].id='10289',s=>s.rooms[0].name='Other',
    s=>s.dailyAvailabilities[query.date].shifts[0].bookable_rooms=[],
    s=>s.dailyAvailabilities[query.date].shifts[0].shift_slots[0].available_rooms[2]=[999],
    s=>delete s.dailyAvailabilities[query.date].shifts[0].shift_slots[0].available_rooms,
    s=>s.dailyAvailabilities[query.date].shifts[0].confirmation.is_auto=false,
    s=>s.dailyAvailabilities[query.date].shifts[0].confirmation.is_auto_until=4,
    s=>s.dailyAvailabilities[query.date].shifts[0].charge_param={},
    s=>delete s.dailyAvailabilities[query.date].shifts[0].prepayment_param,
    s=>s.dailyAvailabilities[query.date].shifts[0].is_offer_required=true,
    s=>s.dailyAvailabilities[query.date].shifts[0].cancelation_param.enduser_cancelable_reference='booking',
    s=>s.dailyAvailabilities[query.date].shifts[0].cancelation_param.enduser_cancelable_before='14400',
    s=>s.dailyAvailabilities[query.date].shifts[0].id=57365
  ];
  for(const change of mutations){const state=structuredClone(auxSource);change(state);assert.equal(evidence(state).candidates.length,0);}
  const selection={...query,time:'12:00'};
  const url=new URL(zenchefFormUrl(selection,ZENCHEF_AUXBONSCRUS));
  assert.equal(url.searchParams.get('fullscreen'),'1');assert.equal(url.searchParams.has('room_id'),false);assert.equal(url.searchParams.has('pid'),false);
  assert.throws(()=>zenchefFormUrl({...selection,roomId:10289},ZENCHEF_AUXBONSCRUS),/room_required_or_unverified/);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_AUXBONSCRUS),/search_fields/);
});

test('Aux Crus de Bourgogne pins own first lunch without optional-room exception', () => {
  const query={date:'2026-10-23',party:2};
  const evidence=state=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'352723',day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_AUXCRUSBOURGOGNE);
  assert.deepEqual(evidence(bourgogneSource).candidates.map(c=>c.time),['12:00','12:15','12:30','13:30','13:45','14:00','14:15']);
  const changes=[s=>s.hasRoomSelection=true,s=>delete s.hasRoomSelection,s=>s.isRoomMandatory=true,s=>s.wish.room_id=10308,s=>s.wish.offers=[{offer_id:1,count:2}]];
  for (const change of changes){const state=structuredClone(bourgogneSource);change(state);assert.equal(evidence(state).candidates.length,0);}
  const original=bourgogneSource.dailyAvailabilities[query.date].shifts[0];
  for (const field of ['confirmation','charge_param','prepayment_param','is_offer_required','offer_required_from_pax','cancelation_param']) {
    const shift=structuredClone(original);delete shift[field];assert.equal(auxCrusBourgognePolicy(bourgogneSource,shift,2),false);
  }
  for(const value of [true,'false',null,undefined]){const shift=structuredClone(original);shift.confirmation.is_auto=value;assert.equal(auxCrusBourgognePolicy(bourgogneSource,shift,2),false);}
  for(const value of [null,0,1,3,5,'4',undefined]){const shift=structuredClone(original);shift.confirmation.is_auto_until=value;assert.equal(auxCrusBourgognePolicy(bourgogneSource,shift,2),false);}
  for(const change of [s=>s.charge_param={},s=>s.prepayment_param={},s=>s.cancelation_param.enduser_cancelable_reference='shift',s=>s.cancelation_param.enduser_cancelable_before='7200',s=>s.id=63455,s=>s.name='Midi']){const shift=structuredClone(original);change(shift);assert.equal(auxCrusBourgognePolicy(bourgogneSource,shift,2),false);}
  const url=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_AUXCRUSBOURGOGNE));
  assert.equal(url.searchParams.get('fullscreen'),'1');assert.equal(url.searchParams.has('room_id'),false);assert.equal(url.searchParams.has('pid'),false);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_AUXCRUSBOURGOGNE),/search_fields/);
});

test('Petit Retro pins own lunch auto/card/cancellation and rejects borrowed policy', () => {
  const query={date:'2026-10-23',party:2}, original=retroSource.dailyAvailabilities[query.date].shifts[0];
  const evidence=state=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'361808',day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_PETITRETRO);
  assert.equal(evidence(retroSource).candidates.length,10);
  for(const change of [s=>s.hasRoomSelection=true,s=>delete s.hasRoomSelection,s=>s.isRoomMandatory=true,s=>s.wish.room_id=45475,s=>s.wish.offers=[{offer_id:1,count:2}]]){const state=structuredClone(retroSource);change(state);assert.equal(evidence(state).candidates.length,0);}
  for(const key of ['confirmation','charge_param','prepayment_param','is_offer_required','offer_required_from_pax','cancelation_param']){const shift=structuredClone(original);delete shift[key];assert.equal(petitRetroPolicy(retroSource,shift,2),false);}
  for(const change of [s=>s.confirmation.is_auto=false,s=>s.confirmation.is_auto='true',s=>s.confirmation.is_auto_until=4,s=>delete s.confirmation.is_auto_until,s=>s.charge_param=null,s=>s.charge_param.min_guests=2,s=>s.charge_param.min_guests='6',s=>s.charge_param.charge_per_guests=20,s=>s.charge_param.is_web_booking_askable=false,s=>s.cancelation_param.enduser_cancelable_reference='booking',s=>s.cancelation_param.enduser_cancelable_before=7200,s=>s.cancelation_param.enduser_cancelable_before='10800',s=>s.id=116917,s=>s.name='Midi']){const shift=structuredClone(original);change(shift);assert.equal(petitRetroPolicy(retroSource,shift,2),false);}
  const url=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_PETITRETRO));
  for(const key of ['pid','fullscreen','room_id'])assert.equal(url.searchParams.has(key),false);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_PETITRETRO),/search_fields/);
});

test('Moulin a Vent pins own no-charge lunch and rejects dinner and borrowed card policy', () => {
  const query={date:'2026-10-23',party:2},original=moulinSource.dailyAvailabilities[query.date].shifts[0];
  const evidence=state=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'363128',day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_MOULINVENT);
  assert.deepEqual(evidence(moulinSource).candidates.map(c=>c.time),['12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00']);
  for(const change of [s=>s.hasRoomSelection=true,s=>delete s.hasRoomSelection,s=>s.isRoomMandatory=true,s=>s.wish.room_id=51857,s=>s.wish.offers=[{offer_id:1,count:2}]]){const state=structuredClone(moulinSource);change(state);assert.equal(evidence(state).candidates.length,0);}
  for(const key of ['confirmation','charge_param','prepayment_param','is_offer_required','offer_required_from_pax','cancelation_param']){const shift=structuredClone(original);delete shift[key];assert.equal(moulinVentPolicy(moulinSource,shift,2),false);}
  for(const change of [s=>s.confirmation.is_auto=false,s=>s.confirmation.is_auto='true',s=>s.confirmation.is_auto_until=4,s=>delete s.confirmation.is_auto_until,s=>s.charge_param={},s=>s.charge_param={is_web_booking_askable:true,min_guests:6,charge_per_guests:10},s=>s.prepayment_param={},s=>s.cancelation_param.enduser_cancelable_reference='booking',s=>s.cancelation_param.enduser_cancelable_before=14400,s=>s.cancelation_param.enduser_cancelable_before='10800',s=>s.id=140331,s=>s.name='Midi',s=>delete s.comment,s=>s.comment.fr='',s=>s.comment.fr=null,s=>s.comment.fr='Changed seating']){const shift=structuredClone(original);change(shift);assert.equal(moulinVentPolicy(moulinSource,shift,2),false);}
  const url=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_MOULINVENT));
  for(const key of ['pid','fullscreen','room_id'])assert.equal(url.searchParams.has(key),false);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_MOULINVENT),/search_fields/);
});

test('Petit Pontoise pins partner context, own automatic threshold and zero cancellation value', () => {
  const query={date:'2026-10-23',party:2},original=pontoiseSource.dailyAvailabilities[query.date].shifts[0];
  const evidence=(state,pid='1001')=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'118',pid,day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_PETITPONTOISE);
  assert.deepEqual(evidence(pontoiseSource).candidates.map(c=>c.time),['12:00','12:30','13:00','13:30','14:00']);
  for(const pid of [null,1001,'other'])assert.throws(()=>evidence(pontoiseSource,pid),/provider_state_unverified/);
  for(const change of [s=>s.hasRoomSelection=true,s=>delete s.hasRoomSelection,s=>s.isRoomMandatory=true,s=>s.wish.room_id=5207,s=>s.wish.offers=[{offer_id:1,count:2}],s=>s.partner_id=1001,s=>delete s.partner_id]){const state=structuredClone(pontoiseSource);change(state);assert.equal(evidence(state).candidates.length,0);}
  for(const key of ['confirmation','charge_param','prepayment_param','is_offer_required','offer_required_from_pax','cancelation_param']){const shift=structuredClone(original);delete shift[key];assert.equal(petitPontoisePolicy(pontoiseSource,shift,2),false);}
  for(const change of [s=>s.confirmation.is_auto=true,s=>s.confirmation.is_auto='false',s=>s.confirmation.is_auto_until=null,s=>s.confirmation.is_auto_until=2,s=>s.confirmation.is_auto_until='4',s=>s.charge_param=null,s=>s.charge_param.min_guests=2,s=>s.charge_param.min_guests='6',s=>s.charge_param.charge_per_guests=30,s=>s.prepayment_param={},s=>s.cancelation_param.enduser_cancelable_reference='booking',s=>s.cancelation_param.enduser_cancelable_before=10800,s=>s.cancelation_param.enduser_cancelable_before='0',s=>s.cancelation_param.enduser_cancelable_before=null,s=>s.id=47972]){const shift=structuredClone(original);change(shift);assert.equal(petitPontoisePolicy(pontoiseSource,shift,2),false);}
  const url=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_PETITPONTOISE));assert.equal(url.searchParams.get('pid'),'1001');
  for(const key of ['fullscreen','room_id'])assert.equal(url.searchParams.has(key),false);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_PETITPONTOISE),/search_fields/);
});

test('Explicit partner venues recheck fresh query pid before review and submission', async () => {
  for(const [venue,source] of [[ZENCHEF_PETITPONTOISE,pontoiseSource],[ZENCHEF_PETITSOMMELIER,sommelierSource],[ZENCHEF_MARTHA,marthaSource],[ZENCHEF_CAFEMARLY,marlySource]]) {
    const form=structuredClone(source),searchQuery={date:'2026-10-23',party:2},formSelection={...searchQuery,time:'12:00'};
    form.wish.slot='12:00';
    const data={query:{pid:'1001'},props:{initialState:{appStoreState:form}}},text='Synthetic EULA';
    const shift=form.dailyAvailabilities[searchQuery.date].shifts.find(s=>s.id===venue.shiftId);
    const session={venue,searchQuery,formSelection,noCardAllowed:true,
      terms:{version:crypto.createHash('sha256').update(JSON.stringify([text,form.restaurantComment||null,shift])).digest('hex')},
      page:{url:()=>zenchefFormUrl(formSelection,venue),locator:selector=>selector==='script#__NEXT_DATA__'
        ?{textContent:async()=>JSON.stringify(data)}:{innerText:async()=>text}}};
    const verify=()=>ZenchefPlaywright.prototype.verifyNativeRoom.call({},session);
    await verify();
    for(const pid of [undefined,null,1001,'other']) {
      data.query.pid=pid;
      await assert.rejects(verify(),error=>error.message==='stale_review'&&error.status===409);
    }
    delete data.query;
    await assert.rejects(verify(),/stale_review/);
    data.query={pid:'1001'};
    await verify();
    if ([ZENCHEF_MARTHA,ZENCHEF_CAFEMARLY].includes(venue)) {
      for (const partner of [undefined,null,1001,'other']) {
        form.partner_id=partner; await assert.rejects(verify(),/stale_review/);
      }
      form.partner_id='1001'; await verify();
    }
  }
});

test('Le Florentin pins its own lunch automatic threshold six and strict no-room state', () => {
  const query={date:'2026-10-23',party:2},original=florentinSource.dailyAvailabilities[query.date].shifts[0];
  const evidence=state=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'376209',day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_LEFLORENTIN);
  assert.equal(evidence(florentinSource).candidates.length,13);assert.equal(evidence(florentinSource).candidates.at(-1).time,'15:00');
  for(const change of [s=>s.hasRoomSelection=true,s=>delete s.hasRoomSelection,s=>s.isRoomMandatory=true,s=>s.wish.room_id=95254,s=>s.wish.offers=[{offer_id:1,count:2}]]){const state=structuredClone(florentinSource);change(state);assert.equal(evidence(state).candidates.length,0);}
  for(const key of ['confirmation','charge_param','prepayment_param','is_offer_required','offer_required_from_pax','cancelation_param']){const shift=structuredClone(original);delete shift[key];assert.equal(leFlorentinPolicy(florentinSource,shift,2),false);}
  for(const value of [true,'false',null,undefined]){const shift=structuredClone(original);shift.confirmation.is_auto=value;assert.equal(leFlorentinPolicy(florentinSource,shift,2),false);}
  for(const value of [null,0,1,2,4,7,'6',undefined]){const shift=structuredClone(original);shift.confirmation.is_auto_until=value;assert.equal(leFlorentinPolicy(florentinSource,shift,2),false);}
  for(const change of [s=>s.charge_param={},s=>s.prepayment_param={},s=>s.is_offer_required=true,s=>s.cancelation_param.enduser_cancelable_reference='booking',s=>s.cancelation_param.enduser_cancelable_before=0,s=>s.cancelation_param.enduser_cancelable_before='10800',s=>s.id=283683,s=>s.id=301346,s=>s.id=282308,s=>s.name='Midi']){const shift=structuredClone(original);change(shift);assert.equal(leFlorentinPolicy(florentinSource,shift,2),false);}
  const url=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_LEFLORENTIN));for(const key of ['pid','fullscreen','room_id'])assert.equal(url.searchParams.has(key),false);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_LEFLORENTIN),/search_fields/);
});

test('Martha binds first lunch and own partner state without importing other service policies', () => {
  const query={date:'2026-10-23',party:2},original=marthaSource.dailyAvailabilities[query.date].shifts[0];
  const evidence=(state,pid='1001')=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'364490',pid,day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_MARTHA);
  assert.deepEqual(evidence(marthaSource).candidates.map(c=>c.time),['12:00','12:30']);
  for(const pid of [null,1001,'other'])assert.throws(()=>evidence(marthaSource,pid),/provider_state_unverified/);
  for(const change of [s=>s.hasRoomSelection=true,s=>delete s.hasRoomSelection,s=>s.isRoomMandatory=true,s=>s.wish.room_id=57498,s=>s.wish.offers=[{offer_id:1,count:2}],s=>s.partner_id=1001,s=>delete s.partner_id]){const state=structuredClone(marthaSource);change(state);assert.equal(evidence(state).candidates.length,0);}
  for(const key of ['confirmation','charge_param','prepayment_param','is_offer_required','offer_required_from_pax','cancelation_param']){const shift=structuredClone(original);delete shift[key];assert.equal(marthaPolicy(marthaSource,shift,2),false);}
  for(const change of [s=>s.confirmation.is_auto=true,s=>s.confirmation.is_auto='false',s=>s.confirmation.is_auto_until=null,s=>s.confirmation.is_auto_until=4,s=>s.confirmation.is_auto_until='6',s=>s.charge_param={},s=>s.prepayment_param={},s=>s.cancelation_param.enduser_cancelable_reference='booking',s=>s.cancelation_param.enduser_cancelable_before=2678400,s=>s.cancelation_param.enduser_cancelable_before='10800',s=>s.id=159418,s=>s.id=159419,s=>s.id=159420,s=>s.name='MIDI 2e service']){const shift=structuredClone(original);change(shift);assert.equal(marthaPolicy(marthaSource,shift,2),false);}
  const url=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_MARTHA));assert.equal(url.searchParams.get('pid'),'1001');for(const key of ['fullscreen','room_id'])assert.equal(url.searchParams.has(key),false);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_MARTHA),/search_fields/);
});

test('Cafe Marly pins own lunch card threshold and 18300 SHIFT cancellation', () => {
  const query={date:'2026-10-23',party:2},original=marlySource.dailyAvailabilities[query.date].shifts[0];
  const evidence=(state,pid='1001')=>zenchefAvailabilityEvidence({page:'/results',query:{rid:'353937',pid,day:query.date,pax:'2'},props:{initialState:{appStoreState:state}}},query,Date.parse('2026-10-18T10:00:00Z'),ZENCHEF_CAFEMARLY);
  assert.deepEqual(evidence(marlySource).candidates.map(c=>c.time),['12:00','12:30','13:00','13:30','14:00','14:30','15:00']);
  for(const pid of [null,1001,'other'])assert.throws(()=>evidence(marlySource,pid),/provider_state_unverified/);
  for(const change of [s=>s.hasRoomSelection=true,s=>delete s.hasRoomSelection,s=>s.isRoomMandatory=true,s=>s.wish.room_id=27608,s=>s.wish.offers=[{offer_id:1,count:2}],s=>s.partner_id=1001,s=>delete s.partner_id]){const state=structuredClone(marlySource);change(state);assert.equal(evidence(state).candidates.length,0);}
  for(const key of ['confirmation','charge_param','prepayment_param','is_offer_required','offer_required_from_pax','cancelation_param']){const shift=structuredClone(original);delete shift[key];assert.equal(cafeMarlyPolicy(marlySource,shift,2),false);}
  for(const change of [s=>s.confirmation.is_auto=false,s=>s.confirmation.is_auto='true',s=>s.confirmation.is_auto_until=6,s=>delete s.confirmation.is_auto_until,s=>s.charge_param=null,s=>s.charge_param.min_guests=2,s=>s.charge_param.min_guests='6',s=>s.charge_param.charge_per_guests=25,s=>s.prepayment_param={},s=>s.cancelation_param.enduser_cancelable_reference='booking',s=>s.cancelation_param.enduser_cancelable_before=1800,s=>s.cancelation_param.enduser_cancelable_before='18300',s=>s.id=122851,s=>s.id=35528,s=>s.id=116978]){const shift=structuredClone(original);change(shift);assert.equal(cafeMarlyPolicy(marlySource,shift,2),false);}
  const url=new URL(zenchefFormUrl({...query,time:'12:00'},ZENCHEF_CAFEMARLY));assert.equal(url.searchParams.get('pid'),'1001');for(const key of ['fullscreen','room_id'])assert.equal(url.searchParams.has(key),false);
  assert.throws(()=>zenchefSearchUrl({...query,party:3},ZENCHEF_CAFEMARLY),/search_fields/);
});
