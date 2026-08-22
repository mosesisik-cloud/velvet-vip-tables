import fs from "node:fs/promises";

const venues = JSON.parse(await fs.readFile("data/venues.json", "utf8"));
const current = JSON.parse(await fs.readFile("data/venue-images.json", "utf8"));
const provenance = {};
const stats = { venues: venues.length, withGallery: 0, images: 0, errors: [] };

function clean(raw, base) {
  if (!raw || /^data:|^blob:/i.test(raw)) return null;
  try {
    const u = new URL(String(raw).replace(/&amp;/g, "&").trim(), base);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (/\.(?:svg|ico)(?:$|\?)/i.test(u.href)) return null;
    if (/(?:logo|icon|favicon|sprite|avatar|badge|placeholder|tracking|pixel)[-_./]/i.test(u.href)) return null;
    return u.href.replace(/^http:/i, "https:");
  } catch { return null; }
}

function candidates(html, base) {
  const out = [];
  const add = (x) => { const u = clean(x, base); if (u && !out.includes(u)) out.push(u); };
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/gi)) add(m[1]);
  for (const m of html.matchAll(/<img\b[^>]*(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi)) add(m[1]);
  for (const m of html.matchAll(/<img\b[^>]*srcset=["']([^"']+)["'][^>]*>/gi)) {
    for (const part of m[1].split(",")) add(part.trim().split(/\s+/)[0]);
  }
  for (const m of html.matchAll(/url\(["']?([^"'()]+\.(?:jpe?g|png|webp)(?:\?[^"'()]*)?)["']?\)/gi)) add(m[1]);
  return out;
}

async function discover(v) {
  const id = v.venue_id;
  const existing = Array.isArray(current[id]) ? current[id] : current[id] ? [current[id]] : [];
  const official = v.website_url || v.source_url;
  const found = existing.map((url) => clean(url, official || "https://example.com")).filter(Boolean);
  if (!official || found.length >= 5) return [id, found.slice(0, 5), official || null];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(official, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; VELVET venue gallery verifier/1.0)" },
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const html = await response.text();
    for (const url of candidates(html, response.url)) {
      if (!found.includes(url)) found.push(url);
      if (found.length === 5) break;
    }
    if (found.length < 5) {
      const origin = new URL(response.url).origin;
      const pages = [...html.matchAll(/<a\b[^>]+href=["']([^"'#]+)["'][^>]*>/gi)]
        .map((m) => clean(m[1], response.url))
        .filter((url) => url && new URL(url).origin === origin && /gallery|galleri|photo|event|night|club|experience|venue/i.test(url))
        .filter((url, i, all) => all.indexOf(url) === i)
        .slice(0, 4);
      for (const page of pages) {
        try {
          const sub = await fetch(page, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; VELVET venue gallery verifier/1.0)" } });
          if (!sub.ok) continue;
          const subHtml = await sub.text();
          for (const url of candidates(subHtml, sub.url)) {
            if (!found.includes(url)) found.push(url);
            if (found.length === 5) break;
          }
        } catch {}
        if (found.length === 5) break;
      }
    }
  } catch (error) {
    stats.errors.push({ id, site: official, error: String(error.message || error) });
  } finally { clearTimeout(timer); }
  return [id, found.slice(0, 5), official];
}

const queue = [...venues];
const results = [];
async function worker() {
  while (queue.length) results.push(await discover(queue.shift()));
}
await Promise.all(Array.from({ length: 8 }, worker));

const galleries = {};
for (const [id, images, source] of results) {
  if (!images.length) continue;
  galleries[id] = images;
  provenance[id] = { source, images, checkedAt: new Date().toISOString() };
  if (images.length > 1) stats.withGallery++;
  stats.images += images.length;
}
await fs.writeFile("data/venue-images.json", JSON.stringify(galleries, null, 2) + "\n");
await fs.writeFile("data/venue-image-sources.json", JSON.stringify({ generatedAt: new Date().toISOString(), venues: provenance }, null, 2) + "\n");
console.log(JSON.stringify(stats, null, 2));
