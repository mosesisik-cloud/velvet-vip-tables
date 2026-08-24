import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const picks = {
  IBZ: ["Lío Ibiza", "Casa Maca", "La Paloma Ibiza"],
  MYK: ["Scorpios Mykonos", "NAMMOS Mykonos", "Zuma Mykonos"],
  DXB: ["Zuma Dubai", "COYA Dubai", "Ossiano"],
  MRB: ["Mamzel Marbella", "Nobu Marbella", "Skina"],
  STT: ["Club 55", "Gigi Ramatuelle", "Verde Beach"],
  MCO: ["Amazonico Monte-Carlo", "Pavyllon Monte-Carlo", "Le Louis XV"],
  CNS: ["La Guérite Cannes", "Baoli Cannes", "La Môme Plage"],
  BDR: ["Lucca by the Sea", "Zuma Bodrum", "Mimoza Gümüşlük"],
  HKT: ["PRU", "Acqua Restaurant Phuket", "Suay Cherngtalay"],
  BKK: ["Gaggan at Louis Vuitton", "Sorn", "Le Du"],
  BAL: ["Locavore NXT", "Apéritif Restaurant", "Mozaic Ubud"],
  MIA: ["MILA Miami", "COTE Miami", "Joe's Stone Crab"],
  LAS: ["SW Steakhouse", "Joël Robuchon Las Vegas", "Spago Las Vegas"],
  TUL: ["Hartwood", "ARCA Tulum", "Gitano Tulum"],
  BCN: ["Disfrutar", "Lasarte", "Cocina Hermanos Torres"],
  CER: ["Billionaire Porto Cervo", "Zuma Porto Cervo", "Matsuhisa Cala di Volpe"],
  HVA: ["Gariful", "Dalmatino Hvar", "Black Pepper Hvar"],
  ATH: ["Delta Restaurant", "Varoulko Seaside", "Island Athens Riviera"],
  IST: ["Mikla", "Neolokal", "TURK Fatih Tutak"],
  CAP: ["Da Paolino", "Il Riccio", "Aurora Capri"],
  AMF: ["Don Alfonso 1890", "La Sponda", "Rossellinis"],
  LON: ["CORE by Clare Smyth", "Gymkhana", "The Ledbury"],
  PAR: ["Plénitude", "Arpège", "Septime"],
  SIN: ["Odette", "Les Amis", "Burnt Ends"],
  LAX: ["Providence", "n/naka", "Spago Beverly Hills"],
  NYC: ["Le Bernardin", "Eleven Madison Park", "Atomix"],
  ASP: ["Matsuhisa Aspen", "Cache Cache Aspen", "Bosq"],
  CRV: ["Le 1947 à Cheval Blanc", "Baumanière 1850", "Bagatelle Courchevel"],
  SBH: ["Bonito Saint Barth", "Tamarin St Barth", "Le Toiny Restaurant"],
  PDE: ["Parador La Huella", "Fasano Punta del Este", "La Susana"],
};

const destinations = JSON.parse(fs.readFileSync(path.join(root, "data/destinations.json"), "utf8"));
const venues = ["venues.json", "unlisted-venues.json"].flatMap((f) => JSON.parse(fs.readFileSync(path.join(root, `data/${f}`), "utf8")));
const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slug = (s) => norm(s).replace(/ /g, "-");
const destinationsOut = {};
for (const d of destinations) {
  const names = picks[d.code];
  if (!names?.length) throw new Error(`Missing restaurant picks for ${d.code}`);
  destinationsOut[d.code] = {
    destination: d.name,
    country: d.country,
    fetchedAt: null,
    source: "VELVET curated · official links where verified",
    restaurants: names.map((name) => {
      const wanted = norm(name);
      const known = venues.find((v) => {
        const got = norm(v.name);
        return got === wanted || got.includes(wanted) || wanted.includes(got);
      });
      return {
        placeId: `curated-${d.code}-${slug(name)}`,
        name,
        rating: null,
        reviewCount: 0,
        address: `${d.name}, ${d.country}`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${d.name}`)}`,
        website: /^https:\/\//i.test(known?.website_url || "") ? known.website_url : "",
        primaryType: "restaurant",
        source: "VELVET curated",
        curated: true,
      };
    }),
  };
}
const payload = { fetchedAt: null, minimumRating: 3.8, maxPerDestination: 20, mode: "curated-no-google-rating", destinations: destinationsOut };
fs.writeFileSync(path.join(root, "data/restaurants.json"), JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote ${Object.keys(destinationsOut).length} destinations and ${Object.values(destinationsOut).reduce((n, d) => n + d.restaurants.length, 0)} restaurants`);
