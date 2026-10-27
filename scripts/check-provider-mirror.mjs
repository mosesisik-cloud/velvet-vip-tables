// Generic read-only smoke check for any provider mirror module.
// Usage: node scripts/check-provider-mirror.mjs <provider-slug> [restaurantId] [expectName]
import assert from 'node:assert/strict';

const slug = process.argv[2];
if (!slug) { console.error('usage: check-provider-mirror.mjs <provider-slug> [restaurantId] [expectName]'); process.exit(2); }
const mod = await import(`../api/${slug}-mirror.mjs`);
const cls = Object.values(mod).find(v => typeof v === 'function' && /Mirror$/.test(v.name));
const restaurantId = process.argv[3] || Object.keys(mod.RESTAURANTS)[0];
const expectName = process.argv[4] || mod.RESTAURANT_DETAILS[restaurantId].name;

const mirror = new cls();
try {
  const snapshot = await mirror.create('live-check', restaurantId, 420);
  assert.ok(snapshot.id, 'session id');
  assert.ok(snapshot.image.startsWith('data:image/png;base64,'), 'png image');
  assert.ok(/^[a-f0-9]{64}$/.test(snapshot.imageHash), 'sha256 hash');
  assert.equal(snapshot.mode, 'inspect');
  assert.equal(snapshot.canSubmit, false, 'inspect mode can never submit');
  const slugInUrl = mod.RESTAURANT_DETAILS[restaurantId].venueId || mod.RESTAURANT_DETAILS[restaurantId].rid || mod.RESTAURANT_DETAILS[restaurantId].slug || '';
  assert.ok(
    snapshot.text.includes(expectName) || snapshot.title.includes(expectName) || (slugInUrl && snapshot.url.includes(slugInUrl)),
    `venue identity "${expectName}" visible or registry id "${slugInUrl}" in provider URL (title: "${snapshot.title}", url: ${snapshot.url})`);
  console.log(`OK ${slug}/${restaurantId}: mirrored "${snapshot.restaurant}", revision ${snapshot.revision}, hash ${snapshot.imageHash.slice(0, 12)}…`);
  await mirror.remove(snapshot.id, 'live-check');
  console.log('Session closed cleanly.');
} finally { await mirror.close(); }
