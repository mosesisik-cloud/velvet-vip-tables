// Live read-only smoke check of the SevenRooms mirror against the real provider.
// Creates an inspect session, verifies the mirrored view, then closes. No clicks beyond
// the initial page load, no personal data, no holds, no bookings.
import assert from 'node:assert/strict';
import { SevenroomsMirror } from '../api/sevenrooms-mirror.mjs';

const restaurantId = process.argv[2] || 'curated-AMF-la-sponda';
const expectName = process.argv[3] || 'La Sponda';

const mirror = new SevenroomsMirror();
try {
  const snapshot = await mirror.create('live-check', restaurantId, 420);
  assert.ok(snapshot.id, 'session id');
  assert.ok(snapshot.image.startsWith('data:image/png;base64,'), 'png image');
  assert.ok(/^[a-f0-9]{64}$/.test(snapshot.imageHash), 'sha256 hash');
  assert.equal(snapshot.mode, 'inspect');
  assert.equal(snapshot.canSubmit, false, 'inspect mode can never submit');
  assert.equal(snapshot.contact, false, 'initial view is not the contact step');
  assert.ok(snapshot.text.includes(expectName) || snapshot.title.includes(expectName), `venue name "${expectName}" in mirrored view or page title (got title: "${snapshot.title}")`);
  assert.ok(snapshot.text.length > 100, 'mirrored view has substantive provider content');
  console.log(`OK ${restaurantId}: mirrored "${snapshot.restaurant}", revision ${snapshot.revision}, hash ${snapshot.imageHash.slice(0, 12)}…, bytes ${snapshot.image.length}`);
  await mirror.remove(snapshot.id, 'live-check');
  console.log('Session closed cleanly.');
} finally { await mirror.close(); }
