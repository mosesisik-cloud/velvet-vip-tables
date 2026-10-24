import fs from 'node:fs';
import { ProviderMirror, MirrorError, baseAllowedRequest, normalizePhone } from './mirror-base.mjs';

// Zenchef provider module on the shared mirror core. Registry, not user-supplied URLs.
// Renderar i spegeln (verifierat 2026-10-16, Septime). Flöde och fält observerade
// 2026-10-24 (FishCorner) med alla leverantörs-POST:ar avbrutna i webbläsaren innan
// de lämnade sidan — inget nådde Zenchef utom ett identitetslöst quotation-preview
// (dag/tid/antal, ingen hold, inga personuppgifter).
//
// Observed contract: selection payloads carry day/time/nb_guests; any payload
// carrying guest fields must reproduce the approved contact exactly. Marketing
// opt-ins, offers and waiting list fail closed.
export function matchesApprovedReservation(payload, approved, venueId, path = '') {
  if (!payload || typeof payload !== 'object' || !approved || approved.terms !== true) return false;
  const phone = normalizePhone(approved.phone);
  if (phone.length < 7 || phone.length > 15) return false;
  const data = payload.reservationData && typeof payload.reservationData === 'object' ? { ...payload, ...payload.reservationData } : payload;
  const day = data.day ?? data.date;
  const time = data.time;
  const guests = data.nb_guests ?? data.party_size ?? data.partySize;
  // Every observed Zenchef write carries the selection; it must match the approval.
  if (day !== undefined || guests !== undefined) {
    if (String(day) !== approved.date) return false;
    if (time !== undefined && String(time) !== approved.time) return false;
    if (Number(guests) !== approved.party) return false;
    if (data.waiting_list === true || data.waitingList === true) return false;
    if (Array.isArray(data.offers) && data.offers.length) return false;
  }
  // Any guest-carrying payload must reproduce the approved contact exactly.
  const carriesGuest = ['firstname', 'first_name', 'firstName', 'lastname', 'last_name', 'lastName', 'email', 'phone_number', 'phoneNumber'].some(k => data[k] !== undefined);
  if (carriesGuest) {
    const marketingKeys = Object.keys(data).filter(k => /opt_?in|newsletter|marketing|sms|offres|actualites/i.test(k));
    if (marketingKeys.some(k => data[k] === true || data[k] === 'true')) return false;
    return String(data.firstname ?? data.first_name ?? data.firstName) === approved.firstname
      && String(data.lastname ?? data.last_name ?? data.lastName) === approved.lastname
      && String(data.email) === approved.email
      && normalizePhone(data.phone_number ?? data.phoneNumber) === phone;
  }
  // Unknown write shapes fail closed unless they were a matched selection echo.
  return day !== undefined || guests !== undefined;
}

const CONFIG = {
  name: 'Zenchef',
  registryFile: new URL('./zenchef-mirror-restaurants.json', import.meta.url),
  assetHosts: ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com'],
  providerHosts: ['bookings.zenchef.com', 'bookings-middleware.zenchef.com'],
  writePath: /wish|confirm|payment|checkout|cancel|delete|login|register|preauth|pay/i,
  bookable: true,
  readySignal: 'bookings-middleware.zenchef.com',
  contactSelector: '[data-testid="firstname-input"]:visible, input[name="firstname"]:visible',
  contactText: /guest details|your details|contact information|gästuppgifter|dina uppgifter|vos coordonnées|su contacto|ihre daten|dati personali/i,
  contactFields: {
    firstname: '[data-testid="firstname-input"]:visible, input[name="firstname"]:visible',
    lastname: '[data-testid="lastname-input"]:visible, input[name="lastname"]:visible',
    phone: '[data-testid="phone-input"]:visible, input[name="phone_number"]:visible, input[type="tel"]:visible',
    email: '[data-testid="email-input"]:visible, input[name="email"]:visible, input[type="email"]:visible',
    comment: 'textarea[name="comment"]:visible, textarea:visible',
  },
  matches: matchesApprovedReservation,
};

// Inspection default. Unknown mutations fail closed.
export function allowedRequest(method, address) {
  return baseAllowedRequest(CONFIG, method, address);
}

export class ZenchefMirror extends ProviderMirror {
  constructor(options = {}) {
    super(CONFIG, options);
  }
}

const registry = JSON.parse(fs.readFileSync(CONFIG.registryFile, 'utf8'));
export const RESTAURANT_DETAILS = Object.freeze(registry);
export const RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(registry).map(([id, row]) => [id, row.url])));
export { MirrorError };
