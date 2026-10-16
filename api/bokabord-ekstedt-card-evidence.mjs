// Static-source evidence classifier ONLY. No network, authorizer, booking
// verifier or activation flag. Inputs must be captured by the backend, never
// supplied by a browser client. Pending here does not prove a reservation exists.
export const EKSTEDT_CARD_SCOPE = Object.freeze({
  restaurantId: 'curated-STO-ekstedt',
  hash: 'cf1ffc30f54f7f3b6158c4be497182ed',
  mealid: 448, mealType: 3, party: 2,
});

const unknown = reason => ({ status: 'unknown', reason, activationAllowed: false });
const present = value => typeof value === 'string' && value.trim().length > 0;

// `binding` is an immutable server-owned observation identity, not permission
// to submit. Its upstream approval/contact/attempt checks remain mandatory.
// Deliberately no confirmed result, receipt proof, intent ID or client secret.
export function classifyEkstedtCardEvidence({ scope, binding, observation } = {}) {
  if (!scope || Object.entries(EKSTEDT_CARD_SCOPE).some(([key, value]) => scope[key] !== value))
    return unknown('outside_exact_scope');
  if (!binding || !present(binding.attemptId) || !present(binding.detailsDigest)
    || !Number.isSafeInteger(binding.bookingId) || binding.bookingId <= 0)
    return unknown('missing_server_binding');
  if (!observation || observation.attemptId !== binding.attemptId
    || observation.detailsDigest !== binding.detailsDigest)
    return unknown('observation_binding_mismatch');
  const { request, response } = observation;
  if (request?.method !== 'POST' || request.body?.booking !== binding.bookingId
    || request.body?.hash !== EKSTEDT_CARD_SCOPE.hash)
    return unknown('request_binding_mismatch');
  // These features have no reviewed end-to-end contract for this scope.
  if (request.body.giftcard || request.body.invitation || request.body.is_temp_booking
    || request.body.purchase_id || observation.savedCardReuse === true)
    return unknown('unsupported_card_variant');
  if (request.path === '/reservation/api/booking/stripeHandlePayment')
    return unknown('independent_booking_confirmation_missing');
  if (request.path !== '/reservation/api/booking/stripeCreateIntent')
    return unknown('unsupported_observation');
  if (!response || response.error || response.errors)
    return unknown('provider_error_or_missing_response');
  // Native code uses a loose else branch, including redirects. We intentionally
  // cannot turn absent requires_action, a 2xx or an HTTP wrapper into success.
  if (response.requires_action !== true)
    return unknown('server_completion_contract_missing');
  if (typeof response.total !== 'number' || !Number.isFinite(response.total)
    || response.total < 0 || !present(response.payment_intent_client_secret))
    return unknown('incomplete_intent_contract');
  return {
    status: 'pending', reason: 'native_card_action_required',
    cardAction: response.total > 0 ? 'payment' : 'setup',
    activationAllowed: false,
  };
}
