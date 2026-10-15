import assert from 'node:assert/strict';
import { restaurantStatusKey, publicationConfirmed, canStartPayment, loginReturnTo } from '../js/ux-booking.js';

// Failed delivery, an ambiguous provider outcome and self-reported confirmation
// must never be presented as a verified restaurant reservation.
assert.equal(restaurantStatusKey('local-pending'), 'draft');
assert.equal(restaurantStatusKey('unknown'), 'unknown');
assert.equal(restaurantStatusKey('guest_reported'), 'reported');
for (const status of ['confirmed', 'provider_confirmed']) assert.equal(restaurantStatusKey(status), 'confirmed');
assert.equal(restaurantStatusKey('payment_required'), 'paymentRequired');
assert.equal(restaurantStatusKey('future-provider-status'), 'processing');

const table = { id: 'RQ-1', status: 'open', openSeats: 2 };
assert.equal(publicationConfirmed(null, table.id), false);
assert.equal(publicationConfirmed({ error: 'unavailable' }, table.id), false);
assert.equal(publicationConfirmed(table, table.id), false, 'local table is not server publication evidence');
assert.equal(publicationConfirmed({ table }, 'RQ-other'), false);
assert.equal(publicationConfirmed({ table: { ...table, status: 'closed' } }, table.id), false);
assert.equal(publicationConfirmed({ table: { ...table, openSeats: 0 } }, table.id), false);
assert.equal(publicationConfirmed({ table }, table.id), true);

assert.equal(canStartPayment(null), false);
assert.equal(canStartPayment({ paid: true }), false);
assert.equal(canStartPayment({ paid: false, paidPending: true }), false);
assert.equal(canStartPayment({ paid: false, paidPending: false }), true);

for (const route of ['#/table/RQ-1', '#/pay/RQ-1', '#/book-site/club?date=2026-10-15&go=1']) assert.equal(loginReturnTo(route), route);
for (const route of ['https://example.com', '//example.com', '#/login', '#/auth/callback', null]) assert.equal(loginReturnTo(route), '');

// All booking status labels and explanations must be localized, never raw keys.
globalThis.localStorage = { getItem: () => 'sv' };
const { uxT } = await import('../js/ux-copy.js');
for (const lang of ['sv', 'en', 'es', 'fr']) {
  for (const state of ['draft', 'requested', 'received', 'confirmed', 'reported', 'declined', 'unknown', 'paymentRequired', 'processing']) {
    assert.notEqual(uxT(state, lang), state);
    assert.notEqual(uxT(state + 'Hint', lang), state + 'Hint');
  }
}
console.log('Booking UX state, publication, payment, return-route and localization tests passed.');
