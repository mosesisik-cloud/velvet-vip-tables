// Independent normalized-UI journey test. ALL inventory/results are fixtures.
// Deliberately does not start api/server.mjs or any supplier browser adapter.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { createJourneyFixture, FIXTURE_RESTAURANT, FIXTURE_DATE, FIXTURE_REFERENCE } from './fixtures/velvet-playwright-journey.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const uiFile = process.env.VELVET_JOURNEY_UI_FILE
  ? path.resolve(process.env.VELVET_JOURNEY_UI_FILE)
  : path.join(root, 'js/velvet-playwright-booking.js');
const uiSource = await fs.readFile(uiFile); // Missing implementation MUST fail, never silently skip.
const fixtures = new Map();
const errors = [];
let base;
const shell = `<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Velvet independent fixture journey</title><body><main id="booking"></main><script type="module">
import {mountVelvetPlaywrightBooking} from '/js/velvet-playwright-booking.js';
const call = async (method,payload) => {
 const response = await fetch('/fixture-api', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({method,payload})});
 const body = await response.json(); if(!response.ok) throw new Error(body.error); return body;
};
window.journey = mountVelvetPlaywrightBooking(document.querySelector('#booking'),{
 restaurantId:'${FIXTURE_RESTAURANT}',restaurantName:'FIXTURE restaurant — no reservations',mode:'fixture',
 transport:Object.fromEntries(['create','current','action','remove'].map(method=>[method,payload=>call(method,payload)]))
});
await window.journey.ready;
window.journeyReady = true;
</script></body></html>`;
const server = http.createServer(async (req, res) => {
  const reply = (status, body, type = 'application/json') => {
    res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(type === 'application/json' ? JSON.stringify(body) : body);
  };
  try {
    const url = new URL(req.url, base || 'http://127.0.0.1');
    if (url.pathname === '/fixture-api' && req.method === 'POST') {
      if (req.headers.origin !== base) return reply(403, { error: 'origin' });
      const token = /(?:^|;\s*)journey_owner=([^;]+)/.exec(req.headers.cookie || '')?.[1];
      const binding = fixtures.get(token);
      if (!binding) return reply(401, { error: 'owner' });
      const chunks = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 16384) return reply(413, { error: 'size' });
        chunks.push(chunk);
      }
      const { method, payload } = JSON.parse(Buffer.concat(chunks));
      if (!['create', 'current', 'action', 'remove'].includes(method)) return reply(400, { error: 'method' });
      try { return reply(200, await binding.fixture.forOwner(binding.owner)[method](payload)); }
      catch (error) { return reply(409, { error: error.message }); }
    }
    if (!['GET', 'HEAD'].includes(req.method)) return reply(405, { error: 'method' });
    if (url.pathname === '/') return reply(200, shell, 'text/html; charset=utf-8');
    if (url.pathname === '/js/velvet-playwright-booking.js') return reply(200, uiSource, 'text/javascript');
    // Only local JS dependencies of the real module are served. No API proxy.
    if (/^\/js\/[a-zA-Z0-9_-]+\.js$/.test(url.pathname)) {
      return reply(200, await fs.readFile(path.join(root, url.pathname.slice(1))), 'text/javascript');
    }
    return reply(404, { error: 'not_found' });
  } catch (error) {
    errors.push(error.message);
    reply(500, { error: 'fixture_server_error' });
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
base = `http://127.0.0.1:${server.address().port}`;
let browser;
let tests = 0;
const test = async (name, run) => { await run(); tests++; console.log(`PASS [MOCK ONLY] ${name}`); };
const action = (page, name) => page.locator(`[data-action="${name}"]`);
const stage = (page, name) => page.waitForFunction(expected => !!document.querySelector(`[data-stage="${expected}"]`), name);
async function open(fixture, { width = 390, owner = randomUUID() } = {}) {
  const token = randomUUID();
  fixtures.set(token, { fixture, owner });
  const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  const blocked = [];
  const pageErrors = [];
  await context.addCookies([{ name: 'journey_owner', value: token, url: base, httpOnly: true, sameSite: 'Strict' }]);
  await context.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    const permitted = url.origin === base && (
      ['GET', 'HEAD'].includes(request.method()) || (request.method() === 'POST' && url.pathname === '/fixture-api')
    );
    if (!permitted) { blocked.push({ method: request.method(), url: request.url() }); return route.abort(); }
    return route.continue();
  });
  await context.routeWebSocket('**/*', socket => { blocked.push({ method: 'WEBSOCKET', url: socket.url() }); socket.close(); });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.journeyReady === true);
  return { page, context, owner, blocked, pageErrors, async close() {
    await context.close();
    fixtures.delete(token);
    assert.deepEqual(blocked, [], 'UI attempted an unexpected external/write/WebSocket request');
    assert.deepEqual(pageErrors, [], 'UI JavaScript errors');
  } };
}
async function review(page) {
  const start = action(page, 'start');
  if (await start.isVisible()) await start.click();
  await page.locator('[name="date"]').fill(FIXTURE_DATE);
  await page.locator('[name="party"]').fill('2');
  await action(page, 'search').click();
  await stage(page, 'slots');
  assert.match(await page.locator('#booking').innerText(), /19:00/);
  await action(page, 'select').first().click();
  await stage(page, 'guest');
  for (const [name, value] of Object.entries({ firstname: 'Fixture', lastname: 'Guest', email: 'fixture@example.invalid', phone: '+46700000000' })) {
    await page.locator(`[name="${name}"]`).fill(value);
  }
  await action(page, 'guest').click();
  await stage(page, 'review');
  const text = await page.locator('#booking').innerText();
  assert.match(text, new RegExp(FIXTURE_DATE));
  assert.match(text, /19:00/);
  assert.match(text, /Fixture/);
  assert.match(text, /TESTDATA/);
  assert.equal(await page.locator('iframe').count(), 0, 'A journey must use native Velvet UI, not an iframe');
}
async function submit(page) {
  await page.locator('[name="terms"]').check();
  const response = page.waitForResponse(response => response.url() === base + '/fixture-api'
    && response.request().postDataJSON()?.payload?.type === 'submit');
  await action(page, 'submit').click();
  await response;
}
const submissions = fixture => fixture.inspect().calls.filter(c => c.type === 'submit');
try {
  browser = await chromium.launch();
  for (const width of [390, 1365]) await test(`full explicit-confirm journey and double-click (${width}px)`, async () => {
    const fixture = createJourneyFixture({ delayMs: 80 });
    const view = await open(fixture, { width });
    try {
      await review(view.page);
      assert.equal(fixture.inspect().submissionCount, 0, 'Review must not submit');
      // Without terms, even a programmatic click must not issue a submit action.
      await action(view.page, 'submit').evaluate(button => button.click());
      assert.equal(submissions(fixture).length, 0, 'Missing consent must stop before transport');
      await view.page.locator('[name="terms"]').check();
      await action(view.page, 'submit').evaluate(button => { button.click(); button.click(); });
      await stage(view.page, 'result');
      assert.equal(submissions(fixture).length, 1);
      assert.equal(fixture.inspect().submissionCount, 1);
      const payload = submissions(fixture)[0];
      assert.equal(payload.confirm, true);
      assert.equal(payload.terms, true);
      assert.equal(payload.termsVersion, 'fixture-terms-v1');
      assert.ok(payload.reviewToken);
      assert.ok(payload.idempotencyKey);
      assert.ok(Number.isInteger(payload.revision));
      assert.match(await view.page.locator('#booking').innerText(), new RegExp(FIXTURE_REFERENCE));
      assert.equal(await view.page.locator('[data-booking-status]').getAttribute('data-booking-status'), 'confirmed');
      assert.equal(await view.page.locator('[data-fixture-banner]').count(), 1);
      await view.page.reload();
      await view.page.waitForFunction(() => window.journeyReady === true);
      await stage(view.page, 'result');
      assert.match(await view.page.locator('#booking').innerText(), new RegExp(FIXTURE_REFERENCE));
      assert.equal(submissions(fixture).length, 1, 'Reload must reconcile, not resubmit');
    } finally { await view.close(); }
  });
  for (const outcome of ['pending', 'unknown', 'payment_required', 'rejected', 'error', 'confirmed_without_reference', 'timeout']) {
    await test(`truthful ${outcome} result, no automatic retry`, async () => {
      const fixture = createJourneyFixture({ outcome });
      const view = await open(fixture);
      try {
        await review(view.page);
        await submit(view.page);
        if (outcome !== 'timeout') await stage(view.page, 'result');
        else await view.page.waitForFunction(() => {
          const submit = document.querySelector('[data-action="submit"]');
          return !submit || submit.disabled;
        });
        await view.page.waitForFunction(() => document.querySelector('[data-booking-status]')?.dataset.bookingStatus !== 'confirmed'
          && document.querySelector('[data-stage="result"]')?.getAttribute('aria-busy') === 'false');
        const text = await view.page.locator('#booking').innerText();
        assert.ok(!text.includes(FIXTURE_REFERENCE));
        assert.equal(await view.page.locator('[data-reference]').count(), 0);
        assert.equal(await view.page.locator('[data-booking-status]').getAttribute('data-booking-status'),
          ['timeout', 'confirmed_without_reference'].includes(outcome) ? 'unknown' : outcome);
        assert.equal(await view.page.locator('[data-fixture-banner]').count(), 1);
        assert.equal(fixture.inspect().submissionCount, 1);
        await view.page.reload();
        await view.page.waitForFunction(() => window.journeyReady === true);
        await stage(view.page, 'result');
        assert.equal(submissions(fixture).length, 1, 'Outcome reconciliation must never repeat submit');
        const submitButton = action(view.page, 'submit');
        assert.ok(!(await submitButton.isVisible()) || await submitButton.isDisabled());
      } finally { await view.close(); }
    });
  }
  await test('concurrent owner contexts cannot see each other’s review or guest', async () => {
    const fixture = createJourneyFixture();
    const first = await open(fixture, { owner: 'fixture-owner-one' });
    const second = await open(fixture, { owner: 'fixture-owner-two' });
    try {
      await review(first.page);
      await second.page.reload();
      await second.page.waitForFunction(() => window.journeyReady === true);
      assert.ok(!(await second.page.locator('#booking').innerText()).includes('fixture@example.invalid'));
      assert.equal(await second.page.locator('[data-stage="review"]').count(), 0);
      await review(second.page);
      const firstState = await fixture.forOwner(first.owner).current({ restaurantId: FIXTURE_RESTAURANT });
      const secondState = await fixture.forOwner(second.owner).current({ restaurantId: FIXTURE_RESTAURANT });
      assert.notEqual(firstState.id, secondState.id, 'Contexts must own distinct sessions');
      // Verify that this fixture really denies a cross-owner token, rather than
      // claiming isolation only because one of the contexts had no session.
      await assert.rejects(fixture.forOwner(second.owner).action({
        id: firstState.id, restaurantId: FIXTURE_RESTAURANT, revision: firstState.revision,
        type: 'submit', confirm: true, terms: true,
      }), /session_expired/);
      const calls = fixture.inspect().calls;
      assert.ok(calls.some(c => c.owner === first.owner));
      assert.ok(calls.some(c => c.owner === second.owner));
      assert.equal(fixture.inspect().submissionCount, 0);
    } finally { await first.close(); await second.close(); }
  });
  await test('changed terms/revision reject stale consent before any fixture submission', async () => {
    const fixture = createJourneyFixture();
    const view = await open(fixture);
    try {
      await review(view.page);
      fixture.changeTerms(view.owner);
      await submit(view.page);
      await view.page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent?.trim());
      assert.equal(fixture.inspect().submissionCount, 0);
      await view.page.reload();
      await view.page.waitForFunction(() => window.journeyReady === true);
      // A submitted action with a rejected acknowledgement remains locked until
      // authoritative attempt reconciliation. Reload must not silently re-arm.
      await stage(view.page, 'result');
      assert.equal(await view.page.locator('[data-booking-status]').getAttribute('data-booking-status'), 'unknown');
      assert.equal(await view.page.locator('[name="terms"]').count(), 0);
      assert.equal(fixture.inspect().submissionCount, 0);
    } finally { await view.close(); }
  });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: 'PASS', evidence: 'mock_only', tests,
    uiSha256: createHash('sha256').update(uiSource).digest('hex'),
    fullSupplierConfirmationVerified: false, productionBackendVerified: false, deployed: false }));
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
