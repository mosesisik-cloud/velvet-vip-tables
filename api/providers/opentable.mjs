import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('./opentable-restaurants.json', import.meta.url), 'utf8'));
const HOSTS = new Set(['www.opentable.com', 'www.opentable.co.uk', 'www.opentable.com.au']);

/** Only reviewed exact restaurant links can become booking destinations. */
export function resolveOpenTable(placeId) {
  if (typeof placeId !== 'string' || !Object.hasOwn(registry, placeId)) return null;
  const row = registry[placeId];
  let url;
  try { url = new URL(row.url); } catch { return null; }
  if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || url.port || url.username || url.password || url.hash) return null;
  if (row.verification !== 'official_restaurant_link_verified' || row.mode !== 'external') return null;
  return Object.freeze({ placeId, ...row, url: url.href });
}

export function listOpenTableRestaurants({ city } = {}) {
  return Object.keys(registry).map(resolveOpenTable).filter(row => row && (!city || row.city.toLowerCase() === String(city).toLowerCase()));
}

/** Deliberately does not fabricate slots or interpret unavailable access as sold out. */
export async function searchOpenTableAvailability({ placeId, date, time, party } = {}) {
  const restaurant = resolveOpenTable(placeId);
  if (!restaurant) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new TypeError('Invalid date');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '') || !Number.isInteger(party) || party < 1 || party > 20) throw new TypeError('Invalid time or party');
  return {
    placeId, provider: 'OpenTable', status: 'unknown', reason: 'live_availability_not_connected',
    slots: [], checkedAt: null, query: { date, time, party },
    bookingUrl: restaurant.url, mode: 'external', prefilled: false,
    message: 'Kontrollera lediga tider hos OpenTable. Datum, tid och antal gäster väljs där.',
  };
}
