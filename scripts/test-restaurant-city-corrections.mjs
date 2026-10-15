import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {AvailabilitySearch} from '../api/availability-search.mjs';
const restaurants=JSON.parse(await fs.readFile(new URL('../data/restaurants.json',import.meta.url)));const registry=JSON.parse(await fs.readFile(new URL('../data/booking-providers.json',import.meta.url)));
const svc=new AvailabilitySearch({registry,restaurants});
for(const [city,code,old,ids] of [['Nice','NCE','MCO',['osm-MCO-pirouette','osm-MCO-gigi-tavola','osm-MCO-sushi-arson']],['Méribel','MER','CRV',['osm-CRV-le-monchu-meribel']]]) {
 for(const id of ids){assert.ok(restaurants.destinations[code].restaurants.some(r=>r.placeId===id));assert.ok(!restaurants.destinations[old].restaurants.some(r=>r.placeId===id));assert.equal(registry[id].city,city);}
 const date=new Date(Date.now()+86400000).toISOString().slice(0,10);const found=await svc.search({city,date,time:'19:00',party:2});assert.deepEqual(found.results.map(r=>r.restaurantId).sort(),[...ids].sort());assert.ok(found.results.every(r=>r.status==='unsupported'),'No invented live availability for newly mapped providers');
}
console.log('PASS actual-city grouping, stable IDs, exact city search and unsupported availability remain honest');
