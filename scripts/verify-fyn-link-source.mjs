import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Explicit invocation only. Four public GETs; no dates, slots, sessions or writes.
const urls = {
  official: 'https://www.fynrestaurant.com/make-a-booking',
  hostScript: 'https://public-prod.dineplan.com/widget/dineplan.widget.min.js',
  child: 'https://account.dineplan.com/widget/v3/DjfvyT1k?source=direct',
  form: 'https://account.dineplan.com/widget/v3/frame/DjfvyT1k',
};
const sources = {};
const bodies = {};
for (const [key, url] of Object.entries(urls)) {
  const response = await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${key}: public source unavailable`);
  bodies[key] = await response.text();
  sources[key] = { url, status: response.status, sha256: createHash('sha256').update(bodies[key]).digest('hex') };
}
assert.match(bodies.official, /data-key=["']DjfvyT1k["']/);
assert.ok(bodies.official.includes(urls.hostScript));
assert.ok(bodies.hostScript.includes('https://account.dineplan.com/widget/v3/'));
assert.ok(bodies.hostScript.includes('"book_click"==t.type'));
assert.ok(bodies.hostScript.includes('href:p+"frame/"+t.key.replace'));
assert.match(bodies.child, /parent\.postMessage/);
assert.match(bodies.child, /obj\.type\s*=\s*"book_click"/);
assert.match(bodies.form, /FYN Restaurant/);
assert.match(bodies.form, /id=["']wcovers["']/);
const report = {
  checkedAt: new Date().toISOString(), restaurantId: 'curated-CPT-fyn', sources,
  sourceChainVerified: true, standaloneFormMarkupVerified: true,
  currentAvailabilityVerified: false, reservationConfirmed: false, publicationVerified: false,
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
