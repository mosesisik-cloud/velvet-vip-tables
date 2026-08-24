#!/usr/bin/env node
/**
 * Static SEO pages Google can crawl (hash routes are invisible).
 * Real catalog only — no invented prices, phones or stars.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const DATA = path.join(ROOT, "data");
const OUT = path.join(ROOT, "d");
const BASE = "https://b2b.bakemyday.se/velvet";

function readJson(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")); }
  catch { return fallback; }
}
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}
function slug(s) {
  const t = String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return t || "x";
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function schemaType(cat) {
  const c = String(cat || "").toLowerCase();
  if (/night|club|disco|hyper/.test(c)) return "NightClub";
  if (/restau|dining|kitchen/.test(c)) return "Restaurant";
  if (/bar|rooftop/.test(c)) return "BarOrPub";
  return "EntertainmentBusiness";
}

const destinations = [
  ...readJson("destinations.json", []),
  ...readJson("extra-destinations.json", []),
].filter((d) => d && d.code && d.listed !== false);
const venues = readJson("venues.json", []).filter((v) => v && v.listed !== false && v.venue_id);
const facts = readJson("venue-facts.json", { venues: {} }).venues || {};
const events = readJson("venue-events.json", { venues: {} }).venues || {};
const booking = readJson("booking-urls.json", {});
const places = readJson("google-places.json", { venues: {} }).venues || {};
const rankings = readJson("club-rankings.json", {});
const rankById = {};
for (const c of rankings.clubs || []) {
  if (c && c.venue_id) {
    const prev = rankById[c.venue_id] || [];
    prev.push(c);
    rankById[c.venue_id] = prev;
  }
}

const destByCode = Object.fromEntries(destinations.map((d) => [d.code, d]));
const destSlug = {};
const usedDest = new Set();
for (const d of destinations) {
  let s = slug(d.name);
  if (usedDest.has(s)) s += "-" + slug(d.code);
  usedDest.add(s);
  destSlug[d.code] = s;
}
const venueSlug = {};
const usedVenue = new Set();
for (const v of venues) {
  const ds = destSlug[v.destination_code] || slug(v.destination);
  let s = slug(v.name);
  const key = ds + "/" + s;
  if (usedVenue.has(key)) s += "-" + slug(v.venue_id);
  usedVenue.add(ds + "/" + s);
  venueSlug[v.venue_id] = s;
}

function destUrl(d) { return `${BASE}/d/${destSlug[d.code]}/`; }
function venueUrl(v) {
  const ds = destSlug[v.destination_code] || slug(v.destination);
  return `${BASE}/d/${ds}/${venueSlug[v.venue_id]}/`;
}
function appVenue(v) { return `${BASE}/#/venue/${encodeURIComponent(v.venue_id)}`; }
function appBook(v) { return `${BASE}/#/book-site/${encodeURIComponent(v.venue_id)}`; }
function appDest(d) { return `${BASE}/#/destination/${encodeURIComponent(d.code)}`; }

const CSS = `
:root { --bg:#0b0b0f; --card:#14141c; --text:#f4eee4; --dim:rgba(244,238,228,.72); --gold:#c9a227; --line:rgba(244,238,228,.12); }
*{box-sizing:border-box} html,body{margin:0;background:var(--bg);color:var(--text);font-family:Georgia,"Times New Roman",serif}
a{color:var(--gold)} .wrap{max-width:760px;margin:0 auto;padding:28px 20px 64px}
.brand{letter-spacing:.28em;font-size:12px;font-weight:700;text-decoration:none;color:var(--text)}
.brand span{color:var(--gold)} nav{display:flex;gap:14px;flex-wrap:wrap;margin:18px 0 28px;font-family:system-ui,sans-serif;font-size:13px}
h1{font-size:clamp(28px,5vw,42px);font-weight:500;line-height:1.15;margin:0 0 12px}
.sub{color:var(--dim);line-height:1.55;font-family:system-ui,sans-serif;font-size:16px}
.kicker{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin:10px 0}
.card a{text-decoration:none} .card h2{font-size:20px;margin:0 0 6px;font-weight:500}
.meta{font-family:system-ui,sans-serif;font-size:13px;color:var(--dim)}
.btn{display:inline-block;margin-top:16px;background:var(--gold);color:#0b0b0f;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700;padding:12px 18px;border-radius:999px}
.note{font-family:system-ui,sans-serif;font-size:13px;color:var(--dim);margin-top:28px}
ul{padding-left:1.1em} li{margin:6px 0}
`;

function layout({ title, description, canonical, jsonLd, body, extraHead = "" }) {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:locale" content="sv_SE">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${BASE}/icons/icon-512.png">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${BASE}/icons/icon-192.png">
${extraHead}
${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <a class="brand" href="${BASE}/">VELVET<span>.</span></a>
  ${body}
  <p class="note">VELVET tar förfrågan mot klubben. Ingen reservation förrän de bekräftar. Inga påhittade priser.</p>
</div>
</body>
</html>
`;
}

function venuePage(v, d) {
  const f = facts[v.venue_id] || {};
  const g = places[v.venue_id];
  const evs = (events[v.venue_id]?.events || []).filter((e) => e && e.title && (!e.date || e.date >= todayISO())).slice(0, 8);
  const ranks = rankById[v.venue_id] || [];
  const book = booking[v.venue_id] || {};
  const engine = book.engine && book.engine !== "official-site" ? book.engine : "";
  const summary = f.summary || v.notes || `${v.name} är ett ${String(v.category || "ställe").toLowerCase()} i ${v.destination}. VELVET tar förfrågan mot klubben.`;
  const title = `${v.name} i ${v.destination} — VIP-bord via VELVET`;
  const description = `${summary}`.slice(0, 158);
  const canonical = venueUrl(v);
  const sameAs = [v.website_url, v.instagram_url].filter((u) => /^https:\/\//i.test(u || ""));
  const ld = {
    "@context": "https://schema.org",
    "@type": schemaType(v.category),
    name: v.name,
    description: summary,
    url: canonical,
    address: f.address ? { "@type": "PostalAddress", streetAddress: f.address } : undefined,
    telephone: f.phone || undefined,
    email: f.email || book.email || undefined,
    sameAs,
    containedInPlace: d ? { "@type": "Place", name: d.name } : undefined,
  };
  if (g && g.matched && Number(g.rating) > 0 && Number(g.reviewCount) > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(g.rating),
      reviewCount: String(g.reviewCount),
      bestRating: "5",
    };
  }
  const rankLine = [];
  for (const club of ranks) {
    for (const s of club.sources || []) {
      const src = s.source === "djmag-top100" ? "DJ Mag" : s.source === "ina-100-best" ? "INA" : String(s.source || "");
      if (s.rank) rankLine.push(`${src} ${s.year || ""} #${s.rank}`.replace(/  +/g, " ").trim());
    }
  }
  const body = `
  <nav><a href="${BASE}/">Hem</a> · <a href="${BASE}/d/">Destinationer</a> · ${d ? `<a href="${destUrl(d)}">${esc(d.name)}</a>` : ""}</nav>
  <p class="kicker">${esc(v.destination)} · ${esc(v.category || "VIP")} · ${esc(v.country || d?.country || "")}${engine ? ` · ${esc(engine)}` : ""}</p>
  <h1>${esc(v.name)}</h1>
  <p class="sub">${esc(summary)}</p>
  ${rankLine.length ? `<p class="meta">${esc(rankLine.join(" · "))}</p>` : ""}
  ${f.hours || f.season || f.ageLimit || f.dressCode ? `<p class="meta">${esc([f.hours && "Öppet "+f.hours, f.season && "Säsong "+f.season, f.ageLimit, f.dressCode].filter(Boolean).join(" · "))}</p>` : ""}
  <p><a class="btn" href="${appBook(v)}">Öppna i VELVET</a></p>
  ${evs.length ? `<h2>Kommande kvällar</h2><ul>${evs.map((e) => `<li>${esc(e.date || "")} — ${esc(e.title)}</li>`).join("")}</ul>` : ""}
  ${(f.highlights || []).length ? `<h2>Från ställets sajt</h2><ul>${f.highlights.slice(0, 6).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
  <p class="meta">${v.website_url ? `<a href="${esc(v.website_url)}">Officiell sajt</a>` : ""} ${v.instagram_url ? ` · <a href="${esc(v.instagram_url)}">Instagram</a>` : ""} · <a href="${appVenue(v)}">Öppna i appen</a></p>
  `;
  return layout({ title, description, canonical, jsonLd: JSON.stringify(ld), body });
}

function destPage(d, list) {
  const title = `VIP-bord i ${d.name} — förfrågan via VELVET`;
  const description = `Skicka förfrågan om VIP-bord, cabanas och daybeds i ${d.name}, ${d.country}. ${list.length} handplockade ställen. VELVET tar den mot klubben.`.slice(0, 158);
  const canonical = destUrl(d);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `VIP-ställen i ${d.name}`,
    numberOfItems: list.length,
    itemListElement: list.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: venueUrl(v),
      name: v.name,
    })),
  };
  const body = `
  <nav><a href="${BASE}/">Hem</a> · <a href="${BASE}/d/">Destinationer</a></nav>
  <p class="kicker">${esc(d.country)} · ${esc(d.region)} · säsong ${esc(d.peak_season || "")}</p>
  <h1>VIP-bord i ${esc(d.name)}</h1>
  <p class="sub">${esc(d.use_cases || d.note || "")} ${list.length} ställen i katalogen. VELVET tar förfrågan mot klubben — vi ligger ovanpå deras bokningssystem.</p>
  ${list.map((v) => `<div class="card"><h2><a href="${venueUrl(v)}">${esc(v.name)}</a></h2><p class="meta">${esc(v.category || "")} · <a href="${appBook(v)}">Öppna i VELVET</a></p></div>`).join("")}
  <p><a class="btn" href="${appDest(d)}">Öppna ${esc(d.name)} i appen</a></p>
  `;
  return layout({ title, description, canonical, jsonLd: JSON.stringify(ld), body });
}

function hubPage(dests) {
  const title = "VIP-bord på världens klubbar — VELVET";
  const description = "Skicka förfrågan om VIP-bord, cabanas och daybeds på handplockade klubbar i Ibiza, Mykonos, Dubai och fler. VELVET tar den mot klubben.";
  const canonical = `${BASE}/d/`;
  const body = `
  <nav><a href="${BASE}/">Hem</a></nav>
  <p class="kicker">VELVET</p>
  <h1>Destinationer för VIP-bord</h1>
  <p class="sub">VELVET tar förfrågan mot klubben. Vi ligger ovanpå SevenRooms, Resy, Tock eller deras egen sida.</p>
  ${dests.map((d) => `<div class="card"><h2><a href="${destUrl(d)}">${esc(d.name)}</a></h2><p class="meta">${esc(d.country)} · ${esc(d.use_cases || "")}</p></div>`).join("")}
  `;
  return layout({ title, description, canonical, jsonLd: "", body });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const destsWithVenues = destinations
  .map((d) => ({ d, list: venues.filter((v) => v.destination_code === d.code || v.destination === d.name) }))
  .filter((x) => x.list.length);

fs.writeFileSync(path.join(OUT, "index.html"), hubPage(destsWithVenues.map((x) => x.d)));

const urls = [`${BASE}/`, `${BASE}/d/`];
for (const { d, list } of destsWithVenues) {
  const dir = path.join(OUT, destSlug[d.code]);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), destPage(d, list));
  urls.push(destUrl(d));
  for (const v of list) {
    const vdir = path.join(dir, venueSlug[v.venue_id]);
    fs.mkdirSync(vdir, { recursive: true });
    fs.writeFileSync(path.join(vdir, "index.html"), venuePage(v, d));
    urls.push(venueUrl(v));
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc><changefreq>weekly</changefreq></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);

const robots = `User-agent: *
Allow: /
Disallow: /ios-fix.html
Disallow: /velvet-ny

Sitemap: ${BASE}/sitemap.xml
`;
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);

const map = {
  base: BASE,
  destinations: destsWithVenues.map(({ d }) => ({ code: d.code, slug: destSlug[d.code], url: destUrl(d) })),
  venues: venues.map((v) => ({
    id: v.venue_id,
    slug: venueSlug[v.venue_id],
    dest: destSlug[v.destination_code],
    url: venueUrl(v),
  })),
};
fs.writeFileSync(path.join(DATA, "seo-urls.json"), JSON.stringify(map, null, 2) + "\n");

console.log("seo pages", urls.length, "dest", destsWithVenues.length, "venues", venues.length);
