import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright';
import { TockPlaywright, TOCK_DELTA_ID } from '../api/providers/tock-playwright.mjs';

const fixtureHtml = fs.readFileSync(new URL('./fixtures/tock-playwright.html', import.meta.url), 'utf8');
const guest = { firstname: 'Local', lastname: 'Fixture', email: 'fixture@example.invalid', phone: '+46700000000' };
const confirmation = s => ({ type: 'submit', revision: s.revision, confirm: true, terms: true,
  termsVersion: s.terms.version, reviewToken: s.reviewToken, idempotencyKey: 'fixture-attempt-01' });

test('production mode is fail-closed and never creates a browser or synthetic slots', async () => {
  const adapter = new TockPlaywright({ browserFactory: () => { throw Error('must not launch'); } });
  try {
    const s = await adapter.create('alice', TOCK_DELTA_ID);
    assert.equal(s.mode, 'live'); assert.equal(s.canSubmit, false);
    assert.equal(s.result.reason, 'provider_protocol_unverified');
    assert.equal(s.availability, null);
    for (const type of ['search', 'select', 'guest', 'submit'])
      await assert.rejects(adapter.action(s.id, 'alice', { type, revision: s.revision }), /provider_protocol_unverified/);
    assert.throws(() => adapter.current('other'), /session_expired/);
    await assert.rejects(adapter.create('bob', 'https://example.com/'), /unknown_restaurant/);
  } finally { await adapter.close(); }
});

test('real Chromium fixture journey and negative boundaries (zero supplier traffic)', async t => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  let now = Date.now(), reserves = 0, records = 0;
  let reserveHook = async () => { reserves++; };
  let recordHook = async () => { records++; };
  const adapter = new TockPlaywright({ mode: 'fixture', fixtureHtml, browserFactory: async () => browser,
    now: () => now, timeoutMs: 10000, maxSessions: 4,
    reserveSubmission: attempt => reserveHook(attempt), recordResult: (attempt, result) => recordHook(attempt, result) });
  const create = owner => adapter.create(owner, TOCK_DELTA_ID);
  const act = (owner, action) => { const s = adapter.current(owner); return adapter.action(s.id, owner, { revision: s.revision, ...action }); };
  const review = async owner => {
    await create(owner);
    await act(owner, { type: 'search', date: '2030-10-20', party: 2 });
    await act(owner, { type: 'select', slotId: 'fixture-dinner' });
    return act(owner, { type: 'guest', guest });
  };
  const remove = owner => { const s = adapter.current(owner); return adapter.remove(s.id, owner); };
  try {
    await t.test('search → slot → guest → explicit consent → fixture-only result', async () => {
      let s = await review('journey');
      assert.equal(s.stage, 'review'); assert.equal(s.canSubmit, true);
      assert.equal(s.availability.source, 'fixture'); assert.equal(s.evidenceMode, 'local_fixture');
      assert.equal(s.liveBookingSupported, false);
      s = await act('journey', confirmation(s));
      assert.equal(s.stage, 'result'); assert.equal(s.result.status, 'confirmed');
      assert.equal(s.result.source, 'fixture'); assert.equal(s.result.supplierConfirmed, false);
      assert.match(s.result.reference, /^FIXTURE-/); assert.equal(s.canSubmit, false);
      assert.deepEqual(s.result.verification, { verified: true, source: 'fixture', restaurantId: TOCK_DELTA_ID,
        sessionId: s.id, attemptId: 'fixture-attempt-01' });
      assert.equal(reserves, 1); assert.equal(records, 1);
      assert.equal(await adapter.sessions.get(s.id).page.evaluate(() => window.fixtureSubmissions), 1);
      await assert.rejects(act('journey', { type: 'submit' }), /already_attempted/);
      await remove('journey');
    });
    await t.test('owner, stale view, exact review token and current terms are enforced', async () => {
      let s = await review('consent');
      await assert.rejects(adapter.action(s.id, 'attacker', confirmation(s)), /session_expired/);
      await assert.rejects(act('consent', { ...confirmation(s), revision: s.revision - 1 }), /stale_view/);
      for (const patch of [{ confirm: false }, { terms: false }, { termsVersion: 'old' }, { reviewToken: 'forged' }]) {
        s = adapter.current('consent');
        await assert.rejects(act('consent', { ...confirmation(s), ...patch }), /confirmation_required/);
      }
      const exposed = adapter.current('consent'); exposed.guest.email = 'changed@example.invalid';
      assert.equal(adapter.current('consent').guest.email, guest.email);
      await adapter.sessions.get(s.id).page.locator('#terms').evaluate(n => { n.textContent = 'Changed terms'; });
      s = adapter.current('consent');
      await assert.rejects(act('consent', confirmation(s)), /stale_terms/);
      assert.equal(reserves, 1);
      await remove('consent');
    });
    await t.test('input errors do not execute supplier actions; back invalidates review', async () => {
      let s = await create('input');
      await assert.rejects(act('input', { type: 'search', date: '2030-02-30', party: 2 }), /invalid_search/);
      await act('input', { type: 'search', date: '2030-10-20', party: 2 });
      await assert.rejects(act('input', { type: 'select', slotId: "'] script" }), /invalid_slot/);
      await act('input', { type: 'select', slotId: 'fixture-dinner' });
      await assert.rejects(act('input', { type: 'guest', guest: { ...guest, card: 'never accepted' } }), /invalid_guest/);
      s = await act('input', { type: 'guest', guest }); const token = s.reviewToken;
      await act('input', { type: 'back', target: 'guest' });
      assert.equal(adapter.current('input').canSubmit, false);
      s = await act('input', { type: 'guest', guest }); assert.notEqual(s.reviewToken, token);
      await remove('input');
    });
    await t.test('unknown and payment outcomes cannot become supplier confirmation', async () => {
      for (const [owner, outcome, expected] of [['payment', 'payment_required', 'payment_required'], ['bad', 'success-like', 'unknown']]) {
        let s = await review(owner);
        await adapter.sessions.get(s.id).page.evaluate(value => { window.fixtureOutcome = value; }, outcome);
        s = await act(owner, confirmation(s));
        assert.equal(s.result.status, expected); assert.equal(s.result.supplierConfirmed, false);
        assert.equal(s.canSubmit, false); assert.equal(s.result.reference, undefined);
        await remove(owner);
      }
    });
    await t.test('concurrent submit is serialized and unknown survives resume after journal timeout', async () => {
      let release;
      reserveHook = () => new Promise(resolve => { release = resolve; });
      const s = await review('timeout');
      adapter.timeoutMs = 100;
      const first = act('timeout', confirmation(s));
      await assert.rejects(act('timeout', confirmation(s)), /busy/);
      const result = await first;
      assert.equal(result.result.status, 'unknown'); assert.equal(result.canSubmit, false);
      assert.equal(adapter.current('timeout').result.status, 'unknown');
      release(); await new Promise(resolve => setTimeout(resolve, 20));
      assert.equal(await adapter.sessions.get(s.id).page.evaluate(() => window.fixtureSubmissions || 0), 0);
      await assert.rejects(act('timeout', { type: 'submit' }), /already_attempted/);
      await remove('timeout'); reserveHook = async () => { reserves++; }; adapter.timeoutMs = 10000;
    });
    await t.test('lost persistence after simulated dispatch does not expose a confirmed or retryable view', async () => {
      recordHook = async () => { throw Error('disk unavailable'); };
      let s = await review('persist'); s = await act('persist', confirmation(s));
      assert.equal(s.result.status, 'unknown'); assert.equal(adapter.current('persist').canSubmit, false);
      assert.equal(await adapter.sessions.get(s.id).page.evaluate(() => window.fixtureSubmissions), 1);
      await remove('persist'); recordHook = async () => { records++; };
    });
    await t.test('network sink sees no GET, POST, navigation or websocket traffic', async () => {
      let received = 0;
      const server = http.createServer((req, res) => { received++; res.end('must not arrive'); });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const s = await create('network'), page = adapter.sessions.get(s.id).page;
        const target = `http://127.0.0.1:${server.address().port}/hold`;
        await page.evaluate(async url => {
          await Promise.all(['GET', 'POST'].map(method => fetch(url, { method }).catch(() => null)));
          try { const ws = new WebSocket(url.replace('http:', 'ws:')); ws.onerror = () => {}; } catch {}
        }, target);
        await page.goto(target, { timeout: 1000 }).catch(() => {});
        assert.equal(received, 0);
        assert.ok(adapter.current('network').blockedRequests >= 1);
        await remove('network');
      } finally { await new Promise(resolve => server.close(resolve)); }
    });
    await t.test('TTL and session capacity are enforced without refreshing expiry on reads', async () => {
      const sessions = await Promise.all(['a', 'b', 'c', 'd'].map(create));
      await assert.rejects(create('e'), /capacity/);
      await assert.rejects(create('a'), /session_exists/);
      now += 600001;
      assert.throws(() => adapter.current('a'), /session_expired/);
      await adapter.expire(); assert.equal(adapter.sessions.size, 0);
      assert.ok(sessions.every(s => !adapter.sessions.has(s.id)));
      await create('a'); await remove('a');
    });
  } finally { await adapter.close(); }
});
