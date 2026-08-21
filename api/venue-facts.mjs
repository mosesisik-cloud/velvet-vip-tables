#!/usr/bin/env node
/**
 * Official venue facts: Firecrawl agent/scrape when available, HTML + JSON-LD fallback.
 * Saves after each venue. Never invents prices, hours, phones or dress codes.
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
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 VELVET/1.0";
const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: ["string", "null"], description: "Short official description of the venue from the site. Null if none. Do not invent." },
    address: { type: ["string", "null"], description: "Street address as printed. Null if not on the site." },
    area: { type: ["string", "null"], description: "Neighbourhood or area name if printed." },
    phone: { type: ["string", "null"], description: "Phone number exactly as printed. Null if missing." },
    email: { type: ["string", "null"], description: "Public email if printed. Null if missing." },
    hours: { type: ["string", "null"], description: "Opening hours or door times as printed. Null if missing. Do not invent." },
    season: { type: ["string", "null"], description: "Season or opening period if printed." },
    ageLimit: { type: ["string", "null"], description: "Minimum age if printed." },
    dressCode: { type: ["string", "null"], description: "Dress code if printed." },
    doorPolicy: { type: ["string", "null"], description: "Door, ID or guest-list policy if printed." },
    music: { type: ["string", "null"], description: "Music style or residencies if printed." },
    vipHow: { type: ["string", "null"], description: "How to request VIP/tables according to the official site. No invented prices." },
    gettingThere: { type: ["string", "null"], description: "How to get there if printed (taxi, bus, boat)." },
    highlights: { type: "array", description: "Short official facts from the page only.", items: { type: "string" } },
  },
};
const PROMPT = "Extract official visitor facts from this nightclub/venue website. Return only text printed on the site: short description, street address, neighbourhood, phone, public email, opening hours, season, age limit, dress code, door/ID policy, music, how to book VIP or tables (no invented prices), how to get there, and short highlights. Null if a field is not on the page. Never invent hours, phones, prices or policies.";
const KEYS = ["summary", "address", "area", "phone", "email", "hours", "season", "ageLimit", "dressCode", "doorPolicy", "music", "vipHow", "gettingThere"];

let running = null;
let firecrawlOk = true;
let agentAvailable = null;

function payKey() {
  if (process.env.FIRECRAWL_API_KEY) return String(process.env.FIRECRAWL_API_KEY).trim();
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
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

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

function validHttp(url) {
  const u = String(url || "").trim();
  if (!/^https?:\/\//i.test(u)) return "";
  if (/instagram\.com|facebook\.com|tiktok\.com|snapchat\.com/i.test(u)) return "";
  return u;
}

function richness(rec) {
  if (!rec || typeof rec !== "object") return 0;
  let n = KEYS.filter((k) => rec[k]).length;
  if (Array.isArray(rec.highlights) && rec.highlights.length) n += 1;
  return n;
}

function cleanStr(s, max) {
  const t = String(s || "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1 ($2)")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&#039;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, "...")
    .replace(/\s+/g, " ")
    .trim();
  if (!t || t.length < 3) return "";
  if (/lorem ipsum|example\.com|\bn\/a\b|not specified|null if missing/i.test(t)) return "";
  return t.slice(0, max);
}

function cleanFacts(raw, source) {
  if (!raw || typeof raw !== "object") return null;
  const out = { source, engine: raw.engine || "firecrawl" };
  let n = 0;
  for (const k of KEYS) {
    let v = cleanStr(raw[k], k === "summary" || k === "vipHow" || k === "gettingThere" ? 400 : 160);
    if (k === "email") {
      v = v.replace(/^mailto:/i, "").replace(/[?&]subject=.*$/i, "").replace(/subject=.*$/i, "").replace(/[.,;>]+$/, "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) v = "";
      if (/privacy|noreply|no-reply|data\.protection|gdpr|dpo@|legal@/i.test(v)) v = "";
    }
    if (k === "vipHow") {
      v = v.replace(/(https?:\/\/[^\s)]+)\?[^\s)]*(external_id|utm_|fbclid|gclid|mc_cid)[^\s)]*/gi, "$1");
    }
    if (k === "summary" && (v.length < 40 || /\[[A-Z0-9]{2,}\]/.test(v) || / is the world$/i.test(v) || /create an account or log in to instagram/i.test(v) || /academy for salon professionals/i.test(v) || /mahiki racing/i.test(v))) v = "";
    if (k === "season" && /select event|choose an? event|dropdown|with us!|in the St\b|^changes$|^en /i.test(v)) v = "";
    if (k === "dressCode" && /^(etiquette|dress code|code)$/i.test(v) || /^(to |at |reply to )/i.test(v)) v = "";
    if (k === "hours" && /bottom of page|primarily a private|cookie|javascript/i.test(v)) v = "";
    if (k === "address" && /tokyo, nevada/i.test(v)) v = "";
    if (k === "area" && /tokyo boulevard/i.test(v)) v = "";
    if (k === "phone") v = v.replace(/^\/+/, "").replace(/INFO&RESERVATIONS/i, "");
    if (v) { out[k] = v; n += 1; }
  }
  const highs = Array.isArray(raw.highlights) ? raw.highlights : [];
  out.highlights = [...new Set(highs.map((h) => cleanStr(h, 120)).filter(Boolean))].slice(0, 8);
  if (out.highlights.length) n += 1;
  if (n < 1) return null;
  out.fetchedAt = new Date().toISOString();
  return out;
}

function mergeFacts(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  const out = {
    ...a,
    engine: [a.engine, b.engine].filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join("+"),
  };
  for (const k of KEYS) {
    if (!out[k] && b[k]) out[k] = b[k];
    else if (k === "vipHow" && b[k] && (!out[k] || b[k].length > out[k].length)) out[k] = b[k];
  }
  out.highlights = [...new Set([...(a.highlights || []), ...(b.highlights || [])])].slice(0, 8);
  const pages = [...new Set([a.source, b.source, ...(a.pages || []), ...(b.pages || [])].filter(Boolean))];
  if (pages.length > 1) out.pages = pages;
  out.fetchedAt = new Date().toISOString();
  return out;
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
  return acc;
}

function formatAddress(addr) {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  if (typeof addr !== "object") return "";
  return [addr.streetAddress, addr.addressLocality, addr.postalCode, addr.addressRegion, addr.addressCountry]
    .flat()
    .filter(Boolean)
    .join(", ");
}

function formatHours(spec) {
  if (!spec) return "";
  if (typeof spec === "string") return spec;
  if (Array.isArray(spec) && spec.every((x) => typeof x === "string")) return spec.join("; ");
  const arr = Array.isArray(spec) ? spec : [spec];
  const parts = [];
  for (const s of arr) {
    if (!s || typeof s !== "object") continue;
    const days = [].concat(s.dayOfWeek || []).map((d) => String(d).replace(/^https?:\/\/schema\.org\//, "")).join(", ");
    const open = s.opens || "";
    const close = s.closes || "";
    if (days && open) parts.push(`${days} ${open}${close ? "–" + close : ""}`);
    else if (open) parts.push(`${open}${close ? "–" + close : ""}`);
  }
  return parts.join("; ");
}

function fromLd(obj) {
  const type = JSON.stringify(obj["@type"] || "").toLowerCase();
  if (type && !/localbusiness|nightclub|barorpub|entertainment|organization|place|restaurant|foodestablishment|musicvenue|tourist/i.test(type)) {
    return null;
  }
  const raw = {
    engine: "html-jsonld",
    summary: obj.description || obj.slogan || "",
    address: formatAddress(obj.address),
    area: obj.address?.addressLocality || obj.areaServed || "",
    phone: obj.telephone || "",
    email: obj.email || "",
    hours: formatHours(obj.openingHoursSpecification || obj.openingHours),
    music: obj.genre || "",
  };
  return raw;
}

function labeled(html, re) {
  const m = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").match(re);
  return m ? m[1] : "";
}

function htmlFacts(html, url) {
  const raw = { engine: "html", source: url };
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1].replace(/<!--[\s\S]*?-->/g, "").trim());
      for (const item of flattenLd(data)) {
        const piece = fromLd(item);
        if (piece) Object.assign(raw, Object.fromEntries(Object.entries(piece).filter(([, v]) => v)));
      }
    } catch { /* bad ld */ }
  }
  if (!raw.phone) {
    const tel = html.match(/href=["']tel:([^"']+)/i);
    if (tel) raw.phone = decodeURIComponent(tel[1]).replace(/\s+/g, " ");
  }
  if (!raw.email) {
    const em = html.match(/href=["']mailto:([^"'?]+)/i);
    if (em && !/privacy|noreply|no-reply|data\.protection|gdpr|dpo@|legal@/i.test(em[1])) raw.email = decodeURIComponent(em[1]);
  }
  if (!raw.summary) {
    const md = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (md) raw.summary = md[1];
  }
  if (!raw.address) {
    const item = html.match(/itemprop=["']streetAddress["'][^>]*>([^<]+)/i)
      || html.match(/<address[^>]*>([\s\S]{8,180})<\/address>/i);
    if (item) raw.address = item[1];
  }
  if (!raw.hours) raw.hours = labeled(html, /(?:opening hours|open(?:ing)? times|horario|öppettider|door(?:s)? open)[:\s]+(.{6,80}?)(?:\.|$)/i);
  if (!raw.ageLimit) raw.ageLimit = labeled(html, /(?:age\s*(?:limit|restriction)?|mínimo de edad|åldersgräns)[:\s]+(\+?\d{2}\+?|\d{2}\s*\+|18\+|21\+)/i);
  if (!raw.dressCode) raw.dressCode = labeled(html, /(?:dress code|código de vestimenta|klädsel)[:\s]+(.{4,80}?)(?:\.|$)/i);
  if (!raw.season) raw.season = labeled(html, /(?:season|temporada|säsong)[:\s]+(.{4,60}?)(?:\.|$)/i);
  const vip = html.match(/href=["'](https?:\/\/[^"']*vip[^"']*)["']/i);
  if (vip && !raw.vipHow) raw.vipHow = "VIP / tables: " + vip[1];
  return cleanFacts(raw, url);
}

function contactLink(html, base) {
  const re = /href=["']([^"']*contact[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const u = new URL(m[1], base);
      if (u.origin === new URL(base).origin && /contact/i.test(u.pathname)) return u.href;
    } catch { /* ignore */ }
  }
  return "";
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error("http " + r.status);
  const ctype = r.headers.get("content-type") || "";
  if (ctype && !/html|xml|text|json/i.test(ctype)) throw new Error("not html");
  return await r.text();
}

async function scrapeFacts(url) {
  let last = null;
  for (let i = 0; i < 3; i++) {
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
    if (r.status === 429 || r.status === 502 || r.status === 503) {
      last = new Error("scrape " + r.status);
      await sleep(12000 * (i + 1));
      continue;
    }
    if (!r.ok) throw new Error("scrape " + r.status);
    const data = (j.data && j.data.json) || j.json || null;
    if (data) data.engine = "firecrawl-scrape";
    return data;
  }
  throw last || new Error("scrape failed");
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
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("agent " + r.status);
  const id = j.id || j.jobId || j.data?.id;
  if (j.data && (j.data.summary || j.data.address || j.data.hours || j.data.vipHow)) {
    j.data.engine = "firecrawl-agent";
    return j.data;
  }
  if (!id) return j.data || j.json || null;
  const started = Date.now();
  while (Date.now() - started < 120000) {
    await sleep(4000);
    const s = await fetch(FC_AGENT + "/" + encodeURIComponent(id), {
      headers: headers(),
      signal: AbortSignal.timeout(15000),
    });
    const st = await s.json().catch(() => ({}));
    const status = String(st.status || st.data?.status || "").toLowerCase();
    const data = st.data?.json || st.data || st.json || st.result;
    if (status === "completed" || status === "ready" || (data && (data.summary || data.address || data.vipHow))) {
      if (data && typeof data === "object") data.engine = "firecrawl-agent";
      return data;
    }
    if (status === "failed" || status === "error" || status === "cancelled") throw new Error("agent " + status);
  }
  throw new Error("agent timeout");
}

async function htmlPull(url) {
  const html = await fetchHtml(url);
  let rec = htmlFacts(html, url);
  if (richness(rec) < 3) {
    const extra = contactLink(html, url);
    if (extra && extra !== url) {
      try {
        const more = htmlFacts(await fetchHtml(extra), extra);
        rec = mergeFacts(rec, more);
      } catch { /* contact optional */ }
    }
  }
  return rec;
}

async function firecrawlPull(url, useAgent) {
  if (!firecrawlOk) return null;
  let raw = null;
  if (useAgent && agentAvailable !== false) {
    try {
      raw = await agentFacts(url);
      if (raw) agentAvailable = true;
    } catch (e) {
      const msg = String(e.message || e);
      if (/agent 401|agent 403|agent 402|agent 429/i.test(msg)) {
        agentAvailable = false;
        if (/429/.test(msg)) firecrawlOk = false;
      }
      raw = null;
    }
  }
  if (!raw) {
    try {
      raw = await scrapeFacts(url);
    } catch (e) {
      const msg = String(e.message || e);
      if (/scrape 429|scrape 401|scrape 402|scrape 403/i.test(msg)) firecrawlOk = false;
      throw e;
    }
  }
  return cleanFacts(raw, url);
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

function pageUrls(v, booking) {
  const home = validHttp(v.website_url) || validHttp(v.source_url);
  const o = booking[v.venue_id] || {};
  const book = o.kind === "social" ? "" : validHttp(o.url);
  const urls = [];
  if (home) urls.push({ url: home, role: "home", agent: false });
  if (book && book !== home) {
    const vip = o.kind === "vip" || o.kind === "events";
    urls.push({ url: book, role: vip ? "vip" : "book", agent: vip });
  } else if (!home && book) {
    urls.push({ url: book, role: "book", agent: o.kind === "vip" || o.kind === "events" });
  }
  return urls;
}

async function factsOne(v, booking, forceAgent) {
  const pages = pageUrls(v, booking);
  if (!pages.length) return { id: v.venue_id, rec: null, skip: true };
  let rec = null;
  let error = "";
  for (const p of pages) {
    try {
      rec = mergeFacts(rec, await htmlPull(p.url));
    } catch (e) {
      error = String(e.message || e).slice(0, 120);
    }
  }
  if (firecrawlOk) {
    const fcPages = pages.filter((p) => p.agent || forceAgent).slice(0, 2);
    for (const p of fcPages) {
      try {
        rec = mergeFacts(rec, await firecrawlPull(p.url, forceAgent || p.agent));
      } catch (e) {
        error = String(e.message || e).slice(0, 120);
      }
    }
  }
  if (!rec) return { id: v.venue_id, rec: null, error: error || "empty" };
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

function persist(venues) {
  for (const id of Object.keys(venues)) {
    const rec = venues[id];
    if (!rec) { delete venues[id]; continue; }
    const src = String(rec.source || "");
    if (/academyla\.com|mahiki\.com\/?$/i.test(src) && /salon professionals|mahiki racing/i.test(JSON.stringify(rec))) {
      delete venues[id];
      continue;
    }
    const cleaned = cleanFacts(rec, src);
    if (cleaned) venues[id] = cleaned;
    else delete venues[id];
  }
  const payload = { fetchedAt: new Date().toISOString(), venues };
  writeJsonAtomic(FACTS_FILE, payload);
  return payload;
}

export async function runFactsCrawl(opts = {}) {
  if (running) return running;
  const job = (async () => {
    firecrawlOk = true;
    const { list, booking } = loadCatalog();
    const prev = loadFactsFile().venues;
    const only = String(opts.venueId || "").trim();
    const force = !!opts.force;
    const listedOnly = !!opts.listedOnly;
    let targets = only ? list.filter((v) => v.venue_id === only) : list.slice();
    if (listedOnly && !only) targets = targets.filter((v) => v.listed !== false);
    if (!force && !only) targets = targets.filter((v) => richness(prev[v.venue_id]) < 2);
    const out = { ...prev };
    let filled = 0;
    const skipped = list.length - targets.length;
    const conc = only ? 1 : 3;
    await mapPool(targets, conc, async (v, idx) => {
      const row = await factsOne(v, booking, only || !!opts.agent);
      if (row.skip) {
        console.log("velvet-facts skip", v.venue_id);
        return row;
      }
      if (row.rec && richness(row.rec) >= richness(out[row.id])) {
        out[row.id] = row.rec;
        filled += 1;
        persist(out);
        console.log("velvet-facts", idx + 1 + "/" + targets.length, v.venue_id, richness(row.rec), row.rec.engine);
      } else {
        console.log("velvet-facts empty", v.venue_id, row.error || "");
      }
      return row;
    });
    const payload = persist(out);
    console.log("velvet-facts done", "checked", targets.length, "filled", filled, "cached", Object.keys(out).length, "skipped", skipped);
    return { ok: true, checked: targets.length, filled, cached: Object.keys(out).length, payload };
  })();
  running = job;
  try { return await job; }
  finally { running = null; }
}

const invoked = String(process.argv[1] || "").replace(/\\/g, "/");
if (invoked.endsWith("venue-facts.mjs")) {
  if (process.argv.includes("--sanitize-only")) {
    const prev = loadFactsFile();
    const payload = persist(prev.venues);
    console.log(JSON.stringify({ ok: true, sanitized: Object.keys(payload.venues).length }));
  } else {
    const i = process.argv.indexOf("--venue");
    const venueId = i >= 0 ? process.argv[i + 1] : "";
    const force = process.argv.includes("--force");
    const listedOnly = process.argv.includes("--listed-only");
    const agent = process.argv.includes("--agent");
    runFactsCrawl({ venueId, force, listedOnly, agent })
      .then((st) => { console.log(JSON.stringify({ ok: st.ok, checked: st.checked, filled: st.filled, cached: st.cached })); })
      .catch((e) => { console.error(e); process.exitCode = 1; });
  }
}
