#!/usr/bin/env node
/**
 * Official venue facts via Firecrawl (agent when possible, scrape+schema otherwise).
 * Never invents prices, hours, phones or dress codes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const APP_DATA = process.env.VELVET_APP_DATA || path.join(ROOT, "data");
const FACTS_FILE = process.env.VELVET_FACTS || path.join(APP_DATA, "venue-facts.json");
const PAY_FILE = process.env.VELVET_PAY || path.join(__dir, "pay.json");
const FC_SCRAPE = "https://api.firecrawl.dev/v2/scrape";
const FC_AGENT = "https://api.firecrawl.dev/v2/agent";
const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: ["string", "null"], description: "Short official description. Null if none. Do not invent." },
    address: { type: ["string", "null"], description: "Street address as printed." },
    area: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    hours: { type: ["string", "null"], description: "Opening hours as printed. Do not invent." },
    season: { type: ["string", "null"] },
    ageLimit: { type: ["string", "null"] },
    dressCode: { type: ["string", "null"] },
    doorPolicy: { type: ["string", "null"] },
    music: { type: ["string", "null"] },
    vipHow: { type: ["string", "null"], description: "How to request VIP on the official site. No invented prices." },
    gettingThere: { type: ["string", "null"] },
    highlights: { type: "array", items: { type: "string" } },
  },
};
const PROMPT = "Extract official visitor facts from this venue website: short description, address, area, phone, email, opening hours, season, age limit, dress code, door policy, music, how to book VIP/tables, how to get there, and short highlights. Use only text on the site. Null if missing. Do not invent prices.";

const KEYS = ["summary", "address", "area", "phone", "email", "hours", "season", "ageLimit", "dressCode", "doorPolicy", "music", "vipHow", "gettingThere"];

let running = null;

function payKey() {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY;
  try {
    return String(JSON.parse(fs.readFileSync(PAY_FILE, "utf8")).firecrawlKey || "").trim();
  } catch { return ""; }
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

export function loadFactsFile() {
  const raw = readJson(FACTS_FILE, {});
  if (raw && raw.venues && typeof raw.venues === "object") {
    return { fetchedAt: raw.fetchedAt || null, venues: raw.venues };
  }
  return { fetchedAt: null, venues: {} };
}

function headers() {
  const h = { "Content-Type": "application/json", Accept: "application/json" };
  const k = payKey();
  if (k) h.Authorization = "Bearer " + k;
  return h;
}

function cleanStr(s, max) {
  const t = String(s || "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t || t.length < 3) return "";
  if (/lorem ipsum|example\.com|n\/a|not specified/i.test(t)) return "";
  return t.slice(0, max);
}

function cleanFacts(raw, source) {
  if (!raw || typeof raw !== "object") return null;
  const out = { source, engine: raw.engine || "firecrawl" };
  let n = 0;
  for (const k of KEYS) {
    const v = cleanStr(raw[k], k === "summary" || k === "vipHow" || k === "gettingThere" ? 400 : 160);
    if (v) { out[k] = v; n += 1; }
  }
  const highs = Array.isArray(raw.highlights) ? raw.highlights : [];
  out.highlights = highs.map((h) => cleanStr(h, 120)).filter(Boolean).slice(0, 8);
  if (out.highlights.length) n += 1;
  if (n < 1) return null;
  out.fetchedAt = new Date().toISOString();
  return out;
}

async function scrapeFacts(url) {
  const r = await fetch(FC_SCRAPE, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      url,
      formats: [{ type: "json", schema: SCHEMA, prompt: PROMPT }],
      onlyMainContent: true,
      waitFor: 2500,
      timeout: 25000,
    }),
    signal: AbortSignal.timeout(32000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("scrape " + r.status);
  const data = (j.data && j.data.json) || j.json || null;
  if (data) data.engine = "firecrawl-scrape";
  return data;
}

async function agentFacts(url) {
  const r = await fetch(FC_AGENT, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      prompt: PROMPT,
      urls: [url],
      schema: SCHEMA,
      maxCredits: 12,
      model: "spark-1-mini",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("agent " + r.status);
  const id = j.id || j.jobId || j.data?.id;
  if (j.data && (j.data.summary || j.data.address || j.data.hours)) {
    j.data.engine = "firecrawl-agent";
    return j.data;
  }
  if (!id) return j.data || j.json || null;
  const started = Date.now();
  while (Date.now() - started < 180000) {
    await new Promise((res) => setTimeout(res, 5000));
    const s = await fetch(FC_AGENT + "/" + encodeURIComponent(id), {
      headers: headers(),
      signal: AbortSignal.timeout(15000),
    });
    const st = await s.json().catch(() => ({}));
    const status = String(st.status || st.data?.status || "").toLowerCase();
    const data = st.data?.json || st.data || st.json || st.result;
    if (status === "completed" || status === "ready" || (data && (data.summary || data.address))) {
      if (data && typeof data === "object") data.engine = "firecrawl-agent";
      return data;
    }
    if (status === "failed" || status === "error" || status === "cancelled") throw new Error("agent " + status);
  }
  throw new Error("agent timeout");
}

function loadCatalog() {
  const venues = readJson(path.join(APP_DATA, "venues.json"), []);
  const extra = readJson(path.join(APP_DATA, "unlisted-venues.json"), []);
  const booking = readJson(path.join(APP_DATA, "booking-urls.json"), {});
  return {
    list: [...(Array.isArray(venues) ? venues : []), ...(Array.isArray(extra) ? extra : [])],
    booking,
  };
}

function pageUrl(v, booking) {
  const o = booking[v.venue_id];
  if (o && /^https?:\/\//i.test(o.url) && o.kind !== "social") return o.url;
  return v.website_url || v.source_url || "";
}

async function factsOne(v, booking, useAgent) {
  const url = pageUrl(v, booking);
  if (!/^https?:\/\//i.test(url) || /instagram|facebook|tiktok|snapchat/i.test(url)) {
    return { id: v.venue_id, rec: null, skip: true };
  }
  let raw = null;
  if (useAgent) {
    try { raw = await agentFacts(url); } catch { raw = null; }
  }
  if (!raw) {
    try { raw = await scrapeFacts(url); } catch (e) {
      return { id: v.venue_id, rec: null, error: String(e.message || e).slice(0, 120) };
    }
  }
  const rec = cleanFacts(raw, url);
  return { id: v.venue_id, rec };
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

export async function runFactsCrawl(opts = {}) {
  if (running) return running;
  const job = (async () => {
    const { list, booking } = loadCatalog();
    const prev = loadFactsFile().venues;
    const only = String(opts.venueId || "").trim();
    const targets = only ? list.filter((v) => v.venue_id === only) : list.filter((v) => v.listed !== false);
    const out = { ...prev };
    let filled = 0;
    const results = await mapPool(targets, only ? 1 : 3, async (v) => {
      const kind = (booking[v.venue_id] || {}).kind || "site";
      const useAgent = only || kind === "vip" || kind === "events";
      return factsOne(v, booking, useAgent);
    });
    for (const row of results) {
      if (!row || row.skip) continue;
      if (row.rec) {
        out[row.id] = row.rec;
        filled += 1;
      }
    }
    const payload = { fetchedAt: new Date().toISOString(), venues: out };
    writeJsonAtomic(FACTS_FILE, payload);
    console.log("velvet-facts", targets.length, "checked", filled, "filled");
    return { ok: true, checked: targets.length, filled, payload };
  })();
  running = job;
  try { return await job; }
  finally { running = null; }
}

const invoked = String(process.argv[1] || "").replace(/\\/g, "/");
if (invoked.endsWith("venue-facts.mjs")) {
  const i = process.argv.indexOf("--venue");
  const venueId = i >= 0 ? process.argv[i + 1] : "";
  runFactsCrawl({ venueId })
    .then((st) => { console.log(JSON.stringify({ ok: st.ok, checked: st.checked, filled: st.filled })); })
    .catch((e) => { console.error(e); process.exitCode = 1; });
}
