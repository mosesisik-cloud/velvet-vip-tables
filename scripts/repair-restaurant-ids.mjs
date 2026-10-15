import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Repair only ambiguous existing IDs; never guess which entity owns an old shared link. */
export function repairRestaurantIds(input) {
  const catalogue = structuredClone(input);
  const groups = new Map();
  for (const [city, destination] of Object.entries(catalogue.destinations || {})) {
    for (const restaurant of destination.restaurants || []) {
      const entries = groups.get(restaurant.placeId) || [];
      entries.push({city,restaurant}); groups.set(restaurant.placeId,entries);
    }
  }
  const used = new Set([...groups].filter(([,entries])=>entries.length===1).map(([id])=>id));
  const changes = [];
  for (const [oldId, entries] of groups) {
    if (entries.length < 2) continue;
    for (const {city,restaurant} of entries) {
      // The affected source rows contain no OSM object identifier. Hash the full Unicode identity.
      const identity = [city,restaurant.name,restaurant.address].map(value=>String(value || '').normalize('NFC'));
      const hash = createHash('sha256').update(JSON.stringify(identity)).digest('hex').slice(0,12);
      const newId = String(oldId).replace(/-+$/,'') + '-' + hash;
      if (used.has(newId)) throw new Error('Indistinguishable restaurant records or hash collision: '+oldId);
      used.add(newId); restaurant.placeId=newId;
      changes.push({oldId,newId,city,name:restaurant.name});
    }
  }
  return {catalogue,changes};
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const file = new URL('../data/restaurants.json',import.meta.url);
  const before = JSON.parse(await fs.readFile(file,'utf8'));
  const {catalogue,changes} = repairRestaurantIds(before);
  const ambiguous = new Set(changes.map(change=>change.oldId));
  for (const name of ['booking-providers.json','restaurant-menus.json']) {
    const references = JSON.parse(await fs.readFile(new URL('../data/'+name,import.meta.url),'utf8'));
    for (const id of Object.keys(references.restaurants || references)) if (ambiguous.has(id)) throw new Error('Manual disambiguation required for '+name+': '+id);
  }
  if (process.argv.includes('--write') && changes.length) await fs.writeFile(file,JSON.stringify(catalogue,null,2)+'\n');
  console.log(JSON.stringify({written:process.argv.includes('--write'),changed:changes.length,changes},null,2));
}

