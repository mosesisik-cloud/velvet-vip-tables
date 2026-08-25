import fs from "node:fs/promises";

const venues = [
  ...JSON.parse(await fs.readFile("data/venues.json", "utf8")),
  ...JSON.parse(await fs.readFile("data/unlisted-venues.json", "utf8")),
];
const current = JSON.parse(await fs.readFile("data/venue-images.json", "utf8"));
const provenance = {};
const stats = { venues: venues.length, withGallery: 0, images: 0, errors: [] };

// Officiella källor som blockerar automatisk hämtning (bot-skydd eller JS-rendering).
// Dessa hålls här, inte bara i genererad JSON, så att full täckning är reproducerbar.
const manualOfficial = {
  "BDR-005": { source: "https://www.instagram.com/thebodrumedition/", images: ["https://scontent-arn2-1.cdninstagram.com/v/t51.2885-19/322524174_5187696864664900_6178109386389879497_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=104&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=X1-czkhYzLUQ7kNvwFVunfa&_nc_oc=Ado5pDljxqFZHvN1S1EHE0sEgEr04kG43G-wSCoi6tB2JeaXbCDTM7WvViZx1NKymZM&_nc_zt=24&_nc_ht=scontent-arn2-1.cdninstagram.com&_nc_ss=7b689&oh=00_AQHddZvyxE5dpBScIhF51b-mJKTZDuHHTHurc_1sOMC1yg&oe=6A93D102"] },
  "BKK-001": { source: "https://www.instagram.com/onyxbangkok/", images: ["https://scontent-arn2-1.cdninstagram.com/v/t51.82787-19/759164339_18606458731031583_4439036265422246274_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=107&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=AbDnNHpnjU8Q7kNvwFAPIay&_nc_oc=AdoG60DeTAC7Wh7mVI_9ce2qdQn22SWVuAwLTSzWSjA5OQJlwFHqm3pjGCSiq1WVh-U&_nc_zt=24&_nc_ht=scontent-arn2-1.cdninstagram.com&_nc_gid=1-Q3sbwVMV3b7v7Tf1ogwg&_nc_ss=7b689&oh=00_AQE_pR93lggluSHmmasqyyjzHjclJfZDZ3PV2SXZ9ll5nA&oe=6A93E1A9"] },
  "BKK-003": { source: "https://www.instagram.com/tichuca.bkk/", images: ["https://scontent-arn2-1.cdninstagram.com/v/t51.82787-19/731295171_18116344460497620_7723530565672584174_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=104&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=cZvITuHQplAQ7kNvwE4LCc0&_nc_oc=Adpi8he4BG-SOlMBxyPpt92r8Eb7QZyPAXeYsMEWTz1yKaKucXRn1LyCRkvh0nuIwkk&_nc_zt=24&_nc_ht=scontent-arn2-1.cdninstagram.com&_nc_gid=SAtjRJyFjSb-vYXX_hiC5g&_nc_ss=7b689&oh=00_AQFB5Ntw3fohLvwFpyV08EeQufWmKdk0h9fZCGZNWXdHlg&oe=6A93EA81"] },
  "TUL-005": { source: "https://www.instagram.com/tabootulum/", images: ["https://scontent-arn2-1.cdninstagram.com/v/t51.2885-19/313377027_856962935716431_4564715990168323384_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=111&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=AMvUhhP8_BoQ7kNvwEWPIFU&_nc_oc=AdqR9WzFevPON91Euaj30vObxw3JXTobWbQoy-DEJxUiLz0kRUxWyLBJeXgTtsxkEc&_nc_zt=24&_nc_ht=scontent-arn2-1.cdninstagram.com&_nc_ss=7b689&oh=00_AQHjZcxniOWySUjQ0YdWv_Rg6jSUrWabQauz_vIquOOY7Q&oe=6A93C20E"] },
  "ATH-001": { source: "https://islandclubrestaurant.gr/", images: ["https://www.islandclubrestaurant.gr/wp-content/uploads/2025/01/island.png"] },
  "SYD-001": { source: "https://www.homesydney.com/", images: ["https://www.homesydney.com/wp-content/uploads/2025/12/logo-opengraph.jpg"] },
  "SYD-002": { source: "https://merivale.com/venues/ivy/", images: ["https://s3.ap-southeast-2.amazonaws.com/production.assets.merivale.com.au/wp-content/uploads/2017/04/02092839/ivy-Venue-SEO-Image_1200x630px.png"] },
  "CPT-001": { source: "https://cabobeach.co.za/", images: ["https://cabobeach.co.za/wp-content/uploads/2026/04/cabo-beach-front-entrance.jpg"] },
  "RIO-002": { source: "https://www.instagram.com/fosfoboxbarclub/", images: ["https://scontent-arn2-1.cdninstagram.com/v/t51.2885-19/279582170_2913196105650819_584380538361919778_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=100&ccb=7-5&_nc_sid=bf7eb4&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy44NTAuQzMifQ%3D%3D&_nc_ohc=73uCyMAAb4AQ7kNvwES5XUl&_nc_oc=AdrKcgZBIdRfI8LUAh23ahR05_hRKazLDWpy_yxqgrNeV_2AaUA9OFuewBQGJdZj5TY&_nc_zt=24&_nc_ht=scontent-arn2-1.cdninstagram.com&_nc_ss=7b689&oh=00_AQHPsk6sngdR8lbISd_7RXok_Py74CquEQbSDTX_O6zERQ&oe=6A93D9F5"] },
  "CDM-001": { source: "https://www.departamento.tv/", images: ["https://cdn.prod.website-files.com/60ff1dce4158bd5bbb2130dd/6109bf698dc9537ca478e7dc_256-departamento.png"] },
  "IBZ-105": { source: "https://destinoibiza.com/", images: current["IBZ-004"] || [] },
  "SYD-101": { source: "https://merivale.com/venues/ivy/", images: current["SYD-002"] || [] },
  "SYD-104": { source: "https://www.homesydney.com/", images: current["SYD-001"] || [] },
};

function clean(raw, base) {
  if (!raw || /^data:|^blob:/i.test(raw)) return null;
  try {
    const u = new URL(String(raw).replace(/&amp;/g, "&").trim(), base);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (/facebook\.com\/tr\?/i.test(u.href)) return null;
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
  const override = manualOfficial[id];
  const official = override?.source || v.website_url || v.source_url;
  const trustedManual = (override?.images || []).filter((url) => /^https?:\/\//i.test(url));
  const found = [...trustedManual, ...existing.map((url) => clean(url, official || "https://example.com"))]
    .filter((url, i, all) => url && all.indexOf(url) === i);
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
  // Sista skyddsnätet är alltid en fil från ställets egen domän. Det gör att
  // även bot-skyddade/JS-renderade sajter får officiell branding i stället för
  // VELVETs generiska emblem, tills nästa galleriuppdatering hittar ett foto.
  if (!found.length && official) {
    try { found.push(new URL("/favicon.ico", official).href); } catch {}
  }
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
