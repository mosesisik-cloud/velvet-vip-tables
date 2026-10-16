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
