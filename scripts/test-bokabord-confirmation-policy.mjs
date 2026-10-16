import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bokabordApprovalDigest, verifyZinkBookingConfirmation, ZINK_CONFIRMATION_POLICY as policy } from '../api/bokabord-confirmation-policy.mjs';
import { publicBookingResult } from '../api/booking-result.mjs';

// Synthetic contacts, date and ID. Only structural types and public venue/meal
// identifiers reproduce the privately inspected historical response.
function fixture() {
  const approval = { hash: policy.hash, mealid: policy.mealid, date: '2030-01-15', time: '17:00', party: 1,
    firstname: 'Fixture', lastname: 'Guest', email: 'fixture@example.test', phone: '+46700000000', terms: true };
  const attempt = { provider: 'BokaBord', restaurantId: policy.restaurantId, sessionId: 'fixture-session',
    attemptId: 'server-attempt', idempotencyKey: 'client-key', detailsDigest: bokabordApprovalDigest(approval),
    dispatched: true, mode: 'fixture' };
  const observation = { ...attempt, httpOk: true, source: 'fixture', data: { success: true, booking: {
    id: 123, status: 1, confirmed: 0, restid: policy.restid, mealid: policy.mealid, meal: { type: 3 },
    date: approval.date, time: approval.time, amount: approval.party, firstname: approval.firstname,
    lastname: approval.lastname, email: approval.email, phone: 46700000000,
    waitlist: 0, products: [], require_noshow: false, payinwidget: true, group_booking: false, parent_order: null,
  } } };
  return { approval, attempt, observation };
}
const run = f => verifyZinkBookingConfirmation(f.attempt, f.approval, f.observation);

test('observed Zink shape produces a bound fixture proof, including confirmed=0', () => {
  const f = fixture(), result = run(f);
  assert.equal(result.status, 'confirmed'); assert.equal(result.reference, '123');
  assert.equal(result.verification.source, 'fixture');
  assert.equal(result.verification.attemptId, 'server-attempt');
  assert.equal(result.verification.idempotencyKey, 'client-key');
  assert.deepEqual(publicBookingResult(result), result);
  assert.equal(JSON.stringify(result).includes('fixture@example.test'), false);
});
test('missing, cancelled, payment and unknown statuses are never confirmed', () => {
  for (const status of [undefined, null, false, true, 0, 2, 3, -1, NaN, '1', 'confirmed', {}, []]) {
    const f = fixture(); f.observation.data.booking.status = status;
    assert.equal(run(f).status, 'unknown', String(status));
  }
});
test('venue, meal and supplier type are restricted to the reviewed ordinary Zink scope', () => {
  for (const key of ['restid', 'mealid']) {
    for (const value of [undefined, 0, '1359', 99999]) {
      const f = fixture(); f.observation.data.booking[key] = value; assert.equal(run(f).status, 'unknown');
    }
  }
  for (const type of [undefined, 0, '3', 8, 9, 10]) {
    const f = fixture(); f.observation.data.booking.meal.type = type; assert.equal(run(f).status, 'unknown');
  }
  const f = fixture(); f.attempt.restaurantId = 'other-venue'; assert.equal(run(f).status, 'unknown');
});
test('waiting lists, card guarantees, products, temporary and group bookings remain unverified', () => {
  for (const change of [{ waitlist: 1 }, { waitlist: undefined }, { require_noshow: true }, { require_noshow: undefined },
    { products: [{}] }, { products: undefined }, { is_temp_booking: true }, { giftcard: true },
    { linked_meals: [1] }, { group_booking: { group_id: 1 } }, { parent_order: 123 }, { meal: { type: 3, bullets: { cc: true } } }]) {
    const f = fixture(); Object.assign(f.observation.data.booking, change); assert.equal(run(f).status, 'unknown');
  }
});
test('receipt must match every approved guest and selection field', () => {
  for (const key of ['date', 'time', 'amount', 'firstname', 'lastname', 'email', 'phone']) {
    const f = fixture(); f.observation.data.booking[key] = 'different'; assert.equal(run(f).status, 'unknown', key);
  }
  const f = fixture(); f.observation.data.booking.phone = '070-000 00 00'; assert.equal(run(f).status, 'confirmed');
});
test('approval/terms changes cannot reuse the old reserved digest', () => {
  for (const change of [{ terms: false }, { party: 2 }, { time: '18:00' }, { email: 'changed@example.test' },
    { comment: 'changed' }, { hash: 'wrong' }, { mealid: 123 }, { phone: '' }]) {
    const f = fixture(); Object.assign(f.approval, change); assert.equal(run(f).status, 'unknown');
  }
});
test('attempt bindings and source are checked; owner authorization remains upstream', () => {
  for (const key of ['provider', 'restaurantId', 'sessionId', 'attemptId', 'idempotencyKey', 'detailsDigest']) {
    const f = fixture(); f.observation[key] = 'other'; assert.equal(run(f).status, 'unknown', key);
  }
  const f = fixture(); f.attempt.mode = 'live'; assert.equal(run(f).status, 'unknown');
  f.observation.source = 'provider'; assert.equal(run(f).verification.source, 'provider'); // branch test only, no supplier call
  f.attempt.dispatched = false; assert.equal(run(f).status, 'unknown');
});
test('transport failure and malformed IDs never produce confirmation', () => {
  for (const id of [undefined, 0, -1, true, {}, ' 123', '1e3', 'NaN', Number.MAX_SAFE_INTEGER + 1]) {
    const f = fixture(); f.observation.data.booking.id = id; assert.equal(run(f).status, 'unknown');
  }
  const f = fixture(); f.observation.httpOk = false; assert.equal(run(f).status, 'unknown');
  f.observation.httpOk = true; f.observation.data.success = false; assert.equal(run(f).status, 'unknown');
});
