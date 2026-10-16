import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AvailabilitySearch } from '../api/availability-search.mjs';
import { resolveExternal200ReviewedLink } from '../js/external200-reviewed-links.js';

// Offline handoff checks. This is NOT a simulated checkout or a Playwright
// implementation; it prevents research rows from silently becoming live routes.
const read = file => JSON.parse(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const manifest = read('data/external200-manifest.json');
const registry = read('data/booking-providers.json');
const bokabord = read('api/bokabord-restaurants.json');
const seen = new Set();
const candidates = new Map();
let candidateCount = 0;
for (let group = 1; group <= 10; group++) {
  const suffix = String(group).padStart(2, '0');
  const source = read(`data/external200-group${suffix}.json`);
  const handoff = read(`data/external200-playwright-group${suffix}.json`);
  assert.equal(handoff.schemaVersion, 1);
  assert.equal(handoff.group, group);
  assert.equal(handoff.restaurants.length, 20);
  assert.deepEqual(handoff.restaurants.map(r => r.restaurantId).sort(), manifest.records.filter(r => r.batch === group).map(r => r.restaurantId).sort());
  for (const row of handoff.restaurants) {
    assert.ok(!seen.has(row.restaurantId), 'duplicate ID');
    seen.add(row.restaurantId);
    const audited = source.records.find(r => r.restaurantId === row.restaurantId);
    assert.equal(row.currentRouteStatus, audited.status);
    assert.equal(row.identityVerified, audited.identity.status === 'verified');
    assert.ok(['candidate', 'manual_only', 'unresolved', 'unavailable'].includes(row.readiness));
    assert.ok(row.blockers.length > 0);
    assert.ok(row.evidence.length > 0);
    assert.equal(row.backendPlaywrightImplemented, false);
    assert.equal(row.backendPlaywrightTested, false);
    assert.equal(row.supplierConfirmationVerified, false);
    assert.equal(Object.hasOwn(bokabord, row.restaurantId), false, 'New Bokabord coverage requires reclassification');
    if (row.readiness === 'candidate') {
      candidateCount++;
      candidates.set(row.restaurantId, row);
      assert.equal(row.identityVerified, true);
      assert.equal(audited.checks.officialExternalLink, true);
      assert.equal(row.bookingUrl, audited.bookingUrl);
      assert.equal(row.providerCandidate, audited.provider);
      const binding = resolveExternal200ReviewedLink(row.restaurantId, row.officialSource, row.bookingUrl);
      assert.ok(binding, row.restaurantId + ': missing independently reviewed binding');
      assert.equal(row.bookingUrl, binding.url);
      assert.equal(row.officialSource, binding.source);
      if (row.providerCandidate === 'SevenRooms') {
        assert.equal(row.providerVenueId, registry[row.restaurantId].venueId);
        assert.equal(row.providerVenueId, new URL(binding.url).pathname.split('/')[2]);
      }
      if (row.providerCandidate === 'Zenchef') assert.equal(row.providerVenueId, new URL(binding.url).searchParams.get('rid'));
      if (row.providerCandidate === 'Yerim Hazir') assert.equal(row.providerVenueId, new URL(binding.url).pathname.split('/').at(-1));
    }
    if (audited.status.startsWith('unresolved')) assert.equal(row.readiness, 'unresolved');
    if (['walk_in', 'takeaway', 'closed', 'closed_reported'].includes(audited.status)) assert.equal(row.readiness, 'unavailable');
  }
}
assert.equal(seen.size, 200);
const sevenrooms = read('data/external200-playwright-sevenrooms-evidence.json');
assert.deepEqual(sevenrooms.records.map(r => r.restaurantId).sort(), [...candidates.values()].filter(r => r.providerCandidate === 'SevenRooms').map(r => r.restaurantId).sort());
for (const row of sevenrooms.records) {
  const candidate = candidates.get(row.restaurantId);
  for (const key of ['providerVenueId','officialSource','bookingUrl']) assert.equal(row[key], candidate[key], row.restaurantId + ': inconsistent evidence ' + key);
}
for (const id of ['osm-SBH-la-petite-plage', 'osm-SBH-le-cafe']) {
  assert.equal(registry[id].bookingMode, 'request_only');
  assert.deepEqual(registry[id].responseTimeHours, { min:24, max:72 });
  assert.equal(registry[id].paymentRequirement, 'card_guarantee');
  const evidence = sevenrooms.records.find(r => r.restaurantId === id);
  assert.equal(evidence.bookingMode, 'request_only');
  assert.deepEqual(evidence.responseTimeHours, { min:24, max:72 });
}

// Exercise the EXISTING backend gates with exact scoped provider rows. A fake
// adapter returning offers must not bypass a request-only/no-live policy.
let calls = 0;
const failNetwork = async () => { calls++; throw new Error('network forbidden in offline test'); };
const scoped = Object.fromEntries(Object.entries(registry).filter(([id]) => seen.has(id)));
const service = new AvailabilitySearch({ registry: scoped, restaurants: {}, fetcher: failNetwork,
  adapters: Object.fromEntries([...new Set(Object.values(scoped).map(r => r.provider))].map(p => [p, failNetwork])) });
for (const [id, row] of Object.entries(scoped)) {
  assert.equal(row.liveAvailabilitySupported, false, id + ': capability changed; review before updating snapshot');
  const result = await service.venue(id, row, { date: '2026-11-20', time: '19:00', party: 2, city: row.city });
  assert.equal(result.status, row.bookingMode === 'request_only' ? 'request_only' : 'unsupported');
  assert.deepEqual(result.slots, []);
  assert.equal(result.checkedAt, null);
  const forged = service.applyGate({ restaurantId: id, status: 'available', slots: [{ time: '19:00' }], checkedAt: new Date().toISOString() });
  assert.equal(forged.status, result.status);
  assert.deepEqual(forged.slots, []);
}
assert.equal(calls, 0);
console.log(`external200 readiness: ${seen.size} exact IDs, ${candidateCount} research candidates, ${Object.keys(scoped).length} backend gates checked; zero network calls, zero checkout simulations, zero live bookings.`);
