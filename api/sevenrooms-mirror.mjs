import fs from 'node:fs';
import { ProviderMirror, MirrorError, baseAllowedRequest, normalizePhone } from './mirror-base.mjs';

// SevenRooms provider module on the shared mirror core. Registry, not user-supplied URLs.
const BOOK_PATH = /^\/booking\/dining\/widget\/[^/]+\/book\/?$/;
const HOLD_PATH = /^\/api-yoa\/dining\/hold\/add\/?$/;

// The provider request must reproduce the approved booking exactly. Unknown or
// extra guest-changing fields, marketing opt-ins, upgrades and gift cards fail closed.
// Every provider POST during an armed submission must pass this check.
// The hold call carries the approved selection (no guest data); the booking call
// must reproduce the approved reservation exactly. Everything else fails closed.
export function matchesApprovedReservation(payload, approved, venueId, path = '') {
  if (!payload || typeof payload !== 'object' || !approved || approved.terms !== true) return false;
  const phone = normalizePhone(approved.phone);
  if (phone.length < 7 || phone.length > 15) return false;
  const data = payload.reservationData && typeof payload.reservationData === 'object' ? { ...payload, ...payload.reservationData } : payload;
  if (venueId && data.venueId && String(data.venueId) !== String(venueId)) return false;
  if (String(data.date) !== approved.date) return false;
  if (String(data.time) !== approved.time) return false;
  if (Number(data.party_size ?? data.partySize) !== approved.party) return false;
  if (HOLD_PATH.test(path)) return true;
  const marketingKeys = Object.keys(data).filter(k => /opt_?in|newsletter|marketing|sms|promo/i.test(k));
  if (marketingKeys.some(k => data[k] === true || data[k] === 'true')) return false;
  if (data.gift_card || data.giftCard || data.giftcard) return false;
  if (Array.isArray(data.upgrades) && data.upgrades.length) return false;
  if (Array.isArray(data.products) && data.products.length) return false;
  const notes = data.reservation_notes ?? data.reservationNotes ?? '';
  return String(data.first_name ?? data.firstName) === approved.firstname
    && String(data.last_name ?? data.lastName) === approved.lastname
    && String(data.email) === approved.email
    && normalizePhone(data.phone_number ?? data.phoneNumber) === phone
    && (approved.comment === undefined ? !notes : String(notes) === approved.comment);
}

export const SEVENROOMS_CONFIG = {
  name: 'SevenRooms',
  registryFile: new URL('./sevenrooms-restaurants.json', import.meta.url),
  assetHosts: ['cdn.sevenrooms.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'use.fontawesome.com', 'js.stripe.com', 'm.stripe.network'],
  providerHosts: ['www.sevenrooms.com', 'sevenrooms.com'],
  writePath: /create|hold|confirm|cancel|delete|checkout|payment|login|register|book|reserve|gift/i,
  bookable: true,
  readySignal: '/api-yoa/',
  contactSelector: 'input[type="email"]:visible, input[name*="first" i]:visible, input[name*="last" i]:visible, input[name*="phone" i]:visible, input[type="tel"]:visible',
  contactText: /guest details|your details|contact information|gästuppgifter|dina uppgifter|vos coordonnées|su contacto/i,
  contactFields: {
    firstname: 'input[name="first_name"]:visible, input[name*="first" i]:visible',
    lastname: 'input[name="last_name"]:visible, input[name*="last" i]:visible',
    phone: 'input[name="phone_number"]:visible, input[type="tel"]:visible',
    email: 'input[name="email"]:visible, input[type="email"]:visible',
    comment: 'textarea[name="reservation_notes"]:visible, textarea:visible',
  },
  matches: matchesApprovedReservation,
};

// Inspection default. Unknown mutations fail closed; outside an armed, approved
// submission no reservation, hold or payment request is ever allowed through.
export function allowedRequest(method, address) {
  return baseAllowedRequest(SEVENROOMS_CONFIG, method, address);
}

export class SevenroomsMirror extends ProviderMirror {
  constructor(options = {}) {
    super(SEVENROOMS_CONFIG, options);
  }
}

const registry = JSON.parse(fs.readFileSync(SEVENROOMS_CONFIG.registryFile, 'utf8'));
export const RESTAURANT_DETAILS = Object.freeze(registry);
export const RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(registry).map(([id, row]) => [id, row.url])));
export { MirrorError };
