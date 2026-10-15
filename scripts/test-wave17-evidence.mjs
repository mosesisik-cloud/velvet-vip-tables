import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Evidence-fragment checks only. This does not prove provider availability,
// embedding, restaurant acceptance, a successful booking or publication.
// Historical user-action observations are not a background network audit.
const expectedIssues = new Map([
  ['curated-ATH-island-athens-riviera', 55],
  ['curated-ATH-varoulko-seaside', 56],
  ['curated-BDR-lucca-by-the-sea', 58],
  ['curated-BKK-gaggan-at-louis-vuitton', 59],
  ['curated-DXB-ossiano', 70],
]);
const files = ['greece', 'lucca', 'gaggan', 'ossiano'];
const documents = await Promise.all(files.map(async name => ({
  name,
  data: JSON.parse(await fs.readFile(new URL(`../work/booking-wave17-${name}-evidence.json`, import.meta.url), 'utf8')),
})));
const records = documents.flatMap(({data}) => data.records || [data]);
assert.equal(records.length, 5, 'This batch contains only the five confirmed claims');
const byId = new Map();
for (const record of records) {
  assert.ok(expectedIssues.has(record.restaurantId), `Unclaimed restaurant: ${record.restaurantId}`);
  assert.ok(!byId.has(record.restaurantId), `Duplicate claim: ${record.restaurantId}`);
  assert.equal(record.issue, expectedIssues.get(record.restaurantId), `Wrong issue for ${record.restaurantId}`);
  checkInspectionSafety(record.inspectionSafety);
  byId.set(record.restaurantId, record);
  const sources = record.sources || record.evidence;
  assert.ok(Array.isArray(sources) && sources.length > 0, `${record.restaurantId}: missing source evidence`);
  for (const source of sources) assertHttps(source.url, record.restaurantId);
}
assert.deepEqual(new Set(byId.keys()), new Set(expectedIssues.keys()));

function assertHttps(value, context) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', `${context}: non-HTTPS source`);
  assert.equal(url.username + url.password + url.port, '', `${context}: credentialed or nonstandard source`);
}
function checkInspectionSafety(safety) {
  assert.ok(safety && typeof safety === 'object', 'Missing inspection safeguard provenance');
  assert.equal(safety.backgroundSideEffects, 'unknown');
  for (const key of ['serviceWorkerBlocking', 'requestWriteInterception', 'networkAudit']) {
    assert.equal(safety[key], 'not_recorded', `No original safeguard/audit log recorded for ${key}`);
  }
  assert.equal(safety.writeFreeEndToEndCertified, false);
  assert.ok(typeof safety.basis === 'string' && safety.basis.trim(), 'Missing provenance limitation');
}
const urlKeys = new Set([
  'url', 'source', 'sourceUrl', 'website', 'finalUrl', 'exactOfficialBookingUrl',
  'addressSource', 'observedRedirectUrl',
]);
const unsupportedClaims = new Set([
  'confirmedReservation', 'nativeEmbeddingObserved', 'liveAvailabilityObserved',
  'availabilityObserved', 'liveAvailabilitySupported', 'paymentSubmitted',
  'personalDataSubmitted', 'accessControlsBypassed', 'fieldsChanged',
  'searchSubmitted', 'slotSelected',
]);
const sideEffectCounts = new Set(['reservationsCreated', 'holdsCreated', 'messagesSent']);
function checkEvidence(value, path) {
  if (!value || typeof value !== 'object') return;
  if (value.name === 'no_side_effects') {
    assert.equal(value.result ?? value.status, 'unknown', `${path}: no write-free certification without safeguard provenance`);
  }
  for (const [key, item] of Object.entries(value)) {
    const context = `${path}.${key}`;
    if (urlKeys.has(key) && typeof item === 'string') assertHttps(item, context);
    if (unsupportedClaims.has(key)) assert.equal(item, false, `${context}: this batch did not verify this capability`);
    if (sideEffectCounts.has(key)) assert.equal(item, null, `${context}: unmeasured background outcomes must stay unknown`);
    if (key === 'integrationMode') assert.notEqual(item, 'native_embed', `${context}: no native embedding verified`);
    if (key === 'verification') assert.notEqual(item, 'embedded_form_loaded', `${context}: no embedded-form test recorded`);
    if (key === 'completionTracking') assert.equal(item, 'unsupported', `${context}: no completion integration verified`);
    checkEvidence(item, context);
  }
}
for (const {name, data} of documents) checkEvidence(data, name);

// Mutation checks protect against restoring a false certification. These are
// offline fixture changes only; no evidence file or provider is modified.
const safetyFixture = records[0].inspectionSafety;
for (const key of ['backgroundSideEffects', 'serviceWorkerBlocking', 'requestWriteInterception', 'networkAudit', 'writeFreeEndToEndCertified']) {
  const changed = {...safetyFixture, [key]: key === 'writeFreeEndToEndCertified' ? true : 'verified'};
  assert.throws(() => checkInspectionSafety(changed), assert.AssertionError);
}
assert.throws(() => checkInspectionSafety(undefined), assert.AssertionError);
for (const key of sideEffectCounts) {
  assert.throws(() => checkEvidence({[key]: 0}, 'mutated'), assert.AssertionError);
}
assert.throws(() => checkEvidence({name:'no_side_effects', result:'passed'}, 'mutated'), assert.AssertionError);

const island = byId.get('curated-ATH-island-athens-riviera');
assert.equal(island.classification, 'official_manual_reservation_route');
assert.equal(island.proposedMapping, null, 'Manual contact must not masquerade as an online provider');
assert.deepEqual(island.proposedRecord.manualContactCandidate, {
  type: 'email',
  value: 'reservations@islandclubrestaurant.gr',
  source: 'https://www.islandresortathensriviera.com/clubrestaurant/contact',
});

const varoulko = byId.get('curated-ATH-varoulko-seaside');
const varoulkoMapping = varoulko.proposedMapping;
assert.equal(varoulko.classification, 'official_external_provider_link_verified');
assert.equal(varoulkoMapping.provider, 'i-host');
assert.equal(varoulkoMapping.integrationMode, 'external_link');
assert.equal(varoulkoMapping.verification, 'official_link_only');
assert.equal(varoulkoMapping.url, 'https://www.i-host.gr/reservations/new?channel=website&lang=en&restaurant=232');
assert.equal(varoulkoMapping.venueKey, 'www.i-host.gr/reservations/new?restaurant=232');
assert.equal(varoulkoMapping.source, 'https://www.varoulko.gr/');
assert.deepEqual([...new URL(varoulkoMapping.url).searchParams], [
  ['channel', 'website'], ['lang', 'en'], ['restaurant', '232'],
], 'Keep the exact official query, especially the identity-bearing restaurant=232');

const lucca = byId.get('curated-BDR-lucca-by-the-sea');
assert.equal(lucca.identity.website, 'https://luccabythesea.com/');
assert.equal(lucca.identity.city, 'Bodrum');
assert.equal(lucca.observedRoute.mode, 'manual_contact');
assert.equal(lucca.observedRoute.bookingMode, 'request_only');
assert.equal(lucca.observedRoute.url, 'https://api.whatsapp.com/send?phone=905354528484');
assert.equal(lucca.proposedRecord.registryEntry, null, 'Never substitute Lucca Bebek or a provider mapping');
assert.deepEqual(lucca.proposedRecord.manualContactCandidate, {
  type: 'whatsapp', value: '+905354528484', source: 'https://luccabythesea.com/',
});

const gaggan = byId.get('curated-BKK-gaggan-at-louis-vuitton');
assert.equal(gaggan.route.exactOfficialBookingUrl,
  'https://www.sevenrooms.com/experiences/gagganatlouisvuitton/gaggan-by-louis-vuitton-10421662797');
assert.equal(gaggan.route.venueKey, 'gagganatlouisvuitton');
assert.equal(gaggan.proposedRecord.integrationAction, 'do_not_activate_provider_mapping');
assert.equal(gaggan.proposedRecord.providerMapping, null, 'Unavailable Gaggan LV must not point to another Gaggan or the cafe');
assert.equal(gaggan.proposedRecord.bookingRouteStatus, 'unavailable');
assert.equal(gaggan.identity.excludedIdentity.source, 'https://gaggan.com/');

const ossiano = byId.get('curated-DXB-ossiano');
assert.equal(ossiano.identity.property, 'Atlantis, The Palm', 'Do not substitute Atlantis The Royal');
assert.equal(ossiano.route.venueId, 'ossianodubai');
assert.equal(ossiano.route.exactOfficialBookingUrl,
  'https://www.sevenrooms.com/reservations/ossianodubai/AD-website');
assert.equal(ossiano.route.observedRedirectUrl,
  'https://www.sevenrooms.com/explore/ossianodubai/reservations/create/search?tracking=AD-website');
assert.equal(ossiano.route.sourceUrl, 'https://www.atlantis.com/dubai/atlantis-the-palm/dining/ossiano');
assert.equal(ossiano.operatingStatus.status, 'unresolved_conflicting_sources');
assert.equal(ossiano.operatingStatus.publishAsBookable, false);
assert.equal(ossiano.proposedRecord.providerMapping, null, 'Do not activate while operating status is unresolved');
assert.equal(ossiano.proposedRecord.implementationStatus, 'blocked');
assert.ok(ossiano.evidence.some(source => source.url === 'https://guide.michelin.com/ae-du/en/dubai-emirate/dubai/restaurant/ossiano'),
  'Retain the conflicting status evidence alongside the operator source');

console.log('PASS: five Wave 17 claims, exact identity, conservative booking claims and safeguard-provenance mutation guards; no live calls');
