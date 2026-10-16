import { createHash } from 'node:crypto';
import { createBookingResultVerifier } from './booking-result.mjs';

// Backend-only contract: the caller captures BOTH the intercepted transaction
// and its subsequent main-frame document. Never accept these objects from HTTP
// clients, persist raw receipts/capability URLs, or navigate to a guessed URL.
const unknown = reason => ({ status: 'unknown', reason });
const empty = value => value == null || value === false;
const linksEmpty = value => value == null || (Array.isArray(value) && value.length === 0);
const phone = value => (typeof value === 'string' ? value : Number.isSafeInteger(value) && value > 0 ? String(value) : '')
  .replace(/\D/g, '').replace(/^0046/, '46').replace(/^0/, '46');
const present = value => typeof value === 'string' && value.trim().length > 0;
const reference = value => (typeof value === 'number' || typeof value === 'string')
  && /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value)) ? String(value) : null;
const lines = text => typeof text === 'string' && text.length <= 64_000
  ? text.replace(/\r/g, '').split('\n').map(line => line.trim().replace(/[\t \u00a0]+/g, ' ')).filter(Boolean) : [];

// This is a candidate for integration, NOT evidence of a completed Noema flow.
// Official initial widget: Lunch 35204/type2, no card or mandatory products.
export const NOEMA_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-noema', name: 'Noema',
  hash: '41276418cbba56f9c561ec99032fe9fc', mealid: 35204, mealType: 2,
});

// Provider's exact visible name uses an ASCII apostrophe. Bar/type0 is excluded.
export const CICCIOS_DINING_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-ciccios', name: "Ciccio's",
  hash: '6efc74a27b57165fbfb16acbebf7d248', mealid: 2379, mealType: 3, maxParty: 7,
});

// Activation also requires native Velvet review before provider contact Next:
// Riche disables the account feature, so that button can submit directly.
export const RICHE_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-riche', name: 'Riche',
  hash: '4a8d2f702a18092521b0b031fbfb4d4a', mealid: 7180, mealType: 2, maxParty: 8,
});

// Contact Next is final: reuse the native review and phone read used by Riche.
// Provider Lunch permits 1–10; initial Velvet scope is deliberately capped at 2.
export const STUREHOF_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-sturehof', name: 'Sturehof',
  hash: '07415d5b4d24177e713964f3bc75eeaf', mealid: 3913, mealType: 2, maxParty: 2,
});

// Source-backed guest/account-choice route reaches the provider's own review.
// Lunch is unpaid; dinner's card requirement and all special meals are excluded.
export const BEIRUT_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-beirut-cafe', name: 'Beirut Café',
  hash: 'ca902bc03574cc4643a6f071e93e2a98', mealid: 30471, mealType: 2, maxParty: 2,
});

export const BALZAC_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-balzac', name: 'Brasserie Balzac',
  hash: 'a0dd019e24669fadaaa6486567307f61', mealid: 354, mealType: 2, maxParty: 2,
});

export const KOMMENDOREN_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-kommendoren', name: 'Kommendören',
  hash: '4dcf4bbddfb1d7c4f3f0d2d5186d4f00', mealid: 3501, mealType: 2, maxParty: 2,
});

export const ASTRID_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-brasserie-astrid', name: 'Brasserie Astrid',
  hash: 'e3a1940c68c7fcb34cb950162eeaaaef', mealid: 55508, mealType: 2, maxParty: 2,
});

export const VAU_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-vau-de-ville', name: 'Vau De Ville',
  hash: '1994e39a706405442f6b37293d883d0b', mealid: 22476, mealType: 2, maxParty: 2,
});

// Reviewed native ordinary booking despite provider type0; never a generic opt-in.
export const DAGMAR_LUNCH_RECEIPT_POLICY = Object.freeze({
  restaurantId: 'curated-STO-villa-dagmar', name: 'Villa Dagmar',
  hash: 'a7eea669cf574253557648c3db0db765', mealid: 63588, mealType: 0, maxParty: 2,
  type0Contract: 'villa-dagmar-lunch:63588:v1',
});

export function createBokabordReceiptVerifier(configuration) {
  const policy = Object.freeze({ maxParty: 8, ...configuration });
  const reviewedType0 = Object.entries(DAGMAR_LUNCH_RECEIPT_POLICY)
    .every(([key, value]) => policy[key] === value);
  if (!present(policy.restaurantId) || !present(policy.name) || !/^[a-f0-9]{20,64}$/.test(policy.hash)
    || !Number.isSafeInteger(policy.mealid) || policy.mealid <= 0 || (![2, 3].includes(policy.mealType) && !reviewedType0)
    || (policy.type0Contract !== undefined && !reviewedType0)
    || !Number.isSafeInteger(policy.maxParty) || policy.maxParty < 1 || policy.maxParty > 8) {
    throw new TypeError('reviewed_ordinary_meal_policy_required');
  }
  const verifyBound = createBookingResultVerifier({ provider: 'BokaBord',
    policySource: 'bokabord:bound-completion-document:sv:v1',
    statusRules: [{ value: 'bound_completion_document', outcome: 'confirmed' }],
  });

  function approvalDigest(approval) {
    if (!approval || approval.hash !== policy.hash || approval.mealid !== policy.mealid || approval.terms !== true
      || !/^\d{4}-\d{2}-\d{2}$/.test(approval.date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(approval.time || '')
      || !Number.isSafeInteger(approval.party) || approval.party < 1 || approval.party > policy.maxParty
      || !['firstname', 'lastname', 'email', 'phone'].every(key => present(approval[key]))
      || !/^\d{7,15}$/.test(phone(approval.phone))
      || (approval.comment !== undefined && typeof approval.comment !== 'string')) return null;
    const date = new Date(approval.date + 'T12:00:00Z');
    if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== approval.date) return null;
    return createHash('sha256').update(JSON.stringify([policy.restaurantId, approval.hash, approval.mealid,
      approval.date, approval.time, approval.party, approval.firstname, approval.lastname, approval.email,
      phone(approval.phone), approval.comment || '', approval.terms])).digest('hex');
  }

  function verify(attempt, approval, observation) {
    const digest = approvalDigest(approval);
    if (!digest || attempt?.detailsDigest !== digest || attempt.restaurantId !== policy.restaurantId) return unknown('approval_binding_mismatch');
    const b = observation?.data?.booking, request = observation?.request, receipt = observation?.receipt;
    if (observation?.httpOk !== true || observation.data?.success !== true || !b
      || request?.method !== 'POST' || request.url !== 'https://app.bokabord.se/reservation/api/booking/saveBooking') return unknown('transaction_not_verified');
    const q = request.payload;
    if (!q || q.hash !== approval.hash || Number(q.mealid) !== approval.mealid || q.date !== approval.date
      || q.time !== approval.time || Number(q.amount) !== approval.party
      || !['firstname', 'lastname', 'email'].every(key => q[key] === approval[key])
      || phone(q.phone) !== phone(approval.phone) || String(q.comment || '') !== (approval.comment || '')
      || q.terms?.general !== true || q.terms.restaurant !== false || q.terms.bokabord !== false
      || q.waitlist !== false || !Array.isArray(q.products) || q.products.length
      || !empty(q.giftcard) || !linksEmpty(q.linked_meals) || !empty(q.is_temp_booking) || !empty(q.bookingid)) return unknown('request_approval_mismatch');
    // Numeric1 is only a candidate gate, never sufficient confirmation evidence.
    // Other/unknown states stay unknown even if a document contains success copy.
    if (b.status !== 1 || b.mealid !== policy.mealid || ![policy.mealType, String(policy.mealType)].includes(b.meal?.type)
      || b.waitlist !== 0 || b.require_noshow !== false || !Array.isArray(b.products) || b.products.length
      || (b.meal?.bullets != null && (typeof b.meal.bullets !== 'object' || Array.isArray(b.meal.bullets)))
      || !empty(b.meal?.bullets?.cc) || !empty(b.is_temp_booking) || !empty(b.giftcard)
      || !empty(b.meal?.must_pay_directly) || !empty(b.meal?.mandatory_products)
      || !linksEmpty(b.linked_meals) || !empty(b.group_booking) || !empty(b.parent_order)) return unknown('unsupported_receipt_state');
    if (b.date !== approval.date || b.time !== approval.time || b.amount !== approval.party
      || !['firstname', 'lastname', 'email'].every(key => b[key] === approval[key])
      || phone(b.phone) !== phone(approval.phone)) return unknown('receipt_details_mismatch');
    const id = reference(b.id);
    if (!id || !present(b.short_code) || b.short_code.length > 128) return unknown('receipt_reference_missing');
    // Require a fresh successful main-frame GET following this exact response.
    const clock = [attempt.dispatchedAt, observation.respondedAt, receipt?.navigatedAt, receipt?.capturedAt];
    if (!clock.every(value => Number.isSafeInteger(value) && value > 0)
      || clock.some((value, index) => index > 0 && value < clock[index - 1]) || clock[3] - clock[0] > 90_000
      || receipt?.mainFrame !== true || receipt.method !== 'GET' || receipt.httpOk !== true) return unknown('fresh_document_not_verified');
    if (!Number.isSafeInteger(receipt.navigationId) || receipt.navigationId < 1
      || receipt.documentNavigationId !== receipt.navigationId || receipt.documentUrl !== receipt.url) return unknown('document_capture_mismatch');
    let url;
    try { url = new URL(receipt.url); } catch { return unknown('receipt_url_mismatch'); }
    if (url.origin !== 'https://app.bokabord.se' || url.pathname !== '/reservation/booking/'
      || url.username || url.password || url.hash || [...url.searchParams].length !== 2
      || url.searchParams.getAll('code').length !== 1 || url.searchParams.get('code') !== b.short_code
      || url.searchParams.get('new') !== '1') return unknown('receipt_url_mismatch');
    const text = lines(receipt.text);
    // Anchored prefix, NOT a substring search through user comments or hidden DOM.
    if (text[0] !== 'Tack för din bokning.' || text[1] !== 'Du är nu klar och bekräftelse har skickats via epost.'
      || text[2] !== policy.name || !new RegExp('^' + approval.party + ' pers\\. \\(.+\\)$').test(text[3] || '')) return unknown('completion_document_not_verified');
    const labels = text.map((line, index) => line === 'Bokningsreferens' ? index : -1).filter(index => index >= 0);
    if (labels.length !== 1 || text[labels[0] + 1] !== '# ' + id || text[labels[0] + 2] !== 'Gästinformation'
      || text.some(line => /^(?:Bokningen (?:är|har) avbok|This reservation has been cancelled)/i.test(line))) return unknown('document_reference_mismatch');
    return verifyBound(attempt, { ...observation, success: true, supplierStatus: 'bound_completion_document', reference: id });
  }
  return Object.freeze({ approvalDigest, verify });
}
