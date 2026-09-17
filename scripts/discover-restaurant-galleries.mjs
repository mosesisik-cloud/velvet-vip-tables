import fs from "node:fs/promises";

const file = "data/restaurants.json";
const catalog = JSON.parse(await fs.readFile(file, "utf8"));
const rows = Object.entries(catalog.destinations || {}).flatMap(([code, destination]) =>
  (destination.restaurants || []).map((restaurant) => ({ code, restaurant })),
);
const stats = { restaurants: rows.length, officialSites: 0, withImages: 0, images: 0, blocked: 0, errors: [] };

function clean(raw, base) {
  if (!raw || /^data:|^blob:/i.test(raw)) return null;
  try {
    const url = new URL(String(raw).replace(/&amp;/g, "&").replace(/\\u0026/gi, "&").replace(/\\u002f/gi, "/").trim(), base);
    if (!/^https?:$/.test(url.protocol)) return null;
    if (/facebook\.com\/tr\?|doubleclick|google-analytics|back-in-stock\.appikon\.com/i.test(url.href)) return null;
    if (/\.(?:svg|ico|gif)(?:$|\?)/i.test(url.href)) return null;
    const path = decodeURIComponent(url.pathname).toLowerCase();
    if (/(?:logo|icon|favicon|sprite|avatar|badge|placeholder|tracking|pixel|close|loader|spinner|tripadvisor|blank|flags?\/|flag[-_.]|quote[-_.]|star\.png|promo-domains|scroll-vertical|ico[-_.])/i.test(path)) return null;
    const sizeHints = [...url.searchParams.entries(), ...[...path.matchAll(/(?:^|[/_,=-])(w|h|width|height)[_=-]?(\d{1,4})(?:$|[/_,.&-])/gi)].map((m) => [m[1], m[2]])];
    if (sizeHints.some(([key, value]) => /^(?:w|h|width|height)$/i.test(key) && Number(value) > 0 && Number(value) < 360)) return null;
    const embeddedSize = decodeURIComponent(url.href).match(/(?:^|[-_\/=])s?(\d{1,4})x(\d{1,4})(?:[-_.\/?&]|$)/i);
    if (embeddedSize && Math.max(Number(embeddedSize[1]), Number(embeddedSize[2])) < 600) return null;
    return url.href.replace(/^http:/i, "https:");
  } catch { return null; }
}

function candidates(html, base) {
  const result = [];
  const add = (value) => {
    const url = clean(value, base);
    if (url && !result.includes(url)) result.push(url);
  };
  for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/"image"\s*:\s*(?:\[\s*)?["']([^"']+)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/<img\b[^>]*(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi)) add(match[1]);
  for (const match of html.matchAll(/<(?:img|video)\b[^>]*(?:poster|data-lazyload|data-original|data-bg)=["']([^"']+)["'][^>]*>/gi)) add(match[1]);
  for (const match of html.matchAll(/<img\b[^>]*srcset=["']([^"']+)["'][^>]*>/gi)) {
    for (const part of match[1].split(",")) add(part.trim().split(/\s+/)[0]);
  }
  for (const match of html.matchAll(/url\(["']?([^"'()]+\.(?:jpe?g|png|webp|avif)(?:\?[^"'()]*)?)["']?\)/gi)) add(match[1]);
  return result;
}

function imageScore(url) {
  const value = decodeURIComponent(url).toLowerCase();
  let score = 0;
  if (/\.(?:jpe?g)(?:$|\?)/i.test(value)) score += 30;
  else if (/\.(?:webp|avif)(?:$|\?)/i.test(value)) score += 26;
  else if (/\.png(?:$|\?)/i.test(value)) score += 8;
  if (/(?:photo|foto|gallery|galeria|restaurant|interior|terrace|food|dish|dsc|img_|hero|banner|venue|event)/i.test(value)) score += 9;
  if (/(?:screen[-_ ]?shot|screenshot|history|line[-_]?map|postal|artboard)/i.test(value)) score -= 8;
  return score;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; VELVET official restaurant image verifier/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { html: await response.text(), url: response.url };
  } finally { clearTimeout(timer); }
}

const queue = rows.filter(({ restaurant }) => /^https?:\/\//i.test(restaurant.website || ""));
stats.officialSites = queue.length;
const discovered = [];

async function worker() {
  while (queue.length) {
    const item = queue.shift();
    const { restaurant } = item;
    try {
      const page = await fetchHtml(restaurant.website);
      const images = candidates(page.html, page.url).sort((a, b) => imageScore(b) - imageScore(a)).slice(0, 5);
      discovered.push({ ...item, source: page.url, images });
      if (!images.length) stats.blocked++;
    } catch (error) {
      stats.errors.push({ placeId: restaurant.placeId, website: restaurant.website, error: String(error.message || error) });
      discovered.push({ ...item, source: restaurant.website, images: [] });
    }
  }
}

await Promise.all(Array.from({ length: 10 }, worker));

// Samma exakta bild får aldrig representera två olika restauranger.
const owner = new Map();
for (const { restaurant, source, images } of discovered) {
  const unique = images.filter((url) => {
    if (owner.has(url) && owner.get(url) !== restaurant.placeId) return false;
    owner.set(url, restaurant.placeId);
    return true;
  });
  if (unique.length) {
    restaurant.images = unique;
    restaurant.imageSource = source;
    restaurant.imageVerifiedAt = new Date().toISOString();
    stats.withImages++;
    stats.images += unique.length;
  } else {
    delete restaurant.images;
    delete restaurant.imageSource;
    delete restaurant.imageVerifiedAt;
  }
}

catalog.imageAudit = {
  generatedAt: new Date().toISOString(),
  policy: "Only images discovered on the exact restaurant's official website; no generic fallbacks and no duplicate URL ownership.",
  restaurants: stats.restaurants,
  officialSites: stats.officialSites,
  withImages: stats.withImages,
};
await fs.writeFile(file, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify(stats, null, 2));
