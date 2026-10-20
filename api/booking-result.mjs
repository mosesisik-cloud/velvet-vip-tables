// Server-side supplier result verification for the normalized Velvet UI contract.
// Only adapter-owned response observations belong here, never client request JSON.
// Transport authorization, durable dispatch guards and persistence remain caller duties.
const OUTCOMES = new Set(['confirmed', 'pending', 'payment_required', 'rejected']);
const text = value => typeof value === 'string' && value.trim() === value
  && value.length > 0 && value.length <= 256 && !/[\u0000-\u001f\u007f]/.test(value);
const statusKey = value => typeof value === 'string' && text(value)
  ? `s:${value}` : typeof value === 'number' && Number.isSafeInteger(value) ? `n:${value}` : null;
const ref = value => text(value) ? value
  : typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? String(value) : null;
const unknown = reason => ({ status: 'unknown', reason });

/**
 * Conservative Bokabord saveBooking contract, inspected 2026-10-16:
 * https://app.bokabord.se/production/app-widget.js?v=6.0.3
 * SHA256 ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5.
 * Exact numeric 0 routes to payment. Numeric 2 is cancelled for ordinary meals.
 * There is no independently verified positive confirmation enum in that source.
 * Do NOT restore "nonzero => confirmed" or guess status 1. Confirmation stays
 * unknown until the owner supplies reviewed supplier acceptance/readback evidence.
 */
export function classifyBokabordResult(data) {
  if (data?.success === false) return { status: 'rejected', reason: 'supplier_rejected' };
  const id = data?.booking?.id;
  const numericId = typeof id === 'number' ? id : typeof id === 'string' && /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
  if (data?.success !== true || !Number.isSafeInteger(numericId) || numericId <= 0) return unknown('supplier_response_not_verified');
  if (data.booking.status === 0) return {
    status: 'payment_required', reason: 'supplier_payment_required', reference: ref(data.booking.id),
  };
  return unknown('supplier_confirmation_not_verified');
}

/**
 * Explicit, type-sensitive mappings only. No default success/nonzero fallback.
 * policySource identifies reviewed supplier evidence, not a booking confirmation.
 * Empty rules intentionally cannot produce confirmed (useful before supplier review).
 */
export function createBookingResultVerifier({ provider, policySource, statusRules = [] }) {
  if (!text(provider) || !text(policySource) || !Array.isArray(statusRules)) {
    throw new TypeError('reviewed_provider_policy_required');
  }
  const rules = new Map();
  for (const rule of statusRules) {
    const key = statusKey(rule?.value);
    if (key === null || rules.has(key) || !OUTCOMES.has(rule.outcome)) {
      throw new TypeError('invalid_or_duplicate_supplier_status');
    }
    rules.set(key, rule.outcome);
  }
  // Snapshot the reviewed configuration; later caller mutation cannot change a rule.
  return function verifyBookingResult(attempt, observation) {
    if (!attempt || !observation || attempt.dispatched !== true) return unknown('dispatch_not_verified');
    if (attempt.provider !== provider || observation.provider !== provider) return unknown('provider_mismatch');
    for (const key of ['restaurantId', 'sessionId', 'attemptId', 'idempotencyKey', 'detailsDigest']) {
      if (!text(attempt[key]) || attempt[key] !== observation[key]) return unknown('attempt_binding_mismatch');
    }
    if (!['live', 'fixture'].includes(attempt.mode)) return unknown('mode_not_verified');
    const source = attempt.mode === 'live' ? 'provider' : 'fixture';
    if (observation.source !== source) return unknown('result_source_mismatch');
    // A transport-success flag alone does not mean reservation acceptance.
    if (observation.success !== true) return unknown('supplier_response_not_verified');
    const outcome = rules.get(statusKey(observation.supplierStatus));
    if (!outcome) return unknown('unrecognized_supplier_status');
    if (outcome === 'rejected') return { status: 'rejected', reason: 'supplier_rejected' };
    const reference = ref(observation.reference);
    if (!reference) return unknown('supplier_reference_missing');
    if (outcome === 'pending') return { status: 'pending', reason: 'request_received', reference };
    if (outcome === 'payment_required') return { status: 'payment_required', reason: 'supplier_payment_required', reference };
    return {
      status: 'confirmed', reference,
      verification: {
        verified: true, source, provider, restaurantId: attempt.restaurantId,
        sessionId: attempt.sessionId, attemptId: attempt.attemptId, idempotencyKey: attempt.idempotencyKey,
        detailsDigest: attempt.detailsDigest, policySource,
      },
    };
  };
}

/**
 * Overlay authoritative in-memory attempt state on the last rendered snapshot.
 * Does not generate pixels, alter revisions or restart provider work. The adapter
 * must call this only after its normal owner/TTL checks. Durable recovery after
 * session expiry belongs to the journal, not this overlay.
 */
export function bookingAttemptSnapshot(session) {
  if (!session?.lastSnapshot) return null;
  const snapshot = { ...session.lastSnapshot };
  if (session.result) snapshot.result = publicBookingResult(session.result);
  else if (session.submitted) snapshot.result = unknown('awaiting_supplier_result');
  if (session.submitted || session.armed || session.result) snapshot.canSubmit = false;
  return snapshot;
}

// A supplier response may contain guest information or private confirmation URLs.
// Never copy the raw booking object into a browser-facing recovery snapshot.
export function publicBookingResult(result) {
  if (!result || ![...OUTCOMES, 'unknown', 'error'].includes(result.status)) return unknown('unrecognized_result');
  const clean = { status: result.status };
  if (text(result.reason)) clean.reason = result.reason;
  if (ref(result.reference)) clean.reference = ref(result.reference);
  const proof = result.verification;
  if (result.status === 'confirmed') {
    if (!clean.reference || proof?.verified !== true || !['provider', 'fixture'].includes(proof.source)
      || !['provider', 'restaurantId', 'sessionId', 'attemptId', 'idempotencyKey', 'detailsDigest', 'policySource'].every(k => text(proof[k]))) {
      return unknown('confirmation_not_verified');
    }
    clean.verification = { verified: true, source: proof.source };
    for (const k of ['provider', 'restaurantId', 'sessionId', 'attemptId', 'idempotencyKey', 'detailsDigest', 'policySource']) clean.verification[k] = proof[k];
    if (proof.provider === 'TableCheck' && proof.restaurantId === 'osm-BAL-sazon'
      && proof.orderEvidence === 'own_booking_raw_readback') clean.verification.orderEvidence=proof.orderEvidence;
    const lunchShift=proof.restaurantId === 'curated-PAR-bofinger' ? 19170 : proof.restaurantId === 'curated-PAR-la-coupole' ? 20148 : proof.restaurantId === 'curated-PAR-terminus-nord' ? 19380 : proof.restaurantId === 'curated-PAR-le-procope' ? 18190 : proof.restaurantId === 'curated-PAR-la-lorraine' ? 16674 : proof.restaurantId === 'curated-PAR-au-pied-de-cochon' ? 29 : proof.restaurantId === 'curated-PAR-le-grand-cafe-capucines' ? 19590 : proof.restaurantId === 'curated-PAR-brasserie-vagenende' ? 63972 : proof.restaurantId === 'curated-PAR-bouillon-julien' ? 12711 : proof.restaurantId === 'curated-PAR-bouillon-racine' ? 93989 : proof.restaurantId === 'curated-PAR-bouillon-republique' ? 528175 : proof.restaurantId === 'curated-PAR-brasserie-rosie' ? 43203 : proof.restaurantId === 'curated-PAR-brasserie-rosie-lou' ? 118503 : proof.restaurantId === 'curated-PAR-brasserie-rosie-jolie' ? 298043 : proof.restaurantId === 'curated-PAR-le-petit-sommelier' ? 37613 : proof.restaurantId === 'curated-PAR-chez-savy' ? 68279 : proof.restaurantId === 'curated-PAR-chez-rene' ? 68277 : proof.restaurantId === 'curated-PAR-le-bistrot-de-paris' ? 68145 : proof.restaurantId === 'curated-PAR-aux-bons-crus' ? 20711 : proof.restaurantId === 'curated-PAR-aux-crus-de-bourgogne' ? 22200 : proof.restaurantId === 'curated-PAR-le-petit-retro' ? 116623 : proof.restaurantId === 'curated-PAR-au-moulin-a-vent' ? 139531 : proof.restaurantId === 'curated-PAR-le-petit-pontoise' ? 9493 : proof.restaurantId === 'curated-PAR-le-florentin' ? 283681 : proof.restaurantId === 'curated-PAR-martha-pizze-amore' ? 159369 : proof.restaurantId === 'curated-PAR-le-cafe-marly' ? 122853 : proof.restaurantId === 'curated-PAR-le-cafe-ruc' ? 32216 : proof.restaurantId === 'curated-PAR-indiana-cafe-bonne-nouvelle' ? 253448 : proof.restaurantId === 'curated-PAR-indiana-cafe-richelieu-drouot' ? 276858 : proof.restaurantId === 'curated-PAR-indiana-cafe-beaugrenelle' ? 281252 : proof.restaurantId === 'curated-PAR-indiana-cafe-tolbiac' ? 243266 : proof.restaurantId === 'curated-PAR-indiana-cafe-montparnasse' ? 314295 : proof.restaurantId === 'curated-PAR-indiana-cafe-republique' ? 274078 : proof.restaurantId === 'curated-PAR-indiana-cafe-bercy-village' ? 245385 : proof.restaurantId === 'curated-PAR-indiana-cafe-denfert-rochereau' ? 278132 : proof.restaurantId === 'curated-PAR-indiana-cafe-les-halles' ? 275998 : proof.restaurantId === 'curated-PAR-indiana-cafe-ternes' ? 276269 : proof.restaurantId === 'curated-PAR-okomusu' ? 87616 : proof.restaurantId === 'curated-PAR-escudella' ? 4974 : proof.restaurantId === 'curated-PAR-comptoir-petits-champs' ? 292 : proof.restaurantId === 'curated-PAR-les-canailles-pigalle' ? 107333 : proof.restaurantId === 'curated-PAR-brasserie-jaja-amsterdam' ? 347295 : proof.restaurantId === 'curated-PAR-bien-eleve' ? 36016 : proof.restaurantId === 'curated-PAR-ardent' ? 82526 : proof.restaurantId === 'curated-PAR-office-paris' ? 12173 : proof.restaurantId === 'curated-PAR-batistou' ? 176469 : proof.restaurantId === 'curated-PAR-becco' ? 177844 : proof.restaurantId === 'curated-PAR-jules-jo' ? 86920 : proof.restaurantId === 'curated-PAR-savannah-cafe' ? 300276 : proof.restaurantId === 'curated-PAR-biche-paris8' ? 149228 : proof.restaurantId === 'curated-PAR-casimir' ? 160340 : proof.restaurantId === 'curated-PAR-cafe-des-musees' ? 7248 : proof.restaurantId === 'curated-PAR-la-plage-parisienne' ? 535548 : proof.restaurantId === 'curated-PAR-zen-restaurant' ? 192088 : null;
    if (proof.provider === 'Zenchef' && lunchShift
      && proof.shiftId === lunchShift && proof.bookingEvidence === 'own_booking_readback') {
      clean.verification.shiftId=lunchShift; clean.verification.bookingEvidence=proof.bookingEvidence;
    }
    if (proof.offerEvidence === 'own_booking_readback' && proof.offerId === 118785 && proof.offerCount === 2
      && typeof proof.offerVersion === 'string' && /^[a-f0-9]{64}$/.test(proof.offerVersion)) {
      Object.assign(clean.verification,{offerId:proof.offerId,offerCount:proof.offerCount,offerVersion:proof.offerVersion,offerEvidence:proof.offerEvidence});
    }
    if (Number.isSafeInteger(proof.roomId) && proof.roomId > 0 && text(proof.roomName)) {
      clean.verification.roomId=proof.roomId; clean.verification.roomName=proof.roomName;
      if (proof.roomEvidence === 'own_booking_readback') clean.verification.roomEvidence=proof.roomEvidence;
    }
  }
  return clean;
}
