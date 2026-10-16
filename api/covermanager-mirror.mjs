import fs from 'node:fs';
import { ProviderMirror, MirrorError, baseAllowedRequest } from './mirror-base.mjs';

// CoverManager provider module on the shared mirror core. Registry, not user-supplied URLs.
// Renderar i spegeln (verifierat 2026-10-16, Lío Ibiza). Modulen skickar egna POST:ar vid laddning - spegelns vakt blockerar dem i inspect-läge.
// Live submission stays disabled (bookable: false) until the provider's booking
// contract is verified in a coordinated test; the armed-submission guard in the
// core still fails closed on any provider POST.
const CONFIG = {
  name: 'CoverManager',
  registryFile: new URL('./covermanager-mirror-restaurants.json', import.meta.url),
  assetHosts: ['cdnjs.cloudflare.com', 'ajax.googleapis.com', 'unpkg.com', 'js.stripe.com', 'm.stripe.network', 'fonts.googleapis.com', 'fonts.gstatic.com'],
  providerHosts: ['www.covermanager.com', 'covermanager.com'],
  writePath: /save|confirm|payment|checkout|cancel|delete|login|register|buy|pay/i,
  // Session-scoped UI-state echoes observed at page load; they create no reservation.
  allowReadPosts: [/^\/reservation\/(update_people|update_hours|ibox2|highlight)\//],
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
