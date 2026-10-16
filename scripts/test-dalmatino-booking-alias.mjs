// Offline contract for the Dalmatino alias. Never writes the registry or contacts a provider.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { resolveEmbeddedBooking, mountEmbeddedBooking } from '../js/restaurant-booking-providers.js';
import { bookingLanguage } from '../js/booking-language.js';
import { withBookingSelection } from '../js/booking-selection.js';
import { AvailabilitySearch } from '../api/availability-search.mjs';

const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const spec = read('../work/booking-wave17b-dalmatino-native.patch.json');
const registry = read('../data/booking-providers.json');
const catalogue = read('../data/restaurants.json');
const before = JSON.stringify(registry);
const id = 'curated-HVA-dalmatino-hvar';
const sourceId = 'osm-HVA-dalmatino';
const expectedUrl = 'https://www.sevenrooms.com/reservations/dalmatinohvar';

function proposedRegistry(current, proposal) {
  assert.equal(proposal.restaurantId, id);
  assert.equal(proposal.reuseRestaurantId, sourceId);
  assert.equal(proposal.preconditions.targetAbsent, true);
  assert.equal(proposal.preconditions.serialRegistryHandoffRequired, true);
  assert.equal(proposal.preconditions.integratorReviewRequired, true);
  assert.ok(!Object.hasOwn(current, id), 'Existing target requires a fresh review, never overwrite it');
  const source = current[sourceId];
  const digest = crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex');
  assert.equal(digest, proposal.preconditions.sourceSha256, 'Source changed: review before reuse');
  assert.equal(proposal.patch.length, 1);
  const [patch] = proposal.patch;
  assert.equal(patch.op, 'add');
  assert.equal(patch.path, '/' + id);
  assert.deepEqual(patch.value, {
    ...source, name: 'Dalmatino Hvar', aliasOf: sourceId,
    liveAvailabilitySupported: false, completionTracking: 'unsupported',
  }, 'Only explicit alias metadata and conservative capability guards may differ');
  assert.equal(source.url, expectedUrl);
  assert.equal(source.source, 'https://dalmatino-hvar.com/');
  assert.equal(source.checkedAt, '2026-10-15', 'Do not redate historical embedding evidence');
  return { ...current, [id]: structuredClone(patch.value) };
}

assert.deepEqual(registry[id], spec.patch[0].value, 'Actual branch registry must contain the reviewed alias');
const baselineRegistry = structuredClone(registry);
delete baselineRegistry[id];
const proposed = proposedRegistry(baselineRegistry, spec);
assert.deepEqual(proposed, registry, 'The exact additive patch reproduces the branch registry');
assert.equal(JSON.stringify(registry), before, 'Source registry remains untouched');
for (const originalId of Object.keys(registry)) assert.deepEqual(proposed[originalId], registry[originalId]);
assert.equal(Object.keys(proposed).length, Object.keys(baselineRegistry).length + 1);
const hvar = catalogue.destinations.HVA;
for (const restaurantId of [id, sourceId]) {
  const row = hvar.restaurants.find(row => row.placeId === restaurantId);
  assert.ok(row, 'Both exact stable IDs must remain in the Hvar catalogue');
  assert.equal(row.address, 'Hvar, Croatia', 'Do not pretend catalogue street addresses are verified');
}
assert.equal(hvar.restaurants.find(row => row.placeId === sourceId).website, spec.identity.officialSource);
assert.equal(spec.reusedEmbeddingEvidence.newLiveInspection, false);
assert.equal(spec.reusedEmbeddingEvidence.checkedAt, proposed[id].checkedAt);
assert.equal(spec.publication, 'implemented_in_branch_not_published');

const booking = resolveEmbeddedBooking(proposed, id);
assert.ok(booking);
assert.equal(booking.integrationMode, 'native_embed');
assert.equal(booking.url, resolveEmbeddedBooking(proposed, sourceId).url);
assert.equal(booking.restaurantId, id);
for (const language of ['sv', 'en', 'es', 'fr']) {
  const localized = new URL(bookingLanguage(booking, language).url);
  assert.equal(localized.pathname, '/reservations/dalmatinohvar');
  assert.equal(localized.searchParams.get('lang'), language);
}
const selection = withBookingSelection(booking, { date: '2026-11-01', time: '19:00', party: 2 });
assert.equal(new URL(selection.url).searchParams.get('default_party_size'), '2');
assert.equal(new URL(selection.url).pathname, '/reservations/dalmatinohvar');

// The existing API gate must keep this alias from acquiring unverified live inventory.
let networkCalls = 0;
const search = new AvailabilitySearch({registry: proposed, restaurants: catalogue,
  fetcher: async () => { networkCalls++; throw new Error('No provider network permitted'); }});
const availability = await search.venue(id, proposed[id], {date:'2026-11-01',time:'19:00',party:2});
assert.equal(availability.status, 'unsupported');
assert.equal(availability.reason, 'live_availability_disabled');
assert.equal(networkCalls, 0);

// Mutation tests: wrong venue/source/date/capabilities and an already assigned target fail closed.
for (const update of [
  {url:'https://www.sevenrooms.com/reservations/another-venue'},
  {source:'https://other.example/'}, {checkedAt:'2026-10-16'},
  {integrationMode:'external_link'}, {liveAvailabilitySupported:true},
  {completionTracking:'confirmed'}, {aliasOf:'another-restaurant'}, {city:'Split'},
]) {
  const changed = structuredClone(spec);
  Object.assign(changed.patch[0].value, update);
  assert.throws(() => proposedRegistry(baselineRegistry, changed));
}
assert.throws(() => proposedRegistry({...baselineRegistry,[id]:{}}, spec));
assert.throws(() => proposedRegistry({...baselineRegistry,[sourceId]:{...registry[sourceId],venueId:'other'}}, spec));
assert.throws(() => proposedRegistry(baselineRegistry, {...spec,restaurantId:'another-restaurant'}));

// Exercise the actual renderer with an in-memory DOM, not a copied implementation.
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.handlers = {}; this.style = {}; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  remove() { this.removed = true; }
  get firstChild() { return this.children[0]; }
}
const previousDocument = globalThis.document;
const previousAnimationFrame = globalThis.requestAnimationFrame;
try {
  globalThis.document = {createElement: tag => new Element(tag), querySelector: () => null};
  globalThis.requestAnimationFrame = callback => callback();
  const container = new Element('section');
  mountEmbeddedBooking(container, booking, 'sv');
  const start = container.children.find(node => node.tag === 'button');
  const stage = container.children.find(node => node.className === 'booking-provider-stage');
  const status = container.children.find(node => node.role === 'status');
  assert.ok(start);
  assert.equal(stage.children.length, 0, 'No provider frame until the guest clicks');
  start.handlers.click();
  start.handlers.click();
  assert.equal(stage.children.length, 1, 'Retain one provider form across interactions');
  const frame = stage.firstChild;
  assert.equal(frame.tag, 'iframe');
  assert.equal(frame.src, bookingLanguage(booking, 'sv').url);
  frame.handlers.load();
  assert.equal(status.textContent, '', 'Frame load must not create a booking or claim email delivery');
  assert.deepEqual(Object.keys(frame.handlers).sort(), ['error', 'load']);
} finally {
  if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  if (previousAnimationFrame === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = previousAnimationFrame;
}
console.log('PASS: actual Dalmatino alias, preserved historical evidence, real renderer, locale/selection, no live inventory, conflict/mutation guards. Offline only; tests do not change registry or send reservations/email.');
