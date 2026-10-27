import fs from 'node:fs';
import { ProviderMirror, MirrorError, baseAllowedRequest } from './mirror-base.mjs';

// CoverManager provider module on the shared mirror core. Registry, not user-supplied URLs.
// Renderar i spegeln (verifierat 2026-10-16, Lío Ibiza). Flöde drivet 2026-10-24 med
// skrivanrop avbrutna i webbläsaren: kalender/gäst/tid/zon fungerar via dokumenterade
// läs-POST:ar. Bokningssteget är reCAPTCHA-gateat (/reservs/avaible_reserv_module) —
// CAPTCHA kringgås aldrig, därför stannar skarp inlämning avstängd (bookable: false).
const CONFIG = {
  name: 'CoverManager',
  registryFile: new URL('./covermanager-mirror-restaurants.json', import.meta.url),
  assetHosts: ['cdnjs.cloudflare.com', 'ajax.googleapis.com', 'unpkg.com', 'js.stripe.com', 'm.stripe.network', 'fonts.googleapis.com', 'fonts.gstatic.com'],
  providerHosts: ['www.covermanager.com', 'covermanager.com'],
  writePath: /save|confirm|payment|checkout|cancel|delete|login|register|buy|pay|reservs/i,
  // Session-scoped UI-state echoes observed 2026-10-24; they create no reservation.
  // NOTE: the booking gate /reservs/avaible_reserv_module is reCAPTCHA-protected.
  // The mirror never bypasses CAPTCHA, so live submission stays off for CoverManager.
  allowReadPosts: [/^\/reservation\/(update_people|update_hours|update_hour_people|update_extra|update_extra_message|ibox2|highlight|interactiveMap)(\/|$)/],
  bookable: false,
  readySignal: '/reservation/',
  contactSelector: 'input[type="email"]:visible, input[name*="first" i]:visible, input[name*="last" i]:visible, input[name*="phone" i]:visible, input[type="tel"]:visible',
  contactText: /guest details|your details|contact information|gästuppgifter|dina uppgifter|vos coordonnées|su contacto|ihre daten|dati personali/i,
  contactFields: {
    firstname: 'input[name="first_name"]:visible, input[name*="first" i]:visible',
    lastname: 'input[name="last_name"]:visible, input[name*="last" i]:visible',
    phone: 'input[name="phone_number"]:visible, input[name*="phone" i]:visible, input[type="tel"]:visible',
    email: 'input[name="email"]:visible, input[type="email"]:visible',
    comment: 'textarea[name="reservation_notes"]:visible, textarea:visible',
  },
  matches: () => false,
};

// Inspection only. Unknown mutations fail closed.
export function allowedRequest(method, address) {
  return baseAllowedRequest(CONFIG, method, address);
}

export class CovermanagerMirror extends ProviderMirror {
  constructor(options = {}) {
    super(CONFIG, options);
  }
}

const registry = JSON.parse(fs.readFileSync(CONFIG.registryFile, 'utf8'));
export const RESTAURANT_DETAILS = Object.freeze(registry);
export const RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(registry).map(([id, row]) => [id, row.url])));
export { MirrorError };
