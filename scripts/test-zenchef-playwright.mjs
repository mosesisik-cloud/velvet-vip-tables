// Local fixture only. No real Zenchef availability, hold or reservation is tested.
// Run: node --test scripts/test-zenchef-playwright.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { ZenchefPlaywright, ZENCHEF_ARPEGE, allowedZenchefInspectionRequest } from '../api/providers/zenchef-playwright.mjs';

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
before(async () => { browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) }); });
const adapters = [];
function adapter(options = {}) {
  // The adapter owns only contexts; this test suite owns the shared browser.
  const a = new ZenchefPlaywright({ mode: 'fixture', fixtureHtml: fixture(),
    browserFactory: async () => ({ newContext: opts => browser.newContext(opts), close: async () => {} }),
    reserveSubmission: async () => {}, recordResult: async () => {}, ...options });
  adapters.push(a); return a;
}
after(async () => { for (const a of adapters) await a.close(); await browser?.close(); });
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

test('inspect mode never advances or exposes fixture confirmation; redirects fail closed', async () => {
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
      for (const type of ['search', 'select', 'contact', 'click', 'submit']) await assert.rejects(act(a, s, { type }), /inspect_only/);
    }
    assert.equal(fetches, 1);
  }
});
