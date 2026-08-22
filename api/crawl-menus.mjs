#!/usr/bin/env node
/**
 * Official printed menus only. Never invents prices.
 * JSON-LD MenuItem first, Firecrawl extract if a key exists, HTML fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const APP_DATA = process.env.VELVET_APP_DATA || path.join(ROOT, "data");
const OUT = process.env.VELVET_MENUS || path.join(APP_DATA, "venue-menus.json");
const PAY_FILE = process.env.VELVET_PAY || path.join(__dir, "pay.json");
const UA = "VELVET-menus/1.0 (+https://b2b.bakemyday.se/velvet/)";
const FC_URL = "https://api.firecrawl.dev/v2/scrape";
const SKIP = /^(home|menu|meny|book now|contact|privacy|cookies?|follow us|vip tables?)$/i;
const MENU_SCHEMA = {
  type: "object",
  properties: {
    currency: { type: ["string", "null"] },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: ["string", "null"], description: "Price exactly as printed. Null if none." },
              },
              required: ["name"],
            },
          },
        },
      },
    },
  },
};

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function firecrawlKey() {
  if (process.env.FIRECRAWL_API_KEY) return String(process.env.FIRECRAWL_API_KEY).trim();
  try { return String(JSON.parse(fs.readFileSync(PAY_FILE, "utf8")).firecrawlKey || "").trim(); }
  catch { return ""; }
}
function writeJsonAtomic(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  try { fs.renameSync(tmp, file); }
  catch { fs.copyFileSync(tmp, file); try { fs.unlinkSync(tmp); } catch {} }
}

function foldName(s) {
  return String(s || "").replace(/\s+/g, " ").replace(/<[^>]+>/g, "").trim().slice(0, 80);
}
function parseAmount(raw) {
  const t = String(raw || "").replace(/\u00a0/g, " ");
  const m = t.match(/(?:EUR|USD|GBP|AED|€|\$|£)\s*([\d]{1,6}(?:[.,]\d{2})?)|([\d]{1,6}(?:[.,]\d{2})?)\s*(?:EUR|USD|GBP|AED|€)/i);
  if (!m) return null;
  const n = parseFloat((m[1] || m[2]).replace(",", "."));
  return Number.isFinite(n) && n >= 1 && n <= 200000 ? n : null;
}
function currencyOf(raw, page) {
  const t = `${raw || ""} ${page || ""}`;
  if (/€|EUR/i.test(t)) return "EUR";
  if (/£|GBP/i.test(t)) return "GBP";
  if (/AED|د\.إ/i.test(t)) return "AED";
  if (/\$|USD/i.test(t)) return "USD";
  return "";
}
function cleanItem(name, price) {
  const n = foldName(name);
  if (n.length < 3 || SKIP.test(n) || /lorem|cookie|javascript/i.test(n)) return null;
  const priceText = foldName(price).slice(0, 40);
  const amount = parseAmount(priceText);
  if (priceText && !amount && !/request|on request|poa|market|mp\b/i.test(priceText)) {
    if (!/\d/.test(priceText)) return { name: n, priceText: "", amount: null };
  }
  return { name: n, priceText: amount || /request|poa|market/i.test(priceText) ? priceText : (amount ? priceText : ""), amount };
}

function walkLd(node, acc = []) {
  if (!node || typeof node !== "object") return acc;
  const types = [].concat(node["@type"] || []).map((x) => String(x).toLowerCase());
  if (types.includes("menuitem") && node.name) acc.push(node);
  const offers = node.offers;
  if (types.includes("product") && node.name && offers) acc.push(node);
  for (const v of Object.values(node)) {
    if (Array.isArray(v)) v.forEach((x) => walkLd(x, acc));
    else if (v && typeof v === "object") walkLd(v, acc);
  }
  return acc;
}
function fromJsonLd(html) {
  const blocks = [...String(html).matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const items = [];
  for (const b of blocks) {
    try {
      const json = JSON.parse(b[1].replace(/[\u0000-\u0008]/g, ""));
      for (const node of walkLd(json)) {
        const price = node.offers?.price || node.offers?.lowPrice || node.offers?.[0]?.price || "";
        const cur = node.offers?.priceCurrency || "";
        const it = cleanItem(node.name, price ? `${price} ${cur}` : "");
        if (it) items.push(it);
      }
    } catch { /* skip */ }
  }
  return items;
}

function fromHtmlLines(html) {
  const text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n");
  const items = [];
  const re = /^(.{3,70}?)\s+((?:EUR|USD|GBP|AED|€|\$|£)\s?[\d.,]{1,8}|\d{1,5}(?:[.,]\d{2})?\s?(?:EUR|USD|GBP|AED|€))$/i;
  for (const line of text.split("\n")) {
    const s = line.replace(/\s+/g, " ").trim();
    const m = s.match(re);
    if (!m) continue;
    const it = cleanItem(m[1].replace(/[·•\-–]+$/g, "").trim(), m[2]);
    if (it && it.amount) items.push(it);
  }
  return items.slice(0, 40);
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error("http " + r.status);
  return await r.text();
}

async function scrapeFirecrawl(url) {
  const key = firecrawlKey();
  if (!key) return null;
  const r = await fetch(FC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      url,
      formats: [{ type: "json", schema: MENU_SCHEMA, prompt: "Extract the printed food, drink or VIP menu. Price exactly as printed. Do not invent prices or items." }],
      onlyMainContent: true,
      waitFor: 2000,
      timeout: 20000,
    }),
    signal: AbortSignal.timeout(26000),
  });
  if (!r.ok) return null;
  const j = await r.json();
  const data = j.data?.json || j.data || j.json || {};
  const items = [];
  for (const sec of data.sections || []) {
    for (const it of sec.items || []) {
      const row = cleanItem(it.name, it.price);
      if (row) items.push({ ...row, section: foldName(sec.name) });
    }
  }
  return { items, currency: data.currency || "" };
}

function menuUrls(venue, booking) {
  const base = String(booking?.url || venue.website_url || venue.source_url || "").replace(/^http:\/\//i, "https://");
  const site = String(venue.website_url || venue.source_url || "").replace(/^http:\/\//i, "https://");
  const out = [];
  const add = (u) => {
    if (!/^https:\/\//i.test(u)) return;
    if (/instagram|facebook|tiktok|discotech|clubbookers/i.test(u)) return;
    const n = u.replace(/\/+$/, "");
    if (!out.includes(n)) out.push(n);
  };
  add(base);
  add(site);
  try {
    const origin = new URL(site || base).origin;
    for (const p of ["/menu", "/menus", "/food-menu", "/vip", "/vip-tables", "/packages"]) add(origin + p);
  } catch { /* skip */ }
  return out.slice(0, 4);
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = it.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out.slice(0, 60);
}

let menusRunning = null;

export function loadMenusFile() {
  const raw = readJson(OUT, null);
  if (raw && raw.venues && typeof raw.venues === "object") return raw;
  return { fetchedAt: null, venues: {} };
}

async function crawlMenuOne(venue, booking) {
  const urls = menuUrls(venue, booking[venue.venue_id]);
  let items = [];
  let source = "";
  let currency = "";
  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const ld = fromJsonLd(html);
      const lines = fromHtmlLines(html);
      const got = [...ld, ...lines];
      if (got.length > items.length) {
        items = got;
        source = url;
        currency = currencyOf(got.map((x) => x.priceText).join(" "), html);
      }
    } catch { /* next */ }
    if (items.filter((x) => x.amount).length >= 6) break;
  }
  if (items.filter((x) => x.amount).length < 3 && urls[0]) {
    try {
      const fc = await scrapeFirecrawl(urls[0]);
      if (fc && fc.items.length > items.length) {
        items = fc.items;
        source = urls[0];
        currency = fc.currency || currencyOf(fc.items.map((x) => x.priceText).join(" "));
      }
    } catch { /* keep html */ }
  }
  items = dedupe(items).filter((x) => x.amount || /request|poa|market/i.test(x.priceText));
  if (!items.length) return { id: venue.venue_id, ok: false, items: [] };
  return {
    id: venue.venue_id,
    ok: true,
    source,
    currency: currency || "",
    items: items.map(({ name, priceText, amount, section }) => ({
      name,
      price: priceText || "",
      amount: amount || null,
      section: section || "",
    })),
  };
}

export async function runMenusCrawl(opts = {}) {
  if (menusRunning) return menusRunning;
  const job = (async () => {
    const listed = readJson(path.join(APP_DATA, "venues.json"), []);
    const extra = readJson(path.join(APP_DATA, "unlisted-venues.json"), []);
    const booking = readJson(path.join(APP_DATA, "booking-urls.json"), {});
    const prev = loadMenusFile();
    const only = String(opts.venueId || "").trim();
    let venues = [...(Array.isArray(listed) ? listed : [])];
    if (!opts.listedOnly) venues = venues.concat(Array.isArray(extra) ? extra : []);
    if (only) venues = venues.filter((v) => v.venue_id === only);
    venues.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    if (!only && Number(opts.limit) > 0) {
      venues = venues.filter((v) => !prev.venues?.[v.venue_id] || opts.force).slice(0, Number(opts.limit));
    }
    const out = { fetchedAt: new Date().toISOString(), venues: { ...(prev.venues || {}) } };
    let ok = 0;
    for (const venue of venues) {
      const rec = await crawlMenuOne(venue, booking);
      if (rec.ok && rec.items.length) {
        out.venues[rec.id] = { source: rec.source, currency: rec.currency, items: rec.items };
        ok += 1;
        console.log("velvet-menus", rec.id, rec.items.length, rec.source);
        writeJsonAtomic(OUT, { ...out, count: Object.keys(out.venues).length });
      } else {
        console.log("velvet-menus none", venue.venue_id);
      }
    }
    out.count = Object.keys(out.venues).length;
    writeJsonAtomic(OUT, out);
    return { ok: true, updated: ok, count: out.count, payload: out };
  })();
  menusRunning = job;
  try {
    return await job;
  } finally {
    menusRunning = null;
  }
}

const invoked = String(process.argv[1] || "").replace(/\\/g, "/");
if (invoked.endsWith("crawl-menus.mjs") || invoked.endsWith("crawl-menus.js")) {
  const i = process.argv.indexOf("--venue");
  const venueId = i >= 0 ? process.argv[i + 1] : "";
  runMenusCrawl({ venueId, reason: "cli" })
    .then((st) => {
      console.log("wrote", OUT, st.updated, "with printed prices");
      process.exitCode = st.ok ? 0 : 1;
    })
    .catch((e) => { console.error(e); process.exit(1); });
}
