import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { TheForkPlaywright, THEFORK_RESTAURANT as restaurantId } from '../api/providers/thefork-playwright.mjs';

let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });
const html = await fs.readFile(new URL('./fixtures/thefork-playwright.html', import.meta.url), 'utf8');
const contexts = new Set();
after(async () => { await Promise.all([...contexts].map(c => c.close())); });

async function factory() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: false });
  contexts.add(context);
  await context.route('**/*', route => route.abort());
  await context.routeWebSocket('**/*', ws => ws.close());
  const page = await context.newPage();
  await page.setContent(html);
  return {
    page,
    async search({ date, party }) {
      await page.locator('#date').fill(date); await page.locator('#party').fill(String(party));
      await page.locator('#search').click(); return page.evaluate(() => fixture.slots);
    },
    async select() { await page.locator('#slot').click(); },
    async guest(guest) {
      for (const key of ['firstname', 'lastname', 'email', 'phone', 'comment']) await page.locator('#' + key).fill(guest[key] || '');
      await page.locator('#review').click(); return { version: 'fixture-v1', text: 'TEST ONLY. No booking or charge.' };
    },
    async back(target) { await page.evaluate(target => show(target), target); },
    async submit() { await page.locator('#submit').click(); return page.evaluate(() => fixture.result); },
    async close() { contexts.delete(context); await context.close(); }
  };
}
const guest = { firstname: 'Fixture', lastname: 'Guest', email: 'fixture@example.invalid', phone: '+46000000000' };
async function review(adapter, owner = 'owner') {
  let s = await adapter.create(owner, restaurantId);
  s = await adapter.action(s.id, owner, { revision: s.revision, type: 'search', date: '2026-12-20', party: 2 });
  s = await adapter.action(s.id, owner, { revision: s.revision, type: 'select', slotId: s.availability.slots[0].id });
  return adapter.action(s.id, owner, { revision: s.revision, type: 'guest', guest });
}
const submit = s => ({ type: 'submit', revision: s.revision, confirm: true, terms: true,
  termsVersion: s.terms.version, reviewToken: s.reviewToken, idempotencyKey: 'fixture-attempt-0001' });

test('production rejects fixture injection and unverified supplier creation without opening a browser', async () => {
  assert.throws(() => new TheForkPlaywright({ fixtureDriverFactory: factory }), /fixture_in_live/);
  const live = new TheForkPlaywright();
  await assert.rejects(live.create('owner', restaurantId), /provider_contract_unverified/);
  await assert.rejects(live.create('owner', 'https://evil.example/'), /unsupported_restaurant/);
});

test('Chromium fixture completes journey only after bound consent, never supplier confirmation', async () => {
  const order = [];
  const adapter = new TheForkPlaywright({ mode: 'fixture', fixtureDriverFactory: factory,
    reserveSubmission: async attempt => { assert.equal(attempt.mode, 'fixture'); order.push('reserve'); },
    recordResult: async (_, result) => { assert.equal(result.supplierVerified, false); order.push('record'); } });
  try {
    let s = await review(adapter);
    assert.equal(s.canSubmit, true); assert.equal(s.mode, 'fixture');
    assert.equal(s.availability.source, 'fixture');
    assert.throws(() => adapter.current(s.id, 'other'), /session_expired/);
    for (const patch of [{ confirm: false }, { terms: false }, { reviewToken: 'forged' }, { termsVersion: 'old' }])
      await assert.rejects(adapter.action(s.id, 'owner', { ...submit(s), ...patch }), /confirmation_required/);
    await assert.rejects(adapter.action(s.id, 'owner', { ...submit(s), revision: 0 }), /stale_view/);
    s = await adapter.action(s.id, 'owner', submit(s));
    assert.equal(s.result.status, 'sandbox_confirmed'); assert.equal(s.result.supplierVerified, false);
    assert.equal(s.canSubmit, false); assert.deepEqual(order, ['reserve', 'record']);
    await assert.rejects(adapter.action(s.id, 'owner', { type: 'submit', revision: s.revision }), /already_attempted/);
    assert.equal(adapter.current(s.id, 'owner').result.status, 'sandbox_confirmed');
  } finally { await adapter.close(); }
});

test('uncertain submission stays unknown and cannot retry; concurrent submit is rejected', async () => {
  let release, calls = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const adapter = new TheForkPlaywright({ mode: 'fixture', fixtureDriverFactory: async () => {
    const d = await factory(); d.submit = async () => { calls++; await gate; throw new Error('transport interrupted'); }; return d;
  }, reserveSubmission: async () => {}, recordResult: async () => {} });
  try {
    const s = await review(adapter);
    const first = adapter.action(s.id, 'owner', submit(s));
    await assert.rejects(adapter.action(s.id, 'owner', submit(s)), /busy/);
    assert.equal(adapter.current(s.id, 'owner').canSubmit, false);
    release(); const result = await first;
    assert.equal(result.result.status, 'unknown'); assert.equal(calls, 1);
    await assert.rejects(adapter.action(s.id, 'owner', { ...submit(s), revision: result.revision }), /already_attempted/);
  } finally { release(); await adapter.close(); }
});

test('journal reservation failure cannot dispatch or reopen submission', async () => {
  let calls = 0;
  const adapter = new TheForkPlaywright({ mode: 'fixture', fixtureDriverFactory: async () => {
    const d = await factory(); d.submit = async () => { calls++; }; return d;
  }, reserveSubmission: async () => { throw new Error('journal unavailable'); }, recordResult: async () => {} });
  try {
    const s = await review(adapter);
    await assert.rejects(adapter.action(s.id, 'owner', submit(s)), /journal unavailable/);
    assert.equal(calls, 0); assert.equal(adapter.current(s.id, 'owner').result.status, 'unknown');
    assert.equal(adapter.current(s.id, 'owner').canSubmit, false);
    await assert.rejects(adapter.action(s.id, 'owner', submit(s)), /already_attempted/);
  } finally { await adapter.close(); }
});

test('editing invalidates old consent; slot/date validation and expiry fail closed', async () => {
  let now = 0;
  const adapter = new TheForkPlaywright({ mode: 'fixture', fixtureDriverFactory: factory, clock: () => now, ttl: 100 });
  try {
    let s = await adapter.create('owner', restaurantId);
    await assert.rejects(adapter.action(s.id, 'owner', { type: 'search', revision: 0, date: '2026-02-31', party: 2 }), /invalid_selection/);
    s = await adapter.action(s.id, 'owner', { type: 'search', revision: 0, date: '2026-12-20', party: 2 });
    await assert.rejects(adapter.action(s.id, 'owner', { type: 'select', revision: s.revision, slotId: 'invented' }), /invalid_slot/);
    s = await adapter.action(s.id, 'owner', { type: 'select', revision: s.revision, slotId: s.availability.slots[0].id });
    s = await adapter.action(s.id, 'owner', { type: 'guest', revision: s.revision, guest });
    const oldToken = s.reviewToken;
    s = await adapter.action(s.id, 'owner', { type: 'back', revision: s.revision, target: 'guest' });
    assert.equal(s.reviewToken, null);
    s = await adapter.action(s.id, 'owner', { type: 'guest', revision: s.revision, guest: { ...guest, firstname: 'Changed' } });
    assert.notEqual(s.reviewToken, oldToken);
    now = 101; assert.throws(() => adapter.current(s.id, 'owner'), /session_expired/);
    await adapter.expire();
  } finally { await adapter.close(); }
});

test('pending creation enforces ownership/capacity and returned snapshots cannot alter approval', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const adapter = new TheForkPlaywright({ mode: 'fixture', capacity: 1, fixtureDriverFactory: async () => { await gate; return factory(); } });
  try {
    const first = adapter.create('owner', restaurantId);
    // create() awaits expiry before recording the pending owner.
    await new Promise(resolve => setImmediate(resolve));
    await assert.rejects(adapter.create('owner', restaurantId), /session_exists/);
    await assert.rejects(adapter.create('other', restaurantId), /capacity/);
    release(); const s = await first;
    s.mode = 'live'; s.result = { status: 'confirmed' }; s.canSubmit = true;
    const current = adapter.current(s.id, 'owner');
    assert.equal(current.mode, 'fixture'); assert.equal(current.result, null); assert.equal(current.canSubmit, false);
  } finally { release(); await adapter.close(); }
});

test('missing durable hooks prevent dispatch and result persistence failure is unknown', async () => {
  const adapter = new TheForkPlaywright({ mode: 'fixture', fixtureDriverFactory: factory });
  try {
    const s = await review(adapter);
    await assert.rejects(adapter.action(s.id, 'owner', submit(s)), /durable_hooks_required/);
  } finally { await adapter.close(); }
  const failed = new TheForkPlaywright({ mode: 'fixture', fixtureDriverFactory: factory,
    reserveSubmission: async () => {}, recordResult: async () => { throw new Error('disk unavailable'); } });
  try {
    const s = await review(failed);
    const result = await failed.action(s.id, 'owner', submit(s));
    assert.equal(result.result.status, 'unknown'); assert.equal(result.canSubmit, false);
  } finally { await failed.close(); }
});
