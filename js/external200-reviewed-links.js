// Independently reviewed source -> destination bindings, 16 October 2026.
// Deliberately NOT generated from audit rows. Changing a destination requires
// evidence review here as well as in the corresponding group decision.
const reviewed = {
  'osm-MIA-pummarola-coral-gable': ['https://www.pummarola.us/reservations', 'https://www.pummarola.us/reservations'],
  'curated-SBH-bonito-saint-barth': ['https://www.bonitosbh.com/', 'https://www.sevenrooms.com/reservations/bonitostbarth'],
  'osm-SBH-bonito': ['https://www.bonitosbh.com/', 'https://www.sevenrooms.com/reservations/bonitostbarth'],
  'osm-SBH-eddy-s': ['https://eddysghetto.com/', 'https://eddysghetto.com/'],
  'osm-BDR-musto-bistro': ['https://www.mustorestaurantbistro.com/', 'https://www.mustorestaurantbistro.com/'],
  'osm-BDR-yelken-bal-k': ['https://www.yelkenbalik.com.tr/iletisim', 'https://www.yerimhazir.com/isletme/yelken-balik-bodrum/373'],
  'osm-DXB-carluccio-s': ['https://carlucciosme.com/locations/the-dubai-mall/', 'https://eatapp.co/reserve/carluccio-s-the-dubai-mall-049b9a'],
  'osm-DXB-shang-palace': ['https://www.shangri-la.com/ru/dubai/shangrila/offer-detail/dining/experience-shang-palace/', 'https://www.sevenrooms.com/reservations/shangpalacedubai'],
  'osm-HKT-uf6b9db1d32b4': ['https://www.rayarestaurant.net/', 'https://www.rayarestaurant.net/'],
  'curated-IST-mikla': ['https://www.miklarestaurant.com/rezervasyon', 'https://www.miklarestaurant.com/rezervasyon'],
  'curated-IST-neolokal': ['https://www.neolokal.com/en/neolokal_en/', 'https://guest.rezervem.com.tr/Neolokal/?sourceId=webSite&culture=en-US'],
  'curated-IST-turk-fatih-tutak': ['https://turkft.com/reservation', 'https://rezervasyon.turkft.com/turk-fatih-tutak/reservation'],
  'osm-SBH-bagatelle': ['https://bagatelle.com/venues/st-barths/booking/', 'https://www.sevenrooms.com/reservations/bagatellestbarth'],
  'osm-SBH-black-ginger': ['https://blackgingersbh.com/en/reservations/', 'https://blackgingersbh.com/en/reservations/'],
  'osm-SBH-fishcorner': ['https://www.fishcornerstbarth.com/en/book-online', 'https://bookings.zenchef.com/results?pid=1001&rid=388090'],
  'osm-SBH-la-guerite': ['https://www.restaurantlaguerite.com/saint-barth-gustavia/', 'https://www.sevenrooms.com/reservations/lagueritedb'],
  'osm-SBH-la-petite-plage': ['https://www.restaurant-lapetiteplage.com/saint-barthelemy', 'https://www.sevenrooms.com/reservations/lapetiteplagesaintbarth'],
  'osm-SBH-le-cafe': ['https://www.lecafe.fr/en/saint-barthelemy-restaurant', 'https://www.sevenrooms.com/reservations/lecafesaintbarth'],
  'osm-SBH-sella': ['https://sellasaintbarth.com/fr/', 'https://www.sevenrooms.com/reservations/restaurantsella'],
};
for (const binding of Object.values(reviewed)) Object.freeze(binding);
Object.freeze(reviewed);

// Explicit table-booking contacts, independently checked in the group reviews.
const contacts = {
  'osm-BAL-seaweed': ['whatsapp', '+628113700916', 'https://linktr.ee/seaweedcanggubali'],
  'osm-BDR-kalamare': ['phone', '+902523167076', 'https://www.kalamarebodrum.com/iletisim/'],
  'osm-BDR-musto-bistro': ['whatsapp', '+905332027575', 'https://www.mustorestaurantbistro.com/'],
  'osm-BDR-red-dragon': ['phone', '+902523168537', 'https://www.reddragon.com.tr/'],
  'osm-BDR-the-place': ['phone', '+905433708384', 'https://theplacerestaurant.eatbu.com/?lang=en'],
  'osm-BDR-yelken-bal-k': ['phone', '+905322578252', 'https://www.yelkenbalik.com.tr/iletisim'],
  'osm-DXB-karma-kafe': ['whatsapp', '+971585772863', 'https://karma-dubai.com/'],
  'osm-DXB-shang-palace': ['email', 'fbreservations.sldb@shangri-la.com', 'https://www.shangri-la.com/ru/dubai/shangrila/offer-detail/dining/experience-shang-palace/'],
  'osm-HKT-u0bb8a4bb7e3a': ['line', '@maimornforest', 'https://www.maimornforest.com/contact-us.php'],
  'osm-HKT-uf6b9db1d32b4': ['email', 'reservation.raya@gmail.com', 'https://www.rayarestaurant.net/'],
  'osm-IST-gumus-kanat': ['phone', '+902126444162', 'https://gumuskanat.eatbu.com/?lang=en'],
  'curated-SBH-bonito-saint-barth': ['email', 'booking@bonitosbh.com', 'https://www.bonitosbh.com/'],
  'curated-SBH-le-toiny-restaurant': ['email', 'restaurant@letoiny.com', 'https://letoiny.com/'],
  'curated-SBH-tamarin-st-barth': ['email', 'info@tamarinstbarth.com', 'https://tamarinstbarth.com/contact/'],
  'osm-SBH-bonito': ['email', 'booking@bonitosbh.com', 'https://www.bonitosbh.com/'],
  'osm-SBH-eddy-s': ['phone', '+590590275417', 'https://eddysghetto.com/'],
  'osm-SBH-fishcorner': ['phone', '+590590513633', 'https://www.fishcornerstbarth.com/en/book-online'],
  'osm-SBH-l-isoletta': ['phone', '+590590520202', 'https://www.isolettastbarth.com/contact'],
};
for (const binding of Object.values(contacts)) Object.freeze(binding);
Object.freeze(contacts);
const statusSources = Object.freeze({
  'osm-DXB-rowley-s': 'https://rowleysrestaurants.com/pages-dubai/',
  'osm-SBH-natural-delights': 'https://naturaldelights-stbarth.fr/contact/',
  'osm-SBH-shellona': 'https://www.hotelsbarriere.com/collection-fouquet-s/saint-barth/restaurants-et-bars',
});

export function resolveExternal200ReviewedContact(id, candidate) {
  if (!candidate || !Object.hasOwn(contacts, id)) return null;
  const [type,value,source] = contacts[id];
  return candidate.type === type && candidate.value === value && candidate.source === source
    ? Object.freeze({type,value,source}) : null;
}

export function resolveExternal200ReviewedSource(id, source) {
  const allowed = [
    Object.hasOwn(reviewed,id) ? reviewed[id][0] : null,
    Object.hasOwn(contacts,id) ? contacts[id][2] : null,
    Object.hasOwn(statusSources,id) ? statusSources[id] : null,
  ];
  return typeof source === 'string' && allowed.includes(source) ? source : null;
}

export function resolveExternal200ReviewedLink(restaurantId, source, destination) {
  if (!Object.hasOwn(reviewed, restaurantId)) return null;
  const [approvedSource, approvedDestination] = reviewed[restaurantId];
  // Exact strings include all venue identity and query parameters. No arbitrary
  // same-host, same-provider, alternate-ID, redirect or query expansion is allowed.
  if (source !== approvedSource || destination !== approvedDestination) return null;
  for (const value of [source, destination]) {
    try { const u = new URL(value); if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash) return null; }
    catch { return null; }
  }
  return Object.freeze({source:approvedSource, url:approvedDestination,
    selection: restaurantId === 'osm-MIA-pummarola-coral-gable' ? Object.freeze({branch:'Coral Gables', reservationType:'Dine-In Reservation'}) : null,
    bookingMode: ['osm-MIA-pummarola-coral-gable','osm-SBH-eddy-s'].includes(restaurantId) ? 'request_only' : null});
}
