/* VELVET service worker — PWA-offlinestöd.
 * Strategi:
 *  - App-skalet (html/css/js/json + ikoner): cache-first, förcachat vid install.
 *    OBS: bumpa VERSION vid varje deploy som ändrar skalet — annars serveras gammal version.
 *  - venue-events.json och /velvet-api/events: network-first (daglig crawl).
 *  - Google Fonts + Leaflet (unpkg) + CARTO-tiles: stale-while-revalidate i runtime-cache.
 *  - Venue-foton och Pexels (hero) cachas INTE — <img>/<video> går mot nätet
 *    så PWA:n inte lagrar tredjepartsbilder utan licens.
 *  - Navigationer utan cache och utan nät → offline.html i VELVET-stil.
 *  - Video (hero) och range-requests cachas ALDRIG (206:or kraschar Cache API och fyller kvoten).
 */
"use strict";

const VERSION = "v4-real-69";
const SHELL_CACHE = "velvet-shell-" + VERSION;
const RUNTIME_CACHE = "velvet-runtime-" + VERSION;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./css/app.css",
  "./js/app.js",
  "./js/i18n.js",
  "./js/mrz.js",
  "./js/passport-ocr.js",
  "./js/face-idv.js",
  "./fonts/inter-latin.woff2",
  "./fonts/playfair-display-latin.woff2",
  "./data/destinations.json",
  "./data/venues.json",
  "./data/extra-destinations.json",
  "./data/unlisted-venues.json",
  "./data/club-rankings.json",
  "./data/venue-images.json",
  "./data/venue-youtube.json",
  "./data/booking-urls.json",
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

// Navigationer: SPA:n bor i index.html (hash-router) — cache-first, nät som backup, offline.html som sista utväg.
async function handleNavigation(request) {
  const cached = await caches.match("./index.html");
  if (cached) return cached;
  try {
    return await fetch(request);
  } catch (_) {
    const offline = await caches.match("./offline.html");
    return offline || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Video/range-requests: rör inte (hero-videon streamas med 206:or).
  if (request.headers.has("range")) return;
  const url = new URL(request.url);
  if (request.destination === "video" || /\.(mp4|webm|m3u8)(\?|$)/i.test(url.pathname)) return;

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
    // App-skal: html/css/js/json + ikoner → cache-first
    if (/\.(html|css|js|json|png|svg|webmanifest)(\?|$)/i.test(url.pathname)) {
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
