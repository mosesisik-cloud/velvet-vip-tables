import { createHash } from 'node:crypto';
import { createBookingResultVerifier } from './booking-result.mjs';

// Narrow observed policy; not a universal Bokabord status enumeration.
// Evidence: docs/bokabord-confirmation-evidence.md. No provider traffic here.
export const ZINK_CONFIRMATION_POLICY = Object.freeze({
  restaurantId: 'curated-STO-zink-italian-cuisine', restid: 1359, mealid: 9778,
  mealType: 3, hash: 'e9d3e6917bc7f05c0df1ae157d9aed5b',
  source: 'reviewed:zink-authorized-confirmation-2026-10-15:v1',
});
const unknown = reason => ({ status: 'unknown', reason });
const phone = value => (typeof value === 'string' ? value
  : typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? String(value) : '')
  .replace(/\D/g, '').replace(/^0046/, '46').replace(/^0/, '46');
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const verify = createBookingResultVerifier({ provider: 'BokaBord',
  policySource: ZINK_CONFIRMATION_POLICY.source,
  statusRules: [{ value: 1, outcome: 'confirmed' }],
});

// Bind the exact server-approved selection, identity, contacts and consent.
// Never persist this object or return it to a different owner.
export function bokabordApprovalDigest(approval) {
  if (!approval || approval.hash !== ZINK_CONFIRMATION_POLICY.hash
    || approval.mealid !== ZINK_CONFIRMATION_POLICY.mealid || approval.terms !== true
    || !/^\d{4}-\d{2}-\d{2}$/.test(approval.date || '')
    || !/^\d{2}:\d{2}$/.test(approval.time || '')
    || !Number.isSafeInteger(approval.party) || approval.party < 1
    || !['firstname', 'lastname', 'email', 'phone'].every(k => nonempty(approval[k]))
    || !/^\d{7,15}$/.test(phone(approval.phone))
    || (approval.comment !== undefined && typeof approval.comment !== 'string')) return null;
  return createHash('sha256').update(JSON.stringify([
    approval.hash, approval.mealid, approval.date, approval.time, approval.party,
    approval.firstname, approval.lastname, approval.email, phone(approval.phone),
    approval.comment || '', approval.terms,
  ])).digest('hex');
}

/**
 * Backend-only: attempt and approval must come from the authenticated, reserved
 * server attempt; observation must come from its intercepted supplier response.
 * observation has httpOk/source/provider and independent attempt-binding fields,
 * plus data={success,booking}. Client JSON must never be supplied as evidence.
 * This helper grants no dispatch permission and performs no submission/retry.
 */
export function verifyZinkBookingConfirmation(attempt, approval, observation) {
  const digest = bokabordApprovalDigest(approval);
  if (!digest || attempt?.detailsDigest !== digest) return unknown('approval_binding_mismatch');
  if (attempt.restaurantId !== ZINK_CONFIRMATION_POLICY.restaurantId) return unknown('unreviewed_restaurant');
  if (observation?.httpOk !== true || observation.data?.success !== true) return unknown('supplier_response_not_verified');
  const b = observation.data.booking;
  if (!b || b.status !== 1 || b.restid !== ZINK_CONFIRMATION_POLICY.restid
    || b.mealid !== ZINK_CONFIRMATION_POLICY.mealid || b.meal?.type !== ZINK_CONFIRMATION_POLICY.mealType) {
    return unknown('unreviewed_supplier_state');
  }
  // A provider's `confirmed` field was 0 in the actual completed booking.
  // It is deliberately NOT interpreted as a reservation outcome.
  if (b.waitlist !== 0 || b.require_noshow !== false || b.meal?.bullets?.cc
    || !Array.isArray(b.products) || b.products.length || b.is_temp_booking
    || b.giftcard || b.linked_meals?.length || b.group_booking || b.parent_order) {
    return unknown('unsupported_booking_requirements');
  }
  if (b.date !== approval.date || b.time !== approval.time || b.amount !== approval.party
    || b.firstname !== approval.firstname || b.lastname !== approval.lastname
    || b.email !== approval.email || phone(b.phone) !== phone(approval.phone)) {
    return unknown('supplier_details_mismatch');
  }
  const id = b.id;
  if (!(typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
    && !(typeof id === 'string' && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)))) {
    return unknown('supplier_reference_missing');
  }
  return verify(attempt, { ...observation, success: true, supplierStatus: b.status, reference: id });
}
