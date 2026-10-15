import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOpenTable, listOpenTableRestaurants, searchOpenTableAvailability } from './opentable.mjs';

test('only verified exact restaurant mappings are exposed', () => {
  assert.equal(listOpenTableRestaurants().length, 8);
  assert.equal(listOpenTableRestaurants({ city: 'Miami' }).length, 3);
  for (const id of ['__proto__', 'constructor', 'https://evil.example', 'osm-HVA-silk', 'curated-DXB-coya-dubai', 'curated-CRV-le-1947-a-cheval-blanc']) assert.equal(resolveOpenTable(id), null);
  assert.match(resolveOpenTable('osm-MIA-la-cabrera-coconut-grove').url, /1377148/);
});
test('unconnected availability is unknown, never no availability or bookable slots', async () => {
  const query = { placeId: 'curated-ASP-bosq', date: '2026-10-19', time: '19:00', party: 2 };
  const result = await searchOpenTableAvailability(query);
  assert.equal(result.status, 'unknown'); assert.equal(result.checkedAt, null);
  assert.deepEqual(result.slots, []); assert.equal(result.prefilled, false);
  for (const changes of [{date:'2026-02-30'}, {time:'24:00'}, {party:0}, {party:'2'}]) await assert.rejects(searchOpenTableAvailability({...query,...changes}));
});
