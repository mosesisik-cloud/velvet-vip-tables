import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, "data", name), "utf8"));
const write = (name, value) => fs.writeFileSync(path.join(root, "data", name), JSON.stringify(value, null, name === "venues.json" ? 1 : 2) + "\n");

const additions = [
  { code:"TYO", name:"Tokyo", country:"Japan", region:"Asia", lat:35.6762, lng:139.6503, season:"Mar-May · Sep-Nov", clubs:[["WOMB Tokyo","https://www.womb.co.jp/en/"],["Zouk Tokyo","https://www.zoukgrouptky.com/"]], restaurants:[["NARISAWA","https://www.narisawa-yoshihiro-en.com/"],["Den","https://www.jimbochoden.com/"],["Florilège","https://www.aoyama-florilege.jp/"]] },
  { code:"HKG", name:"Hong Kong", country:"Hong Kong", region:"Asia", lat:22.3193, lng:114.1694, season:"Oct-Dec", clubs:[["Dragon-i","https://www.dragon-i.com.hk/"],["Cassio","https://www.cassiosocialclub.com/"]], restaurants:[["Amber","https://www.landmarkmandarinoriental.com/en/dine/amber"],["Caprice","https://www.fourseasons.com/hongkong/dining/restaurants/caprice/"],["The Chairman","https://www.thechairmangroup.com/"]] },
  { code:"SYD", name:"Sydney", country:"Australia", region:"Oceania", lat:-33.8688, lng:151.2093, season:"Oct-Apr", clubs:[["Home The Venue","https://www.homesydney.com/"],["ivy","https://merivale.com/venues/ivy/"]], restaurants:[["Quay","https://www.quay.com.au/"],["Bennelong","https://www.bennelong.com.au/"],["Saint Peter","https://www.saintpeter.com.au/"]] },
  { code:"CPT", name:"Cape Town", country:"South Africa", region:"Africa", lat:-33.9249, lng:18.4241, season:"Nov-Mar", clubs:[["Cabo Beach Club","https://cabobeachclub.co.za/"],["The Athletic Club & Social","https://theathletic.co.za/"]], restaurants:[["FYN","https://fynrestaurant.com/"],["La Colombe","https://www.lacolombe.restaurant/"],["Salsify at the Roundhouse","https://salsify.co.za/"]] },
  { code:"RIO", name:"Rio de Janeiro", country:"Brazil", region:"South America", lat:-22.9068, lng:-43.1729, season:"Dec-Mar", clubs:[["Rio Scenarium","https://www.rioscenarium.com.br/"],["Fosfobox","https://fosfobox.com.br/"]], restaurants:[["Oteque","https://www.oteque.com/"],["Lasai","https://lasai.com.br/"],["Oro","https://ororestaurante.com.br/"]] },
  { code:"CDM", name:"Mexico City", country:"Mexico", region:"North America", lat:19.4326, lng:-99.1332, season:"Mar-May · Oct-Nov", clubs:[["Departamento","https://departamento.co/"],["LooLoo","https://looloo.mx/"]], restaurants:[["Pujol","https://pujol.com.mx/"],["Quintonil","https://quintonil.com/"],["Rosetta","https://rosetta.com.mx/"]] },
  { code:"LIS", name:"Lisbon", country:"Portugal", region:"Europe", lat:38.7223, lng:-9.1393, season:"Apr-Oct", clubs:[["Lux Frágil","https://www.luxfragil.com/"],["K Urban Beach","https://www.kurbanbeach.com/"]], restaurants:[["Belcanto","https://belcanto.pt/"],["Alma","https://www.almalisboa.pt/"],["CURA","https://www.fourseasons.com/lisbon/dining/restaurants/cura/"]] },
  { code:"AMS", name:"Amsterdam", country:"Netherlands", region:"Europe", lat:52.3676, lng:4.9041, season:"Apr-Oct", clubs:[["Shelter Amsterdam","https://www.shelteramsterdam.nl/"],["Lofi Amsterdam","https://lofi.amsterdam/"]], restaurants:[["De Kas","https://restaurantdekas.com/"],["Ciel Bleu","https://www.cielbleu.nl/"],["RIJKS","https://www.rijksrestaurant.nl/"]] },
];

const destinations = read("destinations.json");
const venues = read("venues.json");
const restaurants = read("restaurants.json");
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

for (const d of additions) {
  if (!destinations.some((x) => x.code === d.code)) destinations.push({ code:d.code, name:d.name, country:d.country, region:d.region, tier:"Tier 2", luxury:5, party:4, shareability:4, peak_season:d.season, use_cases:"Nightclubs, luxury dining, city weekends", note:"Global expansion city", lat:d.lat, lng:d.lng });
  d.clubs.forEach(([name, website], i) => {
    const id = `${d.code}-${String(i + 1).padStart(3, "0")}`;
    if (!venues.some((v) => v.venue_id === id)) venues.push({ venue_id:id, destination:d.name, destination_code:d.code, name, category:"Nightclub", website_url:website, instagram_url:"", vip_table_potential:true, shareable_format:true, luxury_score:5, party_score:5, shareability_score:4, booking_potential:4, research_status:"Web-verified", notes:"Official website verified", source_url:website, priority_score:92 - i, booking_system:"official-site" });
  });
  restaurants.destinations[d.code] = { destination:d.name, country:d.country, fetchedAt:null, source:"VELVET curated · official websites", restaurants:d.restaurants.map(([name, website]) => ({ placeId:`curated-${d.code}-${slug(name)}`, name, rating:null, reviewCount:0, address:`${d.name}, ${d.country}`, mapsUrl:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${d.name}`)}`, website, primaryType:"restaurant", source:"VELVET curated · official website", curated:true })) };
}

write("destinations.json", destinations);
write("venues.json", venues);
write("restaurants.json", restaurants);
console.log(`${destinations.length} destinations · ${venues.length} venues · ${Object.values(restaurants.destinations).reduce((n, d) => n + d.restaurants.length, 0)} restaurants`);
