import fs from 'node:fs';
import { ProviderMirror, MirrorError, baseAllowedRequest } from './mirror-base.mjs';

// OpenTable provider module on the shared mirror core. Registry, not user-supplied URLs.
// BLOCKERAD i testmiljön: Akamai nekade alla anrop (HTTP 403 / ERR_HTTP2_PROTOCOL_ERROR, 2026-10-16). Åtkomstskyddet kringgås inte.
// Live submission stays disabled (bookable: false) until the provider's booking
// contract is verified in a coordinated test; the armed-submission guard in the
// core still fails closed on any provider POST.
const CONFIG = {
  name: 'OpenTable',
  registryFile: new URL('./opentable-mirror-restaurants.json', import.meta.url),
  assetHosts: ['cdn.otstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'js.stripe.com', 'm.stripe.network'],
  providerHosts: ['www.opentable.com', 'www.opentable.com.mx', 'www.opentable.co.uk', 'www.opentable.de', 'www.opentable.com.au', 'www.opentable.ca', 'www.opentable.ie'],
  writePath: /cancel|delete|payment|checkout|login|register|confirm|complete/i,
  bookable: false,
  readySignal: null,
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

export class OpentableMirror extends ProviderMirror {
  constructor(options = {}) {
    super(CONFIG, options);
  }
}

const registry = JSON.parse(fs.readFileSync(CONFIG.registryFile, 'utf8'));
export const RESTAURANT_DETAILS = Object.freeze(registry);
export const RESTAURANTS = Object.freeze(Object.fromEntries(Object.entries(registry).map(([id, row]) => [id, row.url])));
export { MirrorError };
