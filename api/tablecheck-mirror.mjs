import fs from 'node:fs';
import { ProviderMirror, MirrorError, baseAllowedRequest, normalizePhone } from './mirror-base.mjs';

// TableCheck provider module on the shared mirror core. Registry, not user-supplied URLs.
// Renderar i spegeln (verifierat 2026-10-16, Sazón Bali). Kontrakt observerat
// 2026-10-24 med samtliga skrivande anrop avbrutna i webbläsaren innan de lämnade
// sidan: read-state POSTs (calendar/menu_items/meals_v2) samt boknings-CARTen
// (POST /v2/booking/cart med shop_slug, start_at, pax_adult, customer{...}).
// En cart kan hålla bordet — den skapas aldrig i testläge.
export function matchesApprovedReservation(payload, approved, venueId, path = '') {
  if (!payload || typeof payload !== 'object' || !approved || approved.terms !== true) return false;
  const phone = normalizePhone(approved.phone);
  if (phone.length < 7 || phone.length > 15) return false;
  const data = payload.reservationData && typeof payload.reservationData === 'object' ? { ...payload, ...payload.reservationData } : payload;
  // Venue identity: the registry slug must match.
  const shop = data.shop_slug ?? data.shop_id;
  if (venueId && shop && String(shop) !== String(venueId)) return false;
  // Selection: start_at carries venue-local wall time; compare the raw string,
  // never a Date parse (timezones must not shift the approved time).
  if (data.start_at) {
    const m = String(data.start_at).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (!m || m[1] !== approved.date || m[2] !== approved.time) return false;
  } else if (data.date || data.start_date) {
    if (!String(data.date || data.start_date).startsWith(approved.date)) return false;
  }
  const party = data.pax_adult ?? data.party_size ?? data.partySize;
  if (party !== undefined && Number(party) !== approved.party) return false;
  // Customer: whenever present and non-empty it must equal the approved contact.
  const customer = data.customer && typeof data.customer === 'object' ? data.customer : data;
  const filled = v => v !== undefined && v !== null && String(v) !== '';
  if (filled(customer.first_name) || filled(customer.last_name) || filled(customer.email) || filled(customer.phone)) {
    if (String(customer.first_name) !== approved.firstname) return false;
    if (String(customer.last_name) !== approved.lastname) return false;
    if (String(customer.email) !== approved.email) return false;
    if (normalizePhone(customer.phone) !== phone) return false;
  }
  // Marketing, texts, orders, vouchers and upgrades fail closed.
  if (data.allow_marketing === true || data.send_texts === true) return false;
  if (Array.isArray(data.orders) && data.orders.length) return false;
  if (Array.isArray(data.voucher_ids) && data.voucher_ids.length) return false;
  if (Array.isArray(data.menu_item_ids) && data.menu_item_ids.length) return false;
  return true;
}

const CONFIG = {
  name: 'TableCheck',
  registryFile: new URL('./tablecheck-mirror-restaurants.json', import.meta.url),
  assetHosts: ['cdn0.tablecheck.com', 'cdn2.tablecheck.com', 'cdn3.tablecheck.com', 'booking-cdn.tablecheck.com', 'image.cdn.tablecheck.com', '2.image.cdn.tablecheck.com', '3.image.cdn.tablecheck.com', 'fonts.googleapis.com', 'fonts.gstatic.com'],
  providerHosts: ['www.tablecheck.com', 'production-booking.tablecheck.com'],
  writePath: /confirm|payment|checkout|cancel|delete|login|register|complete/i,
  // Reviewed read-state queries (date/party only, no identity, no hold), observed 2026-10-24.
  allowReadPosts: [/^\/v2\/booking\/(calendar|menu_items|meals_v2|meals|availability|slots)/],
  bookable: true,
  readySignal: 'production-booking.tablecheck.com',
  contactSelector: 'input[type="email"]:visible, input[name*="first" i]:visible, input[name*="last" i]:visible, input[name*="phone" i]:visible, input[type="tel"]:visible',
  contactText: /guest details|your details|contact information|gästuppgifter|dina uppgifter|vos coordonnées|su contacto|ihre daten|dati personali/i,
  contactFields: {
    firstname: 'input[name="first_name"]:visible, input[name*="first" i]:visible',
    lastname: 'input[name="last_name"]:visible, input[name*="last" i]:visible',
    phone: 'input[name="phone_number"]:visible, input[name*="phone" i]:visible, input[type="tel"]:visible',
    email: 'input[name="email"]:visible, input[type="email"]:visible',
    comment: 'textarea[name="special_request"]:visible, textarea:visible',
  },
  matches: matchesApprovedReservation,
};

// Inspection default. Unknown mutations fail closed.
export function allowedRequest(method, address) {
  return baseAllowedRequest(CONFIG, method, address);
}

export class TablecheckMirror extends ProviderMirror {
  constructor(options = {}) {
    super(CONFIG, options);
  }
}

const registry = JSON.parse(fs.readFileSync(CONFIG.registryFile, 'utf8'));
export const RESTAURANT_DETAILS = Object.freeze(registry);
export const RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(registry).map(([id, row]) => [id, row.url])));
export { MirrorError };
