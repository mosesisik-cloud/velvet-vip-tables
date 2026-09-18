#!/usr/bin/env node
/**
 * Finds explicit menu links on each restaurant's own website.
 * It never invents dishes or prices and never promotes third-party reseller links.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "data", "restaurants.json");
const UA = "VELVET-menu-link-verifier/1.0 (+https://mosesisik-cloud.github.io/velvet-vip-tables/)";
const PATH_WORD = /(?:^|[\s/_-])(menu|menus|meny|carta|carte|speisekarte|food-menu|drink-menu)(?:$|[\s/_-])/i;
const LABEL_WORD = /\b(menu|menus|meny|carta|carte|speisekarte)\b/i;
const BAD = /instagram\.com|facebook\.com|tiktok\.com|tripadvisor\.|thefork\.|opentable\.|ubereats\.|deliveroo\.|doordash\.|mailto:|tel:|javascript:/i;

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function ownHost(a, b) {
  const clean = (host) => String(host || "").toLowerCase().replace(/^www\./, "");
  const x = clean(a); const y = clean(b);
  return x === y || x.endsWith("." + y) || y.endsWith("." + x);
}

function menuCandidate(home, finalUrl, href, text) {
  if (!href || BAD.test(href)) return null;
  let url;
  try { url = new URL(decodeHtml(href), finalUrl || home); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  let homeUrl;
  try { homeUrl = new URL(home); } catch { return null; }
  if (!ownHost(url.hostname, homeUrl.hostname)) return null;
  const label = decodeHtml(text);
  const pathText = url.pathname.replace(/[.]/g, " ");
  if (/private[-_/ ]?dining|services?|contact|reservation|booking/i.test(pathText)) return null;
  const scopedHome = homeUrl.pathname.split("/").filter(Boolean)[0] || "";
  const scopedMenu = url.pathname.split("/").filter(Boolean)[0] || "";
  if (scopedHome && scopedMenu && scopedHome.toLowerCase() !== scopedMenu.toLowerCase()) return null;
  const hasPathWord = PATH_WORD.test(pathText);
  const hasLabelWord = LABEL_WORD.test(label);
  const isPdf = /\.pdf(?:$|\?)/i.test(url.href);
  if (!hasPathWord && !hasLabelWord) return null;
  if (url.pathname === "/" && !isPdf) return null;
  const hay = `${pathText} ${label}`;
  let score = 0;
  if (hasPathWord) score += 6;
  if (isPdf) score += 3;
  if (hasLabelWord) score += 4;
  if (/privacy|cookie|career|contact|booking|reservation|gift|press/i.test(hay)) score -= 4;
  if (score < 6) return null;
  url.hash = "";
  return { url: url.href, score };
}

async function discover(home) {
  if (!/^https?:\/\//i.test(home || "") || BAD.test(home)) return null;
  try {
    const response = await fetch(home, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok || !/text\/html/i.test(response.headers.get("content-type") || "text/html")) return null;
    const html = await response.text();
    const candidates = [];
    for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const found = menuCandidate(home, response.url, match[1], match[2]);
      if (found) candidates.push(found);
    }
    candidates.sort((a, b) => b.score - a.score || a.url.length - b.url.length);
    return candidates[0]?.url || null;
  } catch { return null; }
}

async function pool(rows, limit, task) {
  let cursor = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      await task(row);
    }
  });
  await Promise.all(workers);
}

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const restaurants = Object.values(data.destinations || {}).flatMap((row) => row.restaurants || []);
if (process.argv.includes("--reset-discovered")) {
  for (const restaurant of restaurants) {
    if (!restaurant.menuVerifiedAt) continue;
    delete restaurant.menuUrl;
    delete restaurant.menuSource;
    delete restaurant.menuVerifiedAt;
  }
}
const targets = restaurants.filter((restaurant) => !restaurant.menuUrl && /^https?:\/\//i.test(restaurant.website || "") && !BAD.test(restaurant.website));
let found = 0;
let done = 0;

await pool(targets, 12, async (restaurant) => {
  const menuUrl = await discover(restaurant.website);
  done += 1;
  if (menuUrl) {
    restaurant.menuUrl = menuUrl;
    restaurant.menuSource = restaurant.website;
    restaurant.menuVerifiedAt = new Date().toISOString();
    found += 1;
    console.log("menu", restaurant.placeId, menuUrl);
  }
  if (done % 25 === 0) console.log("progress", done, "/", targets.length, "found", found);
});

data.menuLinksVerifiedAt = new Date().toISOString();
fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
console.log("done", targets.length, "checked", found, "official menu links found");
