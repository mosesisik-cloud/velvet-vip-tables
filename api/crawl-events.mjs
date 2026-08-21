#!/usr/bin/env node
/**
 * Daily official-site crawl for VELVET venue events.
 * Firecrawl (JSON extract) on VIP/calendar pages; HTML + JSON-LD on the rest.
 * Never invents prices. Keeps previous events if a site returns nothing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const APP_DATA = process.env.VELVET_APP_DATA || path.join(ROOT, "data");
const EVENTS_FILE = process.env.VELVET_EVENTS || path.join(APP_DATA, "venue-events.json");
const STATUS_FILE = process.env.VELVET_CRAWL_STATUS || path.join(__dir, "crawl-status.json");
const PAY_FILE = process.env.VELVET_PAY || path.join(__dir, "pay.json");
const UA = "VELVET-daily-events/1.0 (+https://b2b.bakemyday.se/velvet/)";
const RESELLER = /discotech|clubbookers|ticketsibiza|tasteibiza|nocovernightclubs|lasvegasnightclubs|miamiviptables|clubtickets|viator|getyourguide/i;
const SKIP_TITLE = /^(home|meny|menu|book now|book a table|vip tables?|contact|kontakt|privacy|cookies?|instagram|facebook|tiktok|newsletter|sign up|log in|follow us)$/i;
const MAX_FIRECRAWL = Number(process.env.VELVET_FIRECRAWL_MAX || 20);
const FC_URL = "https://api.firecrawl.dev/v2/scrape";

const EVENT_SCHEMA = {
  type: "object",
  properties: {
    events: {
      type: "array",
      description: "Official upcoming events, DJ nights or VIP table nights listed on this page. Only what is on the page. Do not invent.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event or artist name as written." },
          date: { type: ["string", "null"], description: "YYYY-MM-DD if a calendar date is shown, else null." },
          note: { type: ["string", "null"], description: "Time, room or short extra. No prices unless printed." },
          url: { type: ["string", "null"], description: "Absolute event URL if linked." },
        },
        required: ["title"],
      },
    },
  },
};

const MONTHS = {
  jan: 1, january: 1, januari: 1, enero: 1, janvier: 1,
  feb: 2, february: 2, februari: 2, febrero: 2, fevrier: 2, février: 2,
  mar: 3, march: 3, mars: 3, marzo: 3,
  apr: 4, april: 4, abril: 4, avril: 4,
  may: 5, maj: 5, mayo: 5, mai: 5,
  jun: 6, june: 6, juni: 6, junio: 6, juin: 6,
  jul: 7, july: 7, juli: 7, julio: 7, juillet: 7,
  aug: 8, august: 8, agosto: 8, aout: 8, août: 8,
  sep: 9, sept: 9, september: 9, septiembre: 9, septembre: 9,
  oct: 10, october: 10, oktober: 10, octubre: 10, octobre: 10,
  nov: 11, november: 11, noviembre: 11, novembre: 11,
  dec: 12, december: 12, diciembre: 12, decembre: 12, décembre: 12,
};

let running = null;
let statusCache = null;

function firecrawlKey() {
  if (process.env.FIRECRAWL_API_KEY) return String(process.env.FIRECRAWL_API_KEY).trim();
  try {
    const pay = JSON.parse(fs.readFileSync(PAY_FILE, "utf8"));
    return String(pay.firecrawlKey || "").trim();
  } catch {
    return "";
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  try {
    fs.renameSync(tmp, file);
  } catch {
    fs.copyFileSync(tmp, file);
    try { fs.unlinkSync(tmp); } catch { /* win */ }
  }
}

export function loadEventsFile() {
  const raw = readJson(EVENTS_FILE, null);
  if (raw && raw.venues && typeof raw.venues === "object") return raw;
  return { fetched: null, fetchedAt: null, engine: null, venues: {} };
}

export function loadCrawlStatus() {
  if (statusCache && running) return { ...statusCache, running: true };
  const st = readJson(STATUS_FILE, {});
  return {
    lastRun: st.lastRun || null,
    lastOk: st.lastOk || null,
    running: !!running,
    engine: st.engine || null,
    firecrawl: !!st.firecrawl,
    venuesChecked: Number(st.venuesChecked) || 0,
    venuesUpdated: Number(st.venuesUpdated) || 0,
    events: Number(st.events) || 0,
    errors: Number(st.errors) || 0,
    reason: st.reason || "",
    nextDue: st.nextDue || null,
  };
}

function saveStatus(partial) {
  const prev = loadCrawlStatus();
  const runningNow = Object.prototype.hasOwnProperty.call(partial, "running") ? !!partial.running : !!running;
  const next = { ...prev, ...partial, running: runningNow };
  statusCache = next;
  writeJsonAtomic(STATUS_FILE, next);
  return next;
}

export function getCrawlState() {
  return { running: !!running, status: loadCrawlStatus() };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoDate(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  const iso = s.match(/^(20\d{2})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const eu = s.match(/^(\d{1,2})[./](\d{1,2})[./](20\d{2})/);
  if (eu) return `${eu[3]}-${String(eu[2]).padStart(2, "0")}-${String(eu[1]).padStart(2, "0")}`;
  const ymd = s.match(/^(20\d{2})[./](\d{1,2})[./](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${String(ymd[2]).padStart(2, "0")}-${String(ymd[3]).padStart(2, "0")}`;
  const tm = s.match(/^(\d{1,2})\s+([A-Za-zàáâäåéèêëíìîïóòôöúùûüç]{3,9})\s+(20\d{2})/i);
  if (tm) {
    const m = MONTHS[tm[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
    if (m) return `${tm[3]}-${String(m).padStart(2, "0")}-${String(tm[1]).padStart(2, "0")}`;
  }
  const us = s.match(/^([A-Za-zàáâäåéèêëíìîïóòôöúùûüç]{3,9})\s+(\d{1,2}),?\s+(20\d{2})/i);
  if (us) {
    const m = MONTHS[us[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
    if (m) return `${us[3]}-${String(m).padStart(2, "0")}-${String(us[2]).padStart(2, "0")}`;
  }
  return "";
}

function absUrl(u, base) {
  try {
    return new URL(u, base).href;
  } catch {
    return base || "";
  }
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanEvent(raw, pageUrl) {
  const title = decodeEntities(String(raw?.title || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).slice(0, 140);
  if (title.length < 3 || SKIP_TITLE.test(title)) return null;
  if (/days_plural|created_at|updated_at|^[a-z0-9-]+$/.test(title)) return null;
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun),?$/i.test(title)) return null;
  if (/^\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?$/i.test(title)) return null;
  if (/^\/\*|cached:|env_date|<\/?[a-z]|[{}=]/.test(title)) return null;
  if (/^\d{3,}/.test(title)) return null;
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(title)) return null;
  const date = isoDate(raw.date || raw.startDate || "");
  const yesterday = new Date(Date.now() - 36 * 3600 * 1000).toISOString().slice(0, 10);
  if (date && date < yesterday) return null;
  if (date && date > "2032-01-01") return null;
  let url = String(raw.url || pageUrl || "").trim();
  if (url && !/^https?:\/\//i.test(url)) url = absUrl(url, pageUrl);
  if (url && RESELLER.test(url)) url = pageUrl;
  const note = String(raw.note || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
  const ev = { title, date: date || undefined, url: url || undefined };
  if (note && !/€|eur\b|\$\d/i.test(note)) ev.note = note;
  else if (note) ev.note = note.replace(/\s*[-–]?\s*(?:from\s*)?(?:€|EUR|\$)\s*\d[\d\s.,]*/gi, "").trim() || undefined;
  return ev;
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const e of list) {
    const k = `${(e.date || "")}|${e.title.toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out
    .sort((a, b) => String(a.date || "9999").localeCompare(String(b.date || "9999")))
    .slice(0, 40);
}

function flattenLd(node, acc = []) {
  if (!node) return acc;
  if (Array.isArray(node)) {
    for (const x of node) flattenLd(x, acc);
    return acc;
  }
  if (typeof node !== "object") return acc;
  acc.push(node);
  if (node["@graph"]) flattenLd(node["@graph"], acc);
  if (node.itemListElement) flattenLd(node.itemListElement, acc);
  return acc;
}

function isEventType(t) {
  const s = Array.isArray(t) ? t.join(" ") : String(t || "");
  return /event|musicEvent|festival|screeningevent/i.test(s);
}

function parseJsonLdEvents(html, pageUrl) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1].replace(/<!--[\s\S]*?-->/g, "").trim());
      for (const item of flattenLd(data)) {
        if (!isEventType(item["@type"])) continue;
        const ev = cleanEvent({
          title: item.name,
          date: item.startDate,
          url: item.url || item.mainEntityOfPage,
          note: item.location?.name || item.description,
        }, pageUrl);
        if (ev) out.push(ev);
      }
    } catch { /* bad ld+json */ }
  }
  return out;
}

function parseDatetimeAttrs(html, pageUrl) {
  const out = [];
  const re = /<time[^>]*datetime=["']([^"']+)["'][^>]*>([\s\S]*?)<\/time>/gi;
  let m;
  while ((m = re.exec(html))) {
    const date = isoDate(m[1]);
    const title = String(m[2] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const ev = cleanEvent({ title: title || date, date, url: pageUrl }, pageUrl);
    if (ev && ev.title !== ev.date) out.push(ev);
  }
  return out;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function weekdayOf(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] || "";
}

function parseEmbeddedEvents(text, pageUrl) {
  const out = [];
  const slugRes = [
    /\\"name\\":\\"([^\\"]{3,90})\\",\\"slug\\":\\"([a-z0-9-]*?(\d{2})-(\d{2})-(20\d{2}))\\"/gi,
    /"name"\s*:\s*"([^"]{3,90})"\s*,\s*"slug"\s*:\s*"([a-z0-9-]*?(\d{2})-(\d{2})-(20\d{2}))"/gi,
  ];
  for (const re of slugRes) {
    let m;
    while ((m = re.exec(text))) {
      const date = isoDate(`${m[3]}/${m[4]}/${m[5]}`);
      const title = m[1].replace(/\\+/g, "").trim();
      const slug = m[2].replace(/\\+/g, "");
      const ev = cleanEvent({ title, date, url: absUrl("/event/" + slug, pageUrl) }, pageUrl);
      if (ev) out.push(ev);
    }
  }
  const residencies = [];
  const rre = /"([A-Z][^"]{2,80})","([a-z0-9-]{3,50})"[\s\S]{0,220}?"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)"/g;
  let rm;
  while ((rm = rre.exec(text))) {
    const title = rm[1].trim();
    if (/^(Created|Updated|Status|Origin|Published|Asset|Seo|Days|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i.test(title)) continue;
    if (/days_plural|created_at|^[a-z0-9-]+$/.test(title)) continue;
    if (/^\d{4}-\d{2}-\d{2}/.test(title)) continue;
    if (!/\s/.test(title) && title.length < 5) continue;
    residencies.push({ title, day: rm[3].toLowerCase() });
  }
  const dateRe = /"(20\d{2}-\d{2}-\d{2})","((?:Mondays|Tuesdays|Wednesdays|Thursdays|Fridays|Saturdays|Sundays))"/g;
  const dateSet = new Set();
  let dm;
  while ((dm = dateRe.exec(text))) dateSet.add(dm[1]);
  if (residencies.length) {
    const extra = text.match(/"(20\d{2}-\d{2}-\d{2})"/g) || [];
    const horizon = new Date(Date.now() + 150 * 864e5).toISOString().slice(0, 10);
    for (const x of extra) {
      const iso = x.slice(1, -1);
      if (iso >= todayISO() && iso <= horizon) dateSet.add(iso);
    }
  }
  const dates = [...dateSet].sort();
  const seen = new Set();
  for (const iso of dates.slice(0, 120)) {
    const wd = weekdayOf(iso);
    for (const r of residencies) {
      if (r.day !== wd) continue;
      const k = iso + "|" + r.title.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      const ev = cleanEvent({ title: r.title, date: iso, url: pageUrl }, pageUrl);
      if (ev) out.push(ev);
    }
  }
  return out;
}

function parseMarkdownEvents(md, pageUrl) {
  if (!md) return [];
  const out = [];
  const lines = String(md).split(/\n+/).map((l) => l.replace(/^#+\s*/, "").replace(/^\*\s*/, "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length > 180) continue;
    let date = "";
    let rest = line;
    const iso = line.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    const eu = line.match(/\b(\d{1,2}[./]\d{1,2}[./]20\d{2})\b/);
    const tm = line.match(/\b(\d{1,2}\s+[A-Za-zàáâäåéèêëíìîïóòôöúùûüç]{3,9}\s+20\d{2})\b/i);
    const us = line.match(/\b([A-Za-zàáâäåéèêëíìîïóòôöúùûüç]{3,9}\s+\d{1,2},?\s+20\d{2})\b/i);
    if (iso) { date = isoDate(iso[1]); rest = line.replace(iso[1], " ").replace(/\s+/g, " ").trim(); }
    else if (eu) { date = isoDate(eu[1]); rest = line.replace(eu[1], " ").replace(/\s+/g, " ").trim(); }
    else if (tm) { date = isoDate(tm[1]); rest = line.replace(tm[1], " ").replace(/\s+/g, " ").trim(); }
    else if (us) { date = isoDate(us[1]); rest = line.replace(us[1], " ").replace(/\s+/g, " ").trim(); }
    if (!date) continue;
    const ev = cleanEvent({ title: rest.replace(/^[-–:|·]+\s*/, "").replace(/\s+[-–:|·]+$/, ""), date, url: pageUrl }, pageUrl);
    if (ev) out.push(ev);
  }
  return out;
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error("http " + r.status);
  const ctype = r.headers.get("content-type") || "";
  if (!/html|xml|text/i.test(ctype) && ctype) throw new Error("not html");
  return await r.text();
}

async function scrapeFirecrawl(url, wantJson) {
  const key = firecrawlKey();
  const formats = ["markdown"];
  if (wantJson) {
    formats.push({
      type: "json",
      schema: EVENT_SCHEMA,
      prompt: "Extract official upcoming events and DJ lineups listed on this venue page. Do not invent dates or prices. Skip ticket resellers.",
    });
  }
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (key) headers.Authorization = "Bearer " + key;
  const r = await fetch(FC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url,
      formats,
      onlyMainContent: true,
      waitFor: 2500,
      timeout: 20000,
      blockAds: true,
    }),
    signal: AbortSignal.timeout(28000),
  });
  const text = await r.text();
  let j = {};
  try { j = JSON.parse(text); } catch { j = {}; }
  if (!r.ok) throw new Error("firecrawl " + r.status);
  const data = j.data || j;
  const jsonEvents = data.json?.events || j.json?.events || [];
  const markdown = data.markdown || j.markdown || "";
  return { jsonEvents: Array.isArray(jsonEvents) ? jsonEvents : [], markdown };
}

function loadCatalog() {
  const venues = readJson(path.join(APP_DATA, "venues.json"), []);
  const booking = readJson(path.join(APP_DATA, "booking-urls.json"), {});
  return { venues: Array.isArray(venues) ? venues : [], booking };
}

function targetUrl(v, booking) {
  const o = booking[v.venue_id];
  let url = "";
  let kind = "site";
  if (o && /^https?:\/\//i.test(o.url)) {
    url = o.url;
    kind = o.kind || "vip";
  } else {
    url = v.website_url || v.source_url || "";
  }
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (/instagram|facebook|tiktok|snapchat/i.test(url)) return { url: url.replace(/^http:\/\//i, "https://"), kind: "social" };
  return { url: url.replace(/^http:\/\//i, "https://"), kind };
}

async function crawlOne(v, booking, useFirecrawl) {
  const tgt = targetUrl(v, booking);
  if (!tgt) return { id: v.venue_id, ok: false, skip: "no-url", events: [], source: "" };
  if (tgt.kind === "social") return { id: v.venue_id, ok: true, skip: "social", events: [], source: tgt.url };
  const pageUrl = tgt.url;
  let events = [];
  let engine = "fetch";
  if (useFirecrawl) {
    try {
      const fc = await scrapeFirecrawl(pageUrl, true);
      engine = "firecrawl";
      events = (fc.jsonEvents || []).map((e) => cleanEvent(e, pageUrl)).filter(Boolean);
      if (!events.length) events = parseEmbeddedEvents(fc.markdown, pageUrl);
      if (!events.length) events = parseMarkdownEvents(fc.markdown, pageUrl);
    } catch {
      engine = "fetch";
    }
  }
  if (!events.length) {
    try {
      const html = await fetchHtml(pageUrl);
      engine = engine === "firecrawl" ? "firecrawl" : "fetch";
      events = [
        ...parseJsonLdEvents(html, pageUrl),
        ...parseDatetimeAttrs(html, pageUrl),
        ...parseEmbeddedEvents(html, pageUrl),
      ];
      if (!events.length) events = parseMarkdownEvents(html.replace(/<[^>]+>/g, "\n"), pageUrl);
    } catch (e) {
      if (!events.length) {
        return { id: v.venue_id, ok: false, error: String(e.message || e).slice(0, 180), events: [], source: pageUrl, engine };
      }
    }
  }
  return { id: v.venue_id, ok: true, events: dedupe(events), source: pageUrl, engine };
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

export async function runCrawl(opts = {}) {
  if (running) return running;
  const job = (async () => {
    const started = new Date().toISOString();
    const { venues, booking } = loadCatalog();
    const prev = loadEventsFile();
    const only = String(opts.venueId || "").trim();
    const list = only ? venues.filter((v) => v.venue_id === only) : venues;
    const hasFc = true; // keyless Firecrawl is allowed; 401 falls back per venue
    saveStatus({ lastRun: started, running: true, reason: opts.reason || "manual", firecrawl: !!firecrawlKey() || hasFc });

    const vip = [];
    const rest = [];
    for (const v of list) {
      const tgt = targetUrl(v, booking);
      const kind = tgt?.kind || "site";
      const already = (prev.venues?.[v.venue_id]?.events || []).length > 0;
      if (kind === "vip" || kind === "events" || (already && kind !== "social")) vip.push(v);
      else rest.push(v);
    }
    const fcTargets = new Set(vip.slice(0, MAX_FIRECRAWL).map((v) => v.venue_id));

    let updated = 0;
    let errors = 0;
    let fcUsed = 0;
    const venuesOut = { ...prev.venues };

    const work = [...vip, ...rest.filter((v) => !fcTargets.has(v.venue_id))];
    const results = await mapPool(work, only ? 1 : 4, async (v) => {
      const useFc = fcTargets.has(v.venue_id);
      const rec = await crawlOne(v, booking, useFc);
      if (useFc) fcUsed += 1;
      return rec;
    });

    for (const rec of results) {
      if (!rec) continue;
      if (!rec.ok && !rec.skip) errors += 1;
      if (rec.skip === "social" || rec.skip === "no-url") continue;
      if (rec.events.length) {
        venuesOut[rec.id] = { source: rec.source, engine: rec.engine, events: rec.events };
        updated += 1;
      }
    }

    const fetchedAt = new Date().toISOString();
    const out = {
      fetched: fetchedAt.slice(0, 10),
      fetchedAt,
      engine: fcUsed ? "firecrawl+fetch" : "fetch",
      venues: venuesOut,
    };
    writeJsonAtomic(EVENTS_FILE, out);
    let eventN = 0;
    for (const rec of Object.values(venuesOut)) eventN += (rec.events || []).length;
    const nextDue = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const st = saveStatus({
      lastRun: started,
      lastOk: fetchedAt,
      running: false,
      engine: out.engine,
      firecrawl: fcUsed > 0,
      venuesChecked: results.length,
      venuesUpdated: updated,
      events: eventN,
      errors,
      reason: opts.reason || "manual",
      nextDue,
    });
    console.log("velvet-crawl", st.venuesChecked, "checked", updated, "updated", eventN, "events", errors, "errors");
    return { ok: true, ...st, payload: out };
  })();

  running = job;
  try {
    return await job;
  } finally {
    running = null;
    statusCache = loadCrawlStatus();
  }
}

export function scheduleDailyCrawl() {
  if (process.env.VELVET_CRAWL === "0") return;
  const tick = () => {
    const st = loadCrawlStatus();
    const t = Date.parse(st.lastOk || st.lastRun || 0);
    const age = Number.isFinite(t) ? Date.now() - t : Infinity;
    if (age > 20 * 3600 * 1000) {
      runCrawl({ reason: "daily" }).catch((e) => console.error("velvet-crawl", e));
    }
  };
  setTimeout(tick, 25_000);
  setInterval(tick, 30 * 60 * 1000);
}

const invoked = String(process.argv[1] || "").replace(/\\/g, "/");
if (invoked.endsWith("crawl-events.mjs") || invoked.endsWith("crawl-events.js")) {
  const i = process.argv.indexOf("--venue");
  const venueId = i >= 0 ? process.argv[i + 1] : "";
  runCrawl({ venueId, reason: "cli" })
    .then((st) => {
      console.log(JSON.stringify({ ...st, payload: undefined }, null, 2));
      process.exitCode = st.ok ? 0 : 1;
    })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    });
}
