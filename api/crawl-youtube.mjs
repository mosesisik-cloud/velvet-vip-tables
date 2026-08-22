// Hitta ställets mest visade officiella YouTube-klipp.
// Ingen påhittad film: saknas tydlig träff → stället behåller Instagram/foto.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "venue-youtube.json");
const STOP = new Set("the a an at of and club beach nightclub dayclub restaurant hotel bar cafe café village project official nightlife group open air hyperclub tavern".split(" "));

function fold(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function tokens(s) {
  return fold(s).split(/\s+/).filter((w) => w && w.length > 1 && !STOP.has(w));
}
function text(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (x.simpleText) return x.simpleText;
  if (Array.isArray(x.runs)) return x.runs.map((r) => r.text).join("");
  return "";
}
function parseViews(v) {
  const raw = text(v.viewCountText) || text(v.shortViewCountText);
  const m = raw.replace(/,/g, "").match(/([\d.]+)\s*([kmb])?/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  const u = (m[2] || "").toLowerCase();
  if (u === "k") n *= 1e3;
  if (u === "m") n *= 1e6;
  if (u === "b") n *= 1e9;
  return Math.round(n);
}
function parseLen(s) {
  const p = String(s || "").split(":").map(Number);
  if (p.some((x) => !Number.isFinite(x))) return 0;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0] || 0;
}
function walkVideos(node, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (node.videoRenderer?.videoId) acc.push(node.videoRenderer);
  for (const v of Object.values(node)) {
    if (Array.isArray(v)) v.forEach((x) => walkVideos(x, acc));
    else if (v && typeof v === "object") walkVideos(v, acc);
  }
  return acc;
}

async function search(query) {
  const body = {
    context: { client: { clientName: "WEB", clientVersion: "2.20240821.00.00", hl: "en", gl: "US" } },
    query,
  };
  const r = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VELVET/1.0",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("yt " + r.status);
  const j = await r.json();
  return walkVideos(j).map((v) => ({
    id: v.videoId,
    title: text(v.title),
    channel: text(v.ownerText) || text(v.longBylineText),
    views: parseViews(v),
    seconds: parseLen(text(v.lengthText)),
  }));
}

function score(v, venue) {
  const title = fold(v.title);
  const channel = fold(v.channel);
  const nameTok = tokens(venue.name);
  const destTok = tokens(venue.destination).filter((w) => w.length >= 4);
  const hay = `${title} ${channel}`;
  if (/top \d|best clubs|compilation|reacts to|vs\b|tier list/.test(title)) return 0;
  let s = 0;
  let nameHits = 0;
  for (const t of nameTok) {
    if (title.includes(t) || channel.includes(t)) { s += 3; nameHits += 1; }
  }
  if (!nameHits) return 0;
  for (const t of destTok) {
    if (hay.includes(t)) s += 2;
  }
  if (nameTok.every((t) => channel.includes(t))) s += 5;
  if (/aftermovie|official|inside|walkthrough|opening|closing/.test(title)) s += 2;
  if (v.seconds && (v.seconds < 20 || v.seconds > 20 * 60)) s -= 2;
  const shortName = nameTok.every((t) => t.length <= 3) || nameTok.length <= 1;
  if (shortName && destTok.length && !destTok.some((t) => hay.includes(t))) return 0;
  if (v.views < 200) s -= 1;
  return s;
}

function pick(hits, venue) {
  const ranked = hits
    .filter((h) => /^[A-Za-z0-9_-]{11}$/.test(h.id))
    .map((h) => ({ ...h, score: score(h, venue) }))
    .filter((h) => h.score >= 6)
    .sort((a, b) => b.score - a.score || b.views - a.views);
  return ranked[0] || null;
}

async function run() {
  const venues = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "venues.json"), "utf8"));
  const out = {};
  let ok = 0;
  for (const venue of venues) {
    const q1 = `${venue.name} ${venue.destination} official aftermovie`;
    const q2 = `${venue.name} ${venue.destination} official`;
    let hits = [];
    try { hits = hits.concat(await search(q1)); } catch (e) { console.warn("skip", venue.venue_id, e.message); }
    await new Promise((r) => setTimeout(r, 250));
    try { hits = hits.concat(await search(q2)); } catch { /* keep */ }
    const seen = new Set();
    hits = hits.filter((h) => (seen.has(h.id) ? false : (seen.add(h.id), true)));
    const best = pick(hits, venue);
    if (best) {
      out[venue.venue_id] = {
        id: best.id,
        title: best.title.slice(0, 140),
        channel: best.channel.slice(0, 80),
        views: best.views,
        url: `https://www.youtube.com/watch?v=${best.id}`,
      };
      ok += 1;
      console.log("OK", venue.venue_id, best.views, best.channel, "—", best.title.slice(0, 70));
    } else {
      console.log("NO", venue.venue_id, venue.name);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  const payload = { fetchedAt: new Date().toISOString(), count: ok, venues: out };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 1) + "\n");
  console.log("wrote", OUT, ok, "/", venues.length);
}

run().catch((e) => { console.error(e); process.exit(1); });
