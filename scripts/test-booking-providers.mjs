import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { resolveEmbeddedBooking } from '../js/restaurant-booking-providers.js';
const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json', import.meta.url)));
const catalogue = JSON.parse(await fs.readFile(new URL('../data/restaurants.json', import.meta.url)));
const ids = new Set(Object.values(catalogue.destinations).flatMap(d => d.restaurants.map(r => r.placeId)));
for (const [id, row] of Object.entries(registry)) {
  assert.ok(ids.has(id), `Unknown restaurant ${id}`);
  assert.ok(resolveEmbeddedBooking(registry, id), `Invalid provider mapping ${id}`);
  assert.equal(row.verification, 'embedded_form_loaded');
  assert.ok(row.source.startsWith('https://'));
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
