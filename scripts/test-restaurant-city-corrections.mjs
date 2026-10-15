import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {AvailabilitySearch} from '../api/availability-search.mjs';
const restaurants=JSON.parse(await fs.readFile(new URL('../data/restaurants.json',import.meta.url)));const registry=JSON.parse(await fs.readFile(new URL('../data/booking-providers.json',import.meta.url)));
const allIds=Object.values(restaurants.destinations).flatMap(d=>d.restaurants.map(r=>r.placeId));assert.equal(allIds.length,770);assert.equal(new Set(allIds).size,770);
for(const [id,address,source] of [['osm-MCO-aradhana','4 boulevard Lech Walesa, 06300 Nice, France','https://aradhana.fr/'],['osm-MCO-chez-pipo','13 rue Bavastro, 06300 Nice, France','https://www.chezpipo.fr/fr/'],['osm-MCO-asia-food','2 Bd Lech Walesa, 06300 Nice, France','https://www.asiafood79.com/']]){const row=restaurants.destinations.NCE.restaurants.find(r=>r.placeId===id);assert.equal(row.address,address);assert.equal(row.locationSource,source);assert.equal(row.locationVerifiedAt,'2026-10-16');assert.equal(new URL(row.mapsUrl).searchParams.get('query'),row.name+', '+address);assert.equal(registry[id],undefined,'Location correction must not invent provider mapping');}
const svc=new AvailabilitySearch({registry,restaurants});
for(const [city,code,old,ids] of [['Nice','NCE','MCO',['osm-MCO-pirouette','osm-MCO-gigi-tavola','osm-MCO-sushi-arson','osm-MCO-aradhana','osm-MCO-chez-pipo','osm-MCO-asia-food']],['Méribel','MER','CRV',['osm-CRV-le-monchu-meribel']]]) {
 for(const id of ids){assert.ok(restaurants.destinations[code].restaurants.some(r=>r.placeId===id));assert.ok(!restaurants.destinations[old].restaurants.some(r=>r.placeId===id));if(registry[id])assert.equal(registry[id].city,city);}
 const date=new Date(Date.now()+86400000).toISOString().slice(0,10);const found=await svc.search({city,date,time:'19:00',party:2});assert.deepEqual(found.results.map(r=>r.restaurantId).sort(),[...ids].sort());assert.ok(found.results.every(r=>r.status==='unsupported'),'No invented live availability for newly mapped providers');
}
console.log('PASS actual-city grouping, stable IDs, exact city search and unsupported availability remain honest');
