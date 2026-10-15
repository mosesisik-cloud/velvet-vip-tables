import { external200ContactHref } from './external200-booking.js?v=190';
import { getBookingCopy } from './booking-copy.js?v=188';
// Issue69, reviewed operator evidence 2026-10-16. This binding is independent
// of mutable catalog email/website fields; no inferred provider or instant slots.
const contacts = Object.freeze({
  'curated-CRV-le-1947-a-cheval-blanc': Object.freeze({
    type: 'email', value: 'le1947.courchevel@chevalblanc.com',
    source: 'https://www.yannick-alleno.com/les-etablissements-du-groupe/cheval-blanc-1947',
  }),
});
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resolveReviewedRestaurantContact(id, candidate) {
  if (!Object.hasOwn(contacts, id)) return null;
  const approved = contacts[id];
  candidate ??= approved;
  if (!candidate || Object.keys(candidate).some(key => !Object.hasOwn(approved, key))
    || Object.entries(approved).some(([key, value]) => candidate[key] !== value)) return null;
  return approved;
}
// A mailto link only opens the user's client on their click. No email is sent by
// Velvet, no guest information collected, no success inferred or record written.
export function restaurantContactPanel(id, language = 'en') {
  const contact = resolveReviewedRestaurantContact(id);
  if (!contact) return null;
  const copy = getBookingCopy(language);
  const href = external200ContactHref(contact);
  return `<div class="restaurant-contact-status" data-booking-status="manual_email" role="status"><p>${esc(copy.requestNotice)}</p><p>${esc(copy.requestUnknownPolicy)}</p><p>${esc(copy.manualPaymentUnknown)}</p><a class="btn btn-gold btn-block" href="${esc(href)}">${esc(copy.manualEmail)}</a><p><a class="restaurant-official-book" href="${esc(contact.source)}" target="_blank" rel="noopener noreferrer">${esc(copy.closedSource)}</a></p></div>`;
}
