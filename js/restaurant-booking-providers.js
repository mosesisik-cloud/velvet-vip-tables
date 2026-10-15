import { bookingLanguage } from './booking-language.js';
import { getBookingCopy, formatBookingCopy } from './booking-copy.js';
// Only reviewed restaurant -> provider mappings are enabled. Discovery results
// must never be used as booking destinations without checking the venue.
let registryPromise;
let reviewedRegistry = {};
export const hasEmbeddedBooking = id => !!resolveEmbeddedBooking(reviewedRegistry, id);
const PROVIDER_HOSTS = Object.freeze({
  'FoodBooking / GloriaFood': ['www.foodbooking.com'],
  TABLFY: ['www.lumabali.com'],
  Meitre: ['lahuella.meitre.com', 'lasusana.meitre.com', 'oro.meitre.com', 'fasano.meitre.com'],
  Elyra: ['widget.elyrasystems.com'], Guestplan: ['angelicabooking.guestplan.io'],
  Dineplan: ['calendar.dineplan.com', 'account.dineplan.com', 'www.dineplan.com'],
  CoverManager: ['www.covermanager.com'],
  Revasi: ['revasi.net'],
  'Restaurant website': ['booking.baolicannes.com'],
  'Prenota Web': ['franchino.prenota-web.it'],
  OpenTable: ['www.opentable.it', 'www.opentable.com', 'www.opentable.co.uk', 'www.opentable.com.au', 'www.opentable.sg'],
  TableCheck: ['www.tablecheck.com'], Zenchef: ['bookings.zenchef.com'],
  'ResDiary / Dish Cult': ['booking.resdiary.com'], Tableo: ['app.tableo.com'],
  Restoo: ['palomaibiza.myrestoo.net'], 'Eat App': ['eatapp.co'],
  TheFork: ['widget.thefork.com', 'module.lafourchette.com'],
  Resy: ['resy.com'], Tock: ['www.exploretock.com'], OMAKASE: ['omakase.in'],
});
const EMBED_PROVIDERS = new Set(['TABLFY', 'Meitre', 'Elyra', 'Guestplan', 'TableCheck', 'Zenchef', 'ResDiary / Dish Cult', 'Tableo', 'Restoo', 'Eat App']);
const IDENTITY_PARAMS = new Set(['rid', 'restref', 'restaurantid', 'restaurant_id', 'venue', 'venue_id', 'id', 'restaurant_uid', 'reservation']);
function venueKey(url) {
  const identity = [...url.searchParams].filter(([key]) => IDENTITY_PARAMS.has(key.toLowerCase()))
    .map(([key, value]) => [key.toLowerCase(), value]).sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
  return url.host + url.pathname + (identity.length ? '?' + identity.map(([key, value]) => key + '=' + encodeURIComponent(value)).join('&') : '');
}

// Kept under the original exported name for existing detail/list callers. The
// returned integrationMode explicitly distinguishes embedded and external flows.
export function resolveEmbeddedBooking(registry, restaurantId) {
  if (!registry || !Object.hasOwn(registry, restaurantId)) return null;
  const row = registry[restaurantId];
  if (!row) return null;
  try {
    const url = new URL(row.url);
    const source = new URL(row.source);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash
      || source.protocol !== 'https:' || source.username || source.password) return null;
    if (row.provider === 'SevenRooms') {
      if (row.integrationMode === 'external_link') {
        if (!['official_link_only','official_link_no_current_offers'].includes(row.verification)
          || !['www.sevenrooms.com','sevenrooms.com','eu.sevenrooms.com'].includes(url.hostname)
          || url.search || row.venueKey !== venueKey(url) || !/^[a-z0-9_-]+$/i.test(row.venueId)) return null;
        const path = url.pathname.split('/').filter(Boolean);
        if (path.length !== 2 || !['reservations','experiences'].includes(path[0]) || path[1] !== row.venueId) return null;
        return {...row, restaurantId, url:url.href, integrationMode:'external_link'};
      }
      if (!/^[a-z0-9_-]+$/i.test(row.venueId) || row.verification !== 'embedded_form_loaded'
        || !['www.sevenrooms.com', 'sevenrooms.com', 'eu.sevenrooms.com'].includes(url.hostname) || url.search) return null;
      const parts = url.pathname.split('/').filter(Boolean);
      if (!['reservations', 'explore'].includes(parts[0]) || parts[1] !== row.venueId) return null;
      if (parts[0] === 'reservations' && parts.length !== 2) return null;
      if (parts[0] === 'explore' && parts.slice(2).join('/') !== 'reservations/create/search') return null;
      if (row.integrationMode && row.integrationMode !== 'native_embed') return null;
      return { ...row, restaurantId, url: url.href, integrationMode: 'native_embed' };
    }
    if (!Object.hasOwn(PROVIDER_HOSTS, row.provider) || !PROVIDER_HOSTS[row.provider].includes(url.hostname)
      || !row.venueKey || row.venueKey !== venueKey(url)) return null;
    if (row.provider === 'FoodBooking / GloriaFood' && (url.pathname !== '/ordering/restaurant/menu' || url.searchParams.get('reservation') !== 'true')) return null;
    // Dineplan cross-site guest selection failed; use the original standalone flow.
    if (row.provider === 'Dineplan' && row.integrationMode === 'native_embed') return null;
    const embedded = row.integrationMode === 'native_embed' && row.verification === 'embedded_form_loaded' && EMBED_PROVIDERS.has(row.provider);
    if (!embedded && (row.integrationMode !== 'external_link' || !['official_restaurant_link_verified', 'official_link_only', 'provider_page_loaded'].includes(row.verification))) return null;
    if (row.provider === 'Resy') { url.searchParams.delete('date'); url.searchParams.delete('seats'); }
    return { ...row, restaurantId, url: url.href, integrationMode: embedded ? 'native_embed' : 'external_link' };
  } catch { return null; }
}

export async function getEmbeddedBooking(restaurantId) {
  registryPromise ||= fetch(new URL('../data/booking-providers.json', import.meta.url), { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('registry_unavailable'); return response.json(); })
    .then(registry => { reviewedRegistry = registry; return registry; })
    .catch(() => { registryPromise = null; return {}; });
  return resolveEmbeddedBooking(await registryPromise, restaurantId);
}

export function mountEmbeddedBooking(container, booking, language = 'sv') {
  const copy = getBookingCopy(language);
  const localized = bookingLanguage(booking, language);
  const text = key => formatBookingCopy(copy[key], {provider:booking.provider, name:booking.name});
  const languageNote = document.createElement('p');
  languageNote.className = 'booking-language-note';
  languageNote.textContent = copy[localized.notice];
  // The cross-origin provider owns every field, availability response, consent,
  // payment and confirmation. Velvet does not infer success from iframe loads
  // or untrusted postMessages, and does not store contact or card details.
  const source = document.createElement('p');
  source.className = 'booking-source';
  source.textContent = text('source');
  const intro = document.createElement('p');
  intro.className = 'booking-intro';
  if (booking.integrationMode === 'external_link') {
    intro.textContent = text('externalIntro');
    if (booking.availabilityNote) intro.textContent += ' ' + booking.checkedAt + ': ' + booking.availabilityNote;
    const link = document.createElement('a');
    link.href = localized.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.className = 'btn btn-gold';
    link.textContent = text('externalLink');
    container.replaceChildren(source, intro, link, languageNote);
    return;
  }
  intro.textContent = copy.originalIntro;
  const start = document.createElement('button');
  start.className = 'btn btn-gold'; start.type = 'button'; start.textContent = copy.findTable;
  const stage = document.createElement('div'); stage.className = 'booking-provider-stage';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const fallback = document.createElement('a');
  fallback.href = localized.url; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer';
  fallback.className = 'restaurant-official-book';
  fallback.textContent = copy.fallbackLink;
  container.replaceChildren(source, intro, languageNote, start, status, stage, fallback);
  start.addEventListener('click', () => {
    if (stage.firstChild) return;
    start.remove();
    intro.textContent = copy.activeIntro;
    status.textContent = copy.opening;
    const frame = document.createElement('iframe');
    frame.className = 'booking-provider-frame';
    frame.title = text('frameTitle');
    frame.allow = 'payment';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.addEventListener('load', () => { status.textContent = ''; });
    frame.addEventListener('error', () => { status.textContent = copy.loadError; });
    frame.src = localized.url;
    stage.append(frame);
    requestAnimationFrame(() => {
      if (stage.isConnected) {
        stage.style.scrollMarginTop = ((document.querySelector('.site-header')?.getBoundingClientRect().height || 88) + 12) + 'px';
        stage.scrollIntoView({block:'start',behavior:'auto'});
      }
    });
  });
}
