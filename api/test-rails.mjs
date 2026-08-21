#!/usr/bin/env node
/**
 * Hits the shipped VELVET API (api/server.mjs) and shipped data files.
 * No reimplementation of roster/pay logic — HTTP against a child of server.mjs.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseTd3, extractMrzFromText, nameMatch, ICAO_SAMPLE, TEST_LIVE } from "./mrz.mjs";
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

  const extracted = extractMrzFromText("header\n" + TEST_LIVE.line1 + "\n" + TEST_LIVE.line2 + "\nfooter");
  if (!extracted?.valid) fail("mrz-extract", JSON.stringify(extracted && extracted.reasons));
  else ok("mrz-extract", "from ocr text");

  const full = nameMatch("MOSES", "ISIK", "Moses Isik");
  const miss = nameMatch("MOSES", "ISIK", "Gabbe Velvet");
  if (!full.ok || miss.ok) fail("mrz-name", JSON.stringify({ full, miss }));
  else ok("mrz-name", "match vs mismatch");
}

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
    } else ok("tables-create", created.json.table.id);

    const joined = await req(base, "POST", "/tables/TB-RAILS/join", { user: guest });
    if (joined.status !== 200 || !joined.json.table) fail("tables-join", JSON.stringify(joined));
    else ok("tables-join", "openLeft=" + joined.json.table.openLeft);

    const got = await req(base, "GET", "/tables/TB-RAILS");
    const members = got.json.table?.members || [];
    const ids = members.map((m) => m.id).sort();
    if (got.status !== 200) fail("tables-get", "HTTP " + got.status);
    else if (ids.join() !== [guest.id, host.id].sort().join()) fail("tables-get", "members " + ids.join());
    else if (members.some((m) => m.paid)) fail("tables-get", "someone already paid");
    else if (members.some((m) => m.idv === "verified")) fail("tables-get", "idv verified without /idv");
    else ok("tables-get", members.length + " members unpaid unverified");

    const paySelf = await req(base, "POST", "/tables/TB-RAILS/pay", {
      user: guest,
      targetId: guest.id,
      paid: true,
    });
    const after = paySelf.json.table?.members || [];
    const g = after.find((m) => m.id === guest.id);
    const h = after.find((m) => m.id === host.id);
    if (paySelf.status !== 200) fail("tables-pay", "HTTP " + paySelf.status);
    else if (!g?.paid) fail("tables-pay", "guest not paid");
    else if (h?.paid) fail("tables-pay", "host should still be unpaid");
    else ok("tables-pay", "guest paid, host unpaid");

    const sepa = await req(base, "POST", "/pay/intent", {
      tableId: "TB-RAILS",
      user: guest,
      method: "sepa",
    });
    if (sepa.status !== 409) fail("pay-intent-no-iban", "expected 409 got " + sepa.status + " " + JSON.stringify(sepa.json));
    else ok("pay-intent-no-iban", String(sepa.json.error || sepa.json.message || 409));

    const auth = await req(base, "GET", "/auth/start/instagram");
    if (auth.status !== 200 || !(auth.json.local === true || auth.json.url)) fail("auth-start", JSON.stringify(auth));
    else ok("auth-start", auth.json.local ? "one-tap local" : "oauth url");

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

    const img = fakeJpeg();
    const FACE_OK = { passportFace: true, selfieFace: true, liveness: true, matchOk: true, matchDistance: 0.32 };
    const noMrz = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Moses Isik", passport: img, selfie: img,
    });
    if (noMrz.status !== 422 || noMrz.json.error !== "mrz_unreadable") fail("idv-no-mrz", JSON.stringify(noMrz.json).slice(0, 200));
    else ok("idv-no-mrz", "422 without MRZ");

    const expired = await req(base, "POST", "/idv", {
      userId: guest.id, name: "Anna Eriksson", passport: img, selfie: img, mrz: ICAO_SAMPLE,
    });
    if (expired.status !== 422 || expired.json.error !== "mrz_expired") fail("idv-expired", JSON.stringify(expired.json).slice(0, 200));
    else ok("idv-expired", "rejected");

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
    else ok("idv-ok", good.json.idv.legalName);

    const gotIdv = await req(base, "GET", "/idv/" + encodeURIComponent(guest.id));
    if (gotIdv.json.idv?.status !== "verified") fail("idv-get", JSON.stringify(gotIdv.json));
    else ok("idv-get", "verified");

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
