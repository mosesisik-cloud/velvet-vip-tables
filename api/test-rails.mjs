#!/usr/bin/env node
/**
 * Hits the shipped VELVET API (api/server.mjs) and shipped data files.
 * No reimplementation of roster/pay logic — HTTP against a child of server.mjs.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseTd3, extractMrzFromText, nameMatch, ageYears, ICAO_SAMPLE, TEST_LIVE, TEST_YOUNG } from "./mrz.mjs";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const SERVER = path.join(__dir, "server.mjs");
const FAIL = [];
const LOG = [];

function ok(name, detail) {
  LOG.push("OK  " + name + (detail ? " — " + detail : ""));
}
function fail(name, detail) {
  FAIL.push(name + ": " + detail);
  LOG.push("FAIL  " + name + " — " + detail);
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function fakeJpeg() {
  const buf = Buffer.alloc(9000, 0x41);
  buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff;
  return "data:image/jpeg;base64," + buf.toString("base64");
}

function checkMrz() {
  const icao = parseTd3(ICAO_SAMPLE.line1, ICAO_SAMPLE.line2);
  if (!icao.checksumsOk || icao.fields.lastName !== "ERIKSSON" || icao.fields.firstName !== "ANNA MARIA") {
    fail("mrz-icao", JSON.stringify(icao));
  } else ok("mrz-icao", "checksums + names");
  if (!icao.expired) fail("mrz-icao-expired", "sample 2012 should be expired");
  else ok("mrz-icao-expired", icao.fields.expirationDate);

  const live = parseTd3(TEST_LIVE.line1, TEST_LIVE.line2);
  if (!live.valid || live.fields.lastName !== "ISIK" || live.fields.documentNumber !== "AB1234567") {
    fail("mrz-live", JSON.stringify(live));
  } else ok("mrz-live", live.fields.firstName + " " + live.fields.lastName);
  const liveAge = ageYears(live.fields.birthDate);
  if (liveAge == null || liveAge < 18) fail("mrz-age-adult", String(liveAge));
  else ok("mrz-age-adult", liveAge + " from MRZ");

  const young = parseTd3(TEST_YOUNG.line1, TEST_YOUNG.line2);
  if (!young.checksumsOk || young.expired) fail("mrz-young", JSON.stringify(young.reasons));
  else if (ageYears(young.fields.birthDate) >= 18) fail("mrz-young-age", ageYears(young.fields.birthDate));
  else ok("mrz-young", young.fields.birthDate + " age " + ageYears(young.fields.birthDate));

  const extracted = extractMrzFromText("header\n" + TEST_LIVE.line1 + "\n" + TEST_LIVE.line2 + "\nfooter");
  if (!extracted?.valid) fail("mrz-extract", JSON.stringify(extracted && extracted.reasons));
  else ok("mrz-extract", "from ocr text");

  const full = nameMatch("MOSES", "ISIK", "Moses Isik");
  const miss = nameMatch("MOSES", "ISIK", "Gabbe Velvet");
  if (!full.ok || miss.ok) fail("mrz-name", JSON.stringify({ full, miss }));
  else ok("mrz-name", "match vs mismatch");
}

/** Born 2007-08-22 — 18 on 2026-08-21, still under US 21. Checksums valid, not expired. */
const TEST_18 = {
  line1: "P<SWEUNG<<ADULT<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
  line2: "EF11111116SWE0708225M3203156<<<<<<<<<<<<<<08",
};

function checkBookingUrls() {
  const venues = loadJson("data/venues.json");
  const booking = loadJson("data/booking-urls.json");
  const missing = [];
  for (const v of venues) {
    const rec = booking[v.venue_id];
    const url = rec?.url || v.website_url || "";
    if (!/^https:\/\//i.test(url)) missing.push(v.venue_id);
  }
  if (missing.length) fail("booking-coverage", "no https url: " + missing.join(","));
  else ok("booking-coverage", venues.length + " venues");

  const yt = loadJson("data/venue-youtube.json");
  const ytMap = yt.venues || {};
  const ytBad = [];
  for (const [id, rec] of Object.entries(ytMap)) {
    if (!venues.some((v) => v.venue_id === id)) ytBad.push("unknown " + id);
    if (!rec || !/^[A-Za-z0-9_-]{11}$/.test(rec.id || "")) ytBad.push("id " + id);
    if (!/^https:\/\/www\.youtube\.com\/watch\?v=/.test(rec.url || "")) ytBad.push("url " + id);
  }
  if (ytBad.length) fail("youtube-clips", ytBad.slice(0, 8).join("; "));
  else ok("youtube-clips", Object.keys(ytMap).length + " official most-viewed clips");

  const unlisted = loadJson("data/unlisted-venues.json");
  const extraDest = loadJson("data/extra-destinations.json");
  const ids = new Set(venues.map((x) => x.venue_id));
  const bad = [];
  for (const x of unlisted) {
    if (ids.has(x.venue_id)) bad.push("dup " + x.venue_id);
    if (x.listed !== false) bad.push("listed " + x.venue_id);
    if (x.research_status !== "Unverified") bad.push("status " + x.venue_id);
    if (!/^https:\/\//i.test(x.website_url || "")) bad.push("url " + x.venue_id);
    if (x.instagram_url) bad.push("ig " + x.venue_id);
    ids.add(x.venue_id);
  }
  const destCodes = new Set([...loadJson("data/destinations.json"), ...extraDest].map((d) => d.code));
  for (const x of unlisted) {
    if (!destCodes.has(x.destination_code)) bad.push("dest " + x.venue_id);
  }
  if (bad.length) fail("unlisted-catalog", bad.join("; "));
  else ok("unlisted-catalog", unlisted.length + " city-only clubs, " + extraDest.length + " extra cities");

  const publicRoster = path.join(ROOT, "data", "promoters.json");
  const apiRoster = path.join(ROOT, "api", "promoters.json");
  if (fs.existsSync(publicRoster)) fail("promoters-not-public", "data/promoters.json still on web root");
  else if (!fs.existsSync(apiRoster)) fail("promoters-seed-file", "api/promoters.json missing");
  else ok("promoters-seed-file", "roster off web root");

  const official = {
    "IBZ-001": ["hiibiza.com", "/vip-tables"],
    "IBZ-002": ["theushuaiaexperience.com", "/vip-tables"],
    "IBZ-003": ["unvrs.com", "/vip-tables"],
    "IBZ-004": ["pacha.com", "/vip-events"],
  };
  const reseller = /discotech|clubbookers|ticketsibiza|tasteibiza|nocovernightclubs|lasvegasnightclubs|miamiviptables|clubtickets/i;
  const lines = [];
  for (const [id, [host, needle]] of Object.entries(official)) {
    const url = booking[id]?.url || "";
    lines.push(id + " " + url);
    if (!url.toLowerCase().includes(host)) fail("official-" + id, "host " + host + " not in " + url);
    else if (!url.toLowerCase().includes(needle.replace(/^\//, "").toLowerCase()) && !url.toLowerCase().includes(needle.toLowerCase())) {
      fail("official-" + id, "path " + needle + " not in " + url);
    } else if (reseller.test(url)) fail("official-" + id, "reseller " + url);
    else ok("official-" + id, url);
  }
  const events = loadJson("data/venue-events.json");
  const ibz = ["IBZ-001", "IBZ-002", "IBZ-003", "IBZ-004"];
  for (const id of ibz) {
    const evs = events.venues?.[id]?.events || [];
    if (!evs.length) fail("events-" + id, "no official events");
    else if (evs.some((e) => e.url && reseller.test(e.url))) fail("events-" + id, "reseller event url");
    else ok("events-" + id, evs.length + " official dated/lineup rows");
  }
  return { count: venues.length, missing: missing.length, lines };
}

async function waitBoot(child, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("api boot timeout")), ms);
    const on = (buf) => {
      const s = String(buf);
      if (s.includes("velvet-api")) {
        clearTimeout(t);
        child.stdout.off("data", on);
        child.stderr.off("data", on);
        resolve();
      }
    };
    child.stdout.on("data", on);
    child.stderr.on("data", on);
    child.on("error", (e) => { clearTimeout(t); reject(e); });
    child.on("exit", (c) => { clearTimeout(t); reject(new Error("api exited " + c)); });
  });
}

async function req(base, method, p, body) {
  const r = await fetch(base + p, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: r.status, json };
}

async function runApi() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "velvet-rails-"));
  const data = path.join(dir, "store.json");
  const pay = path.join(dir, "pay.json");
  fs.writeFileSync(data, JSON.stringify({
    tables: [], idv: {}, reviews: [], chats: {}, promoters: {}, users: {}, payments: [],
  }));
  fs.writeFileSync(pay, "{}");
  const port = 18787;
  const child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, PORT: String(port), VELVET_DATA: data, VELVET_PAY: pay, VELVET_CRAWL: "0", VELVET_IDV: path.join(dir, "idv") },
    cwd: __dir,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  child.stdout.on("data", (d) => { out += d; });
  child.stderr.on("data", (d) => { out += d; });
  try {
    await waitBoot(child);
    ok("api-boot", "port " + port);
    const base = "http://127.0.0.1:" + port;

    const cfg = await req(base, "GET", "/pay/config");
    const methods = (cfg.json.methods || []).map((m) => m.id);
    const need = ["card", "applepay", "googlepay", "revolut", "paypal", "klarna", "sepa", "swift"];
    const missingM = need.filter((id) => !methods.includes(id));
    if (cfg.status !== 200) fail("pay-config", "HTTP " + cfg.status);
    else if (missingM.length) fail("pay-config", "missing methods " + missingM.join(","));
    else if (String(cfg.json.destination) !== "Revolut") fail("pay-config", "destination " + cfg.json.destination);
    else if (cfg.json.ready !== false) fail("pay-config", "ready should be false without IBAN/keys, got " + cfg.json.ready);
    else ok("pay-config", "8 methods, destination Revolut, ready=false");

    const intent = await req(base, "POST", "/pay/intent", {
      tableId: "nope",
      user: { id: "U-instagram-a", name: "A" },
      method: "card",
    });
    if (intent.status === 404 || intent.status === 401) ok("pay-intent-auth-table", "HTTP " + intent.status);
    else fail("pay-intent-auth-table", "expected 404/401 got " + intent.status);

    const host = { id: "U-instagram-gabbe", name: "Gabbe", handle: "gabbe", provider: "instagram" };
    const guest = { id: "U-tiktok-dan", name: "Dan Grant", handle: "dan.grant", provider: "tiktok" };
    const FACE_OK = { passportFace: true, selfieFace: true, liveness: true, matchOk: true, matchDistance: 0.32 };
    const img = fakeJpeg();

    const unverifiedBook = await req(base, "POST", "/tables", {
      id: "TB-BLOCK", venue_id: "IBZ-001", venue: "Hï Ibiza", destination: "Ibiza",
      date: "2026-08-29", package: "VIP-bord", party: 4, openSeats: 2, host: guest,
    });
    if (unverifiedBook.status !== 403 || unverifiedBook.json.error !== "idv_required") {
      fail("book-idv", JSON.stringify(unverifiedBook.json).slice(0, 220));
    } else ok("book-idv", "unverified host cannot book");

    const hostIdv = await req(base, "POST", "/idv", {
      userId: host.id, name: "Gabbe", passport: img, selfie: img, mrz: TEST_LIVE, face: FACE_OK, confirmMismatch: true,
    });
    if (hostIdv.json.idv?.status !== "verified") fail("book-host-idv", JSON.stringify(hostIdv.json).slice(0, 220));
    else ok("book-host-idv", hostIdv.json.idv.legalName);

    const hostNoCard = await req(base, "POST", "/tables", {
      id: "TB-NOCARD", venue_id: "IBZ-001", venue: "Hï Ibiza", destination: "Ibiza",
      date: "2026-08-29", package: "VIP-bord", party: 4, openSeats: 2, host,
    });
    if (hostNoCard.status !== 403 || hostNoCard.json.error !== "card_required") {
      fail("book-card", JSON.stringify(hostNoCard.json).slice(0, 220));
    } else ok("book-card", "verified host still needs card");

    const hostCard = await req(base, "POST", "/card", {
      user: host, last4: "1881", brand: "mastercard", expMonth: 12, expYear: 2099,
    });
    if (hostCard.status !== 200) fail("book-host-card", JSON.stringify(hostCard.json).slice(0, 200));
    else ok("book-host-card", "Mastercard ••1881");

    const created = await req(base, "POST", "/tables", {
      id: "TB-RAILS",
      venue_id: "IBZ-001",
      venue: "Hï Ibiza",
      destination: "Ibiza",
      date: "2026-08-29",
      package: "VIP-bord",
      total: 4800,
      party: 6,
      openSeats: 4,
      host,
    });
    if (created.status !== 201 || created.json.table?.id !== "TB-RAILS") {
      fail("tables-create", JSON.stringify(created));
    } else if (created.json.table.host?.legalName !== "MOSES ISIK") {
      fail("tables-dossier-name", JSON.stringify(created.json.table.host).slice(0, 240));
    } else if (created.json.table.host?.card?.last4 !== "1881" || created.json.table.host?.fields?.documentNumber) {
      fail("tables-dossier-card", JSON.stringify(created.json.table.host).slice(0, 240));
    } else if (created.json.table.host?.idv !== "verified" || created.json.table.host?.fields?.documentNumberMasked !== "•••567") {
      fail("tables-dossier-idv", JSON.stringify(created.json.table.host?.fields).slice(0, 240));
    } else ok("tables-create", "TB-RAILS · " + created.json.table.host.legalName + " · ••1881");

    const joined = await req(base, "POST", "/tables/TB-RAILS/join", { user: guest });
    if (joined.status !== 403 || joined.json.error !== "idv_required") {
      fail("tables-join", JSON.stringify(joined.json).slice(0, 220));
    } else ok("tables-join", "unverified cannot join");

    const plain = { id: "U-plain", name: "Plain Guest", handle: "plain", provider: "tiktok" };
    const lockedGet = await req(base, "GET", "/chats/IBZ-001?userId=" + encodeURIComponent(plain.id));
    if (lockedGet.status !== 403 || lockedGet.json.error !== "idv_required") {
      fail("promo-idv-get", JSON.stringify(lockedGet.json).slice(0, 220));
    } else ok("promo-idv-get", "unverified guest 403");

    const lockedPost = await req(base, "POST", "/chats/IBZ-001", { user: plain, text: "hej promoter" });
    if (lockedPost.status !== 403 || lockedPost.json.error !== "idv_required") {
      fail("promo-idv-post", JSON.stringify(lockedPost.json).slice(0, 220));
    } else ok("promo-idv-post", "unverified guest 403");

    const seedGet = await req(base, "GET", "/chats/IBZ-001?userId=P-jb");
    if (seedGet.status !== 403 || seedGet.json.error !== "idv_required") {
      fail("seed-id-get", JSON.stringify(seedGet.json).slice(0, 220));
    } else ok("seed-id-get", "P-jb is not request auth");

    const seedPost = await req(base, "POST", "/chats/IBZ-001", { user: { id: "P-jb", name: "JB" }, text: "hej" });
    if (seedPost.status !== 403 || seedPost.json.error !== "idv_required") {
      fail("seed-id-post", JSON.stringify(seedPost.json).slice(0, 220));
    } else ok("seed-id-post", "P-jb POST 403 idv_required");

    const spoof = await req(base, "POST", "/chats/IBZ-001", {
      user: { ...plain, role: "promoter", handle: "velvet" },
      text: "hej som promoter",
      asPromoter: true,
    });
    if (spoof.status !== 403 || spoof.json.error !== "idv_required") {
      fail("promo-spoof-role", JSON.stringify(spoof.json).slice(0, 220));
    } else ok("promo-spoof-role", "client role/handle ignored");

    await req(base, "POST", "/users", {
      id: plain.id, provider: "tiktok", name: "Plain Guest",
      handle: "velvet", email: "gabrielhadodo@gmail.com",
    });
    const spoofStored = await req(base, "GET", "/chats/IBZ-001?userId=" + encodeURIComponent(plain.id));
    if (spoofStored.status !== 403 || spoofStored.json.error !== "idv_required") {
      fail("promo-spoof-users", JSON.stringify(spoofStored.json).slice(0, 220));
    } else ok("promo-spoof-users", "POST /users handle/email is not promoter");

    const noUid = await req(base, "GET", "/chats/IBZ-001");
    if (noUid.status !== 401) fail("promo-no-uid", "expected 401 got " + noUid.status);
    else ok("promo-no-uid", "userId required");

    const lockedWa = await req(base, "POST", "/chats/IBZ-001/guest-wa", {
      user: plain, whatsapp: "+34 611 11 22 22",
    });
    if (lockedWa.status !== 403 || lockedWa.json.error !== "idv_required") {
      fail("promo-idv-wa", JSON.stringify(lockedWa.json).slice(0, 220));
    } else ok("promo-idv-wa", "unverified guest-wa 403");

    const guestLocked = await req(base, "GET", "/chats/IBZ-001?userId=" + encodeURIComponent(guest.id));
    if (guestLocked.status !== 403 || guestLocked.json.error !== "idv_required") {
      fail("promo-guest-locked", JSON.stringify(guestLocked.json).slice(0, 220));
    } else ok("promo-guest-locked", "unverified guest 403");

    const hostAsMember = await req(base, "GET", "/chats/IBZ-001?userId=" + encodeURIComponent(host.id));
    if (hostAsMember.status !== 200 || hostAsMember.json.promoter) {
      fail("promo-host-member", JSON.stringify(hostAsMember.json).slice(0, 220));
    } else ok("promo-host-member", "verified paying host can talk to promoter");

    const hostClaim = await req(base, "POST", "/chats/IBZ-001/claim", { user: host });
    if (hostClaim.status !== 200) fail("promo-host-claim", JSON.stringify(hostClaim.json).slice(0, 220));
    const hostOpen = await req(base, "GET", "/chats/IBZ-001?userId=" + encodeURIComponent(host.id));
    if (hostOpen.status !== 200 || !hostOpen.json.promoter) {
      fail("promo-host-bypass", JSON.stringify(hostOpen.json).slice(0, 220));
    } else ok("promo-host-bypass", "promoter access without IDV");

    const promoNoUid = await req(base, "GET", "/promoters");
    if (promoNoUid.status !== 401) fail("promoters-no-uid", "expected 401 got " + promoNoUid.status);
    else ok("promoters-no-uid", "userId required");

    const promoLocked = await req(base, "GET", "/promoters?userId=" + encodeURIComponent(plain.id));
    if (promoLocked.status !== 403 || promoLocked.json.error !== "idv_required") {
      fail("promoters-locked", JSON.stringify(promoLocked.json).slice(0, 220));
    } else ok("promoters-locked", "unverified member 403");

    const promoVenueLocked = await req(base, "GET", "/promoters/IBZ-001?userId=" + encodeURIComponent(plain.id));
    if (promoVenueLocked.status !== 403 || promoVenueLocked.json.error !== "idv_required") {
      fail("promoters-venue-locked", JSON.stringify(promoVenueLocked.json).slice(0, 220));
    } else ok("promoters-venue-locked", "unverified venue list 403");

    const unverifiedClaim = await req(base, "POST", "/chats/IBZ-002/claim", { user: plain });
    if (unverifiedClaim.status !== 403 || unverifiedClaim.json.error !== "idv_required") {
      fail("promo-plain-claim", JSON.stringify(unverifiedClaim.json).slice(0, 220));
    } else ok("promo-plain-claim", "unverified cannot claim");

    const promoHost = await req(base, "GET", "/promoters?userId=" + encodeURIComponent(host.id));
    const listed = promoHost.json.promoters || [];
    const self = listed.find((p) => p.id === host.id);
    const leaked = listed.some((p) => p.card || p.fields || p.documentNumber);
    if (promoHost.status !== 200 || !self || self.idv !== "verified" || self.legalName !== "MOSES ISIK") {
      fail("promoters-host", JSON.stringify(promoHost.json).slice(0, 280));
    } else if (listed.some((p) => p.id === plain.id)) {
      fail("promoters-unverified-hidden", "plain claimer listed");
    } else if (leaked) {
      fail("promoters-no-secrets", JSON.stringify(listed.find((p) => p.card || p.fields)).slice(0, 220));
    } else ok("promoters-host", "verified promoter listed, unverified hidden");

    const promoVenue = await req(base, "GET", "/promoters/IBZ-001?userId=" + encodeURIComponent(host.id));
    const atVenue = (promoVenue.json.promoters || []).find((p) => p.id === host.id);
    if (promoVenue.status !== 200 || !atVenue || atVenue.legalName !== "MOSES ISIK") {
      fail("promoters-venue", JSON.stringify(promoVenue.json).slice(0, 280));
    } else if (!(hostOpen.json.promoters || []).some((p) => p.id === host.id && p.idv === "verified")) {
      fail("promoters-in-chat", JSON.stringify(hostOpen.json.promoters).slice(0, 220));
    } else ok("promoters-venue", "Hï Ibiza roster + chat roster");

    const roster = listed;
    const jb = roster.find((p) => p.id === "P-jb");
    const thomas = roster.find((p) => p.id === "P-thomas");
    const vincenzo = roster.find((p) => p.id === "P-vincenzo");
    const strebel = roster.find((p) => p.id === "P-strebel");
    if (!jb || jb.legalName !== "JB" || jb.idv !== "listed" || jb.card || jb.fields) {
      fail("seed-jb", JSON.stringify(jb).slice(0, 280));
    } else if (!thomas || thomas.legalName !== "Thomas" || thomas.idv !== "listed") {
      fail("seed-thomas", JSON.stringify(thomas).slice(0, 280));
    } else if (!vincenzo || vincenzo.legalName !== "Vincenzo" || vincenzo.idv !== "listed") {
      fail("seed-vincenzo", JSON.stringify(vincenzo).slice(0, 280));
    } else if (!strebel || strebel.legalName !== "Fredrik Strebel" || strebel.scope !== "Sverige" || strebel.idv !== "listed") {
      fail("seed-strebel", JSON.stringify(strebel).slice(0, 280));
    } else if (!jb.photo || !String(jb.photo).endsWith(".gif") || !strebel.photo || strebel.handle !== "fredrikstrebel") {
      fail("seed-photos", JSON.stringify({ jb: jb.photo, strebel: strebel.photo, handle: strebel.handle }));
    } else ok("seed-roster", "JB + Thomas + Vincenzo + Strebel listed, no passport/card");

    const idsAt = (arr) => (arr || []).map((p) => p.id);
    const baoli = await req(base, "GET", "/promoters/CNS-002?userId=" + encodeURIComponent(host.id));
    const bagTulum = await req(base, "GET", "/promoters/TUL-004?userId=" + encodeURIComponent(host.id));
    const dubai = await req(base, "GET", "/promoters/DXB-001?userId=" + encodeURIComponent(host.id));
    const ibz = await req(base, "GET", "/promoters/IBZ-001?userId=" + encodeURIComponent(host.id));
    const miamiBaoli = await req(base, "GET", "/promoters/MIA-005?userId=" + encodeURIComponent(host.id));
    const jbCannes = idsAt(baoli.json.promoters);
    const jbTulum = idsAt(bagTulum.json.promoters);
    const atDxb = idsAt(dubai.json.promoters);
    const atIbz = idsAt(ibz.json.promoters);
    const atMia = idsAt(miamiBaoli.json.promoters);
    if (!jbCannes.includes("P-jb") || !jbCannes.includes("P-vincenzo") || jbCannes.includes("P-thomas")) {
      fail("seed-baoli-cannes", jbCannes.join(","));
    } else if (!jbTulum.includes("P-jb") || jbTulum.includes("P-vincenzo")) {
      fail("seed-bagatelle-tulum", jbTulum.join(","));
    } else if (!atDxb.includes("P-thomas") || atDxb.includes("P-vincenzo") || atDxb.includes("P-jb")) {
      fail("seed-dubai", atDxb.join(","));
    } else if (!atIbz.includes("P-vincenzo") || atIbz.includes("P-jb") || atIbz.includes("P-thomas") || atIbz.includes("P-strebel")) {
      fail("seed-ibiza", atIbz.join(","));
    } else if (!atMia.includes("P-jb") || atMia.includes("P-vincenzo")) {
      fail("seed-baoli-miami", atMia.join(","));
    } else ok("seed-venues", "JB brand worldwide, Thomas Dubai, Vincenzo Europe, Strebel Sweden");

    const brMeta = await req(base, "GET", "/book/bridge/IBZ-001");
    if (brMeta.status !== 200 || !String(brMeta.json.adapter?.officialUrl || "").includes("hiibiza.com")) {
      fail("bridge-adapter", JSON.stringify(brMeta.json).slice(0, 240));
    } else if (!(brMeta.json.adapter?.inventory?.nights || []).some((n) => n.date && n.title)) {
      fail("bridge-inventory", JSON.stringify(brMeta.json.adapter?.inventory).slice(0, 240));
    } else ok("bridge-adapter", brMeta.json.adapter.host + " nights=" + brMeta.json.adapter.inventory.nights.length);

    const inv = await req(base, "GET", "/inventory?dest=IBZ");
    if (inv.status !== 200 || inv.json.dest !== "IBZ" || !Array.isArray(inv.json.venues)) {
      fail("city-inventory", JSON.stringify(inv.json).slice(0, 220));
    } else ok("city-inventory", inv.json.venues.length + " Ibiza rows on " + inv.json.date);

    const menus = await req(base, "GET", "/menus");
    if (menus.status !== 200 || !menus.json.venues) fail("menus", JSON.stringify(menus.json).slice(0, 160));
    else ok("menus", Object.keys(menus.json.venues).length + " printed menus");

    const brNone = await req(base, "GET", "/book/bridge/NOPE-000");
    if (brNone.status !== 404) fail("bridge-missing", "expected 404 got " + brNone.status);
    else ok("bridge-missing", "no booking site");

    const brLocked = await req(base, "POST", "/book/bridge", {
      user: plain, venueId: "IBZ-001", date: "2026-08-29", party: 4,
    });
    if (brLocked.status !== 403 || brLocked.json.error !== "idv_required") {
      fail("bridge-idv", JSON.stringify(brLocked.json).slice(0, 220));
    } else ok("bridge-idv", "unverified 403");

    const brOk = await req(base, "POST", "/book/bridge", {
      user: host, venueId: "IBZ-001", date: "2026-08-29", party: 4, note: "VIP bord",
    });
    const br = brOk.json.bridge || {};
    if (brOk.status !== 201 || !String(br.id || "").startsWith("BR-")) {
      fail("bridge-create", JSON.stringify(brOk.json).slice(0, 280));
    } else if (!String(br.officialUrl || "").includes("hiibiza.com") || br.status !== "handed_off") {
      fail("bridge-official", JSON.stringify(br).slice(0, 240));
    } else {
      ok("bridge-create", br.id + " → " + br.host);
      if (!String(br.packet || "").includes("MOSES ISIK") || String(br.packet || "").includes("AB1234567")) {
        fail("bridge-packet", String(br.packet).slice(0, 240));
      } else ok("bridge-packet", "legal name, no full passport");
      if (br.guest?.card?.last4 !== "1881" || br.guest?.documentNumber) {
        fail("bridge-secrets", JSON.stringify(br.guest).slice(0, 220));
      } else ok("bridge-secrets", "last4 only");
    }

    const brList = await req(base, "GET", "/book/bridge/IBZ-001?userId=" + encodeURIComponent(host.id));
    if (brList.status !== 200 || !(brList.json.bridges || []).some((x) => x.id === br.id)) {
      fail("bridge-list", JSON.stringify(brList.json).slice(0, 240));
    } else ok("bridge-list", "member sees own underlag");

    const night = (brMeta.json.adapter.inventory.nights || []).find((n) => n.date);
    const brNight = await req(base, "POST", "/book/bridge", {
      user: host, venueId: "IBZ-001", date: night.date, party: 4,
      eventTitle: night.title, eventUrl: night.url || "https://www.hiibiza.com/vip-tables",
    });
    if (brNight.status !== 201 || !String(brNight.json.bridge?.packet || "").includes(night.title)) {
      fail("bridge-night", JSON.stringify(brNight.json).slice(0, 280));
    } else ok("bridge-night", night.date + " " + night.title);

    const brReseller = await req(base, "POST", "/book/bridge", {
      user: host, venueId: "IBZ-001", date: "2026-08-29", party: 2,
      eventUrl: "https://www.discotech.com/hi-ibiza",
    });
    if (brReseller.status !== 201 || /discotech/i.test(brReseller.json?.bridge?.eventUrl || "")) {
      fail("bridge-reseller", JSON.stringify(brReseller.json).slice(0, 280));
    } else ok("bridge-reseller", "reseller event URL dropped");

    const got = await req(base, "GET", "/tables/TB-RAILS");
    const members = got.json.table?.members || [];
    const ids = members.map((m) => m.id).sort();
    if (got.status !== 200) fail("tables-get", "HTTP " + got.status);
    else if (ids.join() !== [host.id].sort().join()) fail("tables-get", "members " + ids.join());
    else if (members.some((m) => m.paid)) fail("tables-get", "someone already paid");
    else if (members.find((m) => m.id === host.id)?.idv !== "verified") fail("tables-get", "host should be verified paying");
    else ok("tables-get", members.length + " members, host verified");

    const paySelf = await req(base, "POST", "/tables/TB-RAILS/pay", {
      user: guest,
      targetId: guest.id,
      paid: true,
    });
    if (paySelf.status !== 403 && paySelf.status !== 404) {
      fail("tables-pay", "expected 403/404 for non-member got " + paySelf.status + " " + JSON.stringify(paySelf.json).slice(0, 180));
    } else ok("tables-pay", "non-member cannot mark paid");

    const guestSpend = await req(base, "GET", "/users/" + encodeURIComponent(guest.id));
    if (guestSpend.json.spend?.verified || Number(guestSpend.json.spend?.amount) > 0) {
      fail("spend-unverified", JSON.stringify(guestSpend.json.spend).slice(0, 220));
    } else ok("spend-unverified", "no verified spend without passport");

    const sepa = await req(base, "POST", "/pay/intent", {
      tableId: "TB-RAILS",
      user: host,
      method: "sepa",
    });
    if (sepa.status !== 409 || sepa.json.error !== "no_amount") {
      fail("pay-intent-no-amount", "expected 409 no_amount got " + sepa.status + " " + JSON.stringify(sepa.json));
    } else ok("pay-intent-no-amount", "guest per_person is not charged");

    fs.writeFileSync(pay, JSON.stringify({
      currency: "EUR",
      revolut: { iban: "DE89370400440532013000", bic: "COBADEFFXXX", name: "VELVET", me: "velvet" },
    }));
    const cfgOn = await req(base, "GET", "/pay/config");
    const sepaOn = (cfgOn.json.methods || []).find((m) => m.id === "sepa");
    if (!cfgOn.json.ready || !sepaOn?.enabled) fail("pay-ready", JSON.stringify(cfgOn.json.keys) + " sepa=" + !!sepaOn?.enabled);
    else ok("pay-ready", "IBAN on, SEPA enabled");

    const sepaOk = await req(base, "POST", "/pay/intent", {
      tableId: "TB-RAILS", user: host, method: "sepa", amount: 80,
    });
    if (sepaOk.status !== 200 || sepaOk.json.mode !== "bank" || !String(sepaOk.json.bank?.iban || "").includes("DE89")) {
      fail("pay-sepa", JSON.stringify(sepaOk.json).slice(0, 240));
    } else ok("pay-sepa", sepaOk.json.bank.reference);

    const sent = await req(base, "POST", "/pay/sent", {
      tableId: "TB-RAILS", user: host, amount: 80, method: "sepa",
      reference: sepaOk.json.bank.reference,
    });
    const pending = (sent.json.table?.members || []).find((m) => m.id === host.id);
    if (!sent.json.ok || !pending?.paidPending) fail("pay-sent", JSON.stringify(sent.json).slice(0, 240));
    else ok("pay-sent", "host pending bank");

    const pendingSpend = await req(base, "GET", "/users/" + encodeURIComponent(host.id));
    if (Number(pendingSpend.json.spend?.amount) > 0) {
      fail("spend-pending", JSON.stringify(pendingSpend.json.spend).slice(0, 220));
    } else ok("spend-pending", "bank pending is not verified spend");

    const hostPayAmt = await req(base, "POST", "/tables/TB-RAILS/pay", {
      user: host, targetId: host.id, paid: true, amount: 80,
    });
    const hostMem = (hostPayAmt.json.table?.members || []).find((m) => m.id === host.id);
    const hostProf = await req(base, "GET", "/users/" + encodeURIComponent(host.id));
    if (hostPayAmt.status !== 200 || !hostMem?.paid) fail("spend-pay", JSON.stringify(hostPayAmt.json).slice(0, 220));
    else if (!hostProf.json.spend?.verified || hostProf.json.spend.amount !== 80 || hostProf.json.spend.n !== 1) {
      fail("spend-verified", JSON.stringify(hostProf.json.spend).slice(0, 240));
    } else if (hostProf.json.spend.real !== true || guestSpend.json.spend?.real) {
      fail("spend-real", JSON.stringify({ host: hostProf.json.spend, guest: guestSpend.json.spend }).slice(0, 240));
    } else if (JSON.stringify(hostProf.json).includes("AB1234567")) {
      fail("spend-no-pan", "passport number leaked");
    } else ok("spend-verified", "€80 · 1 payment · real=true on public profile");

    const hostAgain = await req(base, "POST", "/tables/TB-RAILS/pay", {
      user: host, targetId: host.id, paid: true, amount: 80,
    });
    const hostProf2 = await req(base, "GET", "/users/" + encodeURIComponent(host.id));
    if (hostProf2.json.spend?.amount !== 80 || hostProf2.json.spend?.n !== 1) {
      fail("spend-dup", JSON.stringify(hostProf2.json.spend).slice(0, 220));
    } else ok("spend-dup", "same table not double-counted");

    const auth = await req(base, "GET", "/auth/start/instagram");
    if (auth.status !== 200 || !(auth.json.local === true || auth.json.url)) fail("auth-start", JSON.stringify(auth));
    else ok("auth-start", auth.json.local ? "connect public profile" : "oauth url");
    const gStart = await req(base, "GET", "/auth/start/google");
    if (gStart.status !== 200 || !(gStart.json.local === true || gStart.json.url)) fail("auth-start-google", JSON.stringify(gStart.json));
    else ok("auth-start-google", gStart.json.local ? "connect email" : "oauth url");
    const gConn = await req(base, "POST", "/auth/connect", { provider: "google", handle: "ada.test@gmail.com", name: "Ada Test" });
    if (gConn.status !== 200 || gConn.json.user?.handle !== "ada.test@gmail.com" || gConn.json.user?.provider !== "google") {
      fail("auth-connect-google", JSON.stringify(gConn.json).slice(0, 240));
    } else ok("auth-connect-google", "google email linked");

    const badH = await req(base, "POST", "/auth/connect", { provider: "instagram", handle: "!!", name: "Ada" });
    if (badH.status !== 400) fail("auth-connect-handle", JSON.stringify(badH.json));
    else ok("auth-connect-handle", "invalid @ rejected");
    const conn = await req(base, "POST", "/auth/connect", { provider: "instagram", handle: "velvet_test_ada", name: "Ada Test" });
    if (conn.status !== 200 || conn.json.user?.handle !== "velvet_test_ada" || conn.json.user?.name !== "Ada Test") {
      fail("auth-connect", JSON.stringify(conn.json).slice(0, 240));
    } else ok("auth-connect", "public @ linked");

    const events = await req(base, "GET", "/events");
    const evn = events.json?.venues || {};
    if (events.status !== 200) fail("events", "HTTP " + events.status);
    else if (!evn["IBZ-001"]?.events?.length) fail("events", "missing IBZ-001 lineup");
    else ok("events", Object.keys(evn).length + " venues, fetched " + (events.json.fetched || ""));

    const est = await req(base, "GET", "/events/status");
    if (est.status !== 200) fail("events-status", "HTTP " + est.status);
    else ok("events-status", "running=" + !!est.json.running);

    const facts = await req(base, "GET", "/facts");
    if (facts.status !== 200 || !facts.json.venues) fail("facts", JSON.stringify(facts.json).slice(0, 200));
    else ok("facts", Object.keys(facts.json.venues).length + " cached");

    const places = await req(base, "GET", "/places");
    if (places.status !== 200 || !places.json.venues) fail("places", JSON.stringify(places.json).slice(0, 200));
    else ok("places", Object.keys(places.json.venues).length + " cached");

    const noMrz = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Moses Isik", passport: img, selfie: img,
    });
    if (noMrz.status !== 422 || noMrz.json.error !== "mrz_unreadable") fail("idv-no-mrz", JSON.stringify(noMrz.json).slice(0, 200));
    else ok("idv-no-mrz", "422 without MRZ");

    const unreadChat = await req(base, "GET", "/chats/IBZ-001?userId=" + encodeURIComponent(guest.id));
    if (unreadChat.status !== 403 || unreadChat.json.error !== "idv_required") {
      fail("gate-unreadable", JSON.stringify(unreadChat.json).slice(0, 220));
    } else ok("gate-unreadable", "unreadable passport stays idv_required");

    const expired = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Anna Eriksson", passport: img, selfie: img, mrz: ICAO_SAMPLE,
    });
    if (expired.status !== 422 || expired.json.error !== "mrz_expired") fail("idv-expired", JSON.stringify(expired.json).slice(0, 200));
    else ok("idv-expired", "rejected");

    const kid = await req(base, "POST", "/idv", {
      userId: "U-kid", name: "Test Ung", passport: img, selfie: img, mrz: TEST_YOUNG,
    });
    if (kid.status !== 422 || kid.json.error !== "too_young") fail("idv-too-young", JSON.stringify(kid.json).slice(0, 240));
    else ok("idv-too-young", "age " + kid.json.ageYears);

    const kidChat = await req(base, "GET", "/chats/IBZ-001?userId=U-kid");
    if (kidChat.status !== 403 || kidChat.json.error !== "too_young") {
      fail("gate-too-young", JSON.stringify(kidChat.json).slice(0, 220));
    } else if (kidChat.json.minAge !== 18 || kidChat.json.ageYears == null) {
      fail("gate-too-young-fields", JSON.stringify(kidChat.json).slice(0, 220));
    } else ok("gate-too-young", "min " + kidChat.json.minAge + " age " + kidChat.json.ageYears);

    const kidMia = await req(base, "GET", "/chats/MIA-101?userId=U-kid");
    if (kidMia.status !== 403 || kidMia.json.error !== "too_young") {
      fail("gate-us21", JSON.stringify(kidMia.json).slice(0, 220));
    } else if (kidMia.json.minAge !== 21) {
      fail("gate-us21-min", JSON.stringify(kidMia.json).slice(0, 220));
    } else ok("gate-us21", "MIA-101 min " + kidMia.json.minAge);

    const usYoung = { id: "U-us18", name: "Adult Ung", handle: "us18", provider: "tiktok" };
    const usIdv = await req(base, "POST", "/idv", {
      userId: usYoung.id, name: usYoung.name, passport: img, selfie: img, mrz: TEST_18, face: FACE_OK,
    });
    if (usIdv.json.idv?.status !== "verified" || usIdv.json.idv.ageYears < 18 || usIdv.json.idv.ageYears > 20) {
      fail("idv-us18", JSON.stringify(usIdv.json).slice(0, 240));
    } else ok("idv-us18", "age " + usIdv.json.idv.ageYears);

    const usCard = await req(base, "POST", "/card", {
      user: usYoung, last4: "2222", brand: "visa", expMonth: 12, expYear: 2099,
    });
    if (usCard.status !== 200) fail("card-us18", JSON.stringify(usCard.json).slice(0, 200));
    else ok("card-us18", "Visa ••2222");

    const usClaim = await req(base, "POST", "/chats/MIA-101/claim", { user: usYoung });
    if (usClaim.status !== 403 || usClaim.json.error !== "too_young" || usClaim.json.minAge !== 21) {
      fail("claim-us21", JSON.stringify(usClaim.json).slice(0, 220));
    } else ok("claim-us21", "18-20 cannot claim MIA-101");

    const usMia = await req(base, "GET", "/chats/MIA-101?userId=" + encodeURIComponent(usYoung.id));
    if (usMia.status !== 403 || usMia.json.error !== "too_young" || usMia.json.minAge !== 21) {
      fail("chat-us21", JSON.stringify(usMia.json).slice(0, 220));
    } else ok("chat-us21", "18-20 paying member blocked at 21+ venue");

    const kidJoin = await req(base, "POST", "/tables/TB-RAILS/join", { user: { id: "U-kid", name: "Test Ung" } });
    if (kidJoin.status !== 403 || kidJoin.json.error !== "too_young") {
      fail("tables-join-kid", JSON.stringify(kidJoin.json).slice(0, 220));
    } else ok("tables-join-kid", "underage cannot join TB-RAILS");

    const noFace = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Moses Isik", passport: img, selfie: img, mrz: TEST_LIVE,
    });
    if (noFace.status !== 422 || noFace.json.error !== "face_passport") fail("idv-no-face", JSON.stringify(noFace.json).slice(0, 200));
    else ok("idv-no-face", "422 without face");

    const badMatch = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Moses Isik", passport: img, selfie: img, mrz: TEST_LIVE,
      face: { passportFace: true, selfieFace: true, liveness: true, matchOk: false, matchDistance: 0.91 },
    });
    if (badMatch.status !== 422 || badMatch.json.error !== "face_mismatch") fail("idv-face-mismatch", JSON.stringify(badMatch.json).slice(0, 200));
    else ok("idv-face-mismatch", "rejected");

    const noBlink = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Moses Isik", passport: img, selfie: img, mrz: TEST_LIVE,
      face: { passportFace: true, selfieFace: true, liveness: false, matchOk: true, matchDistance: 0.3 },
    });
    if (noBlink.status !== 422 || noBlink.json.error !== "face_liveness") fail("idv-no-blink", JSON.stringify(noBlink.json).slice(0, 200));
    else ok("idv-no-blink", "rejected");

    const mismatch = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Gabbe Velvet", passport: img, selfie: img, mrz: TEST_LIVE, face: FACE_OK,
    });
    if (mismatch.json?.idv?.status !== "mismatch" || mismatch.json.idv.fields?.documentNumber) {
      fail("idv-mismatch", JSON.stringify(mismatch.json).slice(0, 240));
    } else ok("idv-mismatch", mismatch.json.idv.legalName);

    const good = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Moses Isik", passport: img, selfie: img, mrz: TEST_LIVE, face: FACE_OK,
    });
    if (good.status !== 200 || good.json.idv?.status !== "verified") fail("idv-ok", JSON.stringify(good.json).slice(0, 240));
    else if (good.json.idv.fields?.documentNumber) fail("idv-ok", "leaked full passport number");
    else if (good.json.idv.fields?.documentNumberMasked !== "•••567") fail("idv-ok", "mask " + good.json.idv.fields?.documentNumberMasked);
    else if (!good.json.idv.adult || good.json.idv.ageYears < 18) fail("idv-ok-age", JSON.stringify({ age: good.json.idv.ageYears, adult: good.json.idv.adult }));
    else ok("idv-ok", good.json.idv.legalName + " age " + good.json.idv.ageYears);

    const gotIdv = await req(base, "GET", "/idv/" + encodeURIComponent(guest.id));
    if (gotIdv.json.idv?.status !== "verified") fail("idv-get", JSON.stringify(gotIdv.json));
    else ok("idv-get", "verified");

    const pastTb = await req(base, "POST", "/tables", {
      id: "TB-PAST", venue_id: "IBZ-001", venue: "Hï Ibiza", destination: "Ibiza",
      date: "2020-08-01", package: "VIP-bord", total: 1000, party: 4, openSeats: 2, host,
    });
    if (pastTb.status !== 201) fail("tables-past", JSON.stringify(pastTb.json).slice(0, 200));
    else ok("tables-past", pastTb.json.table.id);

    const noTid = await req(base, "POST", "/reviews", { from: guest, to: host, rating: 5, text: "x" });
    if (noTid.status !== 400) fail("review-no-table", "expected 400 got " + noTid.status);
    else ok("review-no-table", "need tableId");

    const fut = await req(base, "POST", "/tables", {
      id: "TB-FUTURE", venue_id: "IBZ-001", venue: "Pacha Ibiza", destination: "Ibiza",
      date: "2099-06-01", package: "VIP-bord", total: 1000, party: 4, openSeats: 2, host,
    });
    const pastJoinEarly = await req(base, "POST", "/tables/TB-PAST/join", { user: guest });
    if (pastJoinEarly.status !== 403 || pastJoinEarly.json.error !== "card_required") {
      fail("tables-join-card", JSON.stringify(pastJoinEarly.json).slice(0, 220));
    } else ok("tables-join-card", "verified still needs card to join");

    const needCard = await req(base, "GET", "/chats/BCN-102?userId=" + encodeURIComponent(guest.id));
    if (needCard.status !== 403 || needCard.json.error !== "card_required") {
      fail("promo-card-get", JSON.stringify(needCard.json).slice(0, 220));
    } else ok("promo-card-get", "verified without card 403");

    const pan = await req(base, "POST", "/card", {
      user: guest, last4: "1111", brand: "visa", expMonth: 12, expYear: 2099,
      number: "4111111111111111", cvc: "123",
    });
    if (pan.status !== 400 || pan.json.error !== "no_pan") fail("card-no-pan", JSON.stringify(pan.json).slice(0, 200));
    else ok("card-no-pan", "PAN rejected");

    const beforeIdv = await req(base, "POST", "/card", {
      user: plain, last4: "4242", brand: "visa", expMonth: 12, expYear: 2099,
    });
    if (beforeIdv.status !== 403 || beforeIdv.json.error !== "idv_required") {
      fail("card-need-idv", JSON.stringify(beforeIdv.json).slice(0, 200));
    } else ok("card-need-idv", "passport first");

    const expiredCard = await req(base, "POST", "/card", {
      user: guest, last4: "4242", brand: "visa", expMonth: 1, expYear: 2020,
    });
    if (expiredCard.status !== 400 || expiredCard.json.error !== "expired") {
      fail("card-expired", JSON.stringify(expiredCard.json).slice(0, 200));
    } else ok("card-expired", "rejected");

    const cardOk = await req(base, "POST", "/card", {
      user: guest, last4: "4242", brand: "visa", expMonth: 12, expYear: 2099,
    });
    if (cardOk.status !== 200 || cardOk.json.card?.last4 !== "4242" || cardOk.json.card?.number) {
      fail("card-ok", JSON.stringify(cardOk.json).slice(0, 220));
    } else ok("card-ok", "Visa ••4242");

    const pastJoin = await req(base, "POST", "/tables/TB-PAST/join", { user: guest });
    if (pastJoin.status !== 200) fail("tables-past-join", JSON.stringify(pastJoin.json).slice(0, 220));
    else ok("tables-past-join", "verified paying guest joined");
    await req(base, "POST", "/tables/TB-FUTURE/join", { user: guest });
    const soon = await req(base, "POST", "/reviews", {
      from: guest, to: host, tableId: "TB-FUTURE", rating: 5, text: "tidigt",
    });
    if (soon.status !== 403 || soon.json.error !== "too_soon") fail("review-soon", JSON.stringify(soon.json));
    else ok("review-soon", "after the night only");

    const rev = await req(base, "POST", "/reviews", {
      from: guest, to: host, tableId: "TB-PAST", rating: 5, text: "kul natt",
    });
    if (rev.status !== 201 || !rev.json.review) fail("review-ok", JSON.stringify(rev.json).slice(0, 200));
    else ok("review-ok", rev.json.review.id);

    const dupRev = await req(base, "POST", "/reviews", {
      from: guest, to: host, tableId: "TB-PAST", rating: 4, text: "igen",
    });
    if (dupRev.status !== 409) fail("review-dup", "expected 409 got " + dupRev.status);
    else ok("review-dup", "one per night");

    const prof = await req(base, "GET", "/users/" + encodeURIComponent(host.id));
    const pastIds = (prof.json.parties?.past || []).map((p) => p.id);
    if (prof.status !== 200 || !pastIds.includes("TB-PAST")) fail("profile-parties", JSON.stringify(prof.json.parties).slice(0, 240));
    else if (prof.json.n < 1 || !prof.json.reviews?.length) fail("profile-rating", "missing fun score");
    else ok("profile-parties", "past party + rating");

    const promoGuest = await req(base, "GET", "/promoters?userId=" + encodeURIComponent(guest.id));
    const guestSees = (promoGuest.json.promoters || []).find((p) => p.id === host.id);
    if (promoGuest.status !== 200 || !guestSees || guestSees.idv !== "verified" || guestSees.legalName !== "MOSES ISIK") {
      fail("promoters-guest-sees", JSON.stringify(promoGuest.json).slice(0, 280));
    } else ok("promoters-guest-sees", "verified paying guest sees verified promoter");

    const idvCard = await req(base, "GET", "/idv/" + encodeURIComponent(guest.id));
    if (!idvCard.json.paying || idvCard.json.card?.last4 !== "4242") {
      fail("card-idv-get", JSON.stringify(idvCard.json).slice(0, 220));
    } else ok("card-idv-get", "paying customer");

    const matchBlocked = await req(base, "POST", "/matches/IBZ-001", {
      user: plain, date: "2026-09-04", seats: 2,
    });
    if (matchBlocked.status !== 403 || matchBlocked.json.error !== "idv_required") {
      fail("match-idv", JSON.stringify(matchBlocked.json).slice(0, 200));
    } else ok("match-idv", "unverified cannot ask");

    const matchBad = await req(base, "POST", "/matches/IBZ-001", { user: guest, date: "narsom", seats: 2 });
    if (matchBad.status !== 400) fail("match-date", "expected 400 got " + matchBad.status);
    else ok("match-date", "need a real date");

    const matchAsk = await req(base, "POST", "/matches/IBZ-001", {
      user: guest, date: "2026-09-04", seats: 2, note: "vill dela VIP-bord", openSeats: 2, openFor: "women",
    });
    if (matchAsk.status !== 200 || matchAsk.json.match?.seats !== 2 || matchAsk.json.match?.status !== "open") {
      fail("match-ask", JSON.stringify(matchAsk.json).slice(0, 240));
    } else ok("match-ask", matchAsk.json.match.id);

    const matchList = await req(base, "GET", "/matches/IBZ-001?userId=" + encodeURIComponent(host.id));
    const waiting = (matchList.json.matches || []).find((m) => m.userId === guest.id && m.status === "open");
    if (!matchList.json.promoter || !waiting) fail("match-queue", JSON.stringify(matchList.json).slice(0, 240));
    else ok("match-queue", waiting.id);

    const composed = await req(base, "POST", "/matches/IBZ-001/compose", {
      user: host, matchIds: [waiting.id], venue: "Hi Ibiza", destination: "Ibiza", openSeats: 2, party: 4, openFor: "women",
    });
    const grouped = composed.json.table;
    if (composed.status !== 201 || grouped?.host?.id !== guest.id || grouped.openLeft !== 2 || grouped.openFor !== "women") {
      fail("match-compose", JSON.stringify(composed.json).slice(0, 240));
    } else ok("match-compose", grouped.id + " openLeft=" + grouped.openLeft + " for women");

    const joinWomenHost = await req(base, "POST", "/tables/" + encodeURIComponent(grouped.id) + "/join", { user: host });
    if (joinWomenHost.status !== 403 || joinWomenHost.json.error !== "seat_pref") {
      fail("seat-pref-men", JSON.stringify(joinWomenHost.json).slice(0, 200));
    } else ok("seat-pref-men", "passport sex blocks men from women-only seats");

    const joinWomenPlain = await req(base, "POST", "/tables/" + encodeURIComponent(grouped.id) + "/join", { user: plain });
    if (joinWomenPlain.status !== 403 || joinWomenPlain.json.error !== "idv_required") {
      fail("seat-pref-idv", JSON.stringify(joinWomenPlain.json).slice(0, 200));
    } else ok("seat-pref-idv", "gendered seats need passport");

    const afterCompose = await req(base, "GET", "/matches/IBZ-001?userId=" + encodeURIComponent(guest.id));
    const mine = (afterCompose.json.matches || []).find((m) => m.id === waiting.id);
    if (mine?.status !== "grouped" || mine?.tableId !== grouped.id) fail("match-grouped", JSON.stringify(mine));
    else ok("match-grouped", "guest sees grouped table");

    const waFacts = await req(base, "GET", "/chats/BCN-102?userId=" + encodeURIComponent(guest.id));
    if (waFacts.status !== 200 || !String(waFacts.json.whatsapp?.phone || "").includes("34669")) {
      fail("wa-venue", JSON.stringify(waFacts.json).slice(0, 220));
    } else ok("wa-venue", "Otto Zutz official WhatsApp");

    const waClaim = await req(base, "POST", "/chats/IBZ-001/claim", {
      user: host, whatsapp: "+46 70 123 45 67",
    });
    if (waClaim.status !== 200 || waClaim.json.whatsapp?.phone !== "46701234567") {
      fail("wa-claim", JSON.stringify(waClaim.json).slice(0, 220));
    } else ok("wa-claim", waClaim.json.whatsapp.phone);

    const waBad = await req(base, "POST", "/chats/IBZ-001/claim", {
      user: host, whatsapp: "abc",
    });
    if (waBad.status !== 400) fail("wa-bad", "expected 400 got " + waBad.status);
    else ok("wa-bad", "invalid number");

    const gwa = await req(base, "POST", "/chats/IBZ-001/guest-wa", {
      user: guest, whatsapp: "+34 611 11 22 22",
    });
    if (gwa.status !== 200 || gwa.json.guestWa !== "34611112222") fail("wa-guest", JSON.stringify(gwa.json));
    else ok("wa-guest", gwa.json.guestWa);

    await req(base, "POST", "/chats/IBZ-001", { user: guest, text: "hej, bord ikväll?" });
    const inbox = await req(base, "GET", "/chats/IBZ-001/inbox?userId=" + encodeURIComponent(host.id));
    const gth = (inbox.json.threads || []).find((th) => th.threadId === guest.id);
    if (inbox.status !== 200 || gth?.guestWa !== "34611112222") fail("wa-inbox", JSON.stringify(inbox.json).slice(0, 240));
    else if (!gth.paying || gth.card?.last4 !== "4242") fail("wa-inbox-paying", JSON.stringify(gth).slice(0, 220));
    else ok("wa-inbox", "promoter sees paying customer + WhatsApp");

    const hook = await req(base, "POST", "/wa/webhook", {
      entry: [{ changes: [{ value: { messages: [{
        from: "46701234567", id: "wamid.rails1", text: { body: "ses 23:30 vid dörren" },
      }] } }] }],
    });
    if (hook.status !== 200 || !hook.json.stored) fail("wa-hook", JSON.stringify(hook.json));
    else ok("wa-hook", "promoter reply from WhatsApp");

    const th = await req(base, "GET", "/chats/IBZ-001?userId=" + encodeURIComponent(guest.id));
    const fromWa = (th.json.messages || []).some((m) => m.via === "whatsapp" && m.role === "promoter" && /23:30/.test(m.text));
    if (!fromWa) fail("wa-thread", JSON.stringify(th.json.messages).slice(0, 240));
    else ok("wa-thread", "guest sees WhatsApp reply");

    const blocked = await req(base, "POST", "/events/refresh", { user: { id: "U-x" } });
    if (blocked.status !== 403) fail("events-refresh-off", "expected 403 got " + blocked.status);
    else ok("events-refresh-off", "VELVET_CRAWL=0");

    return { cfg: cfg.json, table: paySelf.json.table };
  } finally {
    child.kill("SIGTERM");
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* tmp */ }
  }
}

const booking = checkBookingUrls();
checkMrz();
const api = await runApi();
if (FAIL.length) {
  console.error(LOG.join("\n"));
  console.error("FAILED " + FAIL.length);
  process.exit(1);
}
console.log(LOG.join("\n"));
console.log("PASS");

const scratch = process.env.VELVET_SCRATCH;
if (scratch) {
  fs.mkdirSync(scratch, { recursive: true });
  fs.writeFileSync(path.join(scratch, "booking-urls.txt"),
    "count=" + booking.count + " missing=" + booking.missing + "\n" + booking.lines.join("\n") + "\n");
  fs.writeFileSync(path.join(scratch, "pay-config.json"), JSON.stringify(api.cfg, null, 2));
  fs.writeFileSync(path.join(scratch, "table-roster.json"), JSON.stringify(api.table, null, 2));
  fs.writeFileSync(path.join(scratch, "test-rails.log"), LOG.join("\n") + "\nPASS\n");
}
