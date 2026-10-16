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
    for (const key of ['restaurantId', 'sessionId', 'attemptId', 'detailsDigest']) {
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
        sessionId: attempt.sessionId, attemptId: attempt.attemptId,
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
  if (session.result) snapshot.result = structuredClone(session.result);
  else if (session.submitted) snapshot.result = unknown('awaiting_supplier_result');
  if (session.submitted || session.armed || session.result) snapshot.canSubmit = false;
  return snapshot;
}
