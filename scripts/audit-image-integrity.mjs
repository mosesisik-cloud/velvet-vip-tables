import fs from "node:fs/promises";

const [venues, extraVenues, venueImages, venueSources, restaurantCatalog] = await Promise.all([
  fs.readFile("data/venues.json", "utf8").then(JSON.parse),
  fs.readFile("data/unlisted-venues.json", "utf8").then(JSON.parse),
  fs.readFile("data/venue-images.json", "utf8").then(JSON.parse),
  fs.readFile("data/venue-image-sources.json", "utf8").then(JSON.parse),
  fs.readFile("data/restaurants.json", "utf8").then(JSON.parse),
]);

const genericPattern = /(?:images?\.)?(?:unsplash|pexels|pixabay)\./i;
const nonPhotoPattern = /(?:logo|icon|favicon|sprite|avatar|badge|placeholder|tracking|pixel|loader|spinner|tripadvisor|blank|flags?\/|flag[-_.]|quote[-_.]|star\.png|promo-domains|scroll-vertical|ico[-_.])/i;
const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const failures = [];

function auditOwners(entries, label) {
  const owner = new Map();
  let images = 0;
  for (const { id, urls, source } of entries) {
    if (!/^https?:\/\//i.test(source || "")) failures.push(`${label} ${id}: missing official source`);
    for (const url of urls) {
      images += 1;
      if (!/^https?:\/\//i.test(url)) failures.push(`${label} ${id}: invalid image URL ${url}`);
      if (genericPattern.test(url)) failures.push(`${label} ${id}: generic stock image ${url}`);
      if (nonPhotoPattern.test(decodeURIComponent(new URL(url).pathname))) failures.push(`${label} ${id}: non-photo asset ${url}`);
      const prior = owner.get(url);
      if (prior && prior !== id) failures.push(`${label}: ${url} is owned by both ${prior} and ${id}`);
      owner.set(url, id);
    }
  }
  return { units: entries.length, images, uniqueUrls: owner.size };
}

// Match the runtime de-duplication so the report counts actual catalog units.
const seenSites = new Set();
const seenNames = new Set();
const venueUnits = [...venues, ...extraVenues].filter((venue) => {
  let site = "";
  try {
    const url = new URL(venue.website_url || venue.source_url || "");
    site = `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {}
  const place = venue.destination_code || venue.destination;
  const siteKey = site ? `${place}|${site}` : "";
  const nameKey = `${place}|${normalize(venue.name).replace(/[^a-z0-9]+/g, "")}`;
  if ((siteKey && seenSites.has(siteKey)) || seenNames.has(nameKey)) return false;
  if (siteKey) seenSites.add(siteKey);
  seenNames.add(nameKey);
  return true;
});

const venueEntries = venueUnits.flatMap((venue) => {
  const urls = Array.isArray(venueImages[venue.venue_id]) ? venueImages[venue.venue_id] : [];
  if (!urls.length) return [];
  return [{ id: venue.venue_id, urls, source: venueSources.venues?.[venue.venue_id]?.source }];
});
const restaurantRows = Object.values(restaurantCatalog.destinations || {}).flatMap((destination) => destination.restaurants || []);
const restaurantEntries = restaurantRows.flatMap((restaurant) => {
  const urls = Array.isArray(restaurant.images) ? restaurant.images : [];
  if (!urls.length) return [];
  return [{ id: restaurant.placeId, urls, source: restaurant.imageSource }];
});

const report = {
  generatedAt: new Date().toISOString(),
  policy: "Only exact-unit images with an official source are publishable. Generic stock images and cross-unit URL reuse are forbidden.",
  venues: {
    catalogUnits: venueUnits.length,
    publishableUnits: venueEntries.length,
    heldBackUntilVerified: venueUnits.length - venueEntries.length,
    ...auditOwners(venueEntries, "venue"),
  },
  restaurants: {
    catalogUnits: restaurantRows.length,
    publishableUnits: restaurantEntries.length,
    heldBackUntilVerified: restaurantRows.length - restaurantEntries.length,
    ...auditOwners(restaurantEntries, "restaurant"),
  },
  failures,
};

await fs.writeFile("data/image-integrity-audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
