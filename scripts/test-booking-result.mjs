import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBookingResultVerifier, bookingAttemptSnapshot, publicBookingResult } from '../api/booking-result.mjs';

// Invented statuses for a local test provider, NOT Bokabord/Zenchef supplier mappings.
const policy = { provider: 'LOCAL-TEST', policySource: 'fixture:result-policy-v1', statusRules: [
  { value: 'ACCEPTED', outcome: 'confirmed' }, { value: 'REQUEST', outcome: 'pending' },
  { value: 'PAY', outcome: 'payment_required' }, { value: 'DECLINED', outcome: 'rejected' },
] };
const verify = createBookingResultVerifier(policy);
const attempt = () => ({ provider: 'LOCAL-TEST', restaurantId: 'test-venue', sessionId: 'test-session',
  attemptId: 'test-attempt', idempotencyKey: 'client-key', detailsDigest: 'test-details-and-terms-digest', mode: 'fixture', dispatched: true });
const response = () => ({ ...attempt(), source: 'fixture', success: true, supplierStatus: 'ACCEPTED', reference: 'TEST-ONLY' });

test('explicit accepted outcome produces UI proof bound to this fixture attempt', () => {
  const result = verify(attempt(), response());
  assert.equal(result.status, 'confirmed');
  assert.equal(result.reference, 'TEST-ONLY');
  assert.deepEqual(result.verification, { verified: true, source: 'fixture', provider: 'LOCAL-TEST',
    restaurantId: 'test-venue', sessionId: 'test-session', attemptId: 'test-attempt', idempotencyKey: 'client-key',
    detailsDigest: 'test-details-and-terms-digest', policySource: 'fixture:result-policy-v1' });
});
test('success and reference cannot turn missing, malformed or unknown status into confirmation', () => {
  for (const supplierStatus of [undefined, null, false, true, {}, [], 0, 1, 2, 7, NaN, Infinity, '', 'new-status']) {
    assert.equal(verify(attempt(), { ...response(), supplierStatus }).status, 'unknown');
  }
});
test('status matching is exact and type-sensitive; unreviewed policy defaults unknown', () => {
  const numeric = createBookingResultVerifier({ ...policy, statusRules: [{ value: 1, outcome: 'confirmed' }] });
  assert.equal(numeric(attempt(), { ...response(), supplierStatus: 1 }).status, 'confirmed');
  assert.equal(numeric(attempt(), { ...response(), supplierStatus: '1' }).status, 'unknown');
  assert.equal(createBookingResultVerifier({ ...policy, statusRules: [] })(attempt(), response()).status, 'unknown');
});
test('request and payment references remain distinct from reservation proof', () => {
  const pending = verify(attempt(), { ...response(), supplierStatus: 'REQUEST' });
  assert.equal(pending.status, 'pending'); assert.equal(pending.reason, 'request_received');
  const payment = verify(attempt(), { ...response(), supplierStatus: 'PAY' });
  assert.equal(payment.status, 'payment_required');
  for (const result of [pending, payment]) assert.equal(result.verification, undefined);
});
test('transport failure is unresolved; only an explicit mapped supplier rejection rejects', () => {
  for (const success of [undefined, false, 1, 'true']) assert.equal(verify(attempt(), { ...response(), success }).status, 'unknown');
  assert.equal(verify(attempt(), { ...response(), supplierStatus: 'DECLINED', reference: undefined }).status, 'rejected');
});
test('other attempt, venue, session, details or provider cannot confirm', () => {
  for (const key of ['provider', 'restaurantId', 'sessionId', 'attemptId', 'idempotencyKey', 'detailsDigest']) {
    assert.equal(verify(attempt(), { ...response(), [key]: 'other' }).status, 'unknown', key);
    assert.equal(verify({ ...attempt(), [key]: '' }, { ...response(), [key]: '' }).status, 'unknown', key);
  }
  assert.equal(verify({ ...attempt(), dispatched: false }, response()).status, 'unknown');
});
test('fixture evidence cannot become a live confirmation, and invalid modes fail closed', () => {
  assert.equal(verify({ ...attempt(), mode: 'live' }, response()).status, 'unknown');
  assert.equal(verify(attempt(), { ...response(), source: 'provider' }).status, 'unknown');
  assert.equal(verify({ ...attempt(), mode: 'live' }, { ...response(), source: 'provider' }).verification.source, 'provider');
  assert.equal(verify({ ...attempt(), mode: 'sandbox' }, response()).status, 'unknown');
});
test('invalid supplier references never verify', () => {
  for (const reference of [undefined, null, true, {}, [], 0, -1, 1.5, '', ' ', ' ref ', 'bad\nref', 'x'.repeat(257)]) {
    assert.equal(verify(attempt(), { ...response(), reference }).status, 'unknown');
  }
  assert.equal(verify(attempt(), { ...response(), reference: 123 }).reference, '123');
});
test('malformed/duplicate policy rejected; later policy mutations cannot change verifier', () => {
  for (const statusRules of [[{ value: null, outcome: 'confirmed' }], [{ value: 'X', outcome: 'success' }],
    [{ value: 1, outcome: 'confirmed' }, { value: 1, outcome: 'pending' }]]) {
    assert.throws(() => createBookingResultVerifier({ ...policy, statusRules }), TypeError);
  }
  const rule = { value: 'A', outcome: 'pending' };
  const isolated = createBookingResultVerifier({ ...policy, statusRules: [rule] });
  rule.outcome = 'confirmed';
  assert.equal(isolated(attempt(), { ...response(), supplierStatus: 'A' }).status, 'pending');
});
test('timeout after dispatch overlays stale canSubmit without new browser work', () => {
  const lastSnapshot = { revision: 3, image: 'same-image', canSubmit: true, result: null };
  const session = { lastSnapshot, submitted: true, result: { status: 'unknown' } };
  assert.deepEqual(bookingAttemptSnapshot(session), { ...lastSnapshot, canSubmit: false, result: { status: 'unknown' } });
  assert.equal(lastSnapshot.canSubmit, true); // helper does not mutate the old render
  delete session.result;
  assert.equal(bookingAttemptSnapshot(session).result.status, 'unknown');
});
test('armed and settled attempts stay locked; overlay is isolated from result mutation', () => {
  const lastSnapshot = { revision: 4, canSubmit: true, result: null };
  assert.equal(bookingAttemptSnapshot({ lastSnapshot, armed: true }).canSubmit, false);
  const result = verify(attempt(), response());
  const snapshot = bookingAttemptSnapshot({ lastSnapshot, result });
  snapshot.result.verification.source = 'tampered';
  assert.equal(result.verification.source, 'fixture');
  assert.equal(snapshot.canSubmit, false);
  assert.equal(bookingAttemptSnapshot({ lastSnapshot }).canSubmit, true);
  assert.equal(bookingAttemptSnapshot({}), null);
});
test('browser-facing recovery never exposes raw supplier booking or private evidence', () => {
  const verified = verify(attempt(), response());
  const raw = { ...verified, booking: { email: 'private@example.test', short_code: 'PRIVATE' }, token: 'PRIVATE',
    verification: { ...verified.verification, rawResponse: { secret: 'PRIVATE' } } };
  assert.deepEqual(publicBookingResult(raw), verified);
  assert.equal(JSON.stringify(bookingAttemptSnapshot({ lastSnapshot: {}, result: raw })).includes('PRIVATE'), false);
  assert.equal(publicBookingResult({ status: 'confirmed', reference: 'ONLY-ID' }).status, 'unknown');
  assert.equal(publicBookingResult({ status: 'already_attempted' }).status, 'unknown');
});
