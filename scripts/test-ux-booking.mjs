import assert from 'node:assert/strict';
import { restaurantStatusKey, publicationConfirmed, canStartPayment, loginReturnTo, resolveAuthReturn } from '../js/ux-booking.js';

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
for (const route of ['#/not-a-route', '#//example.com', '#/pay-return', '#/account/again', '#/restaurant/', '#/venue/%ZZ', '#/account#auth', '#/account\n', '#/venue\\evil']) assert.equal(loginReturnTo(route), '');
for (const route of ['#/', '#/account', '#/verify', '#/card', '#/favorites', '#/menu/restaurant/zink', '#/restaurant/a%20b?date=2030-10-20&party=4']) assert.equal(loginReturnTo(route), route);

const bridgeReturn = '#/book-site/club?date=2030-10-20&party=4&go=1';
assert.equal(resolveAuthReturn({explicit:bridgeReturn,oauthFrom:'#/account'}), bridgeReturn, 'explicit booking intent wins over OAuth launch page');
assert.equal(resolveAuthReturn({explicit:'https://example.com',oauthFrom:'#/table/RQ-1'}), '#/table/RQ-1', 'invalid explicit target falls through to valid OAuth context');
assert.equal(resolveAuthReturn({explicit:'#/unknown',oauthFrom:'#/pay/RQ-1'}), '#/pay/RQ-1');
assert.equal(resolveAuthReturn({oauthFrom:'#/restaurant/zink?date=2030-10-20&time=19%3A00&party=4'}), '#/restaurant/zink?date=2030-10-20&time=19%3A00&party=4');
assert.equal(resolveAuthReturn({explicit:'#/auth/callback',oauthFrom:'#/pay-return',fallback:'//example.com'}), '#/account');
assert.equal(resolveAuthReturn(), '#/account');
assert.equal(resolveAuthReturn({explicit:'#/account',oauthFrom:bridgeReturn}), '#/account', 'an explicit account destination remains stable');
assert.equal(resolveAuthReturn({explicit:resolveAuthReturn()}), '#/account', 'fallback never cycles through an auth route');
assert.equal(resolveAuthReturn({fallback:'#/verify'}), '#/verify', 'passkey may retain its existing verification fallback');

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

const {joinResponse} = await import('../js/ux-booking.js');
for (const status of [401,403,404,409,500]) assert.ok(joinResponse(status,{table:{id:'t'}},'t').error);
assert.equal(joinResponse(200,{table:{id:'wrong'}},'t').error,'unavailable');
assert.equal(joinResponse(200,{},'t').error,'unavailable');
assert.equal(joinResponse(201,{table:{id:'t'}},'t').table.id,'t');
console.log('PASS join requires matching successful server confirmation; errors cannot become membership.');
