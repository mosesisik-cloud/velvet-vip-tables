import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {restaurantSourceId,assertUniqueRestaurantIds} from './restaurant-identity.mjs';
const read=async path=>JSON.parse(await fs.readFile(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await read('data/restaurants.json');
const rows=Object.values(catalog.destinations).flatMap(d=>d.restaurants);
assert.equal(rows.length,809);const ids=assertUniqueRestaurantIds(catalog);assert.equal(ids.size,809);
for(const path of ['data/booking-providers.json','api/bokabord-restaurants.json']) {
 for(const id of Object.keys(await read(path))) assert.ok(ids.has(id),`${path}: orphaned ${id}`);
}
for(const id of Object.keys((await read('data/restaurant-menus.json')).restaurants))assert.ok(ids.has(id),`orphaned menu ${id}`);
const nonLatin=['ปาท่องโก๋','ร้านต้มยำกุ้งบางลำพู','باب المنصور','Μπαρμπουνάκι','東北餃子'];
const generated=nonLatin.map(name=>restaurantSourceId('BKK',{name}));assert.equal(new Set(generated).size,nonLatin.length);
assert.equal(generated[0],'osm-BKK-uca22dc274c49');assert.equal(generated[1],'osm-BKK-u7179573ef178');
assert.deepEqual(nonLatin.toReversed().map(name=>restaurantSourceId('BKK',{name})).reverse(),generated);
assert.equal(restaurantSourceId('PAR',{name:'Café'}),restaurantSourceId('PAR',{name:'Cafe\u0301'}));
assert.equal(restaurantSourceId('BKK',{name:'Renamed',osmType:'node',osmId:123}),'osm-BKK-node-123');
assert.notEqual(restaurantSourceId('BKK',{name:'Same',osmType:'way',osmId:123}),restaurantSourceId('BKK',{name:'Same',osmType:'node',osmId:123}));
assert.throws(()=>restaurantSourceId('BKK',{name:''}),/requires a name/);
assert.throws(()=>assertUniqueRestaurantIds({destinations:{BKK:{restaurants:[{placeId:'same'},{placeId:'same'}]}}}),/Duplicate/);
assert.throws(()=>assertUniqueRestaurantIds({destinations:{BKK:{restaurants:[{placeId:'osm-BKK-'}]}}}),/Invalid/);
assert.equal(rows.find(r=>r.placeId==='osm-BKK-uca22dc274c49').name,nonLatin[0]);
assert.equal(rows.find(r=>r.placeId==='osm-BKK-u7179573ef178').name,nonLatin[1]);
console.log('PASS catalog:809 rows/809 unique IDs; provider/Bokabord/menu references intact; Unicode/source identity and collisions regression');
