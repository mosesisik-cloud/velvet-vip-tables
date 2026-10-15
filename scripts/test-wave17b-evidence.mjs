import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Contract checks on review evidence, not proof of bookable inventory,
// successful reservations, delivery of a request, native embedding or release.
const claims = new Map([
  ['curated-HKG-caprice', 89],
  ['curated-HKT-acqua-restaurant-phuket', 91],
  ['curated-HVA-dalmatino-hvar', 93],
  ['curated-HVA-gariful', 94],
  ['curated-SIN-burnt-ends', 102],
]);
const documents = await Promise.all(['asia', 'acqua', 'hvar'].map(async name =>
  JSON.parse(await fs.readFile(new URL(`../work/booking-wave17b-${name}-evidence.json`, import.meta.url), 'utf8'))));
const records = documents.flatMap(document => {
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.claimOwner, 'gabbe-wave17-01a02152');
  assert.equal(document.checkedAt, '2026-10-16');
  return document.records;
});
assert.equal(records.length, claims.size);
const byId = new Map();
for (const record of records) {
  assert.ok(claims.has(record.restaurantId), `Unclaimed ID: ${record.restaurantId}`);
  assert.ok(!byId.has(record.restaurantId), `Repeated ID: ${record.restaurantId}`);
  assert.equal(record.issue, claims.get(record.restaurantId));
  byId.set(record.restaurantId, record);
  assert.ok(record.identity.name && record.identity.address && record.identity.source);
  assert.ok(record.sources.length > 0);
  assert.ok(record.limitations.length > 0);
  assert.equal(record.publication, 'not_published');
  assert.equal(record.checks.nativeEmbeddingObserved, false);
  assert.equal(record.checks.availabilityObserved, false);
  assert.equal(record.checks.confirmedReservation, false);
  for (const source of record.sources) {
    assertHttps(source.url);
    assert.ok(source.observation.length > 0);
  }
  if (record.proposedMapping) {
    const mapping = record.proposedMapping;
    assert.equal(mapping.integrationMode, 'external_link');
    assert.ok(['official_link_only', 'official_restaurant_link_verified'].includes(mapping.verification));
    assert.equal(mapping.liveAvailabilitySupported, false);
    assert.equal(mapping.completionTracking, 'unsupported');
    assert.ok(record.sources.some(source => source.url === mapping.source));
    assertHttps(mapping.url);
  }
}

function assertHttps(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.username + url.password + url.port, '');
}
const urlFields = new Set(['url', 'source', 'addressSource', 'officialReservationPage']);
const falseFlags = new Set([
  'nativeEmbeddingObserved', 'availabilityObserved', 'confirmedReservation',
  'liveAvailabilitySupported', 'bookingOrHoldCreated', 'personalDataSubmitted',
  'fieldsChanged', 'searchSubmitted', 'slotSelected', 'messageSent',
  'paymentSubmitted', 'accessControlsBypassed', 'availabilitySearchSubmitted',
  'holdCreated', 'guestInformationSubmitted', 'contactSent',
]);
function review(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (urlFields.has(key) && typeof item === 'string') assertHttps(item);
    if (falseFlags.has(key)) assert.equal(item, false, `Unverified or side-effect flag: ${key}`);
    if (['holdsCreated', 'reservationsCreated', 'messagesSent'].includes(key)) assert.equal(item, 0);
    review(item);
  }
}
documents.forEach(review);

const caprice = byId.get('curated-HKG-caprice');
assert.equal(caprice.proposedMapping.provider, 'Restaurant website');
assert.equal(caprice.proposedMapping.url, 'https://www.fourseasons.com/hongkong/dining/restaurants/caprice/');
assert.equal(caprice.proposedMapping.venueKey, 'www.fourseasons.com/hongkong/dining/restaurants/caprice/');
assert.equal(caprice.checks.officialProviderLinkVerified, false, 'Do not infer an OpenTable ID from search');
assert.deepEqual(caprice.manualContactCandidate, {
  type: 'phone', value: '+85231968882', source: caprice.proposedMapping.url,
});

const acqua = byId.get('curated-HKT-acqua-restaurant-phuket');
assert.equal(acqua.proposedMapping.url, 'https://www.acquarestaurantphuket.com/');
assert.equal(acqua.proposedMapping.bookingMode, 'request_only');
assert.equal(acqua.observedRequestConditions.minimumNoticeHours, 2);
assert.equal(acqua.observedRequestConditions.responseTimeHours, null, 'Advance notice is not response time');
assert.equal(acqua.observedRequestConditions.confirmationMethod, 'restaurant_reply_required');
assert.deepEqual(acqua.manualContactCandidate, {
  type: 'email', value: 'reservations@acquarestaurantphuket.com', source: 'https://www.acquarestaurantphuket.com/',
});

const dalmatino = byId.get('curated-HVA-dalmatino-hvar');
assert.equal(dalmatino.proposedMapping.provider, 'SevenRooms');
assert.equal(dalmatino.proposedMapping.venueId, 'dalmatinohvar');
assert.equal(dalmatino.proposedMapping.url, 'https://www.sevenrooms.com/reservations/dalmatinohvar');
assert.equal(dalmatino.proposedMapping.source, 'https://dalmatino-hvar.com/');
// Existing binding already represents this physical restaurant. This evidence
// must not silently downgrade that binding or count as an independent new venue.
const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json', import.meta.url), 'utf8'));
assert.equal(registry['osm-HVA-dalmatino'].venueId, 'dalmatinohvar');
assert.equal(registry['osm-HVA-dalmatino'].integrationMode, 'native_embed');
assert.equal(registry['osm-HVA-dalmatino'].verification, 'embedded_form_loaded');
assert.equal(registry['curated-HVA-dalmatino-hvar'], undefined, 'Alias integration remains coordinator-owned');
assert.ok(JSON.stringify(dalmatino).includes('osm-HVA-dalmatino'), 'Retain duplicate-ID evidence');

const gariful = byId.get('curated-HVA-gariful');
assert.equal(gariful.proposedMapping.provider, 'i-host');
assert.equal(gariful.proposedMapping.url, 'https://www.i-host.gr/reservations/new?channel=website&lang=eng&restaurant=1779');
assert.equal(gariful.proposedMapping.venueKey, 'www.i-host.gr/reservations/new?restaurant=1779');
assert.equal(gariful.proposedMapping.source, 'https://hvar-gariful.hr/');
assert.deepEqual([...new URL(gariful.proposedMapping.url).searchParams], [
  ['channel', 'website'], ['lang', 'eng'], ['restaurant', '1779'],
], 'Keep original query and identity parameter');

const burnt = byId.get('curated-SIN-burnt-ends');
assert.equal(burnt.identity.address, '7 Dempsey Road, #01-02, Singapore 249671');
assert.equal(burnt.proposedMapping.provider, 'Weeloy');
assert.equal(burnt.proposedMapping.venueKey, 'SG_SG_R_BurntEnds');
assert.equal(burnt.proposedMapping.source, 'https://burntends.com.sg/reservations/');
assert.equal(burnt.proposedMapping.url,
  'https://www.restaurants.sg/modules/booking/book_form_section.php?bkrestaurant=SG_SG_R_BurntEnds&bktracking=WEBSITE&title=Burnt%20Ends');
assert.equal(burnt.checks.embeddedOnOperatorObserved, true);
assert.equal(burnt.checks.nativeEmbeddingObserved, false, 'Operator iframe is not a Velvet embedding test');
assert.equal(burnt.manualContactCandidate, null, 'General enquiries are not a confirmed reservation channel');

console.log('PASS: five Wave 17B claims, exact routes, duplicate-ID guard and conservative booking evidence');
