import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { SAZON, TablecheckSazon, sazonPolicy, sazonGrid, sazonSearchPayload,
  sazonRequestAllowed } from '../api/providers/tablecheck-sazon.mjs';
import { PlaywrightRuntime } from '../api/playwright-runtime.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures/tablecheck-sazon-source.json', import.meta.url)));
const html = context => `<input data-preloaded="context" value='${JSON.stringify(context).replaceAll('&', '&amp;').replaceAll("'", '&#39;')}' />`;
const sourceHtml = html(fixture.context);
const query = { date: '2026-10-19', party: 2 };
const ref = '00000000-0000-4000-8000-000000000001';
const gridUrl = 'https://production-booking.tablecheck.com/v2/booking/availability_v5/grid';
const clone = value => structuredClone(value);
function harness() {
  let time = 1000000;
  const calls = [];
  const adapter = new TablecheckSazon({ now: () => time, fetchImpl: async (url, init) => {
    calls.push({ url, ...init });
    assert.equal(init.redirect, 'error');
    return { status: 200, url, text: async () => url === SAZON.url ? sourceHtml : JSON.stringify(fixture.grid) };
  } });
  return { adapter, calls, advance: ms => { time += ms; } };
}

test('public source binds exact venue, ordinary Dinner and unpriced/no-payment policy', () => {
  const policy = sazonPolicy(sourceHtml);
  assert.equal(policy.shopId, SAZON.shopId);
  assert.equal(policy.menu.id, SAZON.menuId);
  assert.equal(policy.menu.price, null);
  assert.equal(policy.menu.priceStatus, 'not_provided');
  assert.equal(policy.reservationTimeout, 300);
  assert.equal(policy.guestRequirements.phone, 'required');
  const changed = clone(fixture.context);
  changed['/booking/booking_pages'].get.shop.enable_payments = true;
  assert.throws(() => sazonPolicy(html(changed)), /policy_changed/);
  changed['/booking/booking_pages'].get.shop.slug = 'other-venue';
  assert.throws(() => sazonPolicy(html(changed)), /venue_binding/);
});

test('native query equals saved one-date request except private correlation UUID', () => {
  const { session_ref, ...payload } = sazonSearchPayload(query, ref);
  assert.deepEqual(payload, fixture.query);
  assert.equal(session_ref, ref);
  for (const q of [{ date: '2026-02-30', party: 2 }, { ...query, party: 3 }]) {
    assert.throws(() => sazonSearchPayload(q, ref), /search_fields/);
  }
});

test('request boundary rejects cart/checkout/capability and payload scope expansion', () => {
  const payload = sazonSearchPayload(query, ref);
  assert.equal(sazonRequestAllowed('POST', gridUrl, payload, query, ref), true);
  for (const [method, url] of [
    ['POST', 'https://production-booking.tablecheck.com/v2/booking/cart'],
    ['PUT', 'https://production-booking.tablecheck.com/v2/booking/cart/id'],
    ['PUT', 'https://production-booking.tablecheck.com/v2/booking/checkout/id'],
    ['PUT', 'https://production-booking.tablecheck.com/v2/booking/checkout_status/id'],
    ['GET', 'https://production-booking.tablecheck.com/v2/reservations/code'],
    ['DELETE', 'https://production-booking.tablecheck.com/v2/booking/cart/id'],
    ['POST', gridUrl + '?shop_id=other'], ['POST', gridUrl.replace('https:', 'http:')],
  ]) assert.equal(sazonRequestAllowed(method, url, payload, query, ref), false);
  for (const altered of [{ ...payload, shop_id: 'other' }, { ...payload, customer: {} },
    { ...payload, amend_reservation_id: 'code' }, { ...payload, session_ref: ref + 'x' },
    { ...payload, orders: [...payload.orders, { menu_item_id: 'unknown', qty: 1 }] }]) {
    assert.equal(sazonRequestAllowed('POST', gridUrl, altered, query, ref), false);
  }
});

test('actual negative provider response cannot be promoted to available or confirmed', () => {
  const evidence = sazonGrid(fixture.grid, query, sazonPolicy(sourceHtml), 123);
  assert.equal(evidence.status, 'invalid_menu_items');
  assert.deepEqual(evidence.slots, []);
  assert.deepEqual(evidence.rejectedMenuIds, [SAZON.menuId]);
  // Malformed/adversarial data, not positive supplier fixtures.
  for (const raw of [{}, { availability_grid: { data: [{ a: true, t: '2026-10-20T10:00:00Z' }] } },
    { availability_grid: { data: [{ a: true, t: '2026-10-19T10:00:00Z', exp: 'unknown-menu' }] } },
    { availability_grid: { data: [{ a: true, t: '2026-10-19T10:00:00Z', sc: 'unknown-category' }] } }]) {
    assert.throws(() => sazonGrid(raw, query, sazonPolicy(sourceHtml), 123));
  }
  assert.deepEqual(sazonGrid({ availability_grid: { data: [{ a: null }, { a: 'true' }] } },
    query, sazonPolicy(sourceHtml), 123).slots, []);
});

test('adapter lifecycle replays real rejection, rejects selection and all mutations without transport', async () => {
  const { adapter, calls } = harness();
  const initial = await adapter.create('owner', SAZON.restaurantId);
  await assert.rejects(adapter.create('owner', SAZON.restaurantId), /session_exists/);
  await assert.rejects(adapter.current(initial.id, 'other'), /session_expired/);
  const result = await adapter.action(initial.id, 'owner', { type: 'search', revision: initial.revision, ...query });
  assert.equal(result.state, 'availability_observed');
  assert.equal(result.availabilityEvidence.status, 'invalid_menu_items');
  assert.equal(result.canSubmit, false);
  assert.equal(result.canHold, false);
  assert.equal(result.result, null);
  assert.equal(calls.length, 3);
  for (const type of ['hold', 'submit', 'fill', 'click', 'expireCart']) {
    await assert.rejects(adapter.action(initial.id, 'owner', { type, revision: result.revision,
      confirm: true, terms: true, idempotencyKey: 'test' }), /cart_authorization_not_integrated/);
  }
  await assert.rejects(adapter.action(initial.id, 'owner', { type: 'select', revision: result.revision, slotId: 'invented' }), /unverified_slot/);
  await assert.rejects(adapter.action(initial.id, 'owner', { type: 'review', revision: result.revision }), /selection_stale/);
  await assert.rejects(adapter.action(initial.id, 'owner', { type: 'refresh', revision: initial.revision }), /stale_view/);
  assert.equal(calls.length, 3);
  await adapter.remove(initial.id, 'owner');
  await assert.rejects(adapter.current(initial.id, 'owner'), /session_expired/);
  await adapter.close();
});

test('existing runtime mounts preparation as operator-only with no live capability', async () => {
  const { adapter, calls } = harness();
  const entry = { restaurantId: SAZON.restaurantId, adapter, enabled: true, mode: 'inspect',
    current: (id, owner) => adapter.current(id, owner) };
  const runtime = new PlaywrightRuntime({ providers: { tablecheck: entry } });
  await assert.rejects(runtime.create('owner', false, { provider: 'tablecheck', restaurantId: SAZON.restaurantId }), /operator/);
  const snapshot = await runtime.create('owner', true, { provider: 'tablecheck', restaurantId: SAZON.restaurantId });
  assert.equal(snapshot.liveBooking, false);
  assert.equal(runtime.guestProvider('tablecheck', SAZON.restaurantId), false);
  assert.equal(snapshot.canSubmit, false);
  await assert.rejects(runtime.run(snapshot.id, 'owner', true, 'action', { type: 'search', ...query,
    revision: snapshot.revision }), /inspect_only/);
  assert.equal(calls.length, 1);
  await runtime.close();
});

test('session expiry and close prevent stale use', async () => {
  const { adapter, advance } = harness();
  const initial = await adapter.create('owner', SAZON.restaurantId);
  advance(600000);
  await assert.rejects(adapter.current(initial.id, 'owner'), /session_expired/);
  await adapter.close();
  await assert.rejects(adapter.create('owner', SAZON.restaurantId), /closed/);
});
