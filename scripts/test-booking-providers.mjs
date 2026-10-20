import {bookingLanguage} from '../js/booking-language.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { resolveEmbeddedBooking } from '../js/restaurant-booking-providers.js';
const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json', import.meta.url)));
const catalogue = JSON.parse(await fs.readFile(new URL('../data/restaurants.json', import.meta.url)));
const ids = new Set(Object.values(catalogue.destinations).flatMap(d => d.restaurants.map(r => r.placeId)));
for (const [id, row] of Object.entries(registry)) {
  assert.ok(ids.has(id), `Unknown restaurant ${id}`);
  assert.ok(resolveEmbeddedBooking(registry, id), `Invalid provider mapping ${id}`);
  if (row.integrationMode === 'native_embed') assert.equal(row.verification, 'embedded_form_loaded');
  else assert.equal(row.integrationMode, 'external_link');
  assert.ok(row.source.startsWith('https://'));
}
const dineplan = registry['curated-CPT-salsify-at-the-roundhouse'];
assert.ok(resolveEmbeddedBooking(registry, 'curated-CPT-salsify-at-the-roundhouse'));
assert.equal(resolveEmbeddedBooking(registry, 'curated-CPT-salsify-at-the-roundhouse').integrationMode, 'external_link');
for (const id of ['curated-CPT-salsify-at-the-roundhouse', 'curated-CPT-fyn', 'curated-CPT-la-colombe']) {
  assert.equal(resolveEmbeddedBooking({[id]: {...registry[id], integrationMode:'native_embed', verification:'embedded_form_loaded'}}, id), null, 'Other Dineplan hosts remain external even if verification flag is altered');
}
const row = Object.values(registry)[0];
for (const url of [
  'https://www.sevenrooms.com.evil.example/reservations/' + row.venueId,
  'http://www.sevenrooms.com/reservations/' + row.venueId,
  'https://www.sevenrooms.com/reservations/wrong-restaurant',
  'https://www.sevenrooms.com/reservations/' + row.venueId + '?date=2020-01-01',
  'https://www.sevenrooms.com/explore/' + row.venueId + '/subscription',
  'javascript:alert(1)',
]) assert.equal(resolveEmbeddedBooking({ test: { ...row, url } }, 'test'), null);
assert.equal(resolveEmbeddedBooking(registry, 'not-reviewed'), null);
assert.equal(resolveEmbeddedBooking(registry, '__proto__'), null);
assert.equal(Object.values(registry).filter(row => row.provider === 'SevenRooms').length, 50);
assert.equal(Object.values(registry).filter(row => row.integrationMode === 'native_embed').length, 64);
assert.equal(Object.values(registry).filter(row => row.integrationMode === 'external_link').length, 126);
for(const id of ['curated-SBH-bonito-saint-barth','osm-SBH-bonito']) {
  assert.equal(registry[id].venueId,'bonitostbarth');
  assert.equal(registry[id].url,'https://www.sevenrooms.com/reservations/bonitostbarth');
  assert.equal(registry[id].city,'St. Barts');
  assert.equal(registry[id].integrationMode,'external_link');
  assert.equal(registry[id].liveAvailabilitySupported,false);
  assert.equal(registry[id].completionTracking,'unsupported');
}
for (const id of ['osm-IBZ-ama-lur', 'osm-MRB-the-farm', 'osm-STT-gaio', 'osm-STT-l-opera', 'osm-STT-le-cafe']) {
  assert.equal(registry[id].liveAvailabilitySupported, false, 'Initial form evidence must not enable live inventory');
  assert.equal(registry[id].completionTracking, 'unsupported');
  assert.ok(resolveEmbeddedBooking(registry, id));
}
for (const id of ['osm-DXB-carluccio-s', 'osm-SBH-bagatelle', 'osm-SBH-la-guerite', 'osm-SBH-la-petite-plage', 'osm-SBH-le-cafe', 'osm-SBH-sella']) {
  const imported = registry[id];
  assert.equal(imported.integrationMode, 'external_link');
  assert.equal(imported.liveAvailabilitySupported, false);
  assert.equal(imported.completionTracking, 'unsupported');
  assert.equal(imported.verification, 'official_link_only');
  if (id.startsWith('osm-SBH-')) assert.equal(imported.city, 'St. Barts', 'Locality must not replace the search destination');
}
for (const id of ['osm-SBH-la-petite-plage', 'osm-SBH-le-cafe', 'osm-STT-l-opera', 'osm-STT-le-cafe']) {
  assert.equal(registry[id].bookingMode, 'request_only');
  assert.deepEqual(registry[id].responseTimeHours, {min:24,max:72});
  assert.equal(registry[id].paymentRequirement, 'card_guarantee');
  assert.equal(registry[id].cancellationPolicyStatus, 'unknown');
  assert.equal(registry[id].cancellationPolicy, undefined, 'Card guarantee must not fabricate cancellation terms');
}
for (const original of Object.values(registry).filter(row => row.provider !== 'SevenRooms' || row.integrationMode === 'external_link')) {
  const wrongVenue = new URL(original.url); wrongVenue.pathname += '/wrong-restaurant';
  const wrongHost = new URL(original.url); wrongHost.hostname += '.evil.example';
  const wrongId = new URL(original.url); wrongId.searchParams.set('rid', '000000');
  for (const url of [wrongVenue.href, wrongHost.href, wrongId.href, 'javascript:alert(1)']) {
    assert.equal(resolveEmbeddedBooking({test: {...original, url}}, 'test'), null, original.name + ': reject changed destination');
  }
  if (original.integrationMode === 'external_link') {
    assert.equal(resolveEmbeddedBooking({test: {...original, integrationMode:'native_embed'}}, 'test'), null, original.name + ': external-only must not embed');
  }
}
// Render without a browser to verify external flows do not claim an inline form,
// create iframes or install synthetic confirmation listeners.
const { mountEmbeddedBooking } = await import('../js/restaurant-booking-providers.js');
const originalDocument = globalThis.document;
globalThis.document = { createElement(tag) { return { tag, setAttribute() {}, addEventListener() {} }; } };
try {
  for (const original of Object.values(registry).filter(row => row.integrationMode === 'external_link')) {
    const container = { replaceChildren(...children) { this.children = children; } };
    mountEmbeddedBooking(container, original);
    const requestOnly = original.bookingMode === 'request_only';
    assert.deepEqual(container.children.map(e => e.tag), requestOnly ? ['p', 'p', 'p', 'a', 'p'] : ['p', 'p', 'a', 'p']);
    if (requestOnly) {
      assert.match(container.children[1].textContent, /Bokningsförfrågan/);
      assert.match(container.children[2].textContent, /inte en omedelbart bekräftad/);
      if (original.responseTimeHours?.min === 24) assert.match(container.children[2].textContent, /24–72 timmar/);
      else {
        assert.deepEqual(original.responseTimeHours, {max:24});
        assert.match(container.children[2].textContent, /inom 24 timmar/);
        assert.doesNotMatch(container.children[2].textContent, /24–72|0–24/);
      }
    } else assert.match(container.children[1].textContent, /egen flik/);
    const link = container.children.find(e => e.tag === 'a');
    assert.match(link.textContent, requestOnly ? /Öppna bokningsförfrågan/ : /Kontrollera tider/);
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.href, bookingLanguage(original, 'sv').url);
  }
} finally { globalThis.document = originalDocument; }

console.log(`PASS: ${Object.keys(registry).length} restaurant mappings and provider destination guards`);
import vm from 'node:vm';
const handlers = {};
const fetched = [];
vm.runInNewContext(await fs.readFile(new URL('../sw.js', import.meta.url), 'utf8'), {
 self: { location: { origin: 'https://velvet.test' }, addEventListener: (name, fn) => { handlers[name] = fn; } },
 URL, fetch: (request, options) => { fetched.push({ request, options }); return Promise.resolve({ok:true}); },
});
let intercepted = false;
handlers.fetch({ request: {method:'GET',url:'https://www.sevenrooms.com/reservations/test',mode:'navigate',headers:{has:()=>false}},respondWith:()=>{intercepted=true;} });
assert.equal(intercepted,false,'Provider navigation must not enter the app shell cache');
handlers.fetch({ request: {method:'GET',url:'https://velvet.test/velvet-api/restaurant-bookings/history',mode:'cors',headers:{has:()=>false}},respondWith:()=>{intercepted=true;} });
assert.equal(fetched.length,1);
assert.equal(fetched[0].options.cache,'no-store','Private booking state must bypass all caches');
console.log('PASS: provider navigation and private booking state bypass service-worker caches');

for (const [id, provider, expectedUrl] of [
 ['osm-DXB-shang-palace','SevenRooms','https://www.sevenrooms.com/reservations/shangpalacedubai'],
 ['osm-SBH-fishcorner','Zenchef','https://bookings.zenchef.com/results?pid=1001&rid=388090'],
]) {
 const row=resolveEmbeddedBooking(registry,id);
 assert.equal(row.provider,provider);assert.equal(row.url,expectedUrl);
 assert.equal(row.integrationMode,'external_link');assert.equal(row.liveAvailabilitySupported,false);assert.equal(row.completionTracking,'unsupported');
 assert.equal(resolveEmbeddedBooking({[id]:{...registry[id],url:expectedUrl.replace('shangpalacedubai','wrongvenue').replace('388090','388091')}},id),null);
}
