import fs from "node:fs/promises";

const file = "data/restaurants.json";
const catalog = JSON.parse(await fs.readFile(file, "utf8"));
const now = new Date().toISOString();
const extraOfficialPages = {
  animo: ["https://www.animorestaurant.se/copy-of-home"],
};
const officialImageSeeds = {
  // Original Wix media files exposed by Animo's own current and archived home pages.
  animo: [
    "https://static.wixstatic.com/media/f66b98_a93dee161d1843bfa246b1f54fcb3a09f000.jpg",
    "https://static.wixstatic.com/media/f66b98_5f008d985f1e4f5fbf9e0047ce58dd71~mv2.jpg",
    "https://static.wixstatic.com/media/2d5bc9_118c52c861b2405b8a177d2974168e91~mv2.jpg",
    "https://static.wixstatic.com/media/2d5bc9_0ec03719627040b797733a39b2dca73b~mv2.jpg",
    "https://static.wixstatic.com/media/2d5bc9_a0e2f8f2588f4421a70624d4bb8b528d~mv2.jpg",
  ],
};

const targets = [
  ["brasserie-astoria", "Brasserie Astoria", "Nybrogatan 15, 114 39 Stockholm", "https://www.brasserieastoria.se/", "Modern brasserie", "https://www.instagram.com/brasserieastoria/"],
  ["italiano", "Italiano", "Nybrogatan 12, 114 39 Stockholm", "https://www.italiano.se/", "Italienskt", "https://www.instagram.com/italianorestaurang/"],
  ["ciccios", "Ciccio’s", "Nybrogatan 21, 114 39 Stockholm", "https://www.ciccios.se/", "Italienskt · New York", "https://www.instagram.com/cicciosstockholm/"],
  ["ag", "Restaurang AG", "Kronobergsgatan 37, 112 33 Stockholm", "https://restaurangag.se/", "Steakhouse · Svenskt", "https://www.instagram.com/restaurang_ag/"],
  ["hillenberg", "Hillenberg", "Humlegårdsgatan 14, 114 46 Stockholm", "https://hillenberg.se/", "Europeiskt · Brasserie", "https://www.instagram.com/restauranghillenberg/"],
  ["frantzen", "Frantzén", "Klara Norra Kyrkogata 26, 111 22 Stockholm", "https://www.restaurantfrantzen.com/", "Nordiskt · Fine dining", "https://www.instagram.com/frantzengroup/"],
  ["almaza", "Restaurang Almaza", "Scheelegatan 3, 112 23 Stockholm", "https://www.restaurangalmaza.se/", "Libanesiskt · Meze", "https://www.instagram.com/restaurangalmaza/"],
  ["tabbouli", "Tabbouli", "Stockholm, Sweden", "https://tabbouli.eu/", "Libanesiskt · Meze", "https://www.instagram.com/restaurang_tabbouli/"],
  ["beirut-cafe", "Beirut Café", "Nybrogatan 29–31, 114 39 Stockholm", "https://www.beirutcafe.se/", "Libanesiskt · Meze", "https://www.instagram.com/beirutcafe/"],
  ["animo", "Animo", "Kungstensgatan 9, 114 25 Stockholm", "https://www.animorestaurant.se/en", "Modernt europeiskt · Cocktailbar", "https://www.instagram.com/animo.restaurant/"],
  ["noema", "Noema", "Birger Jarlsgatan 64, 114 29 Stockholm", "https://noemastockholm.se/en/", "Modernt europeiskt", "https://www.instagram.com/noemastockholm/"],
  ["farang", "Farang", "Tulegatan 7, 113 53 Stockholm", "https://farang.se/", "Sydostasiatiskt", "https://www.instagram.com/farangstockholm/"],
  ["sperling-co", "Sperling & Co", "Sturegatan 6, 114 35 Stockholm", "https://sperlingco.se/", "Grill · Modern brasserie", "https://www.instagram.com/sperlingandco/"],
  ["boqueria", "Boqueria", "Jakobsbergsgatan 17, 111 44 Stockholm", "https://www.boqueria.se/en/", "Spanskt · Tapas · Pintxos", "https://www.instagram.com/boqueriastockholm/"],
  ["olli", "OLLI Ristorante", "Jakobsbergsgatan 21, 111 44 Stockholm", "https://www.olliristorante.se/", "Italienskt", "https://www.instagram.com/olliristorante/"],
  ["villa-valentina", "Villa Valentina", "Slussbrogatan 10, 116 45 Stockholm", "https://www.villavalentina.se/", "Spanskt · Medelhavet", "https://www.instagram.com/villavalentinarestaurants/"],
  ["basta", "Basta Urban Italian", "Mäster Samuelsgatan 59, 111 21 Stockholm", "https://www.restaurangbasta.se/restauranger/stockholm", "Italienskt", "https://www.instagram.com/bastaurbanitalian/"],
  ["florentine", "Florentine", "Folkungagatan 44, 118 26 Stockholm", "https://www.florentinerestaurants.com/stockholm", "Italienskt · Dinner club", "https://www.instagram.com/florentinerestaurants/"],
  ["brasserie-astrid", "Brasserie Astrid", "Mälartrappan 5, 116 45 Stockholm", "https://brasserieastrid.se/restaurang", "Brasserie · Svenskt", "https://www.instagram.com/brasserieastrid/"],
  ["strandvagen-1", "Strandvägen 1", "Strandvägen 1, 114 51 Stockholm", "https://strandvagen1.se/", "Brasserie · Svenskt", "https://www.instagram.com/strandvagen1/"],
  ["strandbryggan", "Strandbryggan", "Strandvägskajen 27, 114 56 Stockholm", "https://strandbryggan.se/", "Medelhavet · Sjökrog", "https://www.instagram.com/strandbryggan/"],
  ["hallwylska", "Hallwylska Restaurang", "Hamngatan 4, 111 47 Stockholm", "https://hallwylskarestaurang.com/", "Europeiskt · Innergård", "https://www.instagram.com/hallwylska_restaurang/"],
  ["vau-de-ville", "Vau de Ville", "Norrmalmstorg 6, 111 46 Stockholm", "https://vaudevillestockholm.se/", "Franskt · Brasserie", "https://www.instagram.com/vaudevillestockholm/"],
  ["lebanon-meza-lounge", "Lebanon Meza Lounge", "Hamngatan 6, 111 47 Stockholm", "https://mezalounge.se/", "Libanesiskt · Meze", "https://www.instagram.com/lebanonmezalounge/"],
  ["sturehof", "Sturehof", "Stureplan 2, 114 46 Stockholm", "https://sturehof.com/", "Svenskt · Fisk · Skaldjur", "https://www.instagram.com/sturehof/"],
  ["riche", "Riche", "Birger Jarlsgatan 4, 114 34 Stockholm", "https://riche.se/", "Franskt · Svenskt · Brasserie", "https://www.instagram.com/riche_stockholm/"],
  ["villa-dagmar", "Villa Dagmar", "Nybrogatan 25–27, 114 39 Stockholm", "https://hotelvilladagmar.com/food-drink/restaurangen/", "Medelhavet · Modernt europeiskt", "https://www.instagram.com/hotelvilladagmar/"],
  ["paraden", "Paraden", "Valhallavägen 147, 115 31 Stockholm", "https://paradenkvarterskrog.com/", "Kvarterskrog · Europeiskt", "https://www.instagram.com/paradenkvarterskrog/"],
  ["kommendoren", "Kommendören", "Kommendörsgatan 7, 114 48 Stockholm", "https://www.kommendoren.se/", "Kvarterskrog · Europeiskt", "https://www.instagram.com/kommendoren/"],
  ["tete", "Tête", "Regeringsgatan 111, 111 39 Stockholm", "https://www.restaurangtete.se/", "Franskt · Vinbar", "https://www.instagram.com/restaurangtete/"],
  ["copine", "Copine", "Kommendörsgatan 23, 114 48 Stockholm", "https://www.jimjacobrestauranger.se/copine", "Sydeuropeiskt", "https://www.instagram.com/restaurangcopine/"],
  ["balzac", "Brasserie Balzac", "Odengatan 26, 113 51 Stockholm", "https://balzac.se/", "Franskt · Brasserie", "https://www.instagram.com/brasseriebalzac/"],
];

function clean(raw, base) {
  if (!raw || /^data:|^blob:/i.test(raw)) return null;
  try {
    const value = String(raw).replace(/&amp;/g, "&").replace(/\\u0026/gi, "&").replace(/\\u002f/gi, "/").trim();
    const url = new URL(value, base);
    if (!/^https?:$/.test(url.protocol)) return null;
    if (/facebook\.com\/tr\?|doubleclick|google-analytics|gravatar/i.test(url.href)) return null;
    if (/\.(?:svg|ico|gif)(?:$|\?)/i.test(url.href)) return null;
    const path = decodeURIComponent(url.pathname).toLowerCase();
    if (/(?:logo|icon|favicon|sprite|avatar|badge|placeholder|tracking|pixel|loader|spinner|tripadvisor|blank|flags?\/|flag[-_.]|quote[-_.]|star\.png|promo-domains|scroll-vertical|ico[-_.])/i.test(path)) return null;
    const sizeHints = [...url.searchParams.entries(), ...[...decodeURIComponent(url.href).matchAll(/(?:^|[/_,=-])(w|h|width|height)[_=-]?(\d{1,4})(?:$|[/_,.&-])/gi)].map((match) => [match[1], match[2]])];
    if (sizeHints.some(([key, value]) => /^(?:w|h|width|height)$/i.test(key) && Number(value) > 0 && Number(value) < 720)) return null;
    const dimensions = decodeURIComponent(url.href).match(/(?:^|[-_\/=])s?(\d{1,4})x(\d{1,4})(?:[-_.\/?&]|$)/i);
    if (dimensions && Math.max(Number(dimensions[1]), Number(dimensions[2])) < 600) return null;
    const legacyDimensions = decodeURIComponent(url.href).match(/(?:small|thumb)?[-_](\d{2,4})[-_](\d{2,4})(?:[-_.\/?&]|$)/i);
    if (legacyDimensions && Math.max(Number(legacyDimensions[1]), Number(legacyDimensions[2])) < 600) return null;
    if (/(?:blur_[1-9]|quality_(?:auto_)?low)/i.test(url.href)) return null;
    return url.href;
  } catch { return null; }
}

function extractCandidates(html, base) {
  const result = [];
  const add = (value) => {
    const url = clean(value, base);
    if (url && !result.includes(url)) result.push(url);
  };
  for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image(?::src)?)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/"image"\s*:\s*(?:\[\s*)?["']([^"']+)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/<(?:img|video)\b[^>]*(?:src|data-src|data-lazy-src|poster|data-lazyload|data-original|data-bg)=["']([^"']+)["'][^>]*>/gi)) add(match[1]);
  for (const match of html.matchAll(/<img\b[^>]*srcset=["']([^"']+)["'][^>]*>/gi)) {
    for (const part of match[1].split(",")) add(part.trim().split(/\s+/)[0]);
  }
  for (const match of html.matchAll(/url\(["']?([^"'()]+\.(?:jpe?g|png|webp|avif)(?:\?[^"'()]*)?)["']?\)/gi)) add(match[1]);
  for (const match of html.matchAll(/["']([^"']+\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?)["']/gi)) add(match[1]);
  return result;
}

function score(url) {
  const value = decodeURIComponent(url).toLowerCase();
  let points = 0;
  if (/\.(?:jpe?g)(?:$|\?)/i.test(value)) points += 30;
  else if (/\.(?:webp|avif)(?:$|\?)/i.test(value)) points += 27;
  else if (/\.png(?:$|\?)/i.test(value)) points += 8;
  if (/(?:photo|foto|gallery|restaurant|interior|terrace|food|dish|dsc|img_|hero|banner|venue|uploads|media)/i.test(value)) points += 10;
  if (/(?:screen[-_ ]?shot|screenshot|history|line[-_]?map|postal|artboard|menu|meny|jul|nye|event|cookie)/i.test(value)) points -= 20;
  return points;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; VELVET official media verifier/1.0)", accept: "text/html,application/xhtml+xml" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { url: response.url, html: await response.text() };
  } finally { clearTimeout(timer); }
}

function linkedPages(html, base) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = `${match[1]} ${match[2].replace(/<[^>]+>/g, " ")}`;
    if (!/(?:gallery|galleri|restaurant|restaurang|about|om-oss|food|mat|venue|lokal)/i.test(label)) continue;
    try {
      const url = new URL(match[1], base);
      const root = new URL(base);
      if (url.origin === root.origin && !links.includes(url.href) && url.href !== base) links.push(url.href);
    } catch {}
  }
  return links.slice(0, 2);
}

function linkedScripts(html, base) {
  const links = [];
  for (const match of html.matchAll(/<script\b[^>]+src=["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1], base);
      if (url.origin === new URL(base).origin && !links.includes(url.href)) links.push(url.href);
    } catch {}
  }
  return links.slice(0, 2);
}

async function isImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { redirect: "follow", signal: controller.signal, headers: { "user-agent": "Mozilla/5.0", accept: "image/avif,image/webp,image/*,*/*;q=0.8" } });
    const type = response.headers.get("content-type") || "";
    await response.body?.cancel();
    return response.ok && /^image\//i.test(type);
  } catch { return false; }
  finally { clearTimeout(timer); }
}

const globalOwners = new Map();
for (const destination of Object.values(catalog.destinations || {})) {
  for (const restaurant of destination.restaurants || []) {
    if (restaurant.placeId?.startsWith("curated-STO-") && targets.some(([slug]) => restaurant.placeId === `curated-STO-${slug}`)) continue;
    for (const url of restaurant.images || []) globalOwners.set(url, restaurant.placeId);
  }
}

const records = [];
const report = [];
for (const [slug, name, address, website, cuisine, instagram] of targets) {
  const placeId = `curated-STO-${slug}`;
  try {
    const home = await fetchHtml(website);
    const pages = [home];
    for (const link of linkedPages(home.html, home.url)) {
      try { pages.push(await fetchHtml(link)); } catch {}
    }
    for (const link of extraOfficialPages[slug] || []) {
      try { pages.push(await fetchHtml(link)); } catch {}
    }
    if (!extractCandidates(home.html, home.url).length) {
      for (const link of linkedScripts(home.html, home.url)) {
        try { pages.push(await fetchHtml(link)); } catch {}
      }
    }
    const discovered = pages.flatMap((page) => extractCandidates(page.html, page.url)).sort((a, b) => score(b) - score(a));
    const candidates = [...new Set([...(officialImageSeeds[slug] || []), ...discovered])];
    const images = [];
    for (const candidate of candidates) {
      if (images.length >= 5) break;
      if (globalOwners.has(candidate) || !(await isImage(candidate))) continue;
      globalOwners.set(candidate, placeId);
      images.push(candidate);
    }
    const foundInstagram = pages.flatMap((page) => [...page.html.matchAll(/https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.-]+\/?/gi)].map((m) => m[0]))[0];
    const foundFacebook = pages.flatMap((page) => [...page.html.matchAll(/https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9_.-]+\/?/gi)].map((m) => m[0]))[0];
    records.push({
      placeId,
      name,
      rating: null,
      reviewCount: 0,
      address,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`,
      website: home.url,
      bookingUrl: home.url,
      ...(foundInstagram || instagram ? { instagram: foundInstagram || instagram } : {}),
      ...(foundFacebook ? { facebook: foundFacebook } : {}),
      cuisine,
      priceClass: "$$$",
      primaryType: "restaurant",
      source: "VELVET curated · official website",
      curated: true,
      images,
      imageSource: home.url,
      imageVerifiedAt: now,
    });
    report.push({ name, website: home.url, candidates: candidates.length, images: images.length });
  } catch (error) {
    report.push({ name, website, error: String(error.message || error), images: 0 });
  }
}

const missing = report.filter((row) => !row.images);
console.log(JSON.stringify({ report, missing }, null, 2));
if (missing.length) {
  console.error(`Aborting: ${missing.length} official sites yielded no verified image.`);
  process.exit(1);
}

const stockholm = catalog.destinations.STO;
const targetIds = new Set(records.map((record) => record.placeId));
const keep = (stockholm.restaurants || []).filter((restaurant) => !targetIds.has(restaurant.placeId));
const zink = keep.find((restaurant) => restaurant.placeId === "curated-STO-zink-italian-cuisine");
const remainder = keep.filter((restaurant) => restaurant !== zink);
stockholm.restaurants = [zink, ...records, ...remainder].filter(Boolean);

const allRestaurants = Object.values(catalog.destinations || {}).flatMap((destination) => destination.restaurants || []);
catalog.imageAudit = {
  generatedAt: now,
  policy: "Only images discovered on the exact restaurant's official website; no generic fallbacks and no duplicate URL ownership.",
  restaurants: allRestaurants.length,
  officialSites: allRestaurants.filter((restaurant) => /^https?:\/\//i.test(restaurant.website || "")).length,
  withImages: allRestaurants.filter((restaurant) => Array.isArray(restaurant.images) && restaurant.images.length).length,
};
await fs.writeFile(file, `${JSON.stringify(catalog, null, 2)}\n`);
