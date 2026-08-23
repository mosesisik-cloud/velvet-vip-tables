#!/usr/bin/env node
/**
 * Match VELVET venues to Google Places and cache rating + reviews.
 * Never invents stars. Unmatched venues get mapsUrl only (no rating).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const APP_DATA = process.env.VELVET_APP_DATA || path.join(ROOT, "data");
const PLACES_FILE = process.env.VELVET_PLACES || path.join(APP_DATA, "google-places.json");
const RESTAURANTS_FILE = process.env.VELVET_RESTAURANTS || path.join(APP_DATA, "restaurants.json");
const PAY_FILE = process.env.VELVET_PAY || path.join(__dir, "pay.json");
const FC_URL = "https://api.firecrawl.dev/v2/scrape";
const PLACES_API = "https://places.googleapis.com/v1/places:searchText";

const SCHEMA = {
  type: "object",
  properties: {
    placeName: { type: ["string", "null"] },
    rating: { type: ["number", "null"], description: "Google star rating 1-5 if shown. Null if missing. Do not invent." },
    reviewCount: { type: ["integer", "null"] },
    mapsUrl: { type: ["string", "null"] },
    placeId: { type: ["string", "null"] },
    website: { type: ["string", "null"] },
    reviews: {
      type: "array",
      items: {
        type: "object",
        properties: {
          author: { type: "string" },
          rating: { type: ["number", "null"] },
          text: { type: "string" },
          relativeTime: { type: ["string", "null"] },
        },
      },
    },
  },
};

let running = null;
let restaurantsRunning = null;

function fold(s) {
  return String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function namesMatch(a, b) {
  const na = fold(a);
  const nb = fold(b);
  if (!na || !nb || na.length < 4 || nb.length < 4) return false;
  return na.includes(nb) || nb.includes(na);
}
function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./i, "").toLowerCase(); }
  catch { return ""; }
}
function payKey(field) {
  if (process.env[field]) return process.env[field];
  try {
    const p = JSON.parse(fs.readFileSync(PAY_FILE, "utf8"));
    if (field === "FIRECRAWL_API_KEY") return String(p.firecrawlKey || "").trim();
    if (field === "GOOGLE_PLACES_API_KEY") return String(p.googlePlacesKey || "").trim();
  } catch {}
  return "";
}
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function writeJsonAtomic(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  try { fs.renameSync(tmp, file); }
  catch { fs.copyFileSync(tmp, file); try { fs.unlinkSync(tmp); } catch {} }
}

export function loadPlacesFile() {
  const raw = readJson(PLACES_FILE, {});
  if (raw && raw.venues && typeof raw.venues === "object") {
    return { fetchedAt: raw.fetchedAt || null, venues: raw.venues };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { fetchedAt: null, venues: raw };
  }
  return { fetchedAt: null, venues: {} };
}

export function loadRestaurantsFile() {
  const raw = readJson(RESTAURANTS_FILE, {});
  return raw && raw.destinations && typeof raw.destinations === "object"
    ? raw
    : { fetchedAt: null, minimumRating: 3.8, destinations: {} };
}

function mapsSearchUrl(name, city) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([name, city].filter(Boolean).join(", "));
}

function loadCatalog() {
  const venues = readJson(path.join(APP_DATA, "venues.json"), []);
  const extra = readJson(path.join(APP_DATA, "unlisted-venues.json"), []);
  const dests = readJson(path.join(APP_DATA, "destinations.json"), []);
  const extraD = readJson(path.join(APP_DATA, "extra-destinations.json"), []);
  const destBy = {};
  for (const d of [...dests, ...extraD]) destBy[d.code] = d;
  const list = [...(Array.isArray(venues) ? venues : []), ...(Array.isArray(extra) ? extra : [])];
  return { list, destBy };
}

async function placesApiSearch(query) {
  const key = payKey("GOOGLE_PLACES_API_KEY");
  if (!key) return null;
  const r = await fetch(PLACES_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.reviews,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 3, languageCode: "en" }),
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("places " + r.status);
  return Array.isArray(j.places) ? j.places : [];
}

async function restaurantApiSearch(destination) {
  const key = payKey("GOOGLE_PLACES_API_KEY");
  if (!key) throw new Error("google_places_key_missing");
  const query = `top restaurants in ${destination.name}, ${destination.country}`;
  const r = await fetch(PLACES_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.formattedAddress,places.primaryType,places.types,places.priceLevel",
    },
    body: JSON.stringify({
      textQuery: query,
      includedType: "restaurant",
      strictTypeFiltering: true,
      minRating: 3.8,
      maxResultCount: 20,
      languageCode: "en",
    }),
    signal: AbortSignal.timeout(25000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`places ${r.status}: ${j.error?.message || "search failed"}`);
  return (Array.isArray(j.places) ? j.places : [])
    .filter((p) => Number(p.rating) >= 3.8)
    .map((p) => ({
      placeId: p.id || "",
      name: p.displayName?.text || "",
      rating: Math.round(Number(p.rating) * 10) / 10,
      reviewCount: Number(p.userRatingCount) || 0,
      address: p.formattedAddress || "",
      mapsUrl: p.googleMapsUri || "",
      website: p.websiteUri || "",
      priceLevel: p.priceLevel || "",
      primaryType: p.primaryType || "restaurant",
      source: "Google Places",
    }))
    .filter((p) => p.placeId && p.name)
    .sort((a, b) => (b.rating + Math.min(.35, Math.log10(b.reviewCount + 1) / 12)) - (a.rating + Math.min(.35, Math.log10(a.reviewCount + 1) / 12)));
}

export async function runRestaurantDiscovery(opts = {}) {
  if (restaurantsRunning) return restaurantsRunning;
  const job = (async () => {
    const { destBy } = loadCatalog();
    const only = String(opts.destinationCode || "").trim().toUpperCase();
    const targets = Object.values(destBy).filter((d) => d && d.code && (!only || d.code === only));
    if (only && !targets.length) throw new Error("destination_not_found");
    const previous = loadRestaurantsFile();
    const destinations = { ...previous.destinations };
    const errors = [];
    const rows = await mapPool(targets, 2, async (d) => {
      try { return { d, restaurants: await restaurantApiSearch(d) }; }
      catch (error) { errors.push({ code: d.code, error: String(error.message || error) }); return null; }
    });
    for (const row of rows) {
      if (!row) continue;
      destinations[row.d.code] = {
        destination: row.d.name,
        country: row.d.country,
        fetchedAt: new Date().toISOString(),
        restaurants: row.restaurants,
      };
    }
    const payload = { fetchedAt: new Date().toISOString(), minimumRating: 3.8, maxPerDestination: 20, destinations };
    writeJsonAtomic(RESTAURANTS_FILE, payload);
    return { ok: errors.length === 0, checked: targets.length, errors, payload };
  })();
  restaurantsRunning = job;
  try { return await job; }
  finally { restaurantsRunning = null; }
}

async function firecrawlMaps(url) {
  const key = payKey("FIRECRAWL_API_KEY");
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const r = await fetch(FC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url,
      formats: [{
        type: "json",
        schema: SCHEMA,
        prompt: "Extract the Google Maps place rating and reviews shown on this page. Do not invent. rating is 1-5, reviewCount is the number of Google reviews. Include up to 5 review snippets with author and text.",
      }],
      onlyMainContent: true,
      waitFor: 3500,
      timeout: 25000,
    }),
    signal: AbortSignal.timeout(32000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("firecrawl " + r.status);
  return (j.data && j.data.json) || j.json || null;
}

function fromPlacesApi(place) {
  const reviews = (place.reviews || []).slice(0, 5).map((rv) => ({
    author: String(rv.authorAttribution?.displayName || "").slice(0, 80),
    rating: Number(rv.rating) || null,
    text: String(rv.text?.text || rv.originalText?.text || "").slice(0, 600),
    relativeTime: rv.relativePublishTimeDescription || null,
  })).filter((rv) => rv.text);
  return {
    placeName: place.displayName?.text || "",
    rating: Number(place.rating) || null,
    reviewCount: Number(place.userRatingCount) || null,
    mapsUrl: place.googleMapsUri || "",
    placeId: place.id || "",
    website: place.websiteUri || "",
    address: place.formattedAddress || "",
    reviews,
    engine: "places-api",
  };
}

function acceptMatch(v, rec) {
  if (!rec) return false;
  if (rec.website && v.website_url && hostOf(rec.website) && hostOf(rec.website) === hostOf(v.website_url)) return true;
  if (rec.placeName && namesMatch(rec.placeName, v.name)) return true;
  return false;
}

function cleanRec(v, rec, query) {
  const rating = Number(rec.rating);
  const count = Number(rec.reviewCount);
  const mapsUrl = rec.mapsUrl && /^https:\/\/(www\.)?google\./i.test(rec.mapsUrl)
    ? rec.mapsUrl
    : (rec.placeId
      ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v.name) + "&query_place_id=" + encodeURIComponent(rec.placeId)
      : mapsSearchUrl(v.name, v.destination));
  const matched = acceptMatch(v, rec) && Number.isFinite(rating) && rating >= 1 && rating <= 5;
  const out = {
    matched,
    channel: "google",
    query,
    placeName: rec.placeName || "",
    placeId: rec.placeId || "",
    mapsUrl,
    fetchedAt: new Date().toISOString(),
    engine: rec.engine || "firecrawl",
  };
  if (matched) {
    out.rating = Math.round(rating * 10) / 10;
    out.reviewCount = Number.isFinite(count) && count >= 0 ? count : null;
    out.reviews = Array.isArray(rec.reviews) ? rec.reviews.slice(0, 5) : [];
    out.address = rec.address || "";
  }
  return out;
}

async function lookupOne(v) {
  const query = [v.name, v.destination].filter(Boolean).join(", ");
  const maps = mapsSearchUrl(v.name, v.destination);
  try {
    const apiPlaces = await placesApiSearch(query);
    if (apiPlaces && apiPlaces.length) {
      for (const p of apiPlaces) {
        const rec = fromPlacesApi(p);
        if (acceptMatch(v, rec) && rec.rating) return cleanRec(v, rec, query);
      }
    }
  } catch { /* try firecrawl */ }
  try {
    const fc = await firecrawlMaps(maps);
    if (fc) {
      fc.engine = "firecrawl";
      return cleanRec(v, fc, query);
    }
  } catch { /* unmatched */ }
  return {
    matched: false,
    channel: "google",
    query,
    mapsUrl: maps,
    fetchedAt: new Date().toISOString(),
    engine: "maps-link",
  };
}

async function mapPool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, () => worker()));
  return out;
}

export async function runPlacesLookup(opts = {}) {
  if (running) return running;
  const job = (async () => {
    const { list } = loadCatalog();
    const prev = loadPlacesFile().venues;
    const only = String(opts.venueId || "").trim();
    const targets = only ? list.filter((v) => v.venue_id === only) : list.filter((v) => v.listed !== false);
    const out = { ...prev };
    let matched = 0;
    const results = await mapPool(targets, only ? 1 : 3, async (v) => {
      const rec = await lookupOne(v);
      return { id: v.venue_id, rec };
    });
    for (const row of results) {
      if (!row) continue;
      out[row.id] = row.rec;
      if (row.rec.matched) matched += 1;
    }
    const payload = { fetchedAt: new Date().toISOString(), venues: out };
    writeJsonAtomic(PLACES_FILE, payload);
    console.log("velvet-places", targets.length, "looked up", matched, "matched");
    return { ok: true, checked: targets.length, matched, payload };
  })();
  running = job;
  try { return await job; }
  finally { running = null; }
}

export function getPlacesState() {
  return { running: !!running, file: loadPlacesFile() };
}

const invoked = String(process.argv[1] || "").replace(/\\/g, "/");
if (invoked.endsWith("google-places.mjs")) {
  const i = process.argv.indexOf("--venue");
  const venueId = i >= 0 ? process.argv[i + 1] : "";
  runPlacesLookup({ venueId, reason: "cli" })
    .then((st) => { console.log(JSON.stringify({ ok: st.ok, checked: st.checked, matched: st.matched })); })
    .catch((e) => { console.error(e); process.exitCode = 1; });
}
