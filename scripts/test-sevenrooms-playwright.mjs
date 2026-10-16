import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { SevenRoomsPlaywright, SEVENROOMS_PILOT, sevenRoomsReadAllowed } from '../api/providers/sevenrooms-playwright.mjs';

const origin = 'https://www.sevenrooms.com';
const range = origin + '/api-yoa/availability/ng/widget/range?venue=strandvagen1&party_size=2&start_date=2026-12-20&num_days=1';
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url), true);
assert.equal(sevenRoomsReadAllowed('GET', range, 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/dining/widget_info?venue_url_key=strandvagen1', 'xhr'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/static2/reservations/index-fixture.js', 'script'), true);
for (const url of [
  range.replace('strandvagen1', 'other'), range + '&venue=other', range + '&redirect=https://evil.invalid',
  range.replace('num_days=1', 'num_days=31'), range.replace('party_size=2', 'party_size=0'),
  origin + '/api-yoa/dining/hold/add', origin + '/api-yoa/actuals/manage/cancel?token=fixture',
  origin + '/booking/dining/widget/strandvagen1/book', origin + '/api-yoa/unknown',
  range.replace('www.sevenrooms.com', 'www.sevenrooms.com.evil.invalid'),
  range.replace('https:', 'http:'), range.replace('https://', 'https://user:secret@'), range + '#fragment',
  origin + '/api-yoa/%64ining/widget_info?venue_url_key=strandvagen1',
]) assert.equal(sevenRoomsReadAllowed('GET', url, 'fetch'), false, url);
for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) assert.equal(sevenRoomsReadAllowed(method, range, 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url.replace('strandvagen1', 'other')), false);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url + '?lang=sv'), true);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url + '?lang=sv&lang=en'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/static2/not-a-script', 'script'), false);

// Entire provider document/API are local fixtures fulfilled in Chromium's route
// handler. No external network is allowed, no real slots or provider confirmation.
const html = `<!doctype html><html><body><h1>LOCAL FIXTURE — Strandvägen 1</h1>
<button id="search">Search fixture</button><button id="hold" hidden>Choose fixture slot</button>
<p id="state">Not real availability</p><script>
search.onclick=async()=>{const r=await fetch(${JSON.stringify(range)});const j=await r.json();state.textContent=j.label;hold.hidden=false;};
hold.onclick=async()=>{try{await fetch('/api-yoa/dining/hold/add',{method:'POST',body:'fixture-only'});state.textContent='UNSAFE';}catch{state.textContent='Hold blocked';}};
</script></body></html>`;
const forwarded = [], blocked = [], contexts = [];
let clock = Date.now(), documentMode = 'fixture';
const mirror = new SevenRoomsPlaywright({ now: () => clock, browserFactory: async () => {
  const browser = await chromium.launch();
  const createContext = browser.newContext.bind(browser);
  browser.newContext = async options => {
    assert.equal(options.serviceWorkers, 'block');
    assert.equal(options.acceptDownloads, false);
    const context = await createContext(options);
    contexts.push(context);
    const route = context.route.bind(context);
    context.route = (pattern, handler) => route(pattern, actual => handler(new Proxy(actual, {
      get(target, property) {
        if (property === 'fetch') return async options => {
          assert.equal(options.maxRedirects, 0);
          const request = actual.request();
          forwarded.push({ method: request.method(), url: request.url() });
          const isDocument = request.resourceType() === 'document';
          return {
            status: () => documentMode === 'redirect' && isDocument ? 302 : 200,
            headers: () => ({ 'content-type': isDocument ? 'text/html' : 'application/json', ...(documentMode === 'redirect' ? { location: origin + '/api-yoa/dining/hold/add' } : {}) }),
            body: async () => Buffer.from(isDocument ? documentMode === 'captcha' ? '<h1>Verify you are human</h1>' : html : JSON.stringify({ label: 'Fixture slots only' })),
          };
        };
        if (property === 'continue' || property === 'fallback') return () => { throw new Error('External network escape'); };
        if (property === 'abort') return (...args) => { blocked.push(actual.request().url()); return actual.abort(...args); };
        const value = target[property];
        return typeof value === 'function' ? value.bind(target) : value;
      },
    })));
    return context;
  };
  return browser;
} });

try {
  await assert.rejects(mirror.create('', SEVENROOMS_PILOT.restaurantId), /auth/);
  await assert.rejects(mirror.create('alice', 'other'), /pilot_only/);
  let shot = await mirror.create('alice', SEVENROOMS_PILOT.restaurantId, 390);
  assert.equal(shot.provider, 'SevenRooms'); assert.equal(shot.state, 'read_only');
  assert.equal(shot.mode, 'inspect'); assert.equal(shot.canSubmit, false); assert.equal(shot.result, null);
  assert.match(shot.text, /LOCAL FIXTURE/);
  assert.equal(shot.imageHash, crypto.createHash('sha256').update(Buffer.from(shot.image.split(',')[1], 'base64')).digest('hex'));
  await assert.rejects(mirror.create('alice', SEVENROOMS_PILOT.restaurantId), /session_exists/);
  await assert.rejects(mirror.current(shot.id, 'bob'), /session_expired/);
  await assert.rejects(mirror.action(shot.id, 'bob', { type: 'refresh', revision: shot.revision }), /session_expired/);
  await assert.rejects(mirror.remove(shot.id, 'bob'), /session_expired/);
  for (const type of ['submit', 'fill', 'navigate', 'evaluate']) await assert.rejects(mirror.action(shot.id, 'alice', { type, revision: shot.revision, confirm: true, terms: true }), /inspect_only/);
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'refresh', revision: 0 }), /stale_view/);
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'click', revision: shot.revision, x: NaN, y: 0 }), /coordinates/);
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'scroll', revision: shot.revision, delta: 9999 }), /scroll/);
  const page = contexts[0].pages()[0];
  const click = async selector => {
    const box = await page.locator(selector).boundingBox();
    shot = await mirror.action(shot.id, 'alice', { type: 'click', revision: shot.revision, x: box.x + box.width / 2, y: box.y + box.height / 2 });
  };
  await click('#search');
  await page.locator('#hold').waitFor({ state: 'visible' });
  shot = await mirror.current(shot.id, 'alice');
  assert.match(shot.text, /Fixture slots only/);
  await click('#hold');
  await page.waitForFunction(() => document.querySelector('#state').textContent === 'Hold blocked');
  shot = await mirror.current(shot.id, 'alice');
  assert.equal(shot.state, 'provider_write_required'); assert.equal(shot.canSubmit, false); assert.equal(shot.result, null);
  assert.ok(blocked.some(url => url.endsWith('/hold/add')));
  assert.ok(!forwarded.some(request => request.method !== 'GET' || /hold|\/book$/.test(request.url)));
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'click', revision: shot.revision, x: 1, y: 1 }), /provider_write_required/);
  // Untrusted page content must never synthesize provider-confirmed result.
  await page.evaluate(() => { document.body.innerHTML = '<h1>Booking confirmed FAKE-123</h1>'; });
  shot = await mirror.current(shot.id, 'alice'); assert.equal(shot.result, null);
  const concurrent = await Promise.allSettled([mirror.current(shot.id, 'alice'), mirror.current(shot.id, 'alice')]);
  assert.equal(concurrent.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(concurrent.find(x => x.status === 'rejected').reason.code, 'busy');
  for (const owner of ['b', 'c', 'd']) await mirror.create(owner, SEVENROOMS_PILOT.restaurantId);
  await assert.rejects(mirror.create('e', SEVENROOMS_PILOT.restaurantId), /capacity/);
  clock += 600_001;
  await assert.rejects(mirror.current(shot.id, 'alice'), /session_expired/);
  await mirror.expire();
  documentMode = 'captcha';
  const captcha = await mirror.create('new', SEVENROOMS_PILOT.restaurantId);
  assert.equal(captcha.state, 'access_blocked'); assert.equal(captcha.canSubmit, false);
  await mirror.remove(captcha.id, 'new');
  documentMode = 'redirect';
  await assert.rejects(mirror.create('redirect', SEVENROOMS_PILOT.restaurantId));
  assert.ok(!forwarded.some(request => request.url.endsWith('/hold/add')));
} finally { await mirror.close(); }
await assert.rejects(mirror.create('after-close', SEVENROOMS_PILOT.restaurantId), /closed/);
console.log('PASS SevenRooms local Chromium fixture: pinned venue/read routes, PNG hash, owner/revision/busy/capacity/TTL, no submit/fill, hold and redirect blocked, no forged confirmation, CAPTCHA stop. No live provider/network/booking test.');
