import fs from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = async (file) => JSON.parse(await fs.readFile(new URL(file, root), "utf8"));
const destinations = [...await read("data/destinations.json"), ...await read("data/extra-destinations.json")];
const catalog = await read("data/restaurants.json");
const endpoints = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter"
];
const wanted = 30;
const catalogCodes = new Set(Object.entries(catalog.destinations).filter(([, row]) => row.restaurants?.length).map(([code]) => code));
for (const code of Object.keys(catalog.destinations)) {
  if (!catalogCodes.has(code)) delete catalog.destinations[code];
}

const slug = (value) => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const distance = (a, b) => {
  const p = Math.PI / 180;
  const x = (b.lng - a.lng) * p * Math.cos((a.lat + b.lat) * p / 2);
  const y = (b.lat - a.lat) * p;
  return Math.sqrt(x * x + y * y) * 6371;
};

async function queryDestination(d) {
  const query = `[out:json][timeout:20];nwr[amenity=restaurant][name](around:12000,${d.lat},${d.lng});out center tags qt 80;`;
  let error;
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      const response = await fetch(endpoint, { method: "POST", signal: controller.signal, headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", "user-agent": "VELVET-catalog-preview/1.0" }, body: new URLSearchParams({ data: query }) });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return (await response.json()).elements || [];
    } catch (e) { error = e; }
  }
  throw error;
}

for (const d of destinations.filter((x, i, all) => catalogCodes.has(x.code) && all.findIndex((y) => y.code === x.code) === i && Number.isFinite(x.lat) && Number.isFinite(x.lng))) {
  const row = catalog.destinations[d.code];
  if (row.restaurants.length >= wanted) continue;
  const existing = new Set(row.restaurants.map((r) => r.name.trim().toLocaleLowerCase()));
  try {
    const elements = await queryDestination(d);
    const candidates = elements.map((element) => {
      const tags = element.tags || {};
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      const name = tags.name?.trim();
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const website = tags.website || tags["contact:website"] || "";
      return { name, lat, lng, website: /^https?:\/\//i.test(website) ? website : "", cuisine: tags.cuisine || "", km: distance(d, { lat, lng }) };
    }).filter(Boolean).sort((a, b) => a.km - b.km || a.name.localeCompare(b.name));
    for (const place of candidates) {
      if (row.restaurants.length >= wanted) break;
      const key = place.name.toLocaleLowerCase();
      if (existing.has(key)) continue;
      existing.add(key);
      row.restaurants.push({
        placeId: `osm-${d.code}-${slug(place.name)}`,
        name: place.name,
        rating: null,
        reviewCount: 0,
        address: `${d.name}, ${d.country}`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${d.name}`)}`,
        website: place.website,
        primaryType: "restaurant",
        source: "OpenStreetMap",
        curated: true,
        cuisine: place.cuisine || undefined
      });
    }
    row.source = "VELVET curated + OpenStreetMap · official links where available";
    console.log(`${d.code} ${row.restaurants.length}/${wanted}`);
  } catch (error) {
    console.error(`${d.code} failed: ${error.message}`);
  }
}

catalog.fetchedAt = new Date().toISOString();
catalog.maxPerDestination = wanted;
catalog.mode = "curated-plus-open-place-data-no-invented-ratings";
await fs.writeFile(new URL("data/restaurants.json", root), `${JSON.stringify(catalog, null, 2)}\n`);
