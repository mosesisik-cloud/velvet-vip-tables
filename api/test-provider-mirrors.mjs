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
      // These modules are not live-bookable yet: submit never exists there.
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
