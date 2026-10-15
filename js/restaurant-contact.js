import { external200ContactHref } from './external200-booking.js?v=188';
import { getBookingCopy } from './booking-copy.js?v=188';
// Issues69/103/106, reviewed operator evidence 2026-10-16. This binding is independent
// of mutable catalog email/website fields; no inferred provider or instant slots.
const contacts = Object.freeze({
  'curated-TYO-den': Object.freeze({
    type: 'phone', value: '+81364555433',
    source: 'https://www.jimbochoden.com/en/reserve/',
  }),
  'curated-STT-club-55': Object.freeze({
    type: 'phone', value: '+33494555555',
    source: 'https://www.club55.fr/en/contact.html',
  }),
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
// Contact links open the user's client only on their click. Velvet sends no
// message/call, collects no guest data and infers no reservation success.
export function restaurantContactPanel(id, language = 'en') {
  const contact = resolveReviewedRestaurantContact(id);
  if (!contact) return null;
  const copy = getBookingCopy(language);
  const href = external200ContactHref(contact);
  if (contact.type === 'phone') {
    const isDen = id === 'curated-TYO-den';
    const notes = isDen
      ? [copy.denDirectPhone, copy.denCallWindow, copy.denCancellation, copy.manualPaymentUnknown]
      : [copy.manualPhoneNotice, copy.club55PhoneOnly, copy.requestUnknownPolicy, copy.manualPaymentUnknown];
    return `<div class="restaurant-contact-status" data-booking-status="manual_phone" role="status">${notes.map(note => `<p>${esc(note)}</p>`).join('')}<a class="btn btn-gold btn-block" href="${esc(href)}">${esc(copy.manualPhone)}</a><p>${esc(contact.value)}</p><p><a class="restaurant-official-book" href="${esc(contact.source)}" target="_blank" rel="noopener noreferrer">${esc(copy.closedSource)}</a></p></div>`;
  }
  return `<div class="restaurant-contact-status" data-booking-status="manual_email" role="status"><p>${esc(copy.requestNotice)}</p><p>${esc(copy.requestUnknownPolicy)}</p><p>${esc(copy.manualPaymentUnknown)}</p><a class="btn btn-gold btn-block" href="${esc(href)}">${esc(copy.manualEmail)}</a><p><a class="restaurant-official-book" href="${esc(contact.source)}" target="_blank" rel="noopener noreferrer">${esc(copy.closedSource)}</a></p></div>`;
}
