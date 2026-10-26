import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { resolveEmbeddedBooking } from '../js/restaurant-booking-providers.js';
const evidence = JSON.parse(await fs.readFile(new URL('../docs/booking-evidence/curated-LON-gymkhana.json', import.meta.url)));
const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json', import.meta.url)));
const catalogue = JSON.parse(await fs.readFile(new URL('../data/restaurants.json', import.meta.url)));
const id = evidence.restaurantId;
assert.ok(Object.values(catalogue.destinations).some(d => d.restaurants.some(r => r.placeId === id)));
const source = evidence.sources.find(s => s.observedFields).observedFields;
assert.equal(source['title.rendered'], evidence.identity.name);
assert.equal(source['acf.booking_venue_id'], evidence.bookingRoute.venueId);
assert.equal(source['acf.call_to_action_url'], evidence.bookingRoute.url);
const url = new URL(evidence.bookingRoute.url);
assert.equal(url.hostname, 'www.sevenrooms.com');
assert.equal(url.pathname, '/explore/gymkhana/reservations/create/search');
assert.equal(url.search, '?venues=gymkhana%2Cambassadorsclubhouse%2Ctrishna');
assert.equal(evidence.integration.runtimeMapping, null);
assert.equal(evidence.bookingRoute.liveAvailabilityObserved, false);
assert.equal(evidence.bookingRoute.completionTracking, 'unsupported');
// No shared registry edit is part of this handoff. These assertions intentionally
// make the integrator revisit the evidence when activating a mapping.
assert.equal(resolveEmbeddedBooking(registry, id), null);
const candidate = { ...evidence.bookingRoute, name:evidence.identity.name,
  integrationMode:'external_link', verification:'official_link_only',
  venueKey:url.host + url.pathname };
assert.equal(resolveEmbeddedBooking({[id]:candidate}, id), null,
  'The complete official multi-venue link requires coordinated resolver support');
assert.equal(resolveEmbeddedBooking({[id]:{...candidate, integrationMode:'native_embed'}}, id), null,
  'Link evidence must never become an embedded-form claim');
console.log('PASS: Gymkhana evidence provenance, exact URL, and blocked activation');
