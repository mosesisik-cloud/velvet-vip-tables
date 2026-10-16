/* VELVET service worker — PWA-offlinestöd.
 * Strategi:
 *  - html/css/js/json: network-first (iPhone-PWA fick annars kraschat JS för evigt).
 *    OBS: bumpa VERSION vid varje deploy som ändrar skalet — annars serveras gammal version.
 *  - venue-events.json och /velvet-api/events: network-first (daglig crawl).
 *  - Google Fonts + Leaflet (unpkg) + CARTO-tiles: stale-while-revalidate i runtime-cache.
 *  - Venue-foton och Pexels (hero) cachas INTE — <img>/<video> går mot nätet
 *    så PWA:n inte lagrar tredjepartsbilder utan licens.
 *  - Navigationer utan cache och utan nät → offline.html i VELVET-stil.
 *  - Video (hero) och range-requests cachas ALDRIG (206:or kraschar Cache API och fyller kvoten).
 */
"use strict";

const VERSION = "v4-real-214-italiano-dining";
const SHELL_CACHE = "velvet-shell-" + VERSION;
const RUNTIME_CACHE = "velvet-runtime-" + VERSION;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./css/app.css",
  "./css/availability-search.css",
  "./js/app.js",
  "./js/place-brand.js",
  "./css/place-brand.css",
  "./data/venue-brands.json",
  "./data/restaurant-brands.json",
  "./js/navigation-state.js",
  "./js/booking-selection.js",
  "./js/booking-report.js",
  "./js/availability-search.js",
  "./js/availability-copy.js",
  "./js/restaurant-booking-providers.js",
  "./js/ux-booking.js",
  "./js/ux-copy.js",
  "./js/auth-options.js",
  "./js/restaurant-copy.js",
  "./js/bokabord-mirror.js",
  "./js/provider-playwright-booking.js",
  "./js/i18n.js",
  "./js/mrz.js",
  "./js/passport-ocr.js",
  "./js/face-idv.js",
  "./fonts/inter-latin.woff2",
  "./fonts/playfair-display-latin.woff2",
  "./fonts/space-grotesk-latin.woff2",
  "./fonts/syne-latin.woff2",
  "./data/destinations.json",
  "./data/venues.json",
  "./data/extra-destinations.json",
  "./data/unlisted-venues.json",
  "./data/club-rankings.json",
  "./data/restaurants.json",
  "./data/restaurant-menus.json",
  "./data/venue-images.json",
  "./data/venue-layouts.json",
  "./data/venue-youtube.json",
  "./data/booking-urls.json",
  "./data/booking-providers.json",
  "./data/venue-packages.json",
  "./data/venue-menus.json",
  "./data/venue-events.json",
  "./data/venue-facts.json",
  "./data/venue-image-sources.json",
  "./data/google-places.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

// Cross-origin som får ligga i runtime-cachen. Inte klubbfoton, inte Pexels.
function isRuntimeCdn(hostname) {
  return (
    hostname === "fonts.googleapis.com" ||
    hostname === "fonts.gstatic.com" ||
    hostname.endsWith(".gstatic.com") ||
    hostname === "unpkg.com" ||
    hostname.endsWith(".unpkg.com") ||
    hostname === "cdn.jsdelivr.net" ||
    hostname.endsWith(".jsdelivr.net") ||
    hostname === "basemaps.cartocdn.com" ||
    hostname.endsWith(".basemaps.cartocdn.com") ||
    hostname === "cartocdn.com" ||
    hostname.endsWith(".cartocdn.com")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // addAll avbryter HELA installen vid en enda 404 (typsnitt saknades live
    // → användare fastnade på kraschat app.js och såg tom katalog).
    await Promise.all(SHELL_ASSETS.map((url) => cache.add(url).catch(() => undefined)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => (k.startsWith("velvet-shell-") || k.startsWith("velvet-runtime-")) &&
                       k !== SHELL_CACHE && k !== RUNTIME_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // The shell is precached without version queries. Imported modules and CSS
    // use ?v=…; match only public shell entries when the exact request is absent.
    const shell = await caches.open(SHELL_CACHE);
    const shellAsset = await shell.match(request, { ignoreSearch: true });
    if (shellAsset) return shellAsset;
    throw err;
  }
}

// Cache-first: skalet ändras bara vid deploy (då bumpas VERSION).
async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

// Stale-while-revalidate: svara direkt från cache, uppdatera i bakgrunden.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const fresh = await network;
  if (fresh) return fresh;
  return Response.error();
}

// Navigationer: alltid nätet först. Cache-first här var varför iPhone-ikonen
// fastnade på kraschat JS — ny deploy nådde aldrig hemskärmen.
async function handleNavigation(request) {
  try {
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh && fresh.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put("./index.html", fresh.clone());
      return fresh;
    }
  } catch (_) { /* offline */ }
  const cached = await caches.match("./index.html") || await caches.match(request);
  if (cached) return cached;
  const offline = await caches.match("./offline.html");
  return offline || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Video/range-requests: rör inte (hero-videon streamas med 206:or).
  if (request.headers.has("range")) return;
  const url = new URL(request.url);
  if (request.destination === "video" || /\.(mp4|webm|m3u8)(\?|$)/i.test(url.pathname)) return;

  // Provider pages and private booking state must never enter Velvet caches.
  if (url.origin !== self.location.origin && request.mode === "navigate") return;
  if (url.origin === self.location.origin && /\/(?:restaurant-bookings|availability)(?:\/|$)/.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    // Daglig crawl + API: alltid nätet först, cache bara som offline-backup.
    if (/venue-events\.json(\?|$)/i.test(url.pathname) || /venue-menus\.json(\?|$)/i.test(url.pathname) || /google-places\.json(\?|$)/i.test(url.pathname) || /venue-facts\.json(\?|$)/i.test(url.pathname) || /\/velvet-api\//i.test(url.pathname) || /\/events(\/|$)/i.test(url.pathname) || /\/places(\/|$)/i.test(url.pathname) || /\/facts(\/|$)/i.test(url.pathname) || /\/inventory(\/|$)/i.test(url.pathname) || /\/menus(\/|$)/i.test(url.pathname)) {
      event.respondWith(networkFirst(request));
      return;
    }
    // html/css/js/json: nätet först så en kraschad deploy inte låser iPhone-PWA.
    if (/\.(html|css|js|json|webmanifest)(\?|$)/i.test(url.pathname)) {
      event.respondWith(networkFirst(request));
      return;
    }
    if (/\.(png|svg|woff2)(\?|$)/i.test(url.pathname)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    // Övrigt same-origin (t.ex. framtida bilder) → SWR
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Cross-origin: bara typsnitt, Leaflet och kartplattor. Klubbfoton och Pexels går mot nätet.
  if (isRuntimeCdn(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
