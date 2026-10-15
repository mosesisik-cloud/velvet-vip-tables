import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { repairRestaurantIds } from './repair-restaurant-ids.mjs';
const sample={destinations:{ATH:{restaurants:[{placeId:'osm-ATH-',name:'Τα Βλάχικα',address:'Athens'},{placeId:'osm-ATH-',name:'Γευστικόν',address:'Athens'},{placeId:'stable',name:'Existing mapping',address:'Athens'}]}}};
const fixed=repairRestaurantIds(sample);
assert.equal(fixed.changes.length,2);
assert.notEqual(fixed.changes[0].newId,fixed.changes[1].newId);
assert.equal(fixed.catalogue.destinations.ATH.restaurants[2].placeId,'stable');
assert.equal(sample.destinations.ATH.restaurants[0].placeId,'osm-ATH-','Migration must not mutate its input');
assert.equal(repairRestaurantIds(fixed.catalogue).changes.length,0,'Migration is idempotent');
const reversed=structuredClone(sample);reversed.destinations.ATH.restaurants.reverse();
const byName=result=>new Map(result.changes.map(change=>[change.name,change.newId]));
assert.deepEqual(byName(fixed),byName(repairRestaurantIds(reversed)),'IDs must not depend on catalogue ordering');
const identical=structuredClone(sample);identical.destinations.ATH.restaurants[1]={...identical.destinations.ATH.restaurants[0]};
assert.throws(()=>repairRestaurantIds(identical),/Indistinguishable/,'Do not assign random identity to indistinguishable rows');
const catalogue=JSON.parse(await fs.readFile(new URL('../data/restaurants.json',import.meta.url),'utf8'));
const rows=Object.values(catalogue.destinations).flatMap(city=>city.restaurants||[]);
const ids=new Set(rows.map(row=>row.placeId));
assert.equal(ids.size,rows.length,'Every restaurant detail/favorite route must identify exactly one entity');
for(const name of ['booking-providers.json','restaurant-menus.json']) {
  const references=JSON.parse(await fs.readFile(new URL('../data/'+name,import.meta.url),'utf8'));
  for(const id of Object.keys(references.restaurants || references)) assert.ok(ids.has(id),name+' references missing restaurant '+id);
}
assert.equal(repairRestaurantIds(catalogue).changes.length,0);
console.log(`PASS: ${rows.length} globally unique restaurant IDs, deterministic migration and preserved provider/menu references.`);
