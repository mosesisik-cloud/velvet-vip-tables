import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolveEmbeddedBooking} from '../js/restaurant-booking-providers.js';

const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json', import.meta.url)));
const paolinoId = 'curated-CAP-da-paolino';
const matsuhisaId = 'curated-CER-matsuhisa-cala-di-volpe';
const paolino = registry[paolinoId];
const matsuhisa = registry[matsuhisaId];
const resolve = (id, row) => resolveEmbeddedBooking({[id]:row}, id);
for (const id of [paolinoId, matsuhisaId]) {
  const row = registry[id];
  assert.equal(resolveEmbeddedBooking(registry, id)?.url, row.url);
  assert.equal(row.integrationMode, 'external_link');
  assert.equal(row.verification, 'official_link_only');
  assert.equal(row.liveAvailabilitySupported, false);
  assert.equal(row.completionTracking, 'unsupported');
  assert.equal(row.paymentRequirement, undefined, 'Fee policy does not prove card collection');
  assert.equal(row.bookingMode, undefined, 'Neither request nor instant confirmation established');
}

// The explore route exception binds all evidence to this exact restaurant.
for (const patch of [
  {url:paolino.url + '?venues=casapaolino'},
  {url:paolino.url.replace('www.sevenrooms.com', 'www.sevenrooms.com.evil.example')},
  {url:paolino.url.replace('PaolinoLemontrees', 'CasaPaolino')},
  {url:paolino.url.replace('PaolinoLemontrees', 'paolinolemontrees')},
  {url:paolino.url.slice(0,-1)},
  {source:'https://example.com/'},
  {source:paolino.source + '?unverified=1'},
  {venueId:'paolinolemontrees'},
  {venueKey:paolino.venueKey.toLowerCase()},
  {integrationMode:'native_embed', verification:'embedded_form_loaded'},
  {verification:'provider_page_loaded'},
  {liveAvailabilitySupported:true},
  {completionTracking:'supported'},
  {provider:'Other'},
]) assert.equal(resolve(paolinoId, {...paolino,...patch}), null, JSON.stringify(patch));
assert.equal(resolve('curated-CAP-casa-paolino', paolino), null);
assert.equal(resolve('unreviewed', {...paolino,venueId:'paolinolemontrees',url:'https://www.sevenrooms.com/reservations/paolinolemontrees',venueKey:'www.sevenrooms.com/reservations/paolinolemontrees'}), null);

// Standard canonical SevenRooms checks still apply to Matsuhisa.
for (const patch of [
  {url:matsuhisa.url + '?venues=legrand'},
  {url:matsuhisa.url.replace('www.sevenrooms.com','www.sevenrooms.com.evil.example')},
  {url:matsuhisa.url.replace('matsuhisaportocervo','legrand')},
  {source:'http://example.com/'},
  {source:'https://user:password@example.com/'},
]) assert.equal(resolve(matsuhisaId, {...matsuhisa,...patch}), null);
assert.equal(matsuhisa.cancellationPolicy.source,matsuhisa.url);
assert.equal(matsuhisa.cancellationPolicy.checkedAt,'2026-10-16');
for (const text of ['24 timmar','150 EUR per person','fler än 10','72 timmar']) assert.ok(matsuhisa.cancellationPolicy.summary.includes(text));
assert.equal(paolino.cancellationPolicy, undefined);
for (const id of ['osm-PAR-bigbang','curated-MCO-pavyllon-monte-carlo']) {
  assert.equal(resolveEmbeddedBooking(registry,id)?.url,registry[id].url, 'Existing exact exceptions preserved');
}
assert.ok(Object.keys(registry).length >= 130);
console.log('PASS: Italy external links, exact identity guards, policy provenance and existing exceptions (no network or bookings)');
