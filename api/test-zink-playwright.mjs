import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedRequest, BokabordMirror } from './bokabord-mirror.mjs';
test('inspection never sends booking, contact, payment or unknown mutations', () => {
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
    assert.equal(allowedRequest(method, 'https://app.bokabord.se/reservation/api/booking/saveBooking'), false);
  }
  for (const path of ['/reservation/api/booking/checkEmail', '/reservation/api/payment', '/unknown']) {
    assert.equal(allowedRequest('POST', 'https://app.bokabord.se' + path), false);
  }
  assert.equal(allowedRequest('POST', 'https://app.bokabord.se/booking-widget/api/getTimes'), true);
  assert.equal(allowedRequest('GET', 'https://evil.example/'), false);
  assert.equal(allowedRequest('GET', 'http://127.0.0.1/'), false);
});
test('ownership, revision, coordinates and input guard prevent cross-session actions', async () => {
  const mirror = new BokabordMirror();
  let clicks = 0;
  const s = { id: 'one', owner: 'alice', revision: 4, touched: Date.now(), width: 420, height: 760, context: { close: async () => {} }, page: { getByRole: () => ({ isVisible: async () => false }), mouse: { click: async () => clicks++ } } };
  mirror.sessions.set(s.id, s);
  try {
    await assert.rejects(mirror.action('one', 'bob', { type: 'click', revision: 4 }), /session_expired/);
    await assert.rejects(mirror.action('one', 'alice', { type: 'click', revision: 3 }), /stale_view/);
    await assert.rejects(mirror.action('one', 'alice', { type: 'fill', revision: 4 }), /inspect_only/);
    await assert.rejects(mirror.action('one', 'alice', { type: 'click', revision: 4, x: -1, y: 50 }), /coordinates/);
    s.page.getByRole = () => ({ isVisible: async () => true });
    await assert.rejects(mirror.action('one', 'alice', { type: 'click', revision: 4, x: 20, y: 20 }), /contact_stop/);
    assert.equal(clicks, 0);
    await mirror.remove('one', 'bob'); assert.equal(mirror.sessions.size, 1);
    await assert.rejects(mirror.create('alice', 'unknown'), /pilot_only/);
  } finally { await mirror.close(); }
});
