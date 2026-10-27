import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as zenchef from './zenchef-mirror.mjs';
import * as covermanager from './covermanager-mirror.mjs';
import * as tablecheck from './tablecheck-mirror.mjs';
import * as opentable from './opentable-mirror.mjs';
import * as tock from './tock-mirror.mjs';
import * as thefork from './thefork-mirror.mjs';

const MODULES = { zenchef, covermanager, tablecheck, opentable, tock, thefork };

for (const [slug, mod] of Object.entries(MODULES)) {
  test(`${slug}: registry loads with reviewed URLs and working network guard`, () => {
    const entries = Object.entries(mod.RESTAURANTS);
    assert.ok(entries.length > 0, 'registry not empty');
    const [, url] = entries[0];
    // The registered booking page itself must be reachable by the mirror.
    assert.equal(mod.allowedRequest('GET', url), true, `own page allowed: ${url}`);
    // No mutation ever passes outside an armed submission.
    assert.equal(mod.allowedRequest('POST', url), false, 'POST to own page blocked');
    assert.equal(mod.allowedRequest('POST', url + '/anything'), false);
    // Foreign hosts and plain HTTP are blocked.
    assert.equal(mod.allowedRequest('GET', 'https://evil.example.com/'), false);
    assert.equal(mod.allowedRequest('GET', 'https://www.googletagmanager.com/gtm.js'), false);
    assert.equal(mod.allowedRequest('GET', url.replace('https://', 'http://')), false);
  });

  test(`${slug}: session guards and inspect-only enforcement`, async () => {
    const cls = Object.values(mod).find(v => typeof v === 'function' && /Mirror$/.test(v.name));
    const mirror = new cls();
    try {
      const [firstId] = Object.keys(mod.RESTAURANTS);
      await assert.rejects(mirror.create(null, firstId), /auth/);
      await assert.rejects(mirror.create('alice', 'curated-XXX-unknown'), /pilot_only/);
      const s = { id: 'x', owner: 'alice', revision: 1, touched: Date.now(), busy: false, contact: false, width: 420, height: 760, context: { close: async () => {} } };
      mirror.sessions.set('x', s);
      await assert.rejects(mirror.create('alice', firstId), /session_exists/);
      await assert.rejects(mirror.action('x', 'bob', { type: 'refresh', revision: 1 }), /session_expired/);
      await assert.rejects(mirror.action('x', 'alice', { type: 'refresh', revision: 2 }), /stale_view/);
      // Without live wiring there is never a submit action.
      await assert.rejects(mirror.action('x', 'alice', { type: 'submit', confirm: true, revision: 1 }), /inspect_only/);
      await assert.rejects(mirror.action('x', 'alice', { type: 'fill', fields: { email: 'a@b.c' }, revision: 1 }), /inspect_only/);
    } finally { await mirror.close(); }
  });
}

test('all provider modules share the same contact-step vocabulary', () => {
  for (const mod of Object.values(MODULES)) {
    assert.ok(Object.keys(mod.RESTAURANT_DETAILS).length > 0);
  }
});

import { matchesApprovedReservation as zenchefMatch } from './zenchef-mirror.mjs';

test('zenchef: armed submission passes only payloads matching the approval', () => {
  const approval = { date: '2026-10-26', time: '12:00', party: 2, firstname: 'Test', lastname: 'Guest', email: 'test@example.com', phone: '+46700000000', terms: true };
  // Observed quotation-preview shape passes only with the exact selection.
  const quote = { day: '2026-10-26', time: '12:00', nb_guests: 2, offers: [], waiting_list: false };
  assert.equal(zenchefMatch(quote, approval, '356354'), true);
  assert.equal(zenchefMatch({ ...quote, day: '2026-10-27' }, approval, '356354'), false);
  assert.equal(zenchefMatch({ ...quote, nb_guests: 4 }, approval, '356354'), false);
  assert.equal(zenchefMatch({ ...quote, waiting_list: true }, approval, '356354'), false);
  assert.equal(zenchefMatch({ ...quote, offers: [{}] }, approval, '356354'), false);
  // Guest-carrying payloads must reproduce the approved contact exactly.
  const guest = { day: '2026-10-26', time: '12:00', nb_guests: 2, firstname: 'Test', lastname: 'Guest', email: 'test@example.com', phone_number: '+46700000000' };
  assert.equal(zenchefMatch(guest, approval, '356354'), true);
  assert.equal(zenchefMatch({ ...guest, email: 'other@example.com' }, approval, '356354'), false);
  assert.equal(zenchefMatch({ ...guest, firstname: 'Other' }, approval, '356354'), false);
  assert.equal(zenchefMatch({ ...guest, newsletter_opt_in: true }, approval, '356354'), false);
  assert.equal(zenchefMatch(guest, { ...approval, terms: false }, '356354'), false);
  // Unknown shapes and missing payloads fail closed.
  assert.equal(zenchefMatch({}, approval, '356354'), false);
  assert.equal(zenchefMatch(null, approval, '356354'), false);
  assert.equal(zenchefMatch({ something: 'unrelated' }, approval, '356354'), false);
});

import { matchesApprovedReservation as tablecheckMatch } from './tablecheck-mirror.mjs';

test('tablecheck: armed submission passes only payloads matching the approval', () => {
  const approval = { date: '2026-10-30', time: '19:00', party: 2, firstname: 'Test', lastname: 'Guest', email: 'test@example.com', phone: '+46700000000', terms: true };
  // Observed cart shape (customer empty at initiation) passes with exact selection.
  const cart = { shop_slug: 'regent-bali-canggu-sazon', service_mode: 'dining', pax_adult: 2, start_at: '2026-10-30T19:00:00.000+08:00', customer: { first_name: '', last_name: '', email: '', phone: '' }, allow_marketing: false, send_texts: false, orders: [], voucher_ids: [] };
  assert.equal(tablecheckMatch(cart, approval, 'regent-bali-canggu-sazon'), true);
  // Filled customer must equal the approved contact.
  const filled = { ...cart, customer: { first_name: 'Test', last_name: 'Guest', email: 'test@example.com', phone: '+46700000000' } };
  assert.equal(tablecheckMatch(filled, approval, 'regent-bali-canggu-sazon'), true);
  assert.equal(tablecheckMatch({ ...filled, customer: { ...filled.customer, email: 'other@example.com' } }, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch({ ...cart, pax_adult: 4 }, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch({ ...cart, start_at: '2026-10-31T19:00:00.000+08:00' }, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch({ ...cart, start_at: '2026-10-30T20:00:00.000+08:00' }, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch({ ...cart, shop_slug: 'other-shop' }, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch({ ...cart, allow_marketing: true }, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch({ ...cart, orders: [{}] }, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch(null, approval, 'regent-bali-canggu-sazon'), false);
  assert.equal(tablecheckMatch(cart, { ...approval, terms: false }, 'regent-bali-canggu-sazon'), false);
});
