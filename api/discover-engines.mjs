#!/usr/bin/env node
/**
 * Scan each venue site for the booking engine they actually run
 * (SevenRooms, Resy, Tock, OpenTable, …) and store it on booking-urls.json.
 * VELVET stays the guest-facing layer; we do not write into their PMS here.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { engineOf, engineFromBlob } from "./book-bridge.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const APP_DATA = process.env.VELVET_APP_DATA || path.join(ROOT, "data");
const BOOKING_FILE = path.join(APP_DATA, "booking-urls.json");
const UA = "Mozilla/5.0 (compatible; VELVET/1.0; +https://b2b.bakemyday.se/velvet/)";
const CONCUR = Number(process.env.VELVET_ENGINE_CONCUR || 5);
const listedOnly = process.env.VELVET_ENGINE_ALL !== "1";

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
function writeJson(p, obj) {
  const tmp = p + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n");
  fs.renameSync(tmp, p);
}

async function fetchText(url, ms = 14000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    const ct = String(r.headers.get("content-type") || "");
    if (!r.ok) return { ok: false, url: r.url, text: "" };
    if (ct && !/html|xml|javascript|json|text/i.test(ct)) return { ok: true, url: r.url, text: "" };
    const text = await r.text();
    return { ok: true, url: r.url, text: text.slice(0, 450000) };
  } catch {
    return { ok: false, url, text: "" };
  } finally {
    clearTimeout(t);
  }
}

function loadVenues() {
  const listed = readJson(path.join(APP_DATA, "venues.json"), []);
  const extra = listedOnly ? [] : readJson(path.join(APP_DATA, "unlisted-venues.json"), []);
  return [...(Array.isArray(listed) ? listed : []), ...(Array.isArray(extra) ? extra : [])];
}

async function scanVenue(v, booking) {
  const row = booking[v.venue_id] || {};
  const start = row.url || v.website_url || v.source_url || "";
  if (!/^https:\/\//i.test(start)) return { id: v.venue_id, ok: false, reason: "no-url" };
  const page = await fetchText(start);
  let blob = page.text || "";
  let found = engineFromBlob(blob, page.url || start);
  if (found.engine === "official-site") {
    const fromKnown = engineOf(start);
    if (fromKnown !== "official-site") found = { engine: fromKnown, widgetUrl: start };
  }
  if (found.engine === "official-site" && blob) {
    const hrefs = [...blob.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]).slice(0, 40);
    const bookish = hrefs.find((h) => /reserv|book|vip|table|widget/i.test(h));
    if (bookish) {
      try {
        const abs = new URL(bookish, page.url || start).href;
        if (/^https:\/\//i.test(abs) && abs !== start) {
          const second = await fetchText(abs);
          const inner = engineFromBlob(second.text || "", second.url || abs);
          if (inner.engine !== "official-site") found = inner;
        }
      } catch { /* ignore */ }
    }
  }
  const engine = found.engine === "reseller" ? "official-site" : found.engine;
  const widgetUrl = found.widgetUrl && engineOf(found.widgetUrl) === engine ? found.widgetUrl : "";
  const next = {
    ...row,
    url: row.url || start,
    kind: row.kind || "site",
    label: row.label || "",
    name: row.name || v.name,
    engine,
  };
  if (widgetUrl) next.widgetUrl = widgetUrl;
  else if (!row.widgetUrl) delete next.widgetUrl;
  const changed = JSON.stringify({ e: row.engine || "", w: row.widgetUrl || "" }) !== JSON.stringify({ e: engine, w: next.widgetUrl || "" });
  booking[v.venue_id] = next;
  return { id: v.venue_id, ok: true, engine, widgetUrl: next.widgetUrl || "", changed };
}

async function main() {
  const venues = loadVenues().filter((v) => v && v.venue_id);
  const booking = readJson(BOOKING_FILE, {}) || {};
  const out = [];
  let i = 0;
  async function worker() {
    while (i < venues.length) {
      const v = venues[i++];
      const rec = await scanVenue(v, booking);
      out.push(rec);
      if (out.length % 15 === 0) {
        writeJson(BOOKING_FILE, booking);
        console.log("velvet-engines", out.length + "/" + venues.length);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCUR }, () => worker()));
  writeJson(BOOKING_FILE, booking);
  const hits = out.filter((x) => x.engine && x.engine !== "official-site");
  const counts = {};
  for (const h of hits) counts[h.engine] = (counts[h.engine] || 0) + 1;
  console.log(JSON.stringify({ scanned: out.length, withEngine: hits.length, counts, sample: hits.slice(0, 12) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
