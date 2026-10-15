import crypto from 'node:crypto';
export function restaurantSourceId(city, place) {
  if (!/^[A-Z]{3}$/.test(city)) throw new Error('Invalid destination code');
  const type = place.osmType;
  const id = place.osmId;
  if (['node', 'way', 'relation'].includes(type) && /^\d+$/.test(String(id)) && Number(id) > 0) {
    return `osm-${city}-${type}-${id}`;
  }
  const name = String(place.name || '').normalize('NFC').trim();
  if (!name) throw new Error('Restaurant identity requires a name');
  return `osm-${city}-u${crypto.createHash('sha256').update(city + '\n' + name, 'utf8').digest('hex').slice(0, 12)}`;
}
export function assertUniqueRestaurantIds(catalog) {
  const ids = new Set();
  for (const destination of Object.values(catalog.destinations || {})) {
    for (const restaurant of destination.restaurants || []) {
      const id = restaurant.placeId;
      if (typeof id !== 'string' || !id.trim() || /^osm-[A-Z]{3}-$/.test(id)) throw new Error(`Invalid restaurant ID: ${id}`);
      if (ids.has(id)) throw new Error(`Duplicate restaurant ID: ${id}`);
      ids.add(id);
    }
  }
  return ids;
}
