import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBookingResultVerifier, bookingAttemptSnapshot, publicBookingResult, classifyBokabordResult } from '../api/booking-result.mjs';
import { BokabordMirror } from '../api/bokabord-mirror.mjs';

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

test('Bokabord only classifies the observed payment state; no guessed confirmation enum', () => {
  for (const status of [undefined, null, true, false, '', '0', 1, 2, 7, 'confirmed', {}, []]) {
    assert.equal(classifyBokabordResult({ success: true, booking: { id: 123, status } }).status, 'unknown');
  }
  assert.equal(classifyBokabordResult({ success: true, booking: { id: 123, status: 0 } }).status, 'payment_required');
  assert.equal(classifyBokabordResult({ success: false }).status, 'rejected');
  assert.equal(classifyBokabordResult({ success: true, booking: { id: null, status: 0 } }).status, 'unknown');
  for (const id of ['ABC', '1e3', '1.5', ' 1', 0, -1, true, {}, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(classifyBokabordResult({ success: true, booking: { id, status: 0 } }).status, 'unknown');
  }
});

// Exercise the actual production mirror response listener and current(), offline.
// No real browser, supplier requests or booking records are used by this double.
async function mirrorFixture(options = {}) {
  const events = new Map();
  const page = { on: (name, cb) => events.set(name, cb), setDefaultTimeout() {}, goto: async () => {},
    locator: () => ({ first: () => ({ waitFor: async () => {} }) }) };
  const context = { route: async () => {}, newPage: async () => page, on() {}, close: async () => {} };
  const mirror = new BokabordMirror({ prepare: true, live: true, reserveSubmission: async () => {}, ...options });
  mirror.browser = async () => ({ newContext: async () => context });
  mirror.settle = async () => {};
  mirror.snapshot = async s => (s.lastSnapshot = { id: s.id, revision: s.revision, canSubmit: true, result: null });
  await mirror.create('test-owner', 'curated-STO-zink-italian-cuisine');
  return { mirror, page, events, session: [...mirror.sessions.values()][0] };
}
const endpoint = 'https://app.bokabord.se/reservation/api/booking/saveBooking';
test('production response listener persists conservative result, strips raw booking and exposes latest current state', async () => {
  const persisted = [];
  const f = await mirrorFixture({ recordResult: async s => persisted.push(structuredClone(s.result)) });
  try {
    f.session.submitted = true;
    for (const status of [undefined, 'unrecognized', 2, 0]) {
      f.events.get('response')({ url: () => endpoint, ok: () => true, json: async () => ({ success: true, booking: { id: 123, status, email: 'private@example.test' } }) });
      await f.session.resultPromise;
      const current = f.mirror.current('test-owner');
      assert.equal(current.canSubmit, false);
      assert.equal(current.result.status, status === 0 ? 'payment_required' : 'unknown');
      assert.equal(JSON.stringify(current).includes('private@example.test'), false);
    }
    assert.equal(persisted.length, 4);
    assert.equal(f.mirror.current('other-owner').error, 'session_expired');
  } finally { await f.mirror.close(); }
});
test('production submit timeout returns unknown/current locked, blocks repeat and preserves revision', async () => {
  const f = await mirrorFixture();
  const approval = { date: '2026-10-20', time: '19:00', party: 2, terms: true };
  try {
    f.session.lastSnapshot.details = approval;
    f.mirror.bookingDetails = async () => approval;
    f.page.getByRole = () => ({ isVisible: async () => true, click: async () => {
      f.session.submitted = true; f.session.result = { status: 'unknown' }; throw new Error('timeout after dispatch');
    } });
    f.page.waitForResponse = async () => null;
    const submit = { type: 'submit', revision: 0, confirm: true, terms: true };
    await assert.rejects(f.mirror.action(f.session.id, 'test-owner', submit), /timeout after dispatch/);
    assert.equal(f.mirror.current('test-owner').canSubmit, false);
    assert.equal(f.mirror.current('test-owner').result.status, 'unknown');
    assert.equal(f.mirror.current('test-owner').revision, 0);
    await assert.rejects(f.mirror.action(f.session.id, 'test-owner', submit), /already_attempted/);
  } finally { await f.mirror.close(); }
});
test('unreadable supplier response or failed result persistence stays unknown and cannot resubmit', async () => {
  const f = await mirrorFixture({ recordResult: async () => { throw new Error('storage unavailable'); } });
  try {
    f.session.submitted = true;
    for (const json of [async () => { throw new Error('invalid JSON'); }, async () => ({ success: true, booking: { id: 123, status: 0 } })]) {
      f.events.get('response')({ url: () => endpoint, ok: () => true, json });
      await f.session.resultPromise;
      assert.equal(f.mirror.current('test-owner').result.status, 'unknown');
      assert.equal(f.mirror.current('test-owner').canSubmit, false);
    }
  } finally { await f.mirror.close(); }
});
test('HTTP failure is unknown even when its JSON looks like a supplier acceptance', async () => {
  const f = await mirrorFixture();
  try {
    f.session.submitted = true;
    f.events.get('response')({ url: () => endpoint, ok: () => false, json: async () => ({ success: true, booking: { id: 123, status: 0 } }) });
    await f.session.resultPromise;
    assert.equal(f.mirror.current('test-owner').result.status, 'unknown');
  } finally { await f.mirror.close(); }
});
