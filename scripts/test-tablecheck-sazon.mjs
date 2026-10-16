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

test('Experience Book now group order is preserved separately from pax count', () => {
  const { session_ref, ...payload } = sazonSearchPayload(query, ref);
  assert.deepEqual(payload, { ...fixture.query,
    orders: [{ is_group_order: true, qty: 1, menu_item_id: SAZON.menuId }] });
  // The saved actual query used catalog flags, which native Book now overrides.
  // Preserve that historical mistake; do not relabel its response as native evidence.
  assert.notDeepEqual(payload.orders, fixture.query.orders);
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

// Explicitly SYNTHETIC source-contract cases. These are not observed provider
// successes or availability evidence. Every transport is an in-memory function.
function syntheticLifecycle({ denyPhase, failPhase, changeReceipt, refuseRecord = false } = {}) {
  let sequence = 0;
  const calls = [], grants = [], records = [];
  const now = Date.parse('2026-10-16T12:00:00Z');
  const startAt = '2026-10-19T10:00:00Z';
  const orders = [{ menu_item_id: SAZON.menuId, qty: 1, is_group_order: true }];
  const cart = { id: 'synthetic-cart', access_token: 'synthetic-capability',
    expires_at: new Date(now + 300000).toISOString(), start_at: startAt, orders,
    payment_transaction_type: 'none', show_payment_form: false, booking_fee_amt: null };
  const reservation = { id: 'synthetic-booking', slug: 'synthetic-own-code',
    shop_id: SAZON.shopId, shop_slug: SAZON.slug, start_at: startAt,
    num_people_adult: 2, num_people_senior: 0, num_people_child: 0, num_people_baby: 0,
    service_category_id: null, orders, customer_status: 'accepted', iou_payable: false, iou_status: null };
  const adapter = new TablecheckSazon({ mode: 'fixture', now: () => now,
    fetchImpl: async url => ({ status: 200, url, text: async () => url === SAZON.url ? sourceHtml
      : JSON.stringify({ availability_grid: { data: [{ a: true, t: startAt, sc: null, exp: SAZON.menuId }] } }) }),
    reserveSubmission: async intent => {
      grants.push(intent);
      return { sendAllowed: intent.phase !== denyPhase, attempt: { ...intent, ...intent.details,
        attemptId: `synthetic-attempt-${++sequence}`, idempotencyKey: `synthetic-key-${sequence}` } };
    },
    recordResult: async session => {
      records.push(clone(session));
      return { status: refuseRecord ? 'unknown' : session.result.status };
    },
    mutationTransport: async request => {
      calls.push(clone(request));
      if (request.phase === failPhase) throw Error('synthetic ambiguous transport failure');
      if (request.phase === 'cart' || request.phase === 'cart_update') return { status: 200,
        data: { availability: { type: 'success' }, is_request_enabled: false, cart: clone(cart) } };
      if (request.phase === 'booking') return { status: 200, data: { reservation: clone(reservation) } };
      if (request.phase === 'readback') {
        const saved = clone(reservation); changeReceipt?.(saved);
        return { status: 200, data: { reservation: saved } };
      }
      throw Error('unexpected synthetic transport');
    },
  });
  async function readyForCart() {
    let view = await adapter.create('owner', SAZON.restaurantId);
    view = await adapter.action(view.id, 'owner', { type: 'search', ...query, revision: view.revision });
    view = await adapter.action(view.id, 'owner', { type: 'select', slotId: view.availabilityEvidence.slots[0].id, revision: view.revision });
    return adapter.action(view.id, 'owner', { type: 'review', revision: view.revision });
  }
  const approve = (view, type) => ({ type, revision: view.revision, confirm: true, terms: true,
    reviewToken: view.reviewToken, reviewFingerprint: view.reviewFingerprint, termsVersion: view.terms.version });
  async function readyForSubmit() {
    let view = await readyForCart();
    view = await adapter.action(view.id, 'owner', approve(view, 'cart'));
    view = await adapter.action(view.id, 'owner', { type: 'fill', revision: view.revision,
      fields: { firstname: 'Synthetic', lastname: 'Guest', email: 'guest@example.invalid', phone: '+46700000000' } });
    return adapter.action(view.id, 'owner', { type: 'review', revision: view.revision });
  }
  return { adapter, calls, grants, records, readyForCart, readyForSubmit, approve };
}

test('synthetic contract: separate grants and own raw readback are required', async () => {
  const h = syntheticLifecycle();
  const view = await h.readyForSubmit();
  const result = await h.adapter.action(view.id, 'owner', h.approve(view, 'submit'));
  assert.equal(result.mode, 'fixture');
  assert.equal(result.result.status, 'confirmed');
  assert.equal(result.result.verification.source, 'fixture');
  assert.deepEqual(h.grants.map(g => g.phase), ['cart', 'cart_update', 'booking']);
  assert.deepEqual(h.calls.map(c => c.phase), ['cart', 'cart_update', 'booking', 'readback']);
  assert.deepEqual(h.calls[0].body.orders, [{ is_group_order: true, qty: 1, menu_item_id: SAZON.menuId }]);
  assert.equal(h.calls[0].body.customer.email, '');
  assert.equal(h.calls[1].body.customer.email, 'guest@example.invalid');
  assert.equal(h.calls[2].body.allow_provider_marketing, false);
  assert.match(h.calls[3].url, /reservations\/synthetic-own-code\?/);
  assert.equal(h.calls[3].url, 'https://production-booking.tablecheck.com/v2/reservations/synthetic-own-code?email=guest%40example.invalid&phone=%2B46700000000');
  assert.equal(new URL(h.calls[3].url).searchParams.get('email'), 'guest@example.invalid');
  assert.equal(new URL(h.calls[3].url).searchParams.get('phone'), '+46700000000');
  const publicText = JSON.stringify(result);
  assert.ok(!publicText.includes('synthetic-capability') && !publicText.includes('synthetic-cart'));
  const storedText = JSON.stringify(h.grants);
  assert.ok(!storedText.includes('synthetic-capability') && !storedText.includes('guest@example.invalid'));
  await h.adapter.close();
});

test('synthetic contract: denied update grant cannot reach checkout or readback', async () => {
  const h = syntheticLifecycle({ denyPhase: 'cart_update' });
  const view = await h.readyForSubmit();
  await assert.rejects(h.adapter.action(view.id, 'owner', h.approve(view, 'submit')), /attempt_binding/);
  assert.deepEqual(h.calls.map(c => c.phase), ['cart']);
  await assert.rejects(h.adapter.action(view.id, 'owner', h.approve(view, 'submit')), /already_attempted/);
  await h.adapter.close();
  const finalDenied = syntheticLifecycle({ denyPhase: 'booking' });
  const finalView = await finalDenied.readyForSubmit();
  await assert.rejects(finalDenied.adapter.action(finalView.id, 'owner', finalDenied.approve(finalView, 'submit')), /attempt_binding/);
  assert.deepEqual(finalDenied.calls.map(c => c.phase), ['cart', 'cart_update']);
  await finalDenied.adapter.close();
  const noConsent = syntheticLifecycle();
  const cartView = await noConsent.readyForCart();
  await assert.rejects(noConsent.adapter.action(cartView.id, 'owner', { ...noConsent.approve(cartView, 'cart'), confirm: false }), /confirmation_required/);
  assert.equal(noConsent.grants.length, 0);
  assert.equal(noConsent.calls.length, 0);
  await noConsent.adapter.close();
});

test('synthetic contract: ambiguous checkout is consumed without receipt read or retry', async () => {
  const h = syntheticLifecycle({ failPhase: 'booking' });
  const view = await h.readyForSubmit();
  const result = await h.adapter.action(view.id, 'owner', h.approve(view, 'submit'));
  assert.equal(result.result.status, 'unknown');
  assert.deepEqual(h.calls.map(c => c.phase), ['cart', 'cart_update', 'booking']);
  await assert.rejects(h.adapter.action(view.id, 'owner', h.approve(result, 'submit')), /already_attempted/);
  await h.adapter.close();
});

test('synthetic contract: raw extra orders, wrong category/status and journal rejection cannot confirm', async () => {
  for (const changeReceipt of [r => r.orders.push({ menu_item_id: 'unknown', qty: 1, is_group_order: true }),
    r => { r.orders[0].qty = 2; }, r => { r.service_category_id = 'other'; },
    r => { r.shop_id = 'other'; }, r => { r.customer_status = 'waiting'; },
    r => { r.num_people_baby = 1; }, r => { r.id = 'different-booking'; }]) {
    const h = syntheticLifecycle({ changeReceipt });
    const view = await h.readyForSubmit();
    const result = await h.adapter.action(view.id, 'owner', h.approve(view, 'submit'));
    assert.equal(result.result.status, 'unknown');
    await h.adapter.close();
  }
  const h = syntheticLifecycle({ refuseRecord: true });
  const view = await h.readyForSubmit();
  const result = await h.adapter.action(view.id, 'owner', h.approve(view, 'submit'));
  assert.equal(result.result.status, 'unknown');
  await h.adapter.close();
});

test('synthetic contract: pending and IOU remain distinct from confirmation', async () => {
  for (const [status, expected] of [['pending', 'pending'], ['request', 'pending'], ['iou_auth', 'payment_required']]) {
    const h = syntheticLifecycle({ changeReceipt: r => { r.customer_status = status; } });
    const view = await h.readyForSubmit();
    const result = await h.adapter.action(view.id, 'owner', h.approve(view, 'submit'));
    assert.equal(result.result.status, expected);
    await h.adapter.close();
  }
});
