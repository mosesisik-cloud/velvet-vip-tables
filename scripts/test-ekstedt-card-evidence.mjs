import assert from 'node:assert/strict';
import { EKSTEDT_CARD_SCOPE, classifyEkstedtCardEvidence as classify } from '../api/bokabord-ekstedt-card-evidence.mjs';

// Synthetic source-branch replays, NOT captured successful paid bookings.
const fixture = () => ({
  scope: { ...EKSTEDT_CARD_SCOPE },
  binding: { attemptId: 'fixture-attempt', detailsDigest: 'fixture-digest', bookingId: 123 },
  observation: {
    attemptId: 'fixture-attempt', detailsDigest: 'fixture-digest',
    request: { method: 'POST', path: '/reservation/api/booking/stripeCreateIntent',
      body: { booking: 123, hash: EKSTEDT_CARD_SCOPE.hash, invitation: null } },
    response: { requires_action: true, total: 100, payment_intent_client_secret: 'fixture-secret' },
  },
});
let checks = 0;
const unknown = input => { assert.equal(classify(input).status, 'unknown'); checks++; };
for (const total of [0, 100]) {
  const f = fixture(); f.observation.response.total = total;
  const result = classify(f);
  assert.deepEqual(result, { status: 'pending', reason: 'native_card_action_required',
    cardAction: total ? 'payment' : 'setup', activationAllowed: false });
  assert.equal(JSON.stringify(result).includes('fixture-secret'), false);
  // Repeated observations are evidence only: never authorization or confirmation.
  assert.deepEqual(classify(f), result); checks++;
}
for (const key of Object.keys(EKSTEDT_CARD_SCOPE)) {
  const f = fixture(); f.scope[key] = 'different'; unknown(f);
}
for (const party of [1, 3, '2']) { const f = fixture(); f.scope.party = party; unknown(f); }
for (const key of ['attemptId', 'detailsDigest']) {
  const f = fixture(); f.observation[key] = 'other'; unknown(f);
}
for (const mutate of [
  f => { delete f.binding; },
  f => { f.binding.bookingId = '123'; },
  f => { f.observation.request.body.booking = 124; },
  f => { f.observation.request.body.hash = 'other'; },
  f => { f.observation.request.method = 'GET'; },
  f => { f.observation.request.path = '/reservation/api/booking/saveBooking'; },
  f => { f.observation.savedCardReuse = true; },
]) { const f = fixture(); mutate(f); unknown(f); }
for (const key of ['giftcard', 'invitation', 'is_temp_booking', 'purchase_id']) {
  const f = fixture(); f.observation.request.body[key] = 1; unknown(f);
}
for (const total of [undefined, null, '0', -1, Infinity, NaN]) {
  const f = fixture(); f.observation.response.total = total; unknown(f);
}
for (const response of [null, {}, { success: true }, { status: 200 },
  { requires_action: false }, { requires_action: 'true', total: 0 },
  { data: fixture().observation.response },
  { ...fixture().observation.response, error: 'declined' },
  { ...fixture().observation.response, payment_intent_client_secret: '' }]) {
  const f = fixture(); f.observation.response = response; unknown(f);
}
for (const response of [{ success: true }, { status: 1 }, { redirect: '/reservation/booking/' }]) {
  const f = fixture(); f.observation.request.path = '/reservation/api/booking/stripeHandlePayment';
  f.observation.response = response; unknown(f);
}
unknown(undefined);
assert.ok(Object.isFrozen(EKSTEDT_CARD_SCOPE));
console.log(`Ekstedt static card evidence: ${checks} checks passed; no confirmed result or live requests.`);
