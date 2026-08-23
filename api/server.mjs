import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadEventsFile, loadCrawlStatus, runCrawl, getCrawlState, scheduleDailyCrawl } from "./crawl-events.mjs";
import { loadPlacesFile, runPlacesLookup, loadRestaurantsFile, runRestaurantDiscovery } from "./google-places.mjs";
import { loadFactsFile, runFactsCrawl } from "./venue-facts.mjs";
import { loadMenusFile, runMenusCrawl } from "./crawl-menus.mjs";
import { parseTd3, extractMrzFromText, nameMatch, publicFields, legalName, ageYears } from "./mrz.mjs";
import { bookingAdapter, handoffUrl, packetText, publicBridge, officialEventUrl, destInventory } from "./book-bridge.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));

// ---------- SevenRooms live-inventarie (offentligt widget-API, ingen nyckel) ----------
// Verifierade slugs per VELVET-venue (api/sr-venues.json). Läs bara — ingen skrivning
// i deras system förrän partnerskap finns (se docs/sevenrooms-och-integrationsplan.md).
const SR_VENUES = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dir, "sr-venues.json"), "utf8")); } catch { return {}; }
})();
const srCache = new Map(); // "vid|date|party" -> { at, data }
async function srFetchJson(p) {
  const r = await fetch("https://www.sevenrooms.com" + p, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; VELVET-availability-bridge)" },
  });
  if (!r.ok) throw new Error("sr_http_" + r.status);
  const j = await r.json();
  if (j.status !== 200 || !j.data) throw new Error(j.msg || "sr_error");
  return j.data;
}
function srToday() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

// Direktbokning mot SevenRooms publika widget-flöde: range → slot → hold → book.
// X-Checkout-Hash (SHA-256 av "förnamn|efternamn" lowercase) är deras anti-bot-header —
// utan den svarar book-endpointen bara "Booking failed." (Knäckt 2026-08-23, se docs.)
async function srBookSlot(slug, { date, time, party, guest, note, lang }) {
  const [y, m, d] = String(date).split("-");
  const mdY = `${m}-${d}-${y}`;
  const srLang = /^(sv|en|es|fr)$/.test(String(lang || "")) ? lang : "en";
  const range = await srFetchJson(`/api-yoa/availability/widget/range?venue=${slug}&time_slot=${encodeURIComponent(time)}&party_size=${party}&halo_size_interval=64&start_date=${mdY}&num_days=1&channel=SEVENROOMS_WIDGET&selected_lang_code=${srLang}`);
  const daySlots = (range.availability && range.availability[date]) || [];
  let slot = null, shift = null;
  for (const sh of daySlots) {
    for (const t of sh.times || []) {
      if (t.type === "book" && t.time === time) { slot = t; shift = sh; break; }
    }
    if (slot) break;
  }
  if (!slot) return { error: "slot_gone" };
  const holdResp = await fetch("https://www.sevenrooms.com/api-yoa/dining/hold/add", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (compatible; VELVET-booking-bridge)" },
    body: JSON.stringify({
      access_persistent_id: slot.access_persistent_id, actual_id: null, party_size: party, date,
      shift_persistent_id: shift.shift_persistent_id, channel: "SEVENROOMS_WIDGET",
      client_id: null, experience_id: null, picked_duration: null, time,
      tracking_slug: null, venue: slug,
    }),
  }).then((r) => r.json()).catch(() => null);
  const holdId = holdResp?.data?.reservation_hold_id;
  if (!holdId) return { error: "hold_failed", detail: holdResp?.msg || null };
  const first = String(guest.firstName || "").trim();
  const last = String(guest.lastName || "").trim();
  const hash = crypto.createHash("sha256").update(`${first.toLowerCase()}|${last.toLowerCase()}`).digest("hex");
  const rawPhone = String(guest.phone || "").trim();
  let dial = String(guest.dialCode || "").replace(/^\+/, "");
  let country = String(guest.countryCode || "").toUpperCase();
  const plus = rawPhone.replace(/[^\d+]/g, "");
  if (!dial && (plus.startsWith("+") || plus.startsWith("00"))) {
    const rest = plus.replace(/^\+/, "").replace(/^00/, "");
    for (const d of ["971", "358", "354", "353", "351", "61", "55", "52", "54", "81", "90", "49", "48", "47", "46", "45", "44", "43", "41", "39", "34", "33", "32", "31", "30", "27", "1"]) {
      if (rest.startsWith(d)) { dial = d; break; }
    }
  }
  if (!dial && /^0/.test(rawPhone.replace(/\s/g, ""))) dial = "46";
  if (!country && dial === "46") country = "SE";
  let phone = rawPhone.replace(/\D/g, "");
  if (dial && phone.startsWith(dial)) phone = phone.slice(dial.length);
  if (phone.startsWith("0")) phone = phone.slice(1);
  const form = new URLSearchParams();
  const fields = {
    reservation_hold_id: holdId, venue: slug, first_name: first, last_name: last,
    email: String(guest.email || ""), phone_number: phone, dial_code: dial,
    country_code: country,
    party_size: String(party), date: mdY, time, shift_persistent_id: shift.shift_persistent_id,
    channel: "SEVENROOMS_WIDGET", access_persistent_id: slot.access_persistent_id,
    notes: String(note || "").slice(0, 300),
  };
  for (const [k, v] of Object.entries(fields)) if (v) form.append(k, v);
  const r = await fetch(`https://www.sevenrooms.com/booking/dining/widget/${slug}/book`, {
    method: "POST",
    headers: {
      "X-Checkout-Hash": hash, "X-Widget-Origin": "old-widget",
      "User-Agent": "Mozilla/5.0 (compatible; VELVET-booking-bridge)",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.reservation_id) {
    return { error: "book_failed", detail: (j.errors || [])[0] || j.message || ("http_" + r.status) };
  }
  return { ok: true, confirmation: String(j.message || ""), reservationId: j.reservation_id, token: String(j.token || ""), shift: shift.name, date, time, party };
}


const DATA = process.env.VELVET_DATA || path.join(__dir, "store.json");
const PAY_FILE = process.env.VELVET_PAY || path.join(__dir, "pay.json");
const IDV_DIR = process.env.VELVET_IDV || path.join(__dir, "idv");
const PORT = Number(process.env.PORT || 8787);
const PUBLIC_APP = process.env.PUBLIC_URL || "https://b2b.bakemyday.se/velvet";

fs.mkdirSync(IDV_DIR, { recursive: true });

function emptyDb() {
  return { tables: [], idv: {}, reviews: [], chats: {}, promoters: {}, promoterContact: {}, chatsMeta: {}, waSeen: {}, users: {}, payments: [], auth: {}, matches: [], bridges: [] };
}
function loadJsonRel(name) {
  for (const p of [
    path.join(__dir, "public-data", name),
    path.join(__dir, "..", "data", name),
    path.join(__dir, name),
  ]) {
    try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { /* next */ }
  }
  return null;
}
function loadVenuesFile() {
  const v = loadJsonRel("venues.json");
  return Array.isArray(v) ? v : [];
}
function loadAllVenues() {
  const unlisted = loadJsonRel("unlisted-venues.json");
  return [...loadVenuesFile(), ...(Array.isArray(unlisted) ? unlisted : [])];
}
function loadDestMap() {
  const map = {};
  for (const list of [loadJsonRel("destinations.json"), loadJsonRel("extra-destinations.json")]) {
    if (!Array.isArray(list)) continue;
    for (const d of list) if (d && d.code) map[d.code] = d;
  }
  return map;
}
function loadPromoterSeed() {
  const raw = loadJsonRel("promoters.json");
  return Array.isArray(raw?.promoters) ? raw.promoters : [];
}
function venueMatchesSeed(p, v, dests) {
  const name = String(v?.name || "");
  for (const brand of p.brands || []) {
    const b = String(brand || "").trim();
    if (b && name.toLowerCase().includes(b.toLowerCase())) return true;
  }
  const destsWant = (p.destinations || []).map((c) => String(c).toUpperCase());
  if (destsWant.includes(String(v?.destination_code || "").toUpperCase())) return true;
  const dest = dests[v?.destination_code] || {};
  const region = String(dest.region || "");
  const country = String(dest.country || v?.country || "");
  for (const r of p.regions || []) {
    if (region === r) return true;
  }
  for (const c of p.countries || []) {
    if (country.toLowerCase() === String(c).toLowerCase()) return true;
  }
  return false;
}
function applyPromoterSeed(db) {
  const seed = loadPromoterSeed();
  if (!seed.length) return db;
  const venues = loadAllVenues();
  const dests = loadDestMap();
  for (const p of seed) {
    const uid = String(p.id || "").slice(0, 80);
    if (!uid) continue;
    const prev = db.users[uid] || {};
    db.users[uid] = {
      id: uid,
      name: String(p.name || prev.name || "").slice(0, 80),
      handle: String(prev.handle || p.handle || "").replace(/^@/, "").slice(0, 40),
      provider: String(prev.provider || p.provider || ""),
      email: String(prev.email || "").toLowerCase().slice(0, 80),
      legalName: String(p.legalName || p.name || prev.legalName || "").slice(0, 80),
      promoterScope: String(p.scope || prev.promoterScope || ""),
      photo: publicPhoto(p.photo || prev.photo),
      seed: true,
      whatsapp: prev.whatsapp || "",
      card: prev.card || null,
      updated: prev.updated || new Date().toISOString(),
      created: prev.created || new Date().toISOString(),
    };
    const idvPrev = db.idv[uid];
    if (!idvPrev || idvPrev.source === "seed") {
      db.idv[uid] = {
        status: "verified",
        source: "seed",
        legalName: String(p.legalName || p.name || "").slice(0, 80),
        submitted: idvPrev?.submitted || new Date().toISOString(),
        fieldsPublic: null,
      };
    }
    for (const v of venues) {
      if (!v?.venue_id || !venueMatchesSeed(p, v, dests)) continue;
      const list = db.promoters[v.venue_id] || [];
      if (!list.includes(uid)) list.push(uid);
      db.promoters[v.venue_id] = list;
    }
  }
  return db;
}
function load() {
  let db = emptyDb();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA, "utf8"));
    db = {
      tables: Array.isArray(raw.tables) ? raw.tables : [],
      idv: raw.idv && typeof raw.idv === "object" ? raw.idv : {},
      reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
      chats: raw.chats && typeof raw.chats === "object" ? raw.chats : {},
      promoters: raw.promoters && typeof raw.promoters === "object" ? raw.promoters : {},
      promoterContact: raw.promoterContact && typeof raw.promoterContact === "object" ? raw.promoterContact : {},
      chatsMeta: raw.chatsMeta && typeof raw.chatsMeta === "object" ? raw.chatsMeta : {},
      waSeen: raw.waSeen && typeof raw.waSeen === "object" ? raw.waSeen : {},
      users: raw.users && typeof raw.users === "object" ? raw.users : {},
      payments: Array.isArray(raw.payments) ? raw.payments : [],
      auth: raw.auth && typeof raw.auth === "object" ? raw.auth : {},
      matches: Array.isArray(raw.matches) ? raw.matches : [],
      bridges: Array.isArray(raw.bridges) ? raw.bridges : [],
    };
  } catch {}
  return applyPromoterSeed(db);
}
function waDigits(raw) {
  let s = String(raw || "").trim();
  if (s.startsWith("00")) s = s.slice(2);
  const d = s.replace(/\D/g, "");
  if (d.length < 8 || d.length > 15) return "";
  return d;
}
function extractWa(str) {
  const s = String(str || "");
  const m = s.match(/wa\.me\/(\+?\d{8,15})/i)
    || s.match(/whatsapp\.com\/send\?[^"'<\s]*phone=(\+?\d{8,15})/i);
  return m ? waDigits(m[1]) : "";
}
function venueWaFromFacts(venueId) {
  const f = loadFactsFile().venues[venueId];
  if (!f) return "";
  if (extractWa(f.vipHow)) return extractWa(f.vipHow);
  if (/whatsapp|wa\.me/i.test(String(f.vipHow || "")) && f.phone) return waDigits(f.phone);
  return extractWa(JSON.stringify(f));
}
function whatsappForVenue(venueId, db) {
  const saved = db.promoterContact && db.promoterContact[venueId];
  const promo = saved ? waDigits(saved.whatsapp) : "";
  if (promo) return { phone: promo, source: "promoter" };
  const venue = venueWaFromFacts(venueId);
  if (venue) return { phone: venue, source: "venue" };
  return null;
}
function waCloud() {
  const p = loadPay();
  return {
    token: String(process.env.WHATSAPP_TOKEN || p.whatsapp?.token || "").trim(),
    phoneId: String(process.env.WHATSAPP_PHONE_ID || p.whatsapp?.phoneId || "").trim(),
    verify: String(process.env.WHATSAPP_VERIFY || p.whatsapp?.verify || "").trim(),
  };
}
function guestWaForThread(db, venueId, threadId) {
  const u = db.users[threadId];
  const meta = db.chatsMeta?.[venueId]?.[threadId];
  return waDigits((u && u.whatsapp) || (meta && meta.guestWa) || "");
}
function setGuestWa(db, venueId, threadId, phone, name) {
  const d = waDigits(phone);
  if (!d) return "";
  if (db.users[threadId]) db.users[threadId].whatsapp = d;
  if (!db.chatsMeta) db.chatsMeta = {};
  if (!db.chatsMeta[venueId]) db.chatsMeta[venueId] = {};
  db.chatsMeta[venueId][threadId] = {
    ...(db.chatsMeta[venueId][threadId] || {}),
    guestWa: d,
    guestName: name || db.chatsMeta[venueId][threadId]?.guestName || "",
  };
  return d;
}
function appendChat(db, venueId, threadId, msg) {
  if (!db.chats[venueId]) db.chats[venueId] = {};
  if (!db.chats[venueId][threadId]) db.chats[venueId][threadId] = [];
  db.chats[venueId][threadId].push(msg);
  db.chats[venueId][threadId] = db.chats[venueId][threadId].slice(-200);
  return db.chats[venueId][threadId];
}
function markWaSeen(db, id) {
  if (!id) return false;
  if (!db.waSeen) db.waSeen = {};
  if (db.waSeen[id]) return true;
  db.waSeen[id] = Date.now();
  const keys = Object.keys(db.waSeen);
  if (keys.length > 400) {
    for (const k of keys.slice(0, keys.length - 300)) delete db.waSeen[k];
  }
  return false;
}
async function cloudSendWa(to, text) {
  const c = waCloud();
  if (!c.token || !c.phoneId || !to) return false;
  try {
    const r = await fetch("https://graph.facebook.com/v21.0/" + encodeURIComponent(c.phoneId) + "/messages", {
      method: "POST",
      headers: { Authorization: "Bearer " + c.token, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: String(text || "").slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(12000),
    });
    return r.ok;
  } catch {
    return false;
  }
}
const MIN_AGE = 18;
const US21 = new Set(["MIA", "LAS", "NYC", "LAX", "ASP"]);
function minAgeForVenue(venueId) {
  const facts = loadFactsFile()?.venues?.[venueId];
  const n = parseInt(String(facts?.ageLimit || "").replace(/[^\d]/g, ""), 10);
  const fromFacts = (n >= 16 && n <= 25) ? n : null;
  const v = loadAllVenues().find((x) => x.venue_id === venueId);
  const code = String(v?.destination_code || "").toUpperCase();
  if (US21.has(code)) return Math.max(fromFacts || 0, 21);
  return fromFacts || MIN_AGE;
}
function idvAge(rec) {
  return ageYears(rec?.fieldsPublic?.birthDate || rec?.fields?.birthDate);
}
function isIdvVerified(uid, db) {
  const rec = uid && db.idv[uid];
  if (!rec || rec.status !== "verified") return false;
  const age = idvAge(rec);
  return age == null ? false : age >= MIN_AGE;
}
function hasCardOnFile(uid, db) {
  return !!publicCard(db.users[uid]?.card);
}
function isVerifiedMember(uid, db) {
  return isIdvVerified(uid, db) && hasCardOnFile(uid, db);
}
function memberGate(uid, db, venueId) {
  const rec = uid && db.idv[uid];
  const age = rec ? idvAge(rec) : null;
  if (!rec || rec.status !== "verified") {
    if (rec && (rec.status === "underage" || (age != null && age < MIN_AGE))) return "too_young";
    return "idv_required";
  }
  if (age != null && age < MIN_AGE) return "too_young";
  if (age == null) return "idv_required";
  if (!hasCardOnFile(uid, db)) return "card_required";
  if (venueId && age < minAgeForVenue(venueId)) return "too_young";
  return "";
}
function gatePayload(gate, uid, db, venueId) {
  if (gate !== "too_young") return { error: gate };
  return {
    error: "too_young",
    ageYears: idvAge(db.idv[uid]),
    minAge: venueId ? minAgeForVenue(venueId) : MIN_AGE,
  };
}
function parseOpenFor(v) {
  const s = String(v || "anyone").toLowerCase();
  return s === "women" || s === "men" ? s : "anyone";
}
function personSex(uid, db) {
  const rec = db.idv[uid];
  const s = String(rec?.fieldsPublic?.sex || rec?.fields?.sex || "").toUpperCase();
  return s === "F" || s === "M" || s === "X" ? s : "";
}
function seatPrefError(table, uid, db) {
  const want = parseOpenFor(table.openFor);
  if (want === "anyone") return "";
  if (!isIdvVerified(uid, db)) return "idv_required";
  const sex = personSex(uid, db);
  if (want === "women" && sex !== "F") return "seat_pref";
  if (want === "men" && sex !== "M") return "seat_pref";
  return "";
}
function publicMatch(m, db) {
  if (!m) return null;
  const d = dossier(m.userId, db) || {};
  return {
    id: m.id,
    venueId: m.venueId,
    date: m.date,
    seats: Number(m.seats) || 1,
    note: String(m.note || "").slice(0, 240),
    openFor: parseOpenFor(m.openFor),
    openSeats: Number(m.openSeats) || 0,
    status: m.status || "open",
    tableId: m.tableId || "",
    created: m.created,
    userId: m.userId,
    name: m.name || d.legalName || "",
    legalName: d.legalName || "",
    paying: !!d.paying,
    card: d.card || null,
    handle: d.handle || "",
    provider: d.provider || "",
  };
}
function dossier(uid, db) {
  if (!uid) return null;
  const idv = publicIdv(db.idv[uid]);
  const u = db.users[uid] || {};
  const card = publicCard(u.card);
  return {
    id: uid,
    legalName: idv.legalName || u.legalName || "",
    idv: idv.status || "none",
    fields: idv.fields || null,
    card,
    paying: !!card,
    provider: u.provider || "",
    handle: u.handle || "",
    socialUrl: socialUrl(u.provider, u.handle),
  };
}
function operatorUids() {
  const ids = new Set();
  for (const s of String(process.env.VELVET_OPERATORS || "").split(/[,;\s]+/)) {
    const id = s.trim();
    if (id) ids.add(id);
  }
  const payOps = loadPay()?.operators;
  if (Array.isArray(payOps)) {
    for (const x of payOps) {
      const id = String(x || "").trim();
      if (id) ids.add(id);
    }
  }
  return ids;
}
function isOperatorUid(uid) {
  if (!uid) return false;
  return operatorUids().has(uid);
}
function isPromoter(user, venueId, db) {
  const uid = user?.id || "";
  if (!uid) return false;
  if (isOperatorUid(uid)) return true;
  const list = db.promoters[venueId] || [];
  if (!list.includes(uid)) return false;
  return isVerifiedMember(uid, db);
}
function isPromoterAnywhere(uid, db) {
  if (!uid) return false;
  if (isOperatorUid(uid)) return true;
  if (!isVerifiedMember(uid, db)) return false;
  for (const vid of Object.keys(db.promoters || {})) {
    if ((db.promoters[vid] || []).includes(uid)) return true;
  }
  return false;
}
function claimedVenueIds(uid, db) {
  const out = [];
  for (const [venueId, list] of Object.entries(db.promoters || {})) {
    if ((list || []).includes(uid)) out.push(venueId);
  }
  return out;
}
function allPromoterUids(db) {
  const set = new Set();
  for (const list of Object.values(db.promoters || {})) {
    for (const id of list || []) if (id) set.add(String(id));
  }
  for (const uid of Object.keys(db.users || {})) {
    if (isPromoter({ id: uid }, "", db) || db.users[uid]?.seed) set.add(uid);
  }
  return [...set];
}
function venueLabel(venueId) {
  const v = loadAllVenues().find((x) => x.venue_id === venueId);
  return {
    id: venueId,
    name: String(v?.name || venueId),
    destination: String(v?.destination || ""),
  };
}
function publicPhoto(raw) {
  const s = String(raw || "").replace(/\\/g, "/");
  if (/^media\/promoters\/[a-z0-9._-]+\.(gif|jpg|jpeg|png|webp)$/i.test(s)) return s;
  return "";
}
function isRosterPromoter(uid, db) {
  const rec = uid && db.idv[uid];
  return !!(rec && rec.status === "verified" && rec.source === "seed");
}
function publicPromoter(uid, db, venueId) {
  const passport = isIdvVerified(uid, db);
  const roster = isRosterPromoter(uid, db);
  if (!uid || (!passport && !roster)) return null;
  const claimed = claimedVenueIds(uid, db);
  const operator = isPromoter({ id: uid }, "", db);
  if (venueId) {
    if (!claimed.includes(venueId)) return null;
  } else if (!operator && !claimed.length && !roster) {
    return null;
  }
  const d = dossier(uid, db) || {};
  const u = db.users[uid] || {};
  const venueIds = venueId ? [venueId] : (claimed.length <= 8 ? claimed : []);
  return {
    id: uid,
    legalName: d.legalName || u.legalName || "",
    name: String(u.name || d.legalName || "").slice(0, 80),
    handle: String(d.handle || u.handle || "").replace(/^@/, ""),
    provider: d.provider || u.provider || "",
    socialUrl: socialUrl(d.provider || u.provider, d.handle || u.handle),
    idv: passport ? "verified" : "listed",
    operator: !!operator,
    scope: String(u.promoterScope || ""),
    photo: publicPhoto(u.photo),
    venueCount: claimed.length,
    venues: venueIds.map(venueLabel),
  };
}
function listVerifiedPromoters(db, venueId) {
  const ids = new Set();
  if (venueId) {
    for (const id of db.promoters[venueId] || []) if (id) ids.add(String(id));
  } else {
    for (const id of allPromoterUids(db)) ids.add(id);
  }
  return [...ids]
    .map((id) => publicPromoter(id, db, venueId || ""))
    .filter(Boolean)
    .sort((a, b) => String(a.legalName || a.name).localeCompare(String(b.legalName || b.name)));
}
function save(db) {
  // Atomisk skrivning: skriv till tmp-fil och byt namn — vid krasch mitt i en
  // skrivning lämnas gamla intakta db.json kvar i stället för en halvskriven fil.
  const tmp = DATA + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA);
}
function safeId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "unknown";
}
// CORS: bara kända frontends får läsa svaren i en browser. Server-till-server
// (webhooks, curl) saknar Origin och påverkas inte. Utöka listan vid ny domän.
const ALLOWED_ORIGINS = new Set([
  "https://b2b.bakemyday.se",
  "https://mosesisik-cloud.github.io",
]);
function corsOriginFor(req) {
  const o = String(req.headers.origin || "");
  if (ALLOWED_ORIGINS.has(o)) return o;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return o; // lokal utveckling
  return "";
}
function send(res, code, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    ...(res._corsOrigin
      ? { "Access-Control-Allow-Origin": res._corsOrigin, Vary: "Origin" }
      : {}),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    ...extra,
  });
  res.end(body);
}
function readRaw(req, max = 1e6) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > max) { req.destroy(); reject(new Error("too large")); }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
function readBody(req, max = 12e6) {
  return new Promise((resolve, reject) => {
    let s = "";
    req.on("data", (c) => {
      s += c;
      if (s.length > max) { req.destroy(); reject(new Error("too large")); }
    });
    req.on("end", () => {
      try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); }
    });
  });
}
function decodeDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/(jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!m) return null;
  const buf = Buffer.from(m[3].replace(/\s/g, ""), "base64");
  if (buf.length < 8000 || buf.length > 5e6) return null;
  return { ext: m[2].toLowerCase() === "png" ? "png" : "jpg", buf };
}
function publicIdv(rec) {
  if (!rec) return { status: "none" };
  const fields = rec.fieldsPublic || null;
  const age = idvAge(rec);
  return {
    status: rec.status || "none",
    submitted: rec.submitted || null,
    reasons: rec.reasons || [],
    fields,
    legalName: rec.legalName || "",
    nameMatch: rec.nameMatch || null,
    face: rec.facePublic || null,
    ageYears: age,
    adult: age != null && age >= MIN_AGE,
    minAge: MIN_AGE,
  };
}
function readFace(b) {
  const f = b && b.face && typeof b.face === "object" ? b.face : {};
  const dist = Number(f.matchDistance);
  const distOk = Number.isFinite(dist) && dist >= 0 && dist <= 0.58;
  const passportFace = f.passportFace === true;
  const selfieFace = f.selfieFace === true;
  const liveness = f.liveness === true;
  const matchOk = f.matchOk === true && distOk;
  let error = "";
  if (!passportFace) error = "face_passport";
  else if (!selfieFace) error = "face_selfie";
  else if (!liveness) error = "face_liveness";
  else if (!matchOk) error = "face_mismatch";
  return {
    passportFace,
    selfieFace,
    liveness,
    matchOk,
    matchDistance: distOk ? Math.round(dist * 1000) / 1000 : null,
    ok: passportFace && selfieFace && liveness && matchOk,
    error,
  };
}
function readMrzBody(b) {
  const line1 = b?.mrz?.line1 || b?.line1 || "";
  const line2 = b?.mrz?.line2 || b?.line2 || "";
  if (line1 && line2) return parseTd3(line1, line2);
  if (b?.mrz?.text) return extractMrzFromText(b.mrz.text);
  return null;
}
function avgRating(reviews) {
  if (!reviews.length) return { avg: 0, n: 0 };
  const n = reviews.length;
  const avg = reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / n;
  return { avg: Math.round(avg * 10) / 10, n };
}

function socialUrl(provider, handle) {
  const h = String(handle || "").replace(/^@/, "").trim();
  if (!h) return "";
  const enc = encodeURIComponent(h);
  if (provider === "instagram") return `https://www.instagram.com/${enc}/`;
  if (provider === "facebook") return `https://www.facebook.com/${enc}`;
  if (provider === "tiktok") return `https://www.tiktok.com/@${enc}`;
  if (provider === "snapchat") return `https://www.snapchat.com/add/${enc}`;
  if (provider === "google") {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h)) return `mailto:${h}`;
    return "";
  }
  return "";
}
function cleanHandle(provider, raw) {
  let h = String(raw || "").trim();
  if (provider === "google") {
    const email = h.replace(/^mailto:/i, "").toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) return "";
    return email.slice(0, 80);
  }
  h = h.replace(/^https?:\/\/(www\.)?/i, "");
  h = h.replace(/^(instagram|tiktok|facebook|snapchat)\.com\/(add\/|@)?/i, "");
  h = h.split(/[/?#]/)[0].replace(/^@/, "").trim();
  if (provider === "facebook") {
    if (!/^[A-Za-z0-9.]{3,50}$/.test(h) && !/^\d{5,20}$/.test(h)) return "";
  } else if (!/^[A-Za-z0-9._]{2,30}$/.test(h)) return "";
  return h;
}
async function lookupPublicSocial(provider, handle) {
  if (provider === "google") {
    return { ok: true, name: "", photo: "", url: socialUrl("google", handle) };
  }
  const url = socialUrl(provider, handle);
  if (!url) return { ok: false, error: "handle" };
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VELVET/1.0; +https://b2b.bakemyday.se/velvet/)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 404) return { ok: false, error: "not_found" };
    const html = await r.text();
    const og = (prop) => {
      const re1 = new RegExp(`property=["']og:${prop}["'][^>]*content=["']([^"']+)["']`, "i");
      const re2 = new RegExp(`content=["']([^"']+)["'][^>]*property=["']og:${prop}["']`, "i");
      const m = html.match(re1) || html.match(re2);
      return m ? String(m[1]).trim() : "";
    };
    let name = og("title").replace(/\s*[•|·\\-].*$/, "").replace(/\(@[^)]+\)/g, "").trim();
    if (/^(instagram|tiktok|facebook|snapchat|log in|login|sign up)$/i.test(name)) name = "";
    const photo = og("image");
    const photoOk = /^https:\/\//i.test(photo) && !/rsrc\.php|static\.xx\.fbcdn|login/i.test(photo);
    return {
      ok: true,
      name: name.slice(0, 80),
      photo: photoOk ? photo.slice(0, 400) : "",
      url,
    };
  } catch {
    return { ok: true, name: "", photo: "", url };
  }
}
function upsertUser(db, u) {
  if (!u || !u.id) return;
  const provider = String(u.provider || "");
  const handle = String(u.handle || "").replace(/^@/, "").slice(0, 40);
  const prev = db.users[u.id] || {};
  const photo = String(u.photo || prev.photo || "");
  db.users[u.id] = {
    id: String(u.id).slice(0, 80),
    name: String(u.name || prev.name || "").slice(0, 80),
    handle: handle || prev.handle || "",
    provider: provider || prev.provider || "",
    email: String(u.email || prev.email || "").toLowerCase().slice(0, 80),
    legalName: prev.legalName || "",
    promoterScope: prev.promoterScope || "",
    photo: /^https:\/\//i.test(photo) ? photo.slice(0, 400) : (prev.photo || ""),
    connected: !!(u.connected || prev.connected || handle),
    oauth: !!(u.oauth || prev.oauth),
    seed: !!prev.seed,
    updated: new Date().toISOString(),
    created: prev.created || u.created || new Date().toISOString(),
    whatsapp: prev.whatsapp || "",
    card: prev.card || null,
  };
}
function publicCard(c) {
  if (!c || !c.last4) return null;
  const last4 = String(c.last4).replace(/\D/g, "").slice(-4);
  if (last4.length !== 4) return null;
  return {
    last4,
    brand: String(c.brand || "card").toLowerCase().replace(/[^a-z]/g, "").slice(0, 16) || "card",
    expMonth: Number(c.expMonth) || 0,
    expYear: Number(c.expYear) || 0,
  };
}
function parseCardBody(b) {
  if (b.number || b.pan || b.cardNumber || b.cvc || b.cvv || b.securityCode) {
    return { error: "no_pan" };
  }
  const last4 = String(b.last4 || "").replace(/\D/g, "").slice(-4);
  if (last4.length !== 4) return { error: "last4" };
  const brandRaw = String(b.brand || "card").toLowerCase().replace(/[^a-z]/g, "").slice(0, 16);
  const brand = ["visa", "mastercard", "amex", "maestro", "card"].includes(brandRaw) ? brandRaw : "card";
  const expMonth = Number(b.expMonth);
  let expYear = Number(b.expYear);
  if (expMonth < 1 || expMonth > 12 || !expYear) return { error: "exp" };
  if (expYear < 100) expYear += 2000;
  const now = new Date();
  if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
    return { error: "expired" };
  }
  return { card: { last4, brand, expMonth, expYear, added: new Date().toISOString() } };
}
function verifiedSpend(uid, db) {
  if (!uid) return { amount: 0, currency: "EUR", n: 0, verified: false, real: false };
  const idvOk = isIdvVerified(uid, db);
  if (!idvOk) return { amount: 0, currency: "EUR", n: 0, verified: false, real: false };
  const seen = new Set();
  let amount = 0;
  let n = 0;
  for (const rec of db.payments || []) {
    if (rec.userId !== uid || rec.status !== "paid") continue;
    const a = Number(rec.amount) || 0;
    if (a <= 0) continue;
    const k = String(rec.providerId || rec.id || "") || ("P:" + rec.tableId);
    if (seen.has(k)) continue;
    seen.add(k);
    if (rec.tableId) seen.add("T:" + rec.tableId + ":" + uid);
    amount += a;
    n += 1;
  }
  for (const t of db.tables || []) {
    const m = t.host?.id === uid ? t.host : (t.joiners || []).find((j) => j.id === uid);
    if (!m || !m.paid) continue;
    if (String(m.paidVia || "").startsWith("pending:")) continue;
    const a = Number(m.paidAmount) || 0;
    if (a <= 0) continue;
    const k = "T:" + t.id + ":" + uid;
    if (seen.has(k)) continue;
    seen.add(k);
    amount += a;
    n += 1;
  }
  const total = Math.round(amount * 100) / 100;
  return { amount: total, currency: "EUR", n, verified: true, real: total > 0 };
}
function publicPerson(p, db, role) {
  if (!p) return null;
  const id = String(p.id || "");
  const stored = id && db.users[id] ? db.users[id] : {};
  const provider = String(p.provider || stored.provider || "");
  const handle = String(p.handle || stored.handle || "").replace(/^@/, "");
  const name = String(p.name || stored.name || "Gäst").slice(0, 80);
  const file = id ? dossier(id, db) : null;
  const idv = file?.idv === "verified" ? "verified" : "none";
  const card = file?.card || null;
  return {
    id,
    name,
    legalName: file?.legalName || "",
    handle,
    provider,
    socialUrl: socialUrl(provider, handle),
    photo: String(p.photo || stored.photo || "").slice(0, 400),
    connected: !!(p.connected || stored.connected || handle),
    oauth: !!(p.oauth || stored.oauth),
    role: role || p.role || "guest",
    paid: !!p.paid,
    paidAt: p.paidAt || null,
    paidVia: p.paidVia || "",
    paidPending: !p.paid && !!p.paidPending,
    paidAmount: Number(p.paidAmount) || 0,
    spend: verifiedSpend(id, db),
    idv,
    paying: !!card,
    card,
    fields: file?.fields || null,
    joined: p.joined || p.created || null,
  };
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function tableMemberIds(t) {
  return [t.host?.id, ...((t.joiners || []).map((j) => j.id))].filter(Boolean);
}
function isPartyOver(t) {
  const d = String(t.date || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= todayISO();
}
function partySummary(t, uid, db) {
  const mates = tableMemberIds(t)
    .filter((id) => id !== uid)
    .map((id) => {
      const p = t.host?.id === id ? t.host : (t.joiners || []).find((j) => j.id === id);
      return {
        id,
        name: String(p?.name || "").slice(0, 80),
        provider: String(p?.provider || ""),
        handle: String(p?.handle || "").replace(/^@/, ""),
      };
    });
  const given = (db.reviews || []).filter((r) => r.tableId === t.id && r.from === uid);
  return {
    id: t.id,
    venue_id: t.venue_id || "",
    venue: t.venue,
    destination: t.destination || "",
    date: t.date || "",
    package: t.package || "",
    role: t.host?.id === uid ? "host" : "guest",
    past: isPartyOver(t),
    mates,
    ratedIds: given.map((r) => r.to),
  };
}
function tableReviews(t, db) {
  return (db.reviews || [])
    .filter((r) => r.tableId === t.id)
    .map((r) => ({
      id: r.id,
      from: r.from,
      fromName: r.fromName,
      to: r.to,
      toName: r.toName,
      rating: r.rating,
      text: r.text,
      created: r.created,
    }));
}
function publicTable(t, db) {
  const host = publicPerson(t.host, db, "host");
  const joiners = (t.joiners || []).map((j) => publicPerson(j, db, "guest")).filter(Boolean);
  const invites = (t.guests || []).map((g) => ({
    id: "",
    name: String(g.name || "Gäst").slice(0, 80),
    handle: "",
    provider: "",
    socialUrl: "",
    role: "invite",
    paid: !!g.paid,
    paidAt: g.paidAt || null,
    idv: "none",
    joined: null,
  }));
  const members = [host, ...joiners, ...invites].filter(Boolean);
  const paidN = members.filter((m) => m.paid).length;
  const party = Number(t.party) || Math.max(members.length, 1);
  return {
    id: t.id,
    venue_id: t.venue_id,
    venue: t.venue,
    destination: t.destination,
    date: t.date,
    package: t.package,
    total: Number(t.total) || 0,
    party,
    openSeats: Number(t.openSeats) || 0,
    openLeft: Number(t.openLeft) || 0,
    openFor: parseOpenFor(t.openFor),
    status: t.status,
    sharp: !!t.sharp,
    created: t.created,
    host,
    joiners,
    guests: invites,
    members,
    paidN,
    dueN: members.length,
    per_person: Math.ceil((Number(t.total) || 0) / Math.max(1, party)),
    past: isPartyOver(t),
    reviews: tableReviews(t, db),
  };
}
function findUser(db, id) {
  if (db.users[id]) return db.users[id];
  for (const t of db.tables) {
    if (t.host?.id === id) return t.host;
    const j = (t.joiners || []).find((x) => x.id === id);
    if (j) return j;
  }
  return null;
}
function setPaidFlag(obj, paid, actorId, via) {
  obj.paid = !!paid;
  obj.paidAt = paid ? new Date().toISOString() : null;
  obj.paidBy = actorId || "";
  obj.paidVia = paid ? (via || obj.paidVia || "manual") : "";
  if (paid) obj.paidPending = false;
}

function isOperator(user) {
  const email = String(user?.email || "").toLowerCase();
  const handle = String(user?.handle || "").toLowerCase();
  return email === "gabrielhadodo@gmail.com" || email === "moses.isik@bakemyday.se" || handle === "velvet" || handle === "gabbe" || user?.role === "operator";
}

// Delad hemlighet för Revolut/PayPal-webhooks (de saknar egen signaturverifiering
// i den här koden). Sätts via VELVET_WEBHOOK_TOKEN eller pay.json:s webhookToken,
// och läggs som ?token= på webhook-URL:en hos leverantören.
function webhookTokenOk(req, url, pay) {
  const expected = String(process.env.VELVET_WEBHOOK_TOKEN || pay?.webhookToken || "");
  if (!expected) return "missing";
  const got = String(url.searchParams?.get("token") || req.headers["x-webhook-token"] || "");
  return got === expected ? "ok" : "bad";
}

function emptyPay() {
  return {
    currency: "EUR",
    firecrawlKey: "",
    googlePlacesKey: "",
    webhookToken: "",
    revolut: { iban: "", bic: "", name: "", me: "", merchantSecret: "", sandbox: false },
    stripe: { secret: "", pub: "", webhook: "" },
    paypal: { client: "", secret: "", sandbox: false },
    whatsapp: { token: "", phoneId: "", verify: "" },
    oauth: {
      facebook: { id: "", secret: "" },
      instagram: { id: "", secret: "" },
      tiktok: { key: "", secret: "" },
      snapchat: { id: "", secret: "" },
      google: { id: "", secret: "" },
    },
  };
}
function loadPay() {
  try {
    if (!fs.existsSync(PAY_FILE)) {
      fs.writeFileSync(PAY_FILE, JSON.stringify(emptyPay(), null, 2));
    }
    const raw = JSON.parse(fs.readFileSync(PAY_FILE, "utf8"));
    const base = emptyPay();
    return {
      currency: String(raw.currency || "EUR").toUpperCase().slice(0, 3),
      firecrawlKey: String(raw.firecrawlKey || ""),
      googlePlacesKey: String(raw.googlePlacesKey || ""),
      revolut: { ...base.revolut, ...(raw.revolut || {}) },
      stripe: { ...base.stripe, ...(raw.stripe || {}) },
      paypal: { ...base.paypal, ...(raw.paypal || {}) },
      whatsapp: { ...base.whatsapp, ...(raw.whatsapp || {}) },
      oauth: {
        facebook: { ...base.oauth.facebook, ...(raw.oauth?.facebook || {}) },
        instagram: { ...base.oauth.instagram, ...(raw.oauth?.instagram || {}) },
        tiktok: { ...base.oauth.tiktok, ...(raw.oauth?.tiktok || {}) },
        snapchat: { ...base.oauth.snapchat, ...(raw.oauth?.snapchat || {}) },
        google: { ...base.oauth.google, ...(raw.oauth?.google || {}) },
      },
    };
  } catch {
    return emptyPay();
  }
}
function savePay(p) {
  fs.writeFileSync(PAY_FILE, JSON.stringify(p, null, 2));
}
function ibanOk(s) {
  const v = String(s || "").replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v) ? v : "";
}
function payRef(tableId, userId) {
  const t = String(tableId || "").replace(/[^A-Z0-9]/gi, "").slice(-8).toUpperCase();
  const u = String(userId || "").replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase();
  return `VEL-${t}-${u}`.slice(0, 22);
}
function publicPayConfig() {
  const p = loadPay();
  const iban = ibanOk(p.revolut.iban);
  const stripeOn = !!(p.stripe.secret && p.stripe.secret.startsWith("sk_"));
  const revolutOn = !!(p.revolut.merchantSecret);
  const paypalOn = !!(p.paypal.client && p.paypal.secret);
  const meOn = !!(p.revolut.me && String(p.revolut.me).trim());
  const bankOn = !!iban || meOn;
  const cardOn = stripeOn || revolutOn;
  return {
    currency: p.currency || "EUR",
    destination: "Revolut",
    holder: p.revolut.name || "",
    ready: cardOn || bankOn || paypalOn,
    stripe: stripeOn,
    revolutMerchant: revolutOn,
    paypal: paypalOn,
    bank: bankOn,
    methods: [
      { id: "card", group: "card", enabled: cardOn },
      { id: "applepay", group: "wallet", enabled: cardOn },
      { id: "googlepay", group: "wallet", enabled: cardOn },
      { id: "revolut", group: "wallet", enabled: revolutOn || bankOn },
      { id: "paypal", group: "wallet", enabled: paypalOn },
      { id: "klarna", group: "bnpl", enabled: stripeOn },
      { id: "sepa", group: "bank", enabled: !!iban },
      { id: "swift", group: "bank", enabled: !!iban },
    ],
    account: bankOn ? {
      iban: iban || "",
      bic: String(p.revolut.bic || "").replace(/\s+/g, "").toUpperCase(),
      name: p.revolut.name || "",
      bank: "Revolut",
      me: String(p.revolut.me || "").trim(),
    } : null,
    keys: {
      stripe: stripeOn,
      revolut: revolutOn,
      paypal: paypalOn,
      iban: bankOn,
      firecrawl: !!p.firecrawlKey,
      googlePlaces: !!p.googlePlacesKey,
      whatsapp: !!(p.whatsapp?.token && p.whatsapp?.phoneId),
    },
    oauth: oauthFlags(p),
  };
}
function oauthFlags(p) {
  const o = p.oauth || emptyPay().oauth;
  const fb = !!(o.facebook?.id && o.facebook?.secret);
  const ig = !!(o.instagram?.id && o.instagram?.secret) || fb;
  return {
    facebook: fb,
    instagram: ig,
    tiktok: !!(o.tiktok?.key && o.tiktok?.secret),
    snapchat: !!(o.snapchat?.id && o.snapchat?.secret),
    google: !!(o.google?.id && o.google?.secret),
  };
}
function oauthRedirect(provider) {
  return `${process.env.PUBLIC_URL ? process.env.PUBLIC_URL.replace(/\/velvet\/?$/, "") : "https://b2b.bakemyday.se"}/velvet-api/auth/callback/${provider}`;
}
function oauthAuthorizeUrl(provider, state) {
  const p = loadPay();
  const flags = oauthFlags(p);
  if (!flags[provider]) return null;
  const redir = oauthRedirect(provider);
  if (provider === "facebook" || (provider === "instagram" && p.oauth.facebook?.id && !p.oauth.instagram?.id)) {
    const id = p.oauth.facebook.id;
    const scope = provider === "instagram" ? "public_profile,email,instagram_basic" : "public_profile,email";
    return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(redir)}&state=${encodeURIComponent(state)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  }
  if (provider === "instagram") {
    const id = p.oauth.instagram.id;
    return `https://api.instagram.com/oauth/authorize?client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(redir)}&scope=user_profile,user_media&response_type=code&state=${encodeURIComponent(state)}`;
  }
  if (provider === "tiktok") {
    return `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(p.oauth.tiktok.key)}&redirect_uri=${encodeURIComponent(redir)}&response_type=code&scope=user.info.basic&state=${encodeURIComponent(state)}`;
  }
  if (provider === "snapchat") {
    return `https://accounts.snapchat.com/login/oauth2/authorize?client_id=${encodeURIComponent(p.oauth.snapchat.id)}&redirect_uri=${encodeURIComponent(redir)}&response_type=code&scope=https://auth.snapchat.com/oauth2/api/user.display_name&state=${encodeURIComponent(state)}`;
  }
  if (provider === "google") {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(p.oauth.google.id)}&redirect_uri=${encodeURIComponent(redir)}&response_type=code&scope=${encodeURIComponent("openid email profile")}&state=${encodeURIComponent(state)}&prompt=select_account`;
  }
  return null;
}
async function oauthProfile(provider, code) {
  const p = loadPay();
  const redir = oauthRedirect(provider);
  if (provider === "facebook" || (provider === "instagram" && p.oauth.facebook?.id && !p.oauth.instagram?.id)) {
    const tok = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(p.oauth.facebook.id)}&redirect_uri=${encodeURIComponent(redir)}&client_secret=${encodeURIComponent(p.oauth.facebook.secret)}&code=${encodeURIComponent(code)}`);
    const tj = await tok.json();
    if (!tj.access_token) throw new Error(tj.error?.message || "fb_token");
    const me = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(tj.access_token)}`);
    const u = await me.json();
    return {
      id: `U-${provider}-${u.id}`,
      name: String(u.name || ""),
      handle: String(u.id || ""),
      email: String(u.email || ""),
      provider,
      oauth: true,
    };
  }
  if (provider === "instagram") {
    const body = new URLSearchParams({
      client_id: p.oauth.instagram.id,
      client_secret: p.oauth.instagram.secret,
      grant_type: "authorization_code",
      redirect_uri: redir,
      code,
    });
    const tok = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body });
    const tj = await tok.json();
    const token = tj.access_token || tj.data?.[0]?.access_token;
    const iid = tj.user_id || tj.data?.[0]?.user_id;
    if (!token) throw new Error("ig_token");
    const me = await fetch(`https://graph.instagram.com/me?fields=id,username,name&access_token=${encodeURIComponent(token)}`);
    const u = await me.json();
    return {
      id: `U-instagram-${u.id || iid}`,
      name: String(u.name || u.username || ""),
      handle: String(u.username || u.id || ""),
      provider: "instagram",
      oauth: true,
    };
  }
  if (provider === "tiktok") {
    const tok = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: p.oauth.tiktok.key,
        client_secret: p.oauth.tiktok.secret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redir,
      }),
    });
    const tj = await tok.json();
    const access = tj.access_token || tj.data?.access_token;
    if (!access) throw new Error("tt_token");
    const me = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username,avatar_url", {
      headers: { Authorization: "Bearer " + access },
    });
    const u = (await me.json()).data?.user || {};
    return {
      id: `U-tiktok-${u.open_id || crypto.randomBytes(6).toString("hex")}`,
      name: String(u.display_name || ""),
      handle: String(u.username || ""),
      provider: "tiktok",
      oauth: true,
    };
  }
  if (provider === "snapchat") {
    const tok = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: p.oauth.snapchat.id,
        client_secret: p.oauth.snapchat.secret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redir,
      }),
    });
    const tj = await tok.json();
    if (!tj.access_token) throw new Error("snap_token");
    const me = await fetch("https://kit.snapchat.com/v1/me", {
      method: "POST",
      headers: { Authorization: "Bearer " + tj.access_token, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ me { displayName bitmoji { avatar } externalId } }" }),
    });
    const u = (await me.json()).data?.me || {};
    return {
      id: `U-snapchat-${u.externalId || crypto.randomBytes(6).toString("hex")}`,
      name: String(u.displayName || ""),
      handle: String(u.externalId || ""),
      provider: "snapchat",
      oauth: true,
    };
  }
  if (provider === "google") {
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: p.oauth.google.id,
        client_secret: p.oauth.google.secret,
        redirect_uri: redir,
        grant_type: "authorization_code",
      }),
    });
    const tj = await tok.json();
    if (!tj.access_token) throw new Error(tj.error || "google_token");
    const me = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + tj.access_token },
    });
    const u = await me.json();
    const email = String(u.email || "").toLowerCase();
    const sub = String(u.sub || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sub && !email) throw new Error("google_profile");
    const pic = /^https:\/\//i.test(u.picture || "") ? String(u.picture).slice(0, 400) : "";
    return {
      id: `U-google-${sub || email.replace(/[^a-z0-9]/g, "").slice(0, 40)}`,
      name: String(u.name || "").slice(0, 80),
      handle: email || sub,
      email,
      photo: pic,
      provider: "google",
      oauth: true,
      connected: true,
    };
  }
  throw new Error("provider");
}
function mintAuthToken(user) {
  const db = load();
  if (!db.auth) db.auth = {};
  const token = crypto.randomBytes(24).toString("hex");
  db.auth[token] = { user, exp: Date.now() + 15 * 60 * 1000 };
  const keys = Object.keys(db.auth);
  if (keys.length > 80) {
    for (const k of keys) if (db.auth[k].exp < Date.now()) delete db.auth[k];
  }
  save(db);
  return token;
}
function applyIncomingPayment(db, { tableId, userId, amount, currency, method, provider, providerId, bridgeId, venueId }) {
  if (bridgeId && db.bridges) {
    const br = db.bridges.find((x) => x.id === bridgeId && (!userId || x.userId === userId));
    if (br) {
      br.payment = {
        amount: Number(amount) || 0,
        currency: currency || "EUR",
        method: method || provider || "card",
        provider: provider || "",
        providerId: providerId || "",
        status: "paid",
      };
      br.status = "paid";
      br.packet = packetText(br);
    }
  }
  const t = tableId ? db.tables.find((x) => x.id === tableId) : null;
  if (!t || !userId) {
    if (bridgeId) {
      const rec = {
        id: `PY-${Date.now().toString(36)}`,
        tableId: "",
        bridgeId: bridgeId || "",
        venueId: venueId || "",
        userId,
        amount: Number(amount) || 0,
        currency: currency || "EUR",
        method: method || provider || "",
        provider: provider || "",
        providerId: providerId || "",
        status: "paid",
        created: new Date().toISOString(),
      };
      db.payments = [rec, ...(db.payments || [])].slice(0, 500);
      return rec;
    }
    return null;
  }
  let target = t.host?.id === userId ? t.host : (t.joiners || []).find((j) => j.id === userId);
  if (!target) return null;
  setPaidFlag(target, true, userId, provider || method);
  if (Number(amount) > 0) target.paidAmount = Number(amount);
  const rec = {
    id: `PY-${Date.now().toString(36)}`,
    tableId,
    userId,
    amount: Number(amount) || 0,
    currency: currency || "EUR",
    method: method || provider || "",
    provider: provider || "",
    providerId: providerId || "",
    status: "paid",
    created: new Date().toISOString(),
  };
  db.payments = [rec, ...(db.payments || [])].slice(0, 500);
  return rec;
}
async function stripeCheckout({ table, user, cents, currency, method, mode, venueId, bridgeId, venueName, successHash, cancelHash }) {
  const p = loadPay();
  if (!p.stripe.secret) return null;
  const params = new URLSearchParams();
  const setup = mode === "setup";
  params.set("mode", setup ? "setup" : "payment");
  params.set("success_url", `${PUBLIC_APP}/?session_id={CHECKOUT_SESSION_ID}${successHash || "#/pay-return"}`);
  params.set("cancel_url", `${PUBLIC_APP}/${cancelHash || (table?.id ? "#/pay/" + encodeURIComponent(table.id) : "#/card")}`);
  params.set("client_reference_id", `${bridgeId || table?.id || venueId || "card"}:${user.id}`);
  params.set("metadata[tableId]", table?.id || "");
  params.set("metadata[userId]", user.id);
  params.set("metadata[method]", method || "card");
  params.set("metadata[venueId]", venueId || "");
  params.set("metadata[bridgeId]", bridgeId || "");
  params.set("metadata[kind]", setup ? "setup" : (bridgeId || venueId ? "booking" : "table"));
  if (!setup) {
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", (currency || "EUR").toLowerCase());
    params.set("line_items[0][price_data][unit_amount]", String(cents));
    params.set("line_items[0][price_data][product_data][name]", `VELVET · ${venueName || table?.venue || "booking"} · ${table?.date || ""}`.slice(0, 120));
  }
  params.set("automatic_payment_methods[enabled]", "true");
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${p.stripe.secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const j = await r.json();
  if (!j.url) throw new Error(j.error?.message || "stripe");
  return { url: j.url, id: j.id };
}
async function revolutOrder({ table, user, cents, currency }) {
  const p = loadPay();
  if (!p.revolut.merchantSecret) return null;
  const host = p.revolut.sandbox ? "https://sandbox-merchant.revolut.com" : "https://merchant.revolut.com";
  const r = await fetch(host + "/api/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${p.revolut.merchantSecret}`,
      "Revolut-Api-Version": "2024-09-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: cents,
      currency,
      redirect_url: `${PUBLIC_APP}/#/pay-return`,
      merchant_order_data: { reference: `${table.id}:${user.id}` },
      description: `VELVET ${table.venue} ${table.date || ""}`.slice(0, 250),
    }),
  });
  const j = await r.json();
  const url = j.checkout_url || j.token && `${host.replace("merchant.revolut.com", "checkout.revolut.com")}/pay/${j.token}`;
  if (!j.id) throw new Error(j.message || "revolut");
  return { url: url || j.checkout_url, id: j.id };
}
async function paypalOrder({ table, user, amount, currency }) {
  const p = loadPay();
  if (!p.paypal.client || !p.paypal.secret) return null;
  const api = p.paypal.sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const tok = await fetch(api + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${p.paypal.client}:${p.paypal.secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const tj = await tok.json();
  if (!tj.access_token) throw new Error("paypal_auth");
  const r = await fetch(api + "/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tj.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: `${table.id}:${user.id}`,
        amount: { currency_code: currency, value: Number(amount).toFixed(2) },
        description: `VELVET ${table.venue}`.slice(0, 120),
      }],
      application_context: {
        return_url: `${PUBLIC_APP}/#/pay-return`,
        cancel_url: `${PUBLIC_APP}/#/pay/${encodeURIComponent(table.id)}`,
        brand_name: "VELVET",
        user_action: "PAY_NOW",
      },
    }),
  });
  const j = await r.json();
  const approve = (j.links || []).find((l) => l.rel === "approve");
  if (!approve?.href) throw new Error(j.message || "paypal");
  return { url: approve.href, id: j.id };
}
function bankDetails(table, user, amount, currency) {
  const cfg = publicPayConfig();
  if (!cfg.account) return null;
  return {
    ...cfg.account,
    amount,
    currency,
    reference: payRef(table.id, user.id),
  };
}

// Enkel per-IP-rate-limit i minnet. Chatt-polling (1 GET / 4 s) ligger långt under
// GET-taket; POST-taket skyddar /idv, /chats, /tables och /pay mot missbruk.
// Vid flera instanser/byta till riktig databas: ersätt med Redis-baserad limit.
const RATE = new Map(); // ip -> { n, reset }
function rateLimited(req, res) {
  if (String(process.env.VELVET_RATE || "1") === "0") return false;
  const remote = String(req.socket.remoteAddress || "");
  if (remote === "127.0.0.1" || remote === "::1" || remote.endsWith(":127.0.0.1")) return false;
  const ip = String(req.headers["x-forwarded-for"] || remote || "okänd").split(",")[0].trim();
  const now = Date.now();
  let e = RATE.get(ip);
  if (!e || e.reset < now) { e = { n: 0, reset: now + 60_000 }; RATE.set(ip, e); }
  e.n++;
  if (RATE.size > 5000) { for (const [k, v] of RATE) { if (v.reset < now) RATE.delete(k); } }
  const limit = req.method === "POST" ? 30 : 120; // anrop per minut
  if (e.n > limit) { send(res, 429, { error: "rate_limit", message: "För många anrop — försök igen om en minut." }); return true; }
  return false;
}

const server = http.createServer(async (req, res) => {
  res._corsOrigin = corsOriginFor(req);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (rateLimited(req, res)) return;
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
      return send(res, 200, { ok: true, service: "velvet-api" });
    }
    if (req.method === "GET" && url.pathname === "/events") {
      const data = loadEventsFile();
      const st = loadCrawlStatus();
      return send(res, 200, {
        ...data,
        crawl: {
          lastRun: st.lastOk || st.lastRun,
          running: !!st.running,
          engine: st.engine,
          venuesUpdated: st.venuesUpdated,
          events: st.events,
        },
      }, { "Cache-Control": "no-store" });
    }
    if (req.method === "GET" && url.pathname === "/events/status") {
      return send(res, 200, loadCrawlStatus(), { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/events/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      const venueId = String(b.venueId || "").replace(/[^A-Z0-9._-]/gi, "").slice(0, 20);
      const operator = isOperator(b.user);
      const live = getCrawlState();
      if (live.running) {
        return send(res, 202, { running: true, status: live.status, ...loadEventsFile() });
      }
      const last = Date.parse(live.status.lastOk || live.status.lastRun || 0);
      const coolMs = venueId ? 20 * 60 * 1000 : 4 * 3600 * 1000;
      if (!operator && Number.isFinite(last) && Date.now() - last < coolMs && !venueId) {
        return send(res, 429, { error: "cooldown", status: live.status, ...loadEventsFile() });
      }
      if (venueId) {
        const result = await runCrawl({ venueId, reason: operator ? "operator-venue" : "app-venue" });
        try { await runMenusCrawl({ venueId, reason: operator ? "operator-venue" : "app-venue" }); } catch (e) { console.error("velvet-menus", e); }
        try { await runFactsCrawl({ venueId, reason: operator ? "operator-venue" : "app-venue", force: true }); } catch (e) { console.error("velvet-facts", e); }
        return send(res, 200, { ...(result.payload || loadEventsFile()), menus: loadMenusFile(), facts: loadFactsFile(), status: result, running: false }, { "Cache-Control": "no-store" });
      }
      runCrawl({ reason: operator ? "operator" : "app" }).catch((e) => console.error("velvet-crawl", e));
      return send(res, 202, { running: true, status: loadCrawlStatus(), ...loadEventsFile() });
    }
    if (req.method === "GET" && url.pathname === "/places") {
      return send(res, 200, loadPlacesFile(), { "Cache-Control": "no-store" });
    }
    if (req.method === "GET" && url.pathname === "/restaurants") {
      const code = String(url.searchParams.get("dest") || "").trim().toUpperCase();
      let all = loadRestaurantsFile();
      if (code && !all.destinations?.[code] && process.env.VELVET_CRAWL !== "0") {
        try {
          await runRestaurantDiscovery({ destinationCode: code, reason: "app-missing" });
          all = loadRestaurantsFile();
        } catch (e) { console.error("velvet-restaurants", e); }
      }
      const found = code ? all.destinations?.[code] || null : null;
      if (found && Date.now() - Date.parse(found.fetchedAt || 0) > 7 * 864e5 && process.env.VELVET_CRAWL !== "0") {
        runRestaurantDiscovery({ destinationCode: code, reason: "app-stale" }).catch((e) => console.error("velvet-restaurants", e));
      }
      return send(res, 200, code
        ? { fetchedAt: all.fetchedAt, minimumRating: all.minimumRating, destination: found }
        : all, { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/restaurants/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      if (!isOperator(b.user)) return send(res, 403, { error: "operator" });
      const destinationCode = String(b.destinationCode || "").replace(/[^A-Z0-9_-]/gi, "").slice(0, 12);
      runRestaurantDiscovery({ destinationCode, reason: "operator" }).catch((e) => console.error("velvet-restaurants", e));
      return send(res, 202, { running: true, destinationCode });
    }
    const placeOne = url.pathname.match(/^\/places\/([A-Z0-9._-]+)$/i);
    if (req.method === "GET" && placeOne) {
      const all = loadPlacesFile();
      const rec = all.venues?.[placeOne[1]] || null;
      return send(res, 200, { venueId: placeOne[1], place: rec }, { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/places/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      if (!isOperator(b.user)) return send(res, 403, { error: "operator" });
      const venueId = String(b.venueId || "").replace(/[^A-Z0-9._-]/gi, "").slice(0, 20);
      runPlacesLookup({ venueId, reason: "operator" }).catch((e) => console.error("velvet-places", e));
      return send(res, 202, { running: true, ...loadPlacesFile() });
    }
    if (req.method === "GET" && url.pathname === "/facts") {
      return send(res, 200, loadFactsFile(), { "Cache-Control": "no-store" });
    }
    if (req.method === "GET" && url.pathname === "/inventory") {
      const dest = String(url.searchParams.get("dest") || "").trim();
      const date = String(url.searchParams.get("date") || "").trim();
      const venueId = String(url.searchParams.get("venueId") || url.searchParams.get("venue") || "").trim();
      if (venueId) {
        const adapter = bookingAdapter(venueId);
        if (!adapter) return send(res, 404, { error: "no_booking_site" });
        return send(res, 200, { venueId, adapter }, { "Cache-Control": "no-store" });
      }
      if (!dest) return send(res, 400, { error: "dest" });
      const inv = destInventory(dest, date);
      if (!inv) return send(res, 404, { error: "dest" });
      return send(res, 200, inv, { "Cache-Control": "no-store" });
    }
    if (req.method === "GET" && url.pathname === "/menus") {
      return send(res, 200, loadMenusFile(), { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/menus/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      const venueId = String(b.venueId || "").replace(/[^A-Z0-9._-]/gi, "").slice(0, 20);
      const operator = isOperator(b.user);
      if (venueId) {
        const result = await runMenusCrawl({ venueId, reason: operator ? "operator-venue" : "app-venue" });
        return send(res, 200, { ...(result.payload || loadMenusFile()), status: result }, { "Cache-Control": "no-store" });
      }
      if (!operator) return send(res, 403, { error: "operator" });
      runMenusCrawl({ reason: "operator", listedOnly: true, limit: 48 }).catch((e) => console.error("velvet-menus", e));
      return send(res, 202, { running: true, ...loadMenusFile() });
    }
    const factOne = url.pathname.match(/^\/facts\/([A-Z0-9._-]+)$/i);
    if (req.method === "GET" && factOne) {
      const all = loadFactsFile();
      return send(res, 200, { venueId: factOne[1], facts: all.venues?.[factOne[1]] || null }, { "Cache-Control": "no-store" });
    }
    if (req.method === "POST" && url.pathname === "/facts/refresh") {
      if (process.env.VELVET_CRAWL === "0") return send(res, 403, { error: "crawl_disabled" });
      const b = await readBody(req, 2e5);
      const venueId = String(b.venueId || "").replace(/[^A-Z0-9._-]/gi, "").slice(0, 20);
      const operator = isOperator(b.user);
      if (venueId) {
        const result = await runFactsCrawl({ venueId, reason: operator ? "operator-venue" : "app-venue" });
        return send(res, 200, { ...(result.payload || loadFactsFile()), status: result }, { "Cache-Control": "no-store" });
      }
      if (!operator) return send(res, 403, { error: "operator" });
      runFactsCrawl({ reason: "operator" }).catch((e) => console.error("velvet-facts", e));
      return send(res, 202, { running: true, ...loadFactsFile() });
    }

    if (req.method === "GET" && url.pathname === "/pay/config") {
      return send(res, 200, publicPayConfig());
    }
    const authStart = url.pathname.match(/^\/auth\/start\/(facebook|instagram|tiktok|snapchat|google)$/);
    if (req.method === "GET" && authStart) {
      const provider = authStart[1];
      const state = crypto.randomBytes(12).toString("hex");
      const db = load();
      if (!db.auth) db.auth = {};
      db.auth["st:" + state] = { provider, exp: Date.now() + 15 * 60 * 1000 };
      save(db);
      const dest = oauthAuthorizeUrl(provider, state);
      if (!dest) return send(res, 200, { local: true, connect: true, provider });
      return send(res, 200, { url: dest, provider });
    }
    if (req.method === "POST" && url.pathname === "/auth/connect") {
      const b = await readBody(req, 2e5);
      const provider = String(b.provider || "");
      if (!["facebook", "instagram", "tiktok", "snapchat", "google"].includes(provider)) {
        return send(res, 400, { error: "provider" });
      }
      const handle = cleanHandle(provider, b.handle);
      if (!handle) return send(res, 400, { error: "handle" });
      const looked = await lookupPublicSocial(provider, handle);
      if (looked.error === "not_found") return send(res, 404, { error: "not_found" });
      const name = String(b.name || looked.name || "").trim().slice(0, 80);
      if (!name) return send(res, 400, { error: "name" });
      const profile = {
        id: `U-${provider}-${handle.toLowerCase()}`,
        provider,
        handle,
        name,
        photo: looked.photo || "",
        connected: true,
        oauth: false,
        created: new Date().toISOString(),
      };
      const db = load();
      upsertUser(db, profile);
      save(db);
      const stored = db.users[profile.id];
      return send(res, 200, { user: { ...publicPerson(stored, db, "user"), photo: stored.photo || "", connected: true } });
    }
    const authCb = url.pathname.match(/^\/auth\/callback\/(facebook|instagram|tiktok|snapchat|google)$/);
    if (req.method === "GET" && authCb) {
      const provider = authCb[1];
      const code = url.searchParams.get("code") || "";
      const state = url.searchParams.get("state") || "";
      const fail = () => {
        res.writeHead(302, { Location: `${PUBLIC_APP}/#/account` });
        res.end();
      };
      if (!code) return fail();
      const db0 = load();
      const st = db0.auth?.["st:" + state];
      if (!st || st.exp < Date.now()) return fail();
      try {
        const profile = await oauthProfile(provider, code);
        profile.created = new Date().toISOString();
        const db = load();
        upsertUser(db, profile);
        save(db);
        const token = mintAuthToken(profile);
        res.writeHead(302, { Location: `${PUBLIC_APP}/?auth=${encodeURIComponent(token)}#/` });
        res.end();
      } catch {
        fail();
      }
      return;
    }
    if (req.method === "GET" && url.pathname === "/auth/session") {
      const token = url.searchParams.get("token") || "";
      const db = load();
      const rec = db.auth?.[token];
      if (!rec || rec.exp < Date.now() || !rec.user) return send(res, 401, { error: "auth" });
      delete db.auth[token];
      save(db);
      return send(res, 200, { user: rec.user });
    }
    if (req.method === "POST" && url.pathname === "/pay/setup") {
      const b = await readBody(req, 2e5);
      if (!isOperator(b.user)) return send(res, 403, { error: "operator" });
      // Kritiskt: inloggning är namn+handle utan lösenord, så en självpåstådd operator-
      // identitet räcker inte för att byta betalnycklar. Kräv serverns admin-nyckel —
      // annars kan vem som helst kapa Stripe/PayPal/Revolut-konf och dirigera om
      // kundernas betalningar till sitt eget konto.
      const adminKey = String(process.env.VELVET_ADMIN_KEY || "");
      const givenKey = String(req.headers["x-admin-key"] || b.adminKey || "");
      if (!adminKey) return send(res, 503, { error: "admin_key_not_configured", message: "Sätt VELVET_ADMIN_KEY på servern — /pay/setup är avstängd tills dess." });
      if (givenKey !== adminKey) return send(res, 403, { error: "admin_key" });
      const cur = loadPay();
      if (b.webhookToken) cur.webhookToken = String(b.webhookToken);
      if (b.currency) cur.currency = String(b.currency).toUpperCase().slice(0, 3);
      if (b.revolutIban !== undefined) cur.revolut.iban = ibanOk(b.revolutIban) || String(b.revolutIban || "").replace(/\s+/g, "").toUpperCase();
      if (b.revolutBic !== undefined) cur.revolut.bic = String(b.revolutBic || "").replace(/\s+/g, "").toUpperCase();
      if (b.revolutName !== undefined) cur.revolut.name = String(b.revolutName || "").slice(0, 80);
      if (b.revolutMe !== undefined) cur.revolut.me = String(b.revolutMe || "").replace(/^https?:\/\/(www\.)?revolut\.me\//i, "").slice(0, 40);
      if (b.revolutMerchantSecret) cur.revolut.merchantSecret = String(b.revolutMerchantSecret);
      if (b.revolutSandbox !== undefined) cur.revolut.sandbox = !!b.revolutSandbox;
      if (b.stripeSecret) cur.stripe.secret = String(b.stripeSecret);
      if (b.stripePub) cur.stripe.pub = String(b.stripePub);
      if (b.stripeWebhook) cur.stripe.webhook = String(b.stripeWebhook);
      if (b.paypalClient) cur.paypal.client = String(b.paypalClient);
      if (b.paypalSecret) cur.paypal.secret = String(b.paypalSecret);
      if (b.paypalSandbox !== undefined) cur.paypal.sandbox = !!b.paypalSandbox;
      if (!cur.oauth) cur.oauth = emptyPay().oauth;
      if (b.facebookId) cur.oauth.facebook.id = String(b.facebookId);
      if (b.facebookSecret) cur.oauth.facebook.secret = String(b.facebookSecret);
      if (b.instagramId) cur.oauth.instagram.id = String(b.instagramId);
      if (b.instagramSecret) cur.oauth.instagram.secret = String(b.instagramSecret);
      if (b.tiktokKey) cur.oauth.tiktok.key = String(b.tiktokKey);
      if (b.tiktokSecret) cur.oauth.tiktok.secret = String(b.tiktokSecret);
      if (b.snapchatId) cur.oauth.snapchat.id = String(b.snapchatId);
      if (b.snapchatSecret) cur.oauth.snapchat.secret = String(b.snapchatSecret);
      if (!cur.oauth.google) cur.oauth.google = { id: "", secret: "" };
      if (b.googleId) cur.oauth.google.id = String(b.googleId);
      if (b.googleSecret) cur.oauth.google.secret = String(b.googleSecret);
      if (b.firecrawlKey) cur.firecrawlKey = String(b.firecrawlKey).trim();
      if (b.googlePlacesKey) cur.googlePlacesKey = String(b.googlePlacesKey).trim();
      savePay(cur);
      return send(res, 200, { ok: true, config: publicPayConfig() });
    }
    if (req.method === "POST" && url.pathname === "/card/setup") {
      const b = await readBody(req, 2e5);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 401, { error: "auth" });
      const db = load();
      if (!isIdvVerified(uid, db)) return send(res, 403, { error: "idv_required" });
      const s = await stripeCheckout({
        user: { id: uid, name: b.user?.name || "", email: b.user?.email || "" },
        method: "card",
        mode: "setup",
        successHash: "#/pay-return",
        cancelHash: "#/card",
      }).catch(() => null);
      if (!s?.url) return send(res, 409, { error: "no_processor" });
      return send(res, 200, { mode: "redirect", url: s.url, id: s.id, provider: "stripe", kind: "setup" });
    }
    if (req.method === "POST" && url.pathname === "/pay/intent") {
      const b = await readBody(req, 2e5);
      const userId = String(b.user?.id || "");
      if (!userId) return send(res, 401, { error: "auth" });
      const db = load();
      const venueId = String(b.venueId || "");
      const bridgeId = String(b.bridgeId || "");
      const t = db.tables.find((x) => x.id === String(b.tableId || ""));
      if (!t && !venueId && !bridgeId) return send(res, 404, { error: "not_found" });
      if (t) {
        const member = t.host?.id === userId || (t.joiners || []).some((j) => j.id === userId);
        if (!member) return send(res, 403, { error: "not_member" });
      } else {
        const gate = memberGate(userId, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, userId, db, venueId));
      }
      const amount = Math.max(0, Number(b.amount) || 0);
      const currency = publicPayConfig().currency || "EUR";
      const method = String(b.method || "card");
      if (amount < 1) {
        return send(res, 409, { error: "no_amount", message: "Ange beloppet i euro — klubben sätter priset, du betalar din del." });
      }
      const cents = Math.max(100, Math.round(amount * 100));
      const adapter = venueId ? bookingAdapter(venueId) : null;
      const br = bridgeId ? (db.bridges || []).find((x) => x.id === bridgeId) : null;
      const table = t
        ? { id: t.id, venue: t.venue, date: t.date }
        : { id: bridgeId || venueId, venue: br?.venue || adapter?.name || venueId, date: br?.date || "" };
      const user = { id: userId, name: b.user?.name || "", email: b.user?.email || "" };
      try {
        if (method === "sepa" || method === "swift" || (method === "revolut" && !loadPay().revolut.merchantSecret)) {
          const bank = bankDetails(table, user, amount, currency);
          if (!bank) return send(res, 409, { error: "no_account", message: "Revolut-konto inte kopplat än." });
          if ((method === "sepa" || method === "swift") && !bank.iban) {
            return send(res, 409, { error: "no_account", message: "IBAN saknas — använd Revolut.me." });
          }
          return send(res, 200, { mode: "bank", bank, method });
        }
        if (method === "paypal") {
          const o = await paypalOrder({ table, user, amount, currency });
          if (!o) return send(res, 409, { error: "paypal_off" });
          return send(res, 200, { mode: "redirect", url: o.url, id: o.id, provider: "paypal", method });
        }
        if (method === "revolut") {
          const o = await revolutOrder({ table, user, cents, currency });
          if (o?.url) return send(res, 200, { mode: "redirect", url: o.url, id: o.id, provider: "revolut", method });
          const bank = bankDetails(table, user, amount, currency);
          if (!bank) return send(res, 409, { error: "revolut_off" });
          return send(res, 200, { mode: "bank", bank, method });
        }
        // card / applepay / googlepay / klarna → Stripe, else Revolut Merchant
        const s = await stripeCheckout({
          table, user, cents, currency, method,
          venueId, bridgeId,
          venueName: table.venue,
          successHash: "#/pay-return",
          cancelHash: venueId ? `#/book-site/${encodeURIComponent(venueId)}` : (t ? `#/pay/${encodeURIComponent(t.id)}` : "#/card"),
        });
        if (s?.url) return send(res, 200, { mode: "redirect", url: s.url, id: s.id, provider: "stripe", method });
        const o = await revolutOrder({ table, user, cents, currency });
        if (o?.url) return send(res, 200, { mode: "redirect", url: o.url, id: o.id, provider: "revolut", method });
        const bank = bankDetails(table, user, amount, currency);
        if (bank) return send(res, 200, { mode: "bank", bank, method, fallback: true });
        return send(res, 409, { error: "no_processor" });
      } catch (e) {
        return send(res, 502, { error: "provider", message: String(e.message || e) });
      }
    }
    if (req.method === "POST" && url.pathname === "/pay/sent") {
      const b = await readBody(req, 2e5);
      const userId = String(b.user?.id || "");
      if (!userId) return send(res, 401, { error: "auth" });
      const db = load();
      const t = db.tables.find((x) => x.id === String(b.tableId || ""));
      if (!t) return send(res, 404, { error: "not_found" });
      const target = t.host?.id === userId ? t.host : (t.joiners || []).find((j) => j.id === userId);
      if (!target) return send(res, 403, { error: "not_member" });
      if (target.paid) return send(res, 200, { ok: true, table: publicTable(t, db), already: true });
      const amount = Math.max(0, Number(b.amount) || 0);
      target.paidPending = true;
      target.paidAmount = amount;
      target.paidVia = "pending:" + String(b.method || "bank").slice(0, 20);
      target.paidRef = String(b.reference || payRef(t.id, userId));
      save(db);
      return send(res, 200, { ok: true, table: publicTable(t, db) });
    }
    if (req.method === "POST" && url.pathname === "/pay/confirm") {
      const b = await readBody(req, 2e5);
      const userId = String(b.user?.id || "");
      if (!userId) return send(res, 401, { error: "auth" });
      const db = load();
      const pay = loadPay();
      if (b.sessionId && pay.stripe.secret) {
        const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(b.sessionId)}`, {
          headers: { Authorization: `Bearer ${pay.stripe.secret}` },
        });
        const s = await r.json();
        if (s.mode === "setup" && (s.status === "complete" || s.setup_intent)) {
          let last4 = "";
          let brand = "card";
          let expMonth = 0;
          let expYear = 0;
          let pmId = typeof s.payment_method === "string" ? s.payment_method : (s.payment_method?.id || "");
          const si = s.setup_intent;
          const sid = typeof si === "string" ? si : si?.id;
          if (sid) {
            const r2 = await fetch(`https://api.stripe.com/v1/setup_intents/${encodeURIComponent(sid)}?expand[]=payment_method`, {
              headers: { Authorization: `Bearer ${pay.stripe.secret}` },
            });
            const j2 = await r2.json();
            const card = j2.payment_method?.card || {};
            last4 = String(card.last4 || "");
            brand = String(card.brand || "card");
            expMonth = Number(card.exp_month) || 0;
            expYear = Number(card.exp_year) || 0;
            pmId = j2.payment_method?.id || pmId;
          }
          if (last4.length === 4) {
            upsertUser(db, b.user || { id: userId });
            db.users[userId].card = { last4, brand, expMonth, expYear, added: new Date().toISOString(), stripePm: pmId };
            save(db);
            return send(res, 200, { ok: true, card: publicCard(db.users[userId].card), kind: "setup" });
          }
        }
        if (s.payment_status === "paid" || s.status === "complete") {
          const tableId = s.metadata?.tableId || String(b.tableId || "");
          const uid = s.metadata?.userId || userId;
          const rec = applyIncomingPayment(db, {
            tableId, userId: uid,
            bridgeId: s.metadata?.bridgeId || String(b.bridgeId || ""),
            venueId: s.metadata?.venueId || String(b.venueId || ""),
            amount: (s.amount_total || 0) / 100,
            currency: (s.currency || "eur").toUpperCase(), method: "card", provider: "stripe", providerId: s.id,
          });
          if (rec) save(db);
          const t = db.tables.find((x) => x.id === tableId);
          const br = (db.bridges || []).find((x) => x.id === (s.metadata?.bridgeId || b.bridgeId));
          return send(res, 200, { ok: !!rec, table: t ? publicTable(t, db) : null, bridge: br ? publicBridge(br) : null });
        }
      }
      if (b.orderId && pay.revolut.merchantSecret) {
        const host = pay.revolut.sandbox ? "https://sandbox-merchant.revolut.com" : "https://merchant.revolut.com";
        const r = await fetch(`${host}/api/orders/${encodeURIComponent(b.orderId)}`, {
          headers: { Authorization: `Bearer ${pay.revolut.merchantSecret}`, "Revolut-Api-Version": "2024-09-01" },
        });
        const o = await r.json();
        if (["completed", "paid", "captured"].includes(String(o.state || o.status || "").toLowerCase())) {
          const ref = String(o.merchant_order_data?.reference || b.tableId || "");
          const [tableId, uid] = ref.includes(":") ? ref.split(":") : [b.tableId, userId];
          const rec = applyIncomingPayment(db, {
            tableId, userId: uid || userId, amount: (o.amount || 0) / 100,
            currency: o.currency || "EUR", method: "revolut", provider: "revolut", providerId: o.id,
          });
          if (rec) save(db);
          const t = db.tables.find((x) => x.id === tableId);
          return send(res, 200, { ok: !!rec, table: t ? publicTable(t, db) : null });
        }
      }
      return send(res, 409, { error: "not_paid" });
    }
    if (req.method === "POST" && url.pathname === "/pay/webhook/stripe") {
      const raw = await readRaw(req);
      const pay = loadPay();
      // Utan signaturhemlighet får inga betalningar bekräftas — annars kan vem som
      // helst POST:a fejkade "paid"-events och markera sig själv som betald.
      if (!pay.stripe.webhook) return send(res, 503, { error: "webhook_secret_missing" });
      {
        const header = String(req.headers["stripe-signature"] || "");
        const parts = Object.fromEntries(header.split(",").map((x) => {
          const i = x.indexOf("=");
          return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : ["", ""];
        }).filter((x) => x[0]));
        const signed = `${parts.t}.${raw.toString("utf8")}`;
        const digest = crypto.createHmac("sha256", pay.stripe.webhook).update(signed).digest("hex");
        if (!parts.v1 || digest.length !== parts.v1.length || !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(parts.v1))) {
          return send(res, 400, { error: "sig" });
        }
      }
      let ev;
      try { ev = JSON.parse(raw.toString("utf8")); } catch { return send(res, 400, { error: "json" }); }
      const s = ev.data?.object || {};
      if ((ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") && (s.payment_status === "paid" || s.status === "complete")) {
        const db = load();
        applyIncomingPayment(db, {
          tableId: s.metadata?.tableId, userId: s.metadata?.userId,
          bridgeId: s.metadata?.bridgeId, venueId: s.metadata?.venueId,
          amount: (s.amount_total || 0) / 100, currency: (s.currency || "eur").toUpperCase(),
          method: "card", provider: "stripe", providerId: s.id,
        });
        save(db);
      }
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/pay/webhook/revolut") {
      const b = await readBody(req, 2e5);
      const pay = loadPay();
      const tok = webhookTokenOk(req, url, pay);
      if (tok === "missing") return send(res, 503, { error: "webhook_token_missing" });
      if (tok !== "ok") return send(res, 403, { error: "webhook_token" });
      const order = b.order || b.data || b;
      const state = String(order.state || order.status || b.event || "").toLowerCase();
      if (state.includes("complet") || state.includes("paid") || b.event === "ORDER_COMPLETED") {
        const ref = String(order.merchant_order_data?.reference || "");
        const [tableId, userId] = ref.split(":");
        if (tableId && userId) {
          const db = load();
          applyIncomingPayment(db, {
            tableId, userId, amount: (order.amount || 0) / 100,
            currency: order.currency || "EUR", method: "revolut", provider: "revolut", providerId: order.id,
          });
          save(db);
        }
      }
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/pay/webhook/paypal") {
      const b = await readBody(req, 2e5);
      const pay = loadPay();
      const tok = webhookTokenOk(req, url, pay);
      if (tok === "missing") return send(res, 503, { error: "webhook_token_missing" });
      if (tok !== "ok") return send(res, 403, { error: "webhook_token" });
      const ev = String(b.event_type || "");
      const custom = String(b.resource?.purchase_units?.[0]?.custom_id || b.resource?.custom_id || "");
      if (ev.includes("PAYMENT") || ev.includes("CHECKOUT.ORDER.APPROVED") || ev.includes("CAPTURE.COMPLETED")) {
        const [tableId, userId] = custom.split(":");
        if (tableId && userId) {
          const db = load();
          applyIncomingPayment(db, {
            tableId, userId,
            amount: Number(b.resource?.amount?.value || b.resource?.purchase_units?.[0]?.amount?.value || 0),
            currency: b.resource?.amount?.currency_code || "EUR",
            method: "paypal", provider: "paypal", providerId: b.resource?.id,
          });
          save(db);
        }
      }
      return send(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/users") {
      const b = await readBody(req, 2e5);
      if (!b.id || !b.provider) return send(res, 400, { error: "missing" });
      const db = load();
      upsertUser(db, b);
      save(db);
      return send(res, 200, { user: publicPerson(db.users[b.id], db, "user") });
    }
    const userM = url.pathname.match(/^\/users\/([^/]+)$/);
    if (req.method === "GET" && userM) {
      const uid = decodeURIComponent(userM[1]);
      const db = load();
      const u = findUser(db, uid);
      const list = db.reviews.filter((r) => r.to === uid);
      const mine = db.tables.filter((t) => t.host?.id === uid || (t.joiners || []).some((j) => j.id === uid));
      const parties = mine.map((t) => partySummary(t, uid, db)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const person = u ? publicPerson(u, db, "user") : { id: uid, name: uid, handle: "", provider: "", socialUrl: "", idv: db.idv[uid]?.status === "verified" ? "verified" : "none" };
      const spend = verifiedSpend(uid, db);
      return send(res, 200, {
        user: person,
        spend,
        reviews: list,
        ...avgRating(list),
        tables: parties,
        parties: {
          past: parties.filter((p) => p.past).slice(0, 40),
          upcoming: parties.filter((p) => !p.past).slice(0, 20),
        },
      });
    }

    if (req.method === "GET" && url.pathname === "/tables") {
      const db = load();
      const open = db.tables
        .filter((t) => t.status === "open" && Number(t.openLeft) > 0)
        .map((t) => publicTable(t, db));
      return send(res, 200, { tables: open });
    }
    const payM = url.pathname.match(/^\/tables\/([^/]+)\/pay$/);
    const joinM = url.pathname.match(/^\/tables\/([^/]+)\/join$/);
    const getM = url.pathname.match(/^\/tables\/([^/]+)$/);
    if (req.method === "GET" && getM) {
      const db = load();
      const t = db.tables.find((x) => x.id === decodeURIComponent(getM[1]));
      if (!t) return send(res, 404, { error: "not_found" });
      return send(res, 200, { table: publicTable(t, db) });
    }
    if (req.method === "POST" && url.pathname === "/tables") {
      const b = await readBody(req, 2e6);
      if (!b.venue || !b.host?.name) return send(res, 400, { error: "missing" });
      const hostId = String(b.host?.id || "");
      if (!hostId) return send(res, 401, { error: "auth" });
      const db = load();
      const gate = memberGate(hostId, db, String(b.venue_id || ""));
      if (gate) return send(res, 403, gatePayload(gate, hostId, db, String(b.venue_id || "")));
      const party = Math.max(2, Math.min(20, Number(b.party) || 4));
      const openSeats = Math.max(0, Math.min(party - 1, Number(b.openSeats) || 0));
      const host = {
        id: hostId,
        name: String(b.host.name),
        provider: String(b.host?.provider || ""),
        handle: String(b.host?.handle || "").replace(/^@/, ""),
        email: String(b.host?.email || ""),
        phone: String(b.host?.phone || ""),
        paid: false,
        joined: new Date().toISOString(),
      };
      const table = {
        id: b.id || `TB-${Date.now().toString(36).toUpperCase()}`,
        venue_id: String(b.venue_id || ""),
        venue: String(b.venue),
        destination: String(b.destination || ""),
        date: String(b.date || ""),
        package: String(b.package || ""),
        total: Number(b.total) || 0,
        party,
        openSeats,
        openLeft: openSeats,
        openFor: parseOpenFor(b.openFor),
        split: true,
        sharp: !!b.sharp,
        status: openSeats > 0 ? "open" : "closed",
        host,
        guests: Array.isArray(b.guests) ? b.guests.map((g) => ({
          name: String(g.name || "").slice(0, 80),
          email: String(g.email || ""),
          paid: false,
        })) : [],
        joiners: [],
        created: new Date().toISOString(),
      };
      upsertUser(db, host);
      db.tables.unshift(table);
      db.tables = db.tables.slice(0, 200);
      save(db);
      return send(res, 201, { table: publicTable(table, db) });
    }
    if (req.method === "POST" && joinM) {
      const b = await readBody(req, 2e6);
      const db = load();
      const t = db.tables.find((x) => x.id === decodeURIComponent(joinM[1]));
      if (!t) return send(res, 404, { error: "not_found" });
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 401, { error: "auth" });
      const gate = memberGate(uid, db, t.venue_id);
      if (gate) return send(res, 403, gatePayload(gate, uid, db, t.venue_id));
      if (t.openLeft < 1) return send(res, 409, { error: "full" });
      const pref = seatPrefError(t, uid, db);
      if (pref) return send(res, 403, { error: pref, openFor: parseOpenFor(t.openFor) });
      const years = idvAge(db.idv[uid]);
      const min = minAgeForVenue(t.venue_id);
      if (years != null && years < min) return send(res, 403, { error: "too_young", ageYears: years, minAge: min });
      if (t.host?.id === uid || t.joiners.some((j) => j.id === uid)) {
        return send(res, 200, { table: publicTable(t, db), already: true });
      }
      const joiner = {
        id: uid,
        name: String(b.user?.name || b.user?.provider || "Gäst"),
        provider: String(b.user?.provider || ""),
        handle: String(b.user?.handle || "").replace(/^@/, ""),
        paid: false,
        joined: new Date().toISOString(),
      };
      t.joiners.push(joiner);
      upsertUser(db, joiner);
      t.openLeft = Math.max(0, t.openLeft - 1);
      if (t.openLeft === 0) t.status = "full";
      save(db);
      return send(res, 200, { table: publicTable(t, db) });
    }
    if (req.method === "POST" && payM) {
      const b = await readBody(req, 2e5);
      const db = load();
      const t = db.tables.find((x) => x.id === decodeURIComponent(payM[1]));
      if (!t) return send(res, 404, { error: "not_found" });
      const actorId = String(b.user?.id || "");
      if (!actorId) return send(res, 401, { error: "auth" });
      const isHost = !!(t.host?.id && t.host.id === actorId);
      const targetId = String(b.targetId || actorId);
      const targetName = String(b.targetName || "");
      const paid = !!b.paid;
      if (!isHost && targetId !== actorId) return send(res, 403, { error: "forbidden" });
      let hit = false;
      if (t.host?.id === targetId || (isHost && !targetId && !targetName && t.host)) {
        setPaidFlag(t.host, paid, actorId);
        hit = true;
      }
      const j = t.joiners.find((x) => x.id === targetId);
      if (j) { setPaidFlag(j, paid, actorId); hit = true; }
      if (!hit && isHost && targetName) {
        const g = (t.guests || []).find((x) => x.name === targetName);
        if (g) { setPaidFlag(g, paid, actorId); hit = true; }
      }
      if (!hit) return send(res, 404, { error: "member" });
      const amount = Math.max(0, Number(b.amount) || 0);
      const member = t.host?.id === targetId ? t.host : (t.joiners || []).find((x) => x.id === targetId);
      if (member && paid && amount > 0) {
        member.paidAmount = amount;
        if (isIdvVerified(targetId, db)) {
          const already = (db.payments || []).some((p) => p.userId === targetId && p.tableId === t.id && p.status === "paid");
          if (!already) {
            db.payments = [{
              id: `PY-${Date.now().toString(36)}`,
              tableId: t.id,
              userId: targetId,
              amount,
              currency: "EUR",
              method: "manual",
              provider: "app",
              providerId: "",
              status: "paid",
              created: new Date().toISOString(),
            }, ...(db.payments || [])].slice(0, 500);
          }
        }
      }
      if (member && !paid) member.paidAmount = 0;
      save(db);
      return send(res, 200, { table: publicTable(t, db) });
    }

    if (req.method === "POST" && url.pathname === "/idv") {
      const b = await readBody(req);
      const uid = safeId(b.userId);
      if (!uid || uid === "unknown") return send(res, 400, { error: "user" });
      const pass = decodeDataUrl(b.passport);
      const self = decodeDataUrl(b.selfie);
      if (!pass || !self) return send(res, 400, { error: "images" });
      const parsed = readMrzBody(b);
      const dir = path.join(IDV_DIR, uid);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "passport." + pass.ext), pass.buf);
      fs.writeFileSync(path.join(dir, "selfie." + self.ext), self.buf);
      const claimed = String(b.name || "");
      const db = load();
      const now = new Date().toISOString();
      if (!parsed || !parsed.checksumsOk || (parsed.reasons || []).includes("not_passport")) {
        db.idv[b.userId] = {
          userId: String(b.userId),
          name: claimed,
          status: "unreadable",
          submitted: now,
          reasons: (parsed && parsed.reasons) || ["mrz_unreadable"],
        };
        save(db);
        return send(res, 422, { error: "mrz_unreadable", idv: publicIdv(db.idv[b.userId]) });
      }
      if (parsed.expired) {
        db.idv[b.userId] = {
          userId: String(b.userId),
          name: claimed,
          status: "expired",
          submitted: now,
          reasons: parsed.reasons,
          fields: parsed.fields,
          fieldsPublic: publicFields(parsed.fields),
          legalName: legalName(parsed.fields),
        };
        save(db);
        return send(res, 422, { error: "mrz_expired", idv: publicIdv(db.idv[b.userId]) });
      }
      const years = ageYears(parsed.fields.birthDate);
      if (years == null || years < MIN_AGE) {
        db.idv[b.userId] = {
          userId: String(b.userId),
          name: claimed,
          status: "underage",
          submitted: now,
          reasons: ["too_young"],
          fields: parsed.fields,
          fieldsPublic: publicFields(parsed.fields),
          legalName: legalName(parsed.fields),
        };
        save(db);
        return send(res, 422, {
          error: "too_young",
          ageYears: years,
          minAge: MIN_AGE,
          idv: publicIdv(db.idv[b.userId]),
        });
      }
      const face = readFace(b);
      if (!face.ok) {
        db.idv[b.userId] = {
          userId: String(b.userId),
          name: claimed,
          status: face.error === "face_mismatch" ? "face_mismatch" : "face_required",
          submitted: now,
          reasons: [face.error || "face_required"],
          fields: parsed.fields,
          fieldsPublic: publicFields(parsed.fields),
          legalName: legalName(parsed.fields),
          facePublic: {
            passportFace: face.passportFace,
            selfieFace: face.selfieFace,
            liveness: face.liveness,
            matchOk: face.matchOk,
            matchDistance: face.matchDistance,
          },
        };
        save(db);
        return send(res, 422, { error: face.error || "face_required", idv: publicIdv(db.idv[b.userId]) });
      }
      const nm = nameMatch(parsed.fields.firstName, parsed.fields.lastName, claimed);
      let status = "verified";
      if (!nm.ok && !b.confirmMismatch) status = "mismatch";
      db.idv[b.userId] = {
        userId: String(b.userId),
        name: claimed,
        status,
        submitted: now,
        reasons: parsed.reasons,
        nameMatch: nm,
        fields: parsed.fields,
        fieldsPublic: publicFields(parsed.fields),
        legalName: legalName(parsed.fields),
        mrz: { line1: parsed.line1, line2: parsed.line2 },
        facePublic: {
          passportFace: true,
          selfieFace: true,
          liveness: true,
          matchOk: true,
          matchDistance: face.matchDistance,
        },
      };
      if (status === "verified" && db.users[b.userId]) {
        db.users[b.userId].legalName = legalName(parsed.fields);
      }
      save(db);
      if (status === "mismatch") {
        return send(res, 200, { error: "name_mismatch", idv: publicIdv(db.idv[b.userId]) });
      }
      return send(res, 200, { idv: publicIdv(db.idv[b.userId]) });
    }
    const idvM = url.pathname.match(/^\/idv\/([^/]+)$/);
    if (req.method === "GET" && idvM) {
      const db = load();
      const rec = db.idv[decodeURIComponent(idvM[1])];
      const uid = decodeURIComponent(idvM[1]);
      // Integritet: userId:n är gissningsbara (U-<leverantör>-<handle>), så passfält,
      // juridiskt namn och kortuppgifter lämnas bara ut till operatorn med admin-nyckel.
      // Appen själv behöver bara status (refreshIdv).
      const adminKey = String(process.env.VELVET_ADMIN_KEY || "");
      const isAdmin = adminKey && String(req.headers["x-admin-key"] || url.searchParams.get("adminKey") || "") === adminKey;
      const pub = publicIdv(rec);
      return send(res, 200, {
        idv: isAdmin ? pub : { status: pub.status, submitted: pub.submitted },
        ...(isAdmin ? { card: publicCard(db.users[uid]?.card), paying: hasCardOnFile(uid, db) } : {}),
      });
    }
    if (req.method === "POST" && url.pathname === "/card") {
      const b = await readBody(req, 2e5);
      const uid = String(b.user?.id || b.userId || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      upsertUser(db, b.user || { id: uid });
      if (!isIdvVerified(uid, db)) return send(res, 403, { error: "idv_required" });
      const parsed = parseCardBody(b);
      if (parsed.error) return send(res, 400, { error: parsed.error });
      db.users[uid].card = parsed.card;
      save(db);
      return send(res, 200, { ok: true, card: publicCard(parsed.card), paying: true });
    }

    if (req.method === "POST" && url.pathname === "/reviews") {
      const b = await readBody(req, 2e5);
      const from = String(b.from?.id || "");
      const to = String(b.to?.id || "");
      const tableId = String(b.tableId || "");
      const rating = Number(b.rating);
      if (!from || !to || from === to) return send(res, 400, { error: "who" });
      if (!tableId) return send(res, 400, { error: "table" });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return send(res, 400, { error: "rating" });
      const db = load();
      const t = db.tables.find((x) => x.id === tableId);
      if (!t) return send(res, 404, { error: "table" });
      const ids = tableMemberIds(t);
      if (!ids.includes(from) || !ids.includes(to)) return send(res, 403, { error: "not_shared" });
      if (!isPartyOver(t)) return send(res, 403, { error: "too_soon" });
      if (db.reviews.some((r) => r.from === from && r.to === to && r.tableId === tableId)) {
        return send(res, 409, { error: "dup" });
      }
      const rec = {
        id: `RV-${Date.now().toString(36)}`,
        from,
        fromName: String(b.from?.name || ""),
        to,
        toName: String(b.to?.name || ""),
        tableId: String(b.tableId || ""),
        rating,
        text: String(b.text || "").slice(0, 500),
        created: new Date().toISOString(),
      };
      db.reviews.unshift(rec);
      db.reviews = db.reviews.slice(0, 500);
      save(db);
      return send(res, 201, { review: rec });
    }
    const revM = url.pathname.match(/^\/reviews\/([^/]+)$/);
    if (req.method === "GET" && revM) {
      const uid = decodeURIComponent(revM[1]);
      const db = load();
      const list = db.reviews.filter((r) => r.to === uid);
      const u = findUser(db, uid);
      return send(res, 200, {
        reviews: list,
        ...avgRating(list),
        idv: db.idv[uid]?.status || "none",
        user: u ? publicPerson(u, db, "user") : null,
      });
    }

    if (req.method === "GET" && url.pathname === "/wa/webhook") {
      const cloud = waCloud();
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && cloud.verify && token === cloud.verify) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(challenge || "");
        return;
      }
      return send(res, 403, { error: "verify" });
    }
    if (req.method === "POST" && url.pathname === "/wa/webhook") {
      const b = await readBody(req, 1e6);
      const db = load();
      const entries = Array.isArray(b.entry) ? b.entry : [];
      let stored = 0;
      for (const entry of entries) {
        const changes = Array.isArray(entry.changes) ? entry.changes : [];
        for (const ch of changes) {
          const msgs = ch.value?.messages || [];
          for (const m of msgs) {
            const from = waDigits(m.from);
            const text = String(m.text?.body || m.button?.text || "").trim().slice(0, 800);
            const mid = String(m.id || "");
            if (!from || !text) continue;
            if (markWaSeen(db, mid)) continue;
            let venueId = "";
            let threadId = "";
            let role = "user";
            for (const [vid, rec] of Object.entries(db.promoterContact || {})) {
              if (waDigits(rec.whatsapp) === from) {
                venueId = vid;
                threadId = rec.lastThreadId || "";
                role = "promoter";
                break;
              }
            }
            if (!venueId) {
              for (const [vid, threads] of Object.entries(db.chatsMeta || {})) {
                for (const [tid, meta] of Object.entries(threads || {})) {
                  if (waDigits(meta.guestWa) === from) {
                    venueId = vid;
                    threadId = tid;
                    role = "user";
                    break;
                  }
                }
                if (venueId) break;
              }
            }
            if (!venueId) {
              for (const [uid, u] of Object.entries(db.users || {})) {
                if (waDigits(u.whatsapp) === from) {
                  for (const [vid, rec] of Object.entries(db.chats || {})) {
                    if (rec[uid]) { venueId = vid; threadId = uid; role = "user"; break; }
                  }
                  break;
                }
              }
            }
            if (!venueId || !threadId) continue;
            const who = role === "promoter"
              ? (findUser(db, db.promoterContact[venueId]?.userId) || { name: "Promoter" })
              : (db.users[threadId] || { name: "Gäst" });
            appendChat(db, venueId, threadId, {
              id: `M-wa-${Date.now().toString(36)}`,
              role,
              userId: role === "promoter" ? (db.promoterContact[venueId]?.userId || "promoter") : threadId,
              name: String(who.name || ""),
              handle: String(who.handle || ""),
              text,
              via: "whatsapp",
              created: new Date().toISOString(),
            });
            stored += 1;
            if (role === "promoter") {
              const guestPhone = guestWaForThread(db, venueId, threadId);
              if (guestPhone) cloudSendWa(guestPhone, text).catch(() => {});
            } else {
              const promo = whatsappForVenue(venueId, db);
              if (promo?.phone) {
                if (!db.promoterContact[venueId]) db.promoterContact[venueId] = { whatsapp: promo.phone };
                db.promoterContact[venueId].lastThreadId = threadId;
                cloudSendWa(promo.phone, `${who.name || "Gäst"} · VELVET\n${text}`).catch(() => {});
              }
            }
          }
        }
      }
      save(db);
      return send(res, 200, { ok: true, stored });
    }

    const bridgeOne = url.pathname.match(/^\/book\/bridge\/([^/]+)$/);
    if (req.method === "GET" && url.pathname === "/book/bridge") {
      const uid = url.searchParams.get("userId") || "";
      if (!uid) return send(res, 401, { error: "auth" });
      const db = load();
      const gate = memberGate(uid, db);
      if (gate) return send(res, 403, gatePayload(gate, uid, db));
      const mine = (db.bridges || []).filter((x) => x.userId === uid).slice(0, 40);
      return send(res, 200, { bridges: mine.map(publicBridge) });
    }
    if (req.method === "GET" && bridgeOne) {
      const venueId = decodeURIComponent(bridgeOne[1]);
      const adapter = bookingAdapter(venueId);
      if (!adapter) return send(res, 404, { error: "no_booking_site" });
      const uid = url.searchParams.get("userId") || "";
      if (!uid) return send(res, 200, { adapter, payReady: publicPayConfig().ready });
      const db = load();
      const promoter = isPromoter({ id: uid }, venueId, db);
      if (!promoter) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 200, { adapter, payReady: publicPayConfig().ready, ...gatePayload(gate, uid, db, venueId) });
      }
      const list = (db.bridges || []).filter((x) => x.venueId === venueId && (promoter || x.userId === uid));
      return send(res, 200, { adapter, bridges: list.map(publicBridge), promoter, payReady: publicPayConfig().ready });
    }
    if (req.method === "POST" && url.pathname === "/book/bridge") {
      const b = await readBody(req, 2e5);
      const venueId = String(b.venueId || b.venue_id || "");
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      if (!venueId) return send(res, 400, { error: "venue" });
      const adapter = bookingAdapter(venueId);
      if (!adapter) return send(res, 404, { error: "no_booking_site" });
      const db = load();
      if (!isPromoter({ id: uid }, venueId, db)) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      const date = String(b.date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: "date" });
      const party = Math.max(1, Math.min(20, Number(b.party) || 2));
      const eventTitle = String(b.eventTitle || "").trim().slice(0, 140);
      const eventUrl = officialEventUrl(adapter.officialUrl, b.eventUrl);
      const menuWant = String(b.menuItem || "").trim().slice(0, 80);
      const menuHit = menuWant
        ? (adapter.inventory?.menu?.items || []).find((x) => x.name === menuWant)
        : null;
      upsertUser(db, b.user);
      const d = dossier(uid, db) || {};
      const guest = {
        id: uid,
        legalName: d.legalName || String(b.user?.name || "").slice(0, 80),
        nationality: d.fields?.nationality || "",
        documentMasked: d.fields?.documentNumberMasked || "",
        ageYears: idvAge(db.idv[uid]),
        card: d.card || null,
        email: String(b.email || b.user?.email || db.users[uid]?.email || "").slice(0, 80),
        phone: String(b.phone || b.user?.phone || db.users[uid]?.whatsapp || "").slice(0, 40),
        handle: d.handle || "",
      };
      const id = `BR-${Date.now().toString(36).toUpperCase()}`;
      const rec = {
        id,
        venueId,
        venue: adapter.name,
        destination: adapter.destination,
        officialUrl: eventUrl || adapter.officialUrl,
        widgetUrl: adapter.widgetUrl || "",
        handoffUrl: handoffUrl(adapter.widgetUrl || eventUrl || adapter.officialUrl, id),
        eventTitle,
        eventUrl,
        host: adapter.host,
        kind: adapter.kind,
        engine: adapter.engine,
        engineLabel: adapter.engineLabel || "",
        clubEmail: adapter.clubEmail,
        clubPay: !!adapter.clubPay,
        payUrl: adapter.payUrl || "",
        date,
        party,
        package: String(menuHit ? `${menuHit.name}${menuHit.price ? " · " + menuHit.price : ""}` : (b.package || adapter.label || "")).slice(0, 80),
        note: String(b.note || "").trim().slice(0, 240),
        status: "handed_off",
        userId: uid,
        guest,
        created: new Date().toISOString(),
      };
      const wantPay = Math.max(0, Number(b.amount) || Number(menuHit?.amount) || 0);
      if (wantPay > 0) {
        rec.payment = { amount: wantPay, currency: "EUR", status: "pending", method: "card" };
      }
      rec.packet = packetText(rec);
      if (!db.bridges) db.bridges = [];
      db.bridges.unshift(rec);
      db.bridges = db.bridges.slice(0, 400);
      appendChat(db, venueId, uid, {
        id: `M-${Date.now().toString(36)}`,
        role: "user",
        userId: uid,
        name: guest.legalName || String(b.user?.name || ""),
        handle: guest.handle || "",
        text: `Bokningsunderlag ${id} · ${date} · ${party} pers mot ${adapter.host}`,
        kind: "bridge",
        bridgeId: id,
        via: "app",
        created: rec.created,
      });
      save(db);
      return send(res, 201, { bridge: publicBridge(rec), adapter, payReady: publicPayConfig().ready });
    }

    const promoOne = url.pathname.match(/^\/promoters\/([^/]+)$/);
    if (req.method === "GET" && url.pathname === "/promoters") {
      const uid = url.searchParams.get("userId") || "";
      if (!uid) return send(res, 401, { error: "auth" });
      const db = load();
      if (!isPromoterAnywhere(uid, db)) {
        const gate = memberGate(uid, db);
        if (gate) return send(res, 403, gatePayload(gate, uid, db));
      }
      return send(res, 200, { promoters: listVerifiedPromoters(db) });
    }
    if (req.method === "GET" && promoOne) {
      const venueId = decodeURIComponent(promoOne[1]);
      const uid = url.searchParams.get("userId") || "";
      if (!uid) return send(res, 401, { error: "auth" });
      const db = load();
      if (!isPromoter({ id: uid }, venueId, db)) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      return send(res, 200, { venueId, promoters: listVerifiedPromoters(db, venueId) });
    }

    const matchComposeM = url.pathname.match(/^\/matches\/([^/]+)\/compose$/);
    const matchM = url.pathname.match(/^\/matches\/([^/]+)$/);
    if (req.method === "POST" && matchM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(matchM[1]);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      if (!isPromoter({ id: uid }, venueId, db)) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      const date = String(b.date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: "date" });
      const seats = Math.max(1, Math.min(8, Number(b.seats) || 1));
      const note = String(b.note || "").trim().slice(0, 240);
      const openFor = parseOpenFor(b.openFor);
      const wantOpen = Math.max(0, Math.min(12, Number(b.openSeats) || 0));
      upsertUser(db, b.user);
      if (!db.matches) db.matches = [];
      let rec = db.matches.find((m) => m.venueId === venueId && m.userId === uid && m.date === date && m.status === "open");
      let already = false;
      if (!rec) {
        rec = {
          id: `MX-${Date.now().toString(36).toUpperCase()}`,
          venueId,
          userId: uid,
          name: String(b.user?.name || "").slice(0, 80),
          date,
          seats,
          note,
          openFor,
          openSeats: wantOpen,
          status: "open",
          tableId: "",
          created: new Date().toISOString(),
        };
        db.matches.unshift(rec);
        db.matches = db.matches.slice(0, 400);
      } else {
        already = true;
        rec.seats = seats;
        rec.note = note;
        rec.openFor = openFor;
        rec.openSeats = wantOpen;
        rec.name = String(b.user?.name || rec.name || "").slice(0, 80);
      }
      const who = openFor === "women" ? "kvinnor" : openFor === "men" ? "män" : "alla";
      const text = `Vill bli sammansatt till ett bord · ${date} · ${seats} pers${wantOpen ? ` · lämna ${wantOpen} stolar till ${who}` : ""}${note ? ` · ${note}` : ""}`;
      const msg = {
        id: `M-${Date.now().toString(36)}`,
        role: "user",
        userId: uid,
        name: String(b.user?.name || ""),
        handle: String(b.user?.handle || ""),
        text,
        kind: "match",
        matchId: rec.id,
        via: "app",
        created: new Date().toISOString(),
      };
      appendChat(db, venueId, uid, msg);
      if (!db.promoterContact[venueId]) db.promoterContact[venueId] = {};
      db.promoterContact[venueId].lastThreadId = uid;
      const promo = whatsappForVenue(venueId, db);
      if (promo?.phone) {
        cloudSendWa(promo.phone, `${msg.name || "Gäst"} · VELVET · ${venueId}\n${text}`).catch(() => {});
      }
      save(db);
      return send(res, 200, { match: publicMatch(rec, db), already });
    }
    if (req.method === "GET" && matchM) {
      const venueId = decodeURIComponent(matchM[1]);
      const uid = url.searchParams.get("userId") || "";
      if (!uid) return send(res, 401, { error: "auth" });
      const db = load();
      const promoter = isPromoter({ id: uid }, venueId, db);
      if (!promoter) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      const list = (db.matches || []).filter((m) => m.venueId === venueId && (promoter || m.userId === uid));
      return send(res, 200, { matches: list.map((m) => publicMatch(m, db)), promoter });
    }
    if (req.method === "POST" && matchComposeM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(matchComposeM[1]);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      if (!isPromoter({ id: uid }, venueId, db)) return send(res, 403, { error: "not_promoter" });
      const ids = Array.isArray(b.matchIds) ? b.matchIds.map(String) : [];
      const picked = (db.matches || []).filter((m) => m.venueId === venueId && m.status === "open" && ids.includes(m.id));
      if (!picked.length) return send(res, 400, { error: "matches" });
      const date = String(b.date || picked[0].date);
      const seatsN = picked.reduce((n, m) => n + (Number(m.seats) || 1), 0);
      const party = Math.max(2, Math.min(20, Number(b.party) || seatsN));
      const openDefault = Math.max(0, party - seatsN);
      const openSeats = Math.max(0, Math.min(party - 1, b.openSeats == null || b.openSeats === "" ? openDefault : Number(b.openSeats) || 0));
      const openFor = parseOpenFor(b.openFor || picked.find((m) => m.openFor && m.openFor !== "anyone")?.openFor);
      const hostUser = db.users[picked[0].userId] || { id: picked[0].userId, name: picked[0].name };
      const joiners = picked.slice(1).map((m) => {
        const u = db.users[m.userId] || { id: m.userId, name: m.name };
        return {
          id: u.id,
          name: String(u.name || m.name || "").slice(0, 80),
          provider: String(u.provider || ""),
          handle: String(u.handle || "").replace(/^@/, ""),
          paid: false,
          joined: new Date().toISOString(),
        };
      });
      const table = {
        id: `TB-${Date.now().toString(36).toUpperCase()}`,
        venue_id: venueId,
        venue: String(b.venue || venueId),
        destination: String(b.destination || ""),
        date,
        package: String(b.package || "VIP-bord"),
        total: 0,
        party,
        openSeats,
        openLeft: openSeats,
        openFor,
        split: true,
        sharp: false,
        status: openSeats > 0 ? "open" : "closed",
        host: {
          id: hostUser.id,
          name: String(hostUser.name || picked[0].name || "").slice(0, 80),
          provider: String(hostUser.provider || ""),
          handle: String(hostUser.handle || "").replace(/^@/, ""),
          paid: false,
          joined: new Date().toISOString(),
        },
        guests: [],
        joiners,
        created: new Date().toISOString(),
      };
      db.tables.unshift(table);
      db.tables = db.tables.slice(0, 200);
      const link = `${PUBLIC_APP}/#/table/${encodeURIComponent(table.id)}`;
      const who = openFor === "women" ? "kvinnor" : openFor === "men" ? "män" : "alla";
      const text = `Sammansatta till ett bord · ${date} · ${party} pers${openSeats ? ` · ${openSeats} öppna stolar till ${who}` : ""} · ${link}`;
      for (const m of picked) {
        m.status = "grouped";
        m.tableId = table.id;
        appendChat(db, venueId, m.userId, {
          id: `M-${Date.now().toString(36)}${m.userId.slice(-3)}`,
          role: "promoter",
          userId: uid,
          name: String(b.user?.name || "Promoter"),
          handle: String(b.user?.handle || ""),
          text,
          kind: "match_done",
          matchId: m.id,
          tableId: table.id,
          via: "app",
          created: new Date().toISOString(),
        });
        const phone = guestWaForThread(db, venueId, m.userId);
        if (phone) cloudSendWa(phone, text).catch(() => {});
      }
      save(db);
      return send(res, 201, {
        table: publicTable(table, db),
        matches: picked.map((m) => publicMatch(m, db)),
      });
    }

    const claimM = url.pathname.match(/^\/chats\/([^/]+)\/claim$/);
    const guestWaM = url.pathname.match(/^\/chats\/([^/]+)\/guest-wa$/);
    const inboxM = url.pathname.match(/^\/chats\/([^/]+)\/inbox$/);
    const chatM = url.pathname.match(/^\/chats\/([^/]+)$/);
    if (req.method === "POST" && guestWaM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(guestWaM[1]);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      if (!isPromoter({ id: uid }, venueId, db)) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      const phone = waDigits(b.whatsapp);
      if (String(b.whatsapp || "").trim() && !phone) return send(res, 400, { error: "whatsapp" });
      upsertUser(db, b.user);
      if (phone) setGuestWa(db, venueId, uid, phone, b.user?.name);
      else if (db.users[uid]) db.users[uid].whatsapp = "";
      save(db);
      return send(res, 200, { ok: true, guestWa: phone || "" });
    }
    if (req.method === "POST" && claimM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(claimM[1]);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 400, { error: "user" });
      const db = load();
      if (!isOperatorUid(uid)) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      const list = db.promoters[venueId] || [];
      if (!list.includes(uid)) list.push(uid);
      db.promoters[venueId] = list;
      if (Object.prototype.hasOwnProperty.call(b, "whatsapp")) {
        const phone = waDigits(b.whatsapp);
        if (String(b.whatsapp || "").trim() && !phone) return send(res, 400, { error: "whatsapp" });
        if (!db.promoterContact) db.promoterContact = {};
        if (phone) {
          const prev = db.promoterContact[venueId] || {};
          db.promoterContact[venueId] = { ...prev, userId: uid, whatsapp: phone };
        } else delete db.promoterContact[venueId];
      }
      save(db);
      return send(res, 200, { ok: true, promoter: true, whatsapp: whatsappForVenue(venueId, db) });
    }
    if (req.method === "GET" && inboxM) {
      const venueId = decodeURIComponent(inboxM[1]);
      const uid = url.searchParams.get("userId") || "";
      const db = load();
      if (!isPromoter({ id: uid }, venueId, db)) return send(res, 403, { error: "not_promoter" });
      const venueChats = db.chats[venueId] || {};
      const threads = Object.entries(venueChats).map(([threadId, msgs]) => {
        const last = msgs[msgs.length - 1] || {};
        return {
          threadId,
          name: msgs.find((m) => m.role === "user")?.name || threadId,
          last: last.text || "",
          at: last.created || "",
          n: msgs.length,
        };
      }).sort((a, b) => String(b.at).localeCompare(String(a.at)));
      const withWa = threads.map((th) => {
        const card = publicCard(db.users[th.threadId]?.card);
        const match = (db.matches || []).find((m) => m.venueId === venueId && m.userId === th.threadId && m.status === "open");
        return {
          ...th,
          guestWa: guestWaForThread(db, venueId, th.threadId),
          idv: db.idv[th.threadId]?.status === "verified" ? "verified" : "none",
          paying: !!card,
          card,
          spend: verifiedSpend(th.threadId, db),
          match: match ? publicMatch(match, db) : null,
        };
      });
      return send(res, 200, { threads: withWa, promoter: true });
    }
    if (req.method === "GET" && chatM) {
      const venueId = decodeURIComponent(chatM[1]);
      const uid = url.searchParams.get("userId") || "";
      const thread = url.searchParams.get("thread") || uid;
      if (!uid) return send(res, 401, { error: "auth" });
      const db = load();
      const promoter = isPromoter({ id: uid }, venueId, db);
      if (!promoter) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      const venueChats = db.chats[venueId] || {};
      const messages = venueChats[thread] || [];
      const guestId = promoter ? thread : uid;
      const guestCard = publicCard(db.users[guestId]?.card);
      return send(res, 200, {
        messages,
        promoter,
        whatsapp: whatsappForVenue(venueId, db),
        guestWa: guestWaForThread(db, venueId, thread),
        cloud: !!(waCloud().token && waCloud().phoneId),
        promoters: listVerifiedPromoters(db, venueId),
        guest: {
          ...(dossier(guestId, db) || {
            id: guestId,
            idv: db.idv[guestId]?.status === "verified" ? "verified" : "none",
            paying: !!guestCard,
            card: guestCard,
          }),
          spend: verifiedSpend(guestId, db),
        },
      });
    }
    if (req.method === "POST" && chatM) {
      const b = await readBody(req, 2e5);
      const venueId = decodeURIComponent(chatM[1]);
      const text = String(b.text || "").trim().slice(0, 800);
      const uid = String(b.user?.id || "");
      if (!uid || !text) return send(res, 400, { error: "missing" });
      const db = load();
      const promoter = isPromoter({ id: uid }, venueId, db);
      if (!promoter) {
        const gate = memberGate(uid, db, venueId);
        if (gate) return send(res, 403, gatePayload(gate, uid, db, venueId));
      }
      upsertUser(db, b.user);
      const threadId = promoter ? String(b.threadId || uid) : uid;
      if (b.whatsapp) setGuestWa(db, venueId, uid, b.whatsapp, b.user?.name);
      const asPromo = promoter && b.asPromoter !== false;
      const doss = dossier(uid, db);
      const msg = {
        id: `M-${Date.now().toString(36)}`,
        role: asPromo ? "promoter" : "user",
        userId: uid,
        name: String((asPromo ? (doss?.legalName || b.user?.name || "Promoter") : (b.user?.name || ""))).slice(0, 80),
        handle: String(b.user?.handle || doss?.handle || ""),
        text,
        via: "app",
        created: new Date().toISOString(),
      };
      const messages = appendChat(db, venueId, threadId, msg);
      if (!asPromo) {
        if (!db.promoterContact[venueId]) db.promoterContact[venueId] = {};
        db.promoterContact[venueId].lastThreadId = threadId;
        const promo = whatsappForVenue(venueId, db);
        if (promo?.phone) {
          cloudSendWa(promo.phone, `${msg.name || "Gäst"} · VELVET · ${venueId}\n${text}\n\nSvara i WhatsApp — det går till gästen.`).catch(() => {});
        }
      } else {
        const guestPhone = guestWaForThread(db, venueId, threadId);
        if (guestPhone) cloudSendWa(guestPhone, text).catch(() => {});
      }
      save(db);
      return send(res, 201, { message: msg, messages, promoter, guestWa: guestWaForThread(db, venueId, threadId) });
    }

    // ---------- Live-tillgänglighet (SevenRooms) ----------
    const availM = url.pathname.match(/^\/availability\/([A-Z]{3}-\d{3})$/);
    if (req.method === "GET" && availM) {
      const vid = availM[1];
      const slug = SR_VENUES[vid];
      if (!slug) return send(res, 200, { ok: false, reason: "no_live_inventory" });
      const qDate = String(url.searchParams.get("date") || "");
      const date = /^\d{4}-\d{2}-\d{2}$/.test(qDate) ? qDate : "";
      const party = Math.min(20, Math.max(1, Number(url.searchParams.get("party")) || 2));
      const key = `${vid}|${date}|${party}`;
      const hit = srCache.get(key);
      if (hit && Date.now() - hit.at < 60000) return send(res, 200, hit.data, { "Cache-Control": "no-store" });
      try {
        const start = date || srToday();
        const dates = await srFetchJson(`/api-yoa/availability/dates?venue=${slug}&start_date=${start}&num_days=14`);
        const valid = Array.isArray(dates.valid_dates) ? dates.valid_dates : [];
        const day = date || valid[0] || "";
        let shifts = [];
        if (day) {
          const range = await srFetchJson(`/api-yoa/availability/ng/widget/range?venue=${slug}&start_date=${day}&num_days=1&party_size=${party}&channel=website`);
          const daySlots = (range.availability && range.availability[day]) || [];
          shifts = daySlots.map((sh) => ({
            name: String(sh.name || ""),
            category: String(sh.shift_category || ""),
            closed: !!sh.is_closed,
            times: (sh.times || [])
              .filter((t) => t && t.time && (t.type === "book" || t.is_requestable))
              .slice(0, 40)
              .map((t) => ({ time: String(t.time), type: t.type === "book" ? "book" : "request" })),
          })).filter((s) => s.times.length);
        }
        const out = { ok: true, system: "sevenrooms", slug, venueId: vid, date: day || null, partySize: party, validDates: valid.slice(0, 14), shifts, fetched: new Date().toISOString() };
        srCache.set(key, { at: Date.now(), data: out });
        if (srCache.size > 300) srCache.clear();
        return send(res, 200, out, { "Cache-Control": "no-store" });
      } catch (e) {
        return send(res, 200, { ok: false, reason: "upstream", message: String(e.message || e) });
      }
    }

    // ---------- SevenRooms: direktbokning (range→hold→book i ett anrop) ----------
    const srBookM = url.pathname.match(/^\/availability\/([A-Z]{3}-\d{3})\/book$/);
    if (req.method === "POST" && srBookM) {
      const vid = srBookM[1];
      const slug = SR_VENUES[vid];
      if (!slug) return send(res, 404, { error: "no_live_inventory" });
      const b = await readBody(req, 2e5);
      const uid = String(b.user?.id || "");
      if (!uid) return send(res, 401, { error: "auth" });
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : "";
      const time = /^\d{1,2}:\d{2}$/.test(String(b.time || "")) ? String(b.time) : "";
      const party = Math.min(20, Math.max(1, Number(b.party) || 0));
      const g = b.guest || {};
      if (!date || !time || !party) return send(res, 400, { error: "slot" });
      if (!g.firstName || !g.lastName || !g.email) return send(res, 400, { error: "guest" });
      const result = await srBookSlot(slug, { date, time, party, guest: g, note: b.note, lang: b.lang });
      if (!result.ok) return send(res, result.error === "slot_gone" ? 409 : 502, result);
      const db = load();
      const bridge = {
        id: "SR-" + Date.now().toString(36).toUpperCase(),
        venueId: vid,
        venue: String(b.venueName || vid),
        destination: String(b.destination || ""),
        engine: "sevenrooms",
        officialUrl: `https://www.sevenrooms.com/reservations/${slug}`,
        date, time, party,
        guest: { name: `${g.firstName} ${g.lastName}`, email: g.email, phone: g.phone || "" },
        status: "confirmed",
        confirmation: result.confirmation,
        reservationId: result.reservationId,
        manageToken: result.token,
        userId: uid,
        note: String(b.note || "").slice(0, 300),
        created: new Date().toISOString(),
        history: [{ status: "confirmed", note: "Direktbokad i klubbens system (SevenRooms)", at: new Date().toISOString() }],
      };
      db.bridges = [bridge, ...(db.bridges || [])].slice(0, 200);
      save(db);
      return send(res, 200, { ok: true, booking: { id: bridge.id, confirmation: result.confirmation, date, time, party, venue: bridge.venue, token: result.token } });
    }
    if (req.method === "POST" && url.pathname === "/availability/cancel") {
      const b = await readBody(req, 2e5);
      const token = String(b.token || "");
      const db = load();
      const br = (db.bridges || []).find((x) => token && x.manageToken === token);
      if (!br) return send(res, 404, { error: "not_found" });
      const uid = String(b.user?.id || "");
      if (!uid || (br.userId && br.userId !== uid)) return send(res, 403, { error: "auth" });
      const r = await fetch(`https://www.sevenrooms.com/api-yoa/actuals/manage/cancel?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Length": "0", "User-Agent": "Mozilla/5.0 (compatible; VELVET-booking-bridge)" },
      });
      const j = await r.json().catch(() => ({}));
      if (j?.data?.is_canceled) {
        br.status = "cancelled";
        br.history = [...(Array.isArray(br.history) ? br.history : []), { status: "cancelled", note: "Avbokad via VELVET", at: new Date().toISOString() }];
        save(db);
        return send(res, 200, { ok: true, status: "cancelled" });
      }
      return send(res, 502, { ok: false, detail: j.msg || "cancel_failed" });
    }

    // ---------- Bridge-status (operator: skickad → mottagen → bekräftad/avböjd) ----------
    const bridgeStatusM = url.pathname.match(/^\/book\/bridge\/([^/]+)\/status$/);
    if (req.method === "POST" && bridgeStatusM) {
      const adminKey = String(process.env.VELVET_ADMIN_KEY || "");
      const given = String(req.headers["x-admin-key"] || "");
      if (!adminKey) return send(res, 503, { error: "admin_key_not_configured" });
      if (given !== adminKey) return send(res, 403, { error: "admin_key" });
      const b = await readBody(req, 2e5);
      const next = String(b.status || "");
      if (!["handed_off", "sent", "received", "confirmed", "declined", "cancelled"].includes(next)) {
        return send(res, 400, { error: "status" });
      }
      const db = load();
      const br = (db.bridges || []).find((x) => x.id === decodeURIComponent(bridgeStatusM[1]));
      if (!br) return send(res, 404, { error: "not_found" });
      br.status = next;
      br.history = [...(Array.isArray(br.history) ? br.history : []), { status: next, note: String(b.note || "").slice(0, 200), at: new Date().toISOString() }];
      save(db);
      return send(res, 200, { ok: true, bridge: publicBridge(br) });
    }

    send(res, 404, { error: "nope" });
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("velvet-api " + PORT);
  scheduleDailyCrawl();
});
