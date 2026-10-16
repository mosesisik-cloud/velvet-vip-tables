import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedRequest, SevenroomsMirror, MirrorError } from './sevenrooms-mirror.mjs';

test('sevenrooms adapter allows only read-only provider and asset traffic', () => {
  // Read-only availability and widget traffic is allowed.
  assert.equal(allowedRequest('GET', 'https://www.sevenrooms.com/reservations/lasponda?venues=lasponda&lang=en'), true);
  assert.equal(allowedRequest('GET', 'https://www.sevenrooms.com/api-yoa/availability/dates?venue=lasponda'), true);
  assert.equal(allowedRequest('GET', 'https://www.sevenrooms.com/api-yoa/availability/widget/range?venue=lasponda'), true);
  assert.equal(allowedRequest('GET', 'https://www.sevenrooms.com/api-yoa/dining/venue_info?venue_url_key=lasponda'), true);
  assert.equal(allowedRequest('HEAD', 'https://www.sevenrooms.com/reservations/plenitude'), true);
  // Static assets from known hosts are GET-only.
  assert.equal(allowedRequest('GET', 'https://cdn.sevenrooms.com/widget/main.js'), true);
  assert.equal(allowedRequest('POST', 'https://cdn.sevenrooms.com/widget/main.js'), false);
  assert.equal(allowedRequest('GET', 'https://js.stripe.com/v3/'), true);
  // Reservation, hold, account and payment mutations always fail closed.
  assert.equal(allowedRequest('POST', 'https://www.sevenrooms.com/api-yoa/reservations/create'), false);
  assert.equal(allowedRequest('POST', 'https://www.sevenrooms.com/api-yoa/availability/hold'), false);
  assert.equal(allowedRequest('POST', 'https://www.sevenrooms.com/api-yoa/dining/venue_info?venue_url_key=lasponda'), false);
  assert.equal(allowedRequest('GET', 'https://www.sevenrooms.com/api-yoa/reservations/create/search/confirm'), false);
  assert.equal(allowedRequest('POST', 'https://www.sevenrooms.com/checkout/payment'), false);
  // Unknown hosts, trackers and plain HTTP are blocked.
  assert.equal(allowedRequest('GET', 'https://www.googletagmanager.com/gtm.js'), false);
  assert.equal(allowedRequest('GET', 'https://o17585.ingest.us.sentry.io/api/'), false);
  assert.equal(allowedRequest('GET', 'https://accounts.google.com/gsi/client'), false);
  assert.equal(allowedRequest('GET', 'http://www.sevenrooms.com/reservations/lasponda'), false);
  assert.equal(allowedRequest('GET', 'https://evil-sevenrooms.com/reservations/lasponda'), false);
  assert.equal(allowedRequest('GET', 'not a url'), false);
});

test('mirror requires a known restaurant and a single session per owner', async () => {
  const mirror = new SevenroomsMirror();
  try {
    await assert.rejects(mirror.create(null, 'curated-AMF-la-sponda'), /auth/);
    await assert.rejects(mirror.create('alice', 'curated-XXX-unknown'), /pilot_only/);
    mirror.sessions.set('one', { owner: 'alice', touched: Date.now(), context: { close: async () => {} } });
    await assert.rejects(mirror.create('alice', 'curated-AMF-la-sponda'), /session_exists/);
  } finally { await mirror.close(); }
});

test('actions are inspection-only and bound to owner and revision', async () => {
  const mirror = new SevenroomsMirror();
  const s = { id: 's1', owner: 'alice', revision: 3, touched: Date.now(), busy: false, contact: false, width: 420, height: 760, context: { close: async () => {} } };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action('s1', 'bob', { type: 'click', x: 1, y: 1, revision: 3 }), /session_expired/);
    await assert.rejects(mirror.action('s1', 'alice', { type: 'click', x: 1, y: 1, revision: 2 }), /stale_view/);
    await assert.rejects(mirror.action('s1', 'alice', { type: 'submit', confirm: true, revision: 3 }), /inspect_only/);
    await assert.rejects(mirror.action('s1', 'alice', { type: 'fill', fields: { email: 'x@example.com' }, revision: 3 }), /inspect_only/);
    await assert.rejects(mirror.action('s1', 'alice', { type: 'click', x: -5, y: 1, revision: 3 }), /coordinates/);
  } finally { await mirror.close(); }
});

test('contact step stops all interaction before any personal data', async () => {
  const mirror = new SevenroomsMirror();
  const s = { id: 's2', owner: 'alice', revision: 1, touched: Date.now(), busy: false, contact: true, width: 420, height: 760, context: { close: async () => {} } };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action('s2', 'alice', { type: 'click', x: 100, y: 100, revision: 1 }), /contact_stop/);
  } finally { await mirror.close(); }
});

test('expired sessions are removed and rejected', async () => {
  const mirror = new SevenroomsMirror();
  let closed = false;
  const s = { id: 's3', owner: 'alice', revision: 1, touched: Date.now() - 11 * 60_000, busy: false, contact: false, context: { close: async () => { closed = true; } } };
  mirror.sessions.set(s.id, s);
  await assert.rejects(mirror.action('s3', 'alice', { type: 'refresh', revision: 1 }), /session_expired/);
  assert.equal(closed, true);
  await mirror.close();
});

import { matchesApprovedReservation } from './sevenrooms-mirror.mjs';

const approval = { date: '2026-10-30', time: '19:30', party: 2, firstname: 'Test', lastname: 'Guest', email: 'test@example.com', phone: '+39089999999', terms: true };
const approvedPayload = () => ({ venueId: 'lasponda', date: '2026-10-30', time: '19:30', party_size: 2, first_name: 'Test', last_name: 'Guest', email: 'test@example.com', phone_number: '+39089999999', reservation_notes: '', newsletter_opt_in: false });

test('submission payload must reproduce the approved booking exactly', () => {
  assert.equal(matchesApprovedReservation(approvedPayload(), approval, 'lasponda'), true);
  // camelCase variant and nested reservationData wrapper are accepted.
  assert.equal(matchesApprovedReservation({ reservationData: { venueId: 'lasponda', date: '2026-10-30', time: '19:30', partySize: 2, firstName: 'Test', lastName: 'Guest', email: 'test@example.com', phoneNumber: '+39089999999' } }, approval, 'lasponda'), true);
  for (const changes of [{ date: '2026-10-31' }, { time: '20:00' }, { party_size: 4 }, { first_name: 'Other' }, { last_name: 'Other' }, { email: 'other@example.com' }, { phone_number: '+39089000000' }, { venueId: 'other-venue' }, { newsletter_opt_in: true }, { sms_opt_in: true }, { gift_card: 'x' }, { upgrades: [{}] }, { reservation_notes: 'surprise' }]) {
    assert.equal(matchesApprovedReservation({ ...approvedPayload(), ...changes }, approval, 'lasponda'), false, JSON.stringify(changes));
  }
  assert.equal(matchesApprovedReservation(approvedPayload(), { ...approval, terms: false }, 'lasponda'), false);
  assert.equal(matchesApprovedReservation(approvedPayload(), { ...approval, phone: '123' }, 'lasponda'), false);
  assert.equal(matchesApprovedReservation(null, approval, 'lasponda'), false);
  assert.equal(matchesApprovedReservation(approvedPayload(), approval, 'plenitude'), false);
});

test('live submission requires contact step, current details and exact revision, and never repeats', async () => {
  const mirror = new SevenroomsMirror({ live: true, reserveSubmission: async () => {} });
  const details = { ...approval };
  mirror.bookingDetails = async () => details;
  mirror.cardRequired = async () => false;
  let clicks = 0;
  const s = { id: 'live1', owner: 'alice', revision: 7, touched: Date.now(), busy: false, contact: true, inFlight: 0, width: 420, height: 760, lastSnapshot: { details }, context: { close: async () => {} }, page: {
    locator: sel => sel === 'body'
      ? { innerText: async () => 'checkout summary' }
      : { first: () => ({ isVisible: async () => false }), filter: () => ({ last: () => ({ click: async () => { clicks++; } }) }), evaluateAll: async () => [] },
    getByText: () => ({ first: () => ({ isVisible: async () => false }) }),
    evaluate: async () => true,
    url: () => 'https://www.sevenrooms.com/booking/dining/widget/lasponda/details',
    title: async () => 'Checkout',
    screenshot: async () => Buffer.from('png'),
    waitForResponse: async () => null,
  } };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action('live1', 'alice', { type: 'submit', revision: 6, confirm: true, terms: true }), /stale_view/);
    await assert.rejects(mirror.action('live1', 'alice', { type: 'submit', revision: 7, confirm: false, terms: true }), /confirmation_required/);
    await assert.rejects(mirror.action('live1', 'alice', { type: 'submit', revision: 7, confirm: true, terms: false }), /confirmation_required/);
    await mirror.action('live1', 'alice', { type: 'submit', revision: 7, confirm: true, terms: true });
    assert.equal(clicks, 1, 'provider confirm button clicked exactly once after arming');
    assert.equal(s.armed, false, 'disarmed after the attempt');
  } finally { await mirror.close(); }
});

test('card guarantee hands off and is never submitted through the mirror', async () => {
  const mirror = new SevenroomsMirror({ live: true, reserveSubmission: async () => {} });
  mirror.cardRequired = async () => true;
  const s = { id: 'card1', owner: 'alice', revision: 1, touched: Date.now(), busy: false, contact: true, width: 420, height: 760, lastSnapshot: { details: null }, context: { close: async () => {} }, page: {} };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action('card1', 'alice', { type: 'submit', revision: 1, confirm: true, terms: true }), /card_required/);
    assert.equal(s.handoffReason, 'card_required');
  } finally { await mirror.close(); }
});

test('submit is impossible without the live reservation wiring', async () => {
  const mirror = new SevenroomsMirror();
  const s = { id: 'plain', owner: 'alice', revision: 1, touched: Date.now(), busy: false, contact: true, width: 420, height: 760, context: { close: async () => {} } };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action('plain', 'alice', { type: 'submit', revision: 1, confirm: true }), /inspect_only/);
  } finally { await mirror.close(); }
});
