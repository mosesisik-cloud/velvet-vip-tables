import crypto from 'node:crypto';

// Native form contract observed read-only; submission is disabled by default.
// Supported fixed scopes use explicit approval and journal-backed submission.
// Never wire fixture mode to a public server or count its result as a booking.
export const ZENCHEF_ARPEGE = Object.freeze({
  restaurantId: 'curated-PAR-arpege', venueId: '354036', name: 'Arpège',
  url: 'https://bookings.zenchef.com/results?rid=354036&lang=fr',
  timezone: 'Europe/Paris', minParty: 1, maxParty: 6,
});
export const ZENCHEF_FISHCORNER = Object.freeze({ restaurantId: 'osm-SBH-fishcorner', venueId: '388090', name: 'Fish Corner',
  url: 'https://bookings.zenchef.com/results?rid=388090&lang=fr', timezone: 'America/Guadeloupe', minParty: 2, maxParty: 2,
  shiftId: 545372, source: 'https://www.fishcornerstbarth.com/en/book-online' });
export const ZENCHEF_PESQUIERE = Object.freeze({ restaurantId: 'osm-STT-la-pesquiere-le-mazagran-et-lou-revelen',
  venueId: '362908', name: 'La PeSQui\u00e8re, Le Mazagran et Lou Revelen',
  url: 'https://bookings.zenchef.com/results?rid=362908&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 136503, source: 'https://www.lapesquiere.fr/contact-restaurant-a-saint-tropez-dans-le-var-83/',
  policySource: 'https://bookings.zenchef.com/gtc?rid=362908&lang=fr',
  rooms: Object.freeze([Object.freeze({ id: 51183, name: 'La Pesquiere' }),
    Object.freeze({ id: 52372, name: 'Mazagran salle' }), Object.freeze({ id: 52373, name: 'Mazagran terrasse' })]) });
// Registry ID retains its legacy MCO prefix; this venue is physically in Nice.
export const ZENCHEF_PIROUETTE = Object.freeze({ restaurantId: 'osm-MCO-pirouette', venueId: '363313', name: 'Pirouette',
  url: 'https://bookings.zenchef.com/results?rid=363313&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 189024, source: 'https://lesagitateurs.com/pirouette',
  policySource: 'https://bookings.zenchef.com/gtc?rid=363313&lang=fr',
  rooms: Object.freeze([Object.freeze({ id: 52521, name: 'Salle principale' }), Object.freeze({ id: 65674, name: 'Terasse' })]) });
// Native offers have no meal price. Saved booking_offers proves IDs/count;
// descriptions and unpriced terms are bound separately in our approval.
export const ZENCHEF_DEKAS = Object.freeze({ restaurantId: 'curated-AMS-de-kas', venueId: '386643', name: 'Restaurant De Kas',
  url: 'https://bookings.zenchef.com/results?rid=386643&lang=en', timezone: 'Europe/Amsterdam', minParty: 2, maxParty: 2,
  shiftId: 494748, offerId: 118785, source: 'https://restaurantdekas.com/eng/reservations-',
  menuSource: 'https://restaurantdekas.com/eng/menu', policySource: 'https://bookings.zenchef.com/gtc?rid=386643&lang=en' });
export const ZENCHEF_BOFINGER = Object.freeze({ restaurantId: 'curated-PAR-bofinger', venueId: '84941', name: 'Bofinger',
  url: 'https://bookings.zenchef.com/results?rid=84941&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 19170, source: 'https://www.bofingerparis.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=84941&lang=fr' });
export const ZENCHEF_LACOUPOLE = Object.freeze({ restaurantId: 'curated-PAR-la-coupole', venueId: '83871', name: 'La Coupole',
  url: 'https://bookings.zenchef.com/results?rid=83871&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 20148, source: 'https://www.lacoupole-paris.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=83871&lang=fr' });
export const ZENCHEF_TERMINUSNORD = Object.freeze({ restaurantId: 'curated-PAR-terminus-nord', venueId: '82241', name: 'Terminus Nord',
  url: 'https://bookings.zenchef.com/results?rid=82241&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 19380, source: 'https://www.terminusnord.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=82241&lang=fr' });
export const ZENCHEF_PROCOPE = Object.freeze({ restaurantId: 'curated-PAR-le-procope', venueId: '250682', name: 'Le Procope',
  url: 'https://bookings.zenchef.com/results?rid=250682&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 18190, source: 'https://www.procope.com/o/reserver/?no_redirect=true', policySource: 'https://bookings.zenchef.com/gtc?rid=250682&lang=fr' });
export const ZENCHEF_LALORRAINE = Object.freeze({ restaurantId: 'curated-PAR-la-lorraine', venueId: '478', name: 'La Lorraine',
  url: 'https://bookings.zenchef.com/results?rid=478&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 16674, source: 'https://www.brasserielalorraine.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=478&lang=fr' });
export const ZENCHEF_PIEDDECOCHON = Object.freeze({ restaurantId: 'curated-PAR-au-pied-de-cochon', venueId: '247', name: 'Au Pied de Cochon',
  url: 'https://bookings.zenchef.com/results?rid=247&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 29, source: 'https://www.pieddecochon.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=247&lang=fr' });
export const ZENCHEF_GRANDCAFE = Object.freeze({ restaurantId: 'curated-PAR-le-grand-cafe-capucines', venueId: '101232', name: 'Le Grand Café Capucines',
  url: 'https://bookings.zenchef.com/results?rid=101232&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 19590, source: 'https://www.legrandcafe.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=101232&lang=fr' });
export const ZENCHEF_VAGENENDE = Object.freeze({ restaurantId: 'curated-PAR-brasserie-vagenende', venueId: '356807', name: 'Brasserie Vagenende',
  url: 'https://bookings.zenchef.com/results?rid=356807&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 63972, source: 'https://www.vagenende.com/reserver', policySource: 'https://bookings.zenchef.com/gtc?rid=356807&lang=fr' });
export const ZENCHEF_BOUILLONJULIEN = Object.freeze({ restaurantId: 'curated-PAR-bouillon-julien', venueId: '350246', name: 'Bouillon Julien',
  url: 'https://bookings.zenchef.com/results?rid=350246&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 12711, source: 'https://www.bouillon-julien.com/rserver', policySource: 'https://bookings.zenchef.com/gtc?rid=350246&lang=fr' });
export const ZENCHEF_BOUILLONRACINE = Object.freeze({ restaurantId: 'curated-PAR-bouillon-racine', venueId: '132', name: 'Bouillon Racine',
  url: 'https://bookings.zenchef.com/results?rid=132&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 93989, source: 'https://www.bouillonracine.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=132&lang=fr' });
export const ZENCHEF_BOUILLONREPUBLIQUE = Object.freeze({ restaurantId: 'curated-PAR-bouillon-republique', venueId: '357115', name: 'Bouillon République',
  url: 'https://bookings.zenchef.com/results?rid=357115&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 528175, lunchTimes: Object.freeze(['11:30','12:00','12:30','13:00','13:30','14:00','14:30']), source: 'https://bouillonlesite.com/reservation', policySource: 'https://bookings.zenchef.com/gtc?rid=357115&lang=fr' });
export const ZENCHEF_ROSIE = Object.freeze({ restaurantId: 'curated-PAR-brasserie-rosie', venueId: '355132', name: 'Brasserie Rosie',
  url: 'https://bookings.zenchef.com/results?rid=355132&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 43203, source: 'https://brasseriesalamode.com/brasserie-rosie', policySource: 'https://bookings.zenchef.com/gtc?rid=355132&lang=fr' });
export const ZENCHEF_ROSIELOU = Object.freeze({ restaurantId: 'curated-PAR-brasserie-rosie-lou', venueId: '361941', name: 'Brasserie Rosie Lou',
  url: 'https://bookings.zenchef.com/results?rid=361941&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 118503, source: 'https://brasseriesalamode.com/brasserie-rosie-lou', policySource: 'https://bookings.zenchef.com/gtc?rid=361941&lang=fr' });
export const ZENCHEF_ROSIEJOLIE = Object.freeze({ restaurantId: 'curated-PAR-brasserie-rosie-jolie', venueId: '376490', name: 'Brasserie Rosie Jolie',
  url: 'https://bookings.zenchef.com/results?rid=376490&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 298043, source: 'https://brasseriesalamode.com/brasserie-rosie-jolie', policySource: 'https://bookings.zenchef.com/gtc?rid=376490&lang=fr' });
export const ZENCHEF_PETITSOMMELIER = Object.freeze({ restaurantId: 'curated-PAR-le-petit-sommelier', venueId: '1404', name: 'Le Petit Sommelier',
  url: 'https://bookings.zenchef.com/results?rid=1404&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 37613, source: 'https://www.lepetitsommelierdeparis.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=1404&lang=fr' });
export const ZENCHEF_CHEZSAVY = Object.freeze({ restaurantId: 'curated-PAR-chez-savy', venueId: '357117', name: 'Chez Savy',
  url: 'https://bookings.zenchef.com/results?rid=357117&fullscreen=1&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 68279, source: 'https://lcep.fr/savy/', policySource: 'https://bookings.zenchef.com/gtc?rid=357117&lang=fr' });
export const ZENCHEF_CHEZRENE = Object.freeze({ restaurantId: 'curated-PAR-chez-rene', venueId: '357076', name: 'Chez René',
  url: 'https://bookings.zenchef.com/results?rid=357076&fullscreen=1&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 68277, source: 'https://lcep.fr/chez-rene/', policySource: 'https://bookings.zenchef.com/gtc?rid=357076&lang=fr' });
export const ZENCHEF_BISTROTPARIS = Object.freeze({ restaurantId: 'curated-PAR-le-bistrot-de-paris', venueId: '357075', name: 'Le Bistrot de Paris',
  url: 'https://bookings.zenchef.com/results?rid=357075&fullscreen=1&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 68145, source: 'https://lcep.fr/le-bistrot-de-paris/', policySource: 'https://bookings.zenchef.com/gtc?rid=357075&lang=fr' });
export const ZENCHEF_AUXBONSCRUS = Object.freeze({ restaurantId: 'curated-PAR-aux-bons-crus', venueId: '352718', name: 'Aux Bons Crus',
  url: 'https://bookings.zenchef.com/results?rid=352718&fullscreen=1&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 20711, source: 'https://auxbonscrus.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=352718&lang=fr' });
export const ZENCHEF_AUXCRUSBOURGOGNE = Object.freeze({ restaurantId: 'curated-PAR-aux-crus-de-bourgogne', venueId: '352723', name: 'Aux Crus de Bourgogne',
  url: 'https://bookings.zenchef.com/results?rid=352723&fullscreen=1&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 22200, source: 'https://auxcrusdebourgogne.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=352723&lang=fr' });
export const ZENCHEF_PETITRETRO = Object.freeze({ restaurantId: 'curated-PAR-le-petit-retro', venueId: '361808', name: 'Le Petit Rétro',
  url: 'https://bookings.zenchef.com/results?rid=361808&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 116623, source: 'https://www.petitretro.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=361808&lang=fr' });
export const ZENCHEF_MOULINVENT = Object.freeze({ restaurantId: 'curated-PAR-au-moulin-a-vent', venueId: '363128', name: 'Au Moulin à Vent',
  url: 'https://bookings.zenchef.com/results?rid=363128&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 139531, source: 'https://www.au-moulinavent.com/informations-contact/', policySource: 'https://bookings.zenchef.com/gtc?rid=363128&lang=fr' });
export const ZENCHEF_PETITPONTOISE = Object.freeze({ restaurantId: 'curated-PAR-le-petit-pontoise', venueId: '118', name: 'Le Petit Pontoise',
  url: 'https://bookings.zenchef.com/results?rid=118&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 9493, source: 'https://www.lepetitpontoise.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=118&lang=fr' });
export const ZENCHEF_LEFLORENTIN = Object.freeze({ restaurantId: 'curated-PAR-le-florentin', venueId: '376209', name: 'Le Florentin',
  url: 'https://bookings.zenchef.com/results?rid=376209&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 283681, source: 'https://leflorentinbistrot.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=376209&lang=fr' });
export const ZENCHEF_MARTHA = Object.freeze({ restaurantId: 'curated-PAR-martha-pizze-amore', venueId: '364490', name: 'Martha – Pizze Amore',
  url: 'https://bookings.zenchef.com/results?rid=364490&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 159369, source: 'https://marthapizzeamore.com/reservez-une-table/', policySource: 'https://bookings.zenchef.com/gtc?rid=364490&pid=1001&lang=fr' });
export const ZENCHEF_CAFEMARLY = Object.freeze({ restaurantId: 'curated-PAR-le-cafe-marly', venueId: '353937', name: 'Le Café Marly',
  url: 'https://bookings.zenchef.com/results?rid=353937&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 122853, source: 'https://www.cafe-marly.com/restaurant', policySource: 'https://bookings.zenchef.com/gtc?rid=353937&lang=fr' });
export const ZENCHEF_CAFERUC = Object.freeze({ restaurantId: 'curated-PAR-le-cafe-ruc', venueId: '353947', name: 'Le Café Ruc',
  url: 'https://bookings.zenchef.com/results?rid=353947&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 32216, source: 'https://www.caferuc.com/restaurant', policySource: 'https://bookings.zenchef.com/gtc?rid=353947&lang=fr' });
export const ZENCHEF_INDIANABONNENOUVELLE = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-bonne-nouvelle', venueId: '373444', name: 'Indiana Café Bonne Nouvelle',
  url: 'https://bookings.zenchef.com/results?rid=373444&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 253448, source: 'https://www.indianacafe.fr/restaurant/bonne-nouvelle', policySource: 'https://bookings.zenchef.com/gtc?rid=373444&pid=1001&lang=fr' });
export const ZENCHEF_INDIANARICHELIEU = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-richelieu-drouot', venueId: '375454', name: 'Indiana Café Richelieu-Drouot',
  url: 'https://bookings.zenchef.com/results?rid=375454&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 276858, source: 'https://www.indianacafe.fr/restaurant/richelieu-drouot', policySource: 'https://bookings.zenchef.com/gtc?rid=375454&pid=1001&lang=fr' });
export const ZENCHEF_INDIANABEAUGRENELLE = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-beaugrenelle', venueId: '375446', name: 'Indiana Café Beaugrenelle',
  url: 'https://bookings.zenchef.com/results?rid=375446&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 281252, source: 'https://www.indianacafe.fr/restaurant/beaugrenelle', policySource: 'https://bookings.zenchef.com/gtc?rid=375446&pid=1001&lang=fr' });
export const ZENCHEF_INDIANATOLBIAC = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-tolbiac', venueId: '373445', name: 'Indiana Café Tolbiac',
  url: 'https://bookings.zenchef.com/results?rid=373445&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 243266, source: 'https://www.indianacafe.fr/restaurant/club-tolbiac', policySource: 'https://bookings.zenchef.com/gtc?rid=373445&pid=1001&lang=fr' });
const NO_ROOM_LUNCH_VENUES = Object.freeze([ZENCHEF_BOFINGER, ZENCHEF_LACOUPOLE, ZENCHEF_TERMINUSNORD, ZENCHEF_PROCOPE, ZENCHEF_LALORRAINE, ZENCHEF_PIEDDECOCHON, ZENCHEF_GRANDCAFE, ZENCHEF_VAGENENDE, ZENCHEF_BOUILLONJULIEN, ZENCHEF_BOUILLONRACINE, ZENCHEF_BOUILLONREPUBLIQUE, ZENCHEF_ROSIE, ZENCHEF_ROSIELOU, ZENCHEF_ROSIEJOLIE, ZENCHEF_PETITSOMMELIER, ZENCHEF_CHEZSAVY, ZENCHEF_CHEZRENE, ZENCHEF_BISTROTPARIS, ZENCHEF_AUXBONSCRUS, ZENCHEF_AUXCRUSBOURGOGNE, ZENCHEF_PETITRETRO, ZENCHEF_MOULINVENT, ZENCHEF_PETITPONTOISE, ZENCHEF_LEFLORENTIN, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_CAFERUC, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC]);
const ROOM_VENUES = Object.freeze([ZENCHEF_PESQUIERE, ZENCHEF_PIROUETTE]);
const READBACK_VENUES = Object.freeze([...ROOM_VENUES, ZENCHEF_DEKAS, ...NO_ROOM_LUNCH_VENUES]);
export const ZENCHEF_POLICY_SOURCE = 'https://bookings.zenchef.com/gtc?rid=388090&lang=fr';
const VENUES = Object.freeze({ [ZENCHEF_INDIANATOLBIAC.restaurantId]: ZENCHEF_INDIANATOLBIAC, [ZENCHEF_INDIANABEAUGRENELLE.restaurantId]: ZENCHEF_INDIANABEAUGRENELLE, [ZENCHEF_INDIANARICHELIEU.restaurantId]: ZENCHEF_INDIANARICHELIEU, [ZENCHEF_INDIANABONNENOUVELLE.restaurantId]: ZENCHEF_INDIANABONNENOUVELLE, [ZENCHEF_CAFERUC.restaurantId]: ZENCHEF_CAFERUC, [ZENCHEF_CAFEMARLY.restaurantId]: ZENCHEF_CAFEMARLY, [ZENCHEF_MARTHA.restaurantId]: ZENCHEF_MARTHA, [ZENCHEF_LEFLORENTIN.restaurantId]: ZENCHEF_LEFLORENTIN, [ZENCHEF_PETITPONTOISE.restaurantId]: ZENCHEF_PETITPONTOISE, [ZENCHEF_MOULINVENT.restaurantId]: ZENCHEF_MOULINVENT, [ZENCHEF_PETITRETRO.restaurantId]: ZENCHEF_PETITRETRO, [ZENCHEF_AUXCRUSBOURGOGNE.restaurantId]: ZENCHEF_AUXCRUSBOURGOGNE, [ZENCHEF_AUXBONSCRUS.restaurantId]: ZENCHEF_AUXBONSCRUS, [ZENCHEF_BISTROTPARIS.restaurantId]: ZENCHEF_BISTROTPARIS, [ZENCHEF_CHEZRENE.restaurantId]: ZENCHEF_CHEZRENE, [ZENCHEF_CHEZSAVY.restaurantId]: ZENCHEF_CHEZSAVY, [ZENCHEF_PETITSOMMELIER.restaurantId]: ZENCHEF_PETITSOMMELIER, [ZENCHEF_ROSIEJOLIE.restaurantId]: ZENCHEF_ROSIEJOLIE, [ZENCHEF_ROSIELOU.restaurantId]: ZENCHEF_ROSIELOU, [ZENCHEF_ROSIE.restaurantId]: ZENCHEF_ROSIE, [ZENCHEF_BOUILLONREPUBLIQUE.restaurantId]: ZENCHEF_BOUILLONREPUBLIQUE, [ZENCHEF_BOUILLONRACINE.restaurantId]: ZENCHEF_BOUILLONRACINE, [ZENCHEF_BOUILLONJULIEN.restaurantId]: ZENCHEF_BOUILLONJULIEN, [ZENCHEF_VAGENENDE.restaurantId]: ZENCHEF_VAGENENDE, [ZENCHEF_GRANDCAFE.restaurantId]: ZENCHEF_GRANDCAFE, [ZENCHEF_PIEDDECOCHON.restaurantId]: ZENCHEF_PIEDDECOCHON, [ZENCHEF_LALORRAINE.restaurantId]: ZENCHEF_LALORRAINE, [ZENCHEF_PROCOPE.restaurantId]: ZENCHEF_PROCOPE, [ZENCHEF_TERMINUSNORD.restaurantId]: ZENCHEF_TERMINUSNORD, [ZENCHEF_LACOUPOLE.restaurantId]: ZENCHEF_LACOUPOLE, [ZENCHEF_BOFINGER.restaurantId]: ZENCHEF_BOFINGER, [ZENCHEF_DEKAS.restaurantId]: ZENCHEF_DEKAS, [ZENCHEF_ARPEGE.restaurantId]: ZENCHEF_ARPEGE, [ZENCHEF_FISHCORNER.restaurantId]: ZENCHEF_FISHCORNER, [ZENCHEF_PESQUIERE.restaurantId]: ZENCHEF_PESQUIERE, [ZENCHEF_PIROUETTE.restaurantId]: ZENCHEF_PIROUETTE });
const FIXTURE_URL = 'https://zenchef-fixture.invalid/';
const TTL = 10 * 60_000;
const FIELDS = ['firstname', 'lastname', 'email', 'phone'];
const PROVIDER_FIELDS = Object.freeze({ firstname: '[data-testid="firstname-input"]',
  lastname: '[data-testid="lastname-input"]', email: '[data-testid="email-input"]', phone: '[data-testid="phone-input"]' });
export class ZenchefError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const bounded = async (operation, ms) => {
  let timer;
  try { return await Promise.race([Promise.resolve().then(operation), new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ZenchefError('deadline', 504)), ms);
  })]); } finally { clearTimeout(timer); }
};

// Exact native Fish Corner lunch request observed with POST aborted before wire.
// The provider enables review invitations by default, outside visible marketing
// controls. Remove those optional invitations; never add consent on the guest's behalf.
export function approvedZenchefPayload(body, approval) {
  const deKas = approval?.restaurantId === ZENCHEF_DEKAS.restaurantId;
  const keys = 'day nb_guests time lang firstname lastname civility country phone_number email comment custom_field custom_field_v2 customersheet offers partner_id type'.split(' ');
  const roomVenue = ROOM_VENUES.find(venue => venue.restaurantId === approval?.restaurantId);
  const roomRequired = !!roomVenue;
  if (roomRequired) keys.push('wish');
  const sheetKeys = 'firstname lastname civility phone email optins country lang'.split(' ');
  const exactKeys = (o, list) => o && typeof o === 'object' && !Array.isArray(o)
    && Object.keys(o).length === list.length && list.every(k => Object.hasOwn(o, k));
  const emptyArray = a => Array.isArray(a) && a.length === 0;
  if (!approval || !exactKeys(body, keys) || !exactKeys(body.customersheet, sheetKeys)) return null;
  if (roomRequired && (!roomVenue.rooms.some(room => room.id === approval.roomId && room.name === approval.roomName)
    || !exactKeys(body.wish, ['booking_room_id']) || body.wish.booking_room_id !== approval.roomId)) return null;
  const sheet = body.customersheet, phone = String(approval.phone).replace(/\s/g, '');
  if (body.day !== approval.date || body.time !== approval.time || body.nb_guests !== approval.party
    || body.lang !== (deKas ? 'en' : 'fr') || body.partner_id !== '1001' || body.type !== 'web' || body.comment !== ''
    || !exactKeys(body.custom_field, []) || !emptyArray(body.custom_field_v2) || !(deKas ? approvedDeKasOffers(body.offers, approval) : emptyArray(body.offers))
    || body.phone_number !== phone || sheet.phone !== phone || sheet.lang !== (deKas ? 'en' : 'fr')
    || !/^[a-z]{2}$/.test(approval.country || '') || !Array.isArray(sheet.optins)
    || sheet.optins.some(o => !exactKeys(o, ['type', 'value']) || !['review_mail', 'review_sms'].includes(o.type) || o.value !== true)) return null;
  for (const k of ['firstname', 'lastname', 'email', 'civility', 'country']) {
    if (body[k] !== approval[k]?.trim() || sheet[k] !== approval[k]?.trim()) return null;
  }
  return { ...body, customersheet: { ...sheet, optins: [] } };
}

function approvedDeKasOffers(offers, approval, saved = false) {
  const choice = approval?.offer;
  if (approval?.party !== 2 || !choice || choice.offerId !== ZENCHEF_DEKAS.offerId || choice.count !== 2
    || !/^[a-f0-9]{64}$/.test(choice.version || '') || !Array.isArray(offers) || offers.length !== 1) return false;
  const row = offers[0];
  return !!row && row.offer_id === choice.offerId && row.count === choice.count
    && (saved || (Object.keys(row).length === 2 && Object.hasOwn(row, 'offer_id') && Object.hasOwn(row, 'count')));
}

// Public form/thank_you bundles bind createdCustomerSheet.relatedBookingStatus
// to response.status and render confirmed ONLY for the literal "confirmed".
// This is a source-backed mapping; no successful live booking is claimed here.
export function zenchefBookingResult(status, data, approval = null) {
  if (status < 200 || status >= 300 || !data || typeof data !== 'object') return { status: 'unknown' };
  if (data.requires_action === true || data.charge) return { status: 'payment_required' };
  if (data.error || !/^[1-9]\d*$/.test(String(data.id)) || typeof data.uuid !== 'string' || !data.uuid) return { status: 'unknown' };
  // Room/offer confirmation always requires independent same-attempt readback.
  // Even a complete matching POST echo is not saved-booking evidence.
  if (READBACK_VENUES.some(venue => venue.restaurantId === approval?.restaurantId) && data.status === 'confirmed') return { status: 'unknown' };
  if (data.status === 'confirmed') return { status: 'confirmed', reference: String(data.id) };
  if (data.status === 'waiting') return { status: 'pending' };
  return { status: 'unknown' };
}

// Source: booking.getByUuid -> bookings/{uuid}; loadBookingWithUuid reads
// id/status/day/shift_date/time/nb_guests/wish.booking_room_id and
// booking_offers[].offer_id/count. UUID is obtained
// only from this attempt's native POST, never from client action parameters.
function ownReadbackUrl(created, approval) {
  if (!created || created.status !== 'confirmed' || created.error || created.charge || created.requires_action
    || !/^[1-9]\d*$/.test(String(created.id)) || typeof created.uuid !== 'string'
    || !/^[A-Za-z0-9_-]{8,128}$/.test(created.uuid)) return null;
  const venue = READBACK_VENUES.find(venue => venue.restaurantId === approval?.restaurantId);
  if (!venue
    || (created.wish?.booking_room_id !== undefined && created.wish.booking_room_id !== approval.roomId)
    || [['day', 'date'], ['shift_date', 'date'], ['time', 'time'], ['nb_guests', 'party']]
      .some(([field, key]) => created[field] !== undefined && created[field] !== approval[key])) return null;
  return `https://bookings-middleware.zenchef.com/bookings/${created.uuid}?restaurantId=${venue.venueId}`;
}
function savedBookingResult(status, data, binding) {
  const approval = binding.approval;
  if (status < 200 || status >= 300 || !data || data.error || data.charge || data.requires_action
    || String(data.id) !== binding.bookingId || data.status !== 'confirmed'
    || (data.uuid !== undefined && data.uuid !== binding.uuid)
    || (approval.restaurantId === ZENCHEF_DEKAS.restaurantId
      ? !approvedDeKasOffers(data.booking_offers, approval, true)
      : NO_ROOM_LUNCH_VENUES.some(v => v.restaurantId === approval.restaurantId)
        ? (data.wish?.booking_room_id != null || !Array.isArray(data.booking_offers) || data.booking_offers.length !== 0)
        : data.wish?.booking_room_id !== approval.roomId) || data.day !== approval.date
    || (data.shift_date != null && data.shift_date !== approval.date)
    || data.time !== approval.time || data.nb_guests !== approval.party) return { status: 'unknown' };
  return { status: 'confirmed', reference: binding.bookingId };
}
const attemptMatchesApproval = (attempt, approval) => !!attempt?.attemptId && !!attempt?.idempotencyKey
  && ['provider', 'restaurantId', 'sessionId', 'mode', 'phase', 'reviewFingerprint', 'date', 'time', 'party']
    .every(key => attempt[key] === approval[key])
  && (!NO_ROOM_LUNCH_VENUES.some(v => v.restaurantId === approval.restaurantId)
    || NO_ROOM_LUNCH_VENUES.some(v => v.restaurantId === approval.restaurantId && approval.shiftId === v.shiftId && attempt.details?.shiftId === v.shiftId))
  && (approval.restaurantId !== ZENCHEF_DEKAS.restaurantId || digest(attempt.details?.offer || null) === digest(approval.offer || null));

export function zenchefSearchUrl(query, venue = ZENCHEF_ARPEGE) {
  const { date, party } = query || {};
  const parsed = new Date(String(date) + 'T12:00:00Z');
  if (venue === ZENCHEF_ROSIEJOLIE && String(date).slice(5) >= '08-03' && String(date).slice(5) <= '08-23') throw new ZenchefError('summer_date_unsupported');
  if (venue === ZENCHEF_BOUILLONJULIEN && ['12-24', '12-25', '12-31'].includes(String(date).slice(5))) throw new ZenchefError('special_date_unsupported');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed)
    || parsed.toISOString().slice(0, 10) !== date || !Number.isInteger(party) || party < venue.minParty || party > venue.maxParty) {
    throw new ZenchefError('search_fields');
  }
  // day/pax are the provider's own public results-page parameters (2026-10-16).
  return venue.url + `&day=${date}&pax=${party}`;
}

export function zenchefFormUrl(selection, venue = ZENCHEF_ARPEGE) {
  const search = zenchefSearchUrl(selection, venue);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(selection.time)) throw new ZenchefError('time');
  if (venue === ZENCHEF_BOUILLONREPUBLIQUE && !venue.lunchTimes.includes(selection.time)) throw new ZenchefError('time_outside_lunch_scope');
  if (venue.rooms ? !venue.rooms.some(room => room.id === selection.roomId) : selection.roomId !== undefined) throw new ZenchefError('room_required_or_unverified');
  return search.replace('/results?', '/form?') + '&slot=' + encodeURIComponent(selection.time)
    + (venue.rooms ? '&room_id=' + selection.roomId : '');
}

// Public bundle and rendered form observed 2026-10-16. API reads remain pinned
// to the venue and selected month; authentication is the provider's normal GET.
// No alternate WAF route, token injection, quotation POST or payment resource.
export function allowedZenchefPreparationRequest(request, selection, venue = ZENCHEF_ARPEGE) {
  if (request.method() !== 'GET' || request.redirectedFrom()) return false;
  let expected, u;
  try { expected = zenchefFormUrl(selection, venue); if (venue === ZENCHEF_DEKAS) expected = expected.replace('/form?', '/offers?'); u = new URL(request.url()); } catch { return false; }
  if (request.resourceType() === 'document') return request.url() === expected;
  if (u.origin === 'https://bookings.zenchef.com' && !u.search) {
    return (request.resourceType() === 'script' && (/^\/_next\/static\/chunks\/[A-Za-z0-9_./-]+\.js$/.test(u.pathname)
      || (venue === ZENCHEF_DEKAS && /^\/_next\/static\/[A-Za-z0-9_-]+\/_(buildManifest|ssgManifest)\.js$/.test(u.pathname))))
      || ((request.resourceType() === 'stylesheet' || (venue === ZENCHEF_DEKAS && request.resourceType() === 'fetch')) && /^\/_next\/static\/css\/[A-Za-z0-9_.-]+\.css$/.test(u.pathname))
      || (request.resourceType() === 'font' && /^\/_next\/static\/media\/[A-Za-z0-9_.-]+\.(woff2?|ttf)$/.test(u.pathname))
      || (['fetch', 'xhr'].includes(request.resourceType()) && (venue === ZENCHEF_DEKAS ? /^\/locales\/(en|fr)\/(translation|validation)\.json$/ : /^\/locales\/fr\/(translation|validation)\.json$/).test(u.pathname));
  }
  if (u.origin !== 'https://bookings-middleware.zenchef.com' || !['fetch', 'xhr'].includes(request.resourceType())
    || u.hash || u.username || u.password || u.searchParams.getAll('restaurantId').length !== 1
    || u.searchParams.get('restaurantId') !== venue.venueId) return false;
  const keys = [...u.searchParams.keys()];
  if (new Set(keys).size !== keys.length) return false;
  if (u.pathname === '/getAuthToken') return keys.length === 1;
  if (u.pathname !== '/getAvailabilitiesSummary' || keys.length !== 3
    || !keys.every(k => ['restaurantId', 'date_begin', 'date_end'].includes(k))) return false;
  const month = selection.date.slice(0, 7);
  const last = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
  return u.searchParams.get('date_begin') === month + '-01' && u.searchParams.get('date_end') === month + '-' + last;
}

// Public client shouldPrepayShift uses pax >= min_guests; addOffer uses pax
// for is_same_for_all. computeOfferFromShiftAndSlot merges shift then slot.
// Scope stays one observed ordinary lunch, not every De Kas menu or shift.
function deKasChoice(state, shift, slot, query, inWindow) {
  const deposit = shift.prepayment_param;
  if (query.party !== 2 || state.currency !== 'EUR' || state.language !== 'en'
    || state.isRoomMandatory !== false || state.wish.room_id !== null
    || shift.id !== ZENCHEF_DEKAS.shiftId || shift.name !== 'Lunch'
    || shift.charge_param !== null || shift.confirmation?.is_auto !== true || shift.confirmation.is_auto_until !== null
    || shift.is_offer_required !== true || (shift.offer_required_from_pax !== null && shift.offer_required_from_pax !== 0)
    || deposit?.is_web_booking_askable !== true || deposit.min_guests !== 7 || query.party >= deposit.min_guests
    || deposit.charge_per_guests !== 5000 || deposit.deposit_type !== 'fixed') return null;
  const base = shift.offers?.filter(o => o.id === ZENCHEF_DEKAS.offerId);
  const rows = slot.offers?.filter(o => o.id === ZENCHEF_DEKAS.offerId);
  const catalog = state.offers?.find(o => o.id === ZENCHEF_DEKAS.offerId);
  if (base?.length !== 1 || rows?.length !== 1 || !catalog || catalog.is_active !== true
    || catalog.is_private !== false || catalog.has_prepayment !== false || catalog.has_duration !== false) return null;
  if (base[0].has_prepayment !== false || base[0].payment_type !== 'none' || base[0].charge_per_guests !== null) return null;
  const offer = { ...base[0], ...rows[0] }, config = offer.config;
  if (offer.has_prepayment !== false || offer.payment_type !== 'none' || offer.charge_per_guests !== null
    || offer.has_duration !== false || config?.is_same_for_all !== true || config.is_limited_to_pax !== true
    || !Number.isInteger(config.min_pax_available) || config.min_pax_available > query.party
    || (config.max_pax_available !== null && (!Number.isInteger(config.max_pax_available) || config.max_pax_available < query.party))
    || !Number.isFinite(offer.stock) || offer.stock < query.party || !offer.possible_guests?.includes(query.party)
    || !Array.isArray(offer.available_rooms?.[query.party]) || !offer.available_rooms[query.party].length
    || !inWindow(offer) || offer.name_translations?.en !== 'Lunch' || typeof offer.description?.en !== 'string'
    || !offer.description.en.trim()) return null;
  const choice = { offerId: offer.id, count: query.party, name: offer.name_translations.en,
    description: offer.description.en, currency: state.currency, mealPrice: null, priceStatus: 'not_provided_by_booking_form',
    menuSource: ZENCHEF_DEKAS.menuSource, depositApplies: false, depositMinGuests: deposit.min_guests,
    selectionSource: 'native_offer', submissionSupported: true };
  // Bind all source policy/stock/terms plus day/time/party, not just menu ID.
  choice.version = digest([query, shift.id, slot.name, offer, catalog, deposit, shift.confirmation, state.restaurantComment]);
  return choice;
}

// Current native form computes automatic = is_auto || pax <= is_auto_until.
// Pin the observed lunch threshold; do not generalize it to other restaurants.
export function bofingerPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BOFINGER.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 19170 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param?.is_web_booking_askable === false && shift.charge_param.min_guests === 6
    && shift.charge_param.charge_per_guests === 10 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 172800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}

export function laCoupolePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_LACOUPOLE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 20148 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function terminusNordPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_TERMINUSNORD.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 19380 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 12
    && shift.charge_param.charge_per_guests === 20 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function procopePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_PROCOPE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 18190 && shift.name === 'Déjeuner 1er service'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 4
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 86400
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function laLorrainePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_LALORRAINE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 16674 && shift.name === 'Service Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 8
    && shift.charge_param.charge_per_guests === 20 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 172800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function piedDeCochonPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_PIEDDECOCHON.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 29 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 5
    && shift.charge_param.charge_per_guests === 15 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 172800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function grandCafePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_GRANDCAFE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 19590 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 86400
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function vagenendePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_VAGENENDE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 63972 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 5
    && shift.charge_param.charge_per_guests === 25 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'booking';
}
export function bouillonJulienPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BOUILLONJULIEN.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 12711 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 8
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10860
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function bouillonRacinePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BOUILLONRACINE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 93989 && shift.name === 'Déjeuner 1 service'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function bouillonRepubliquePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BOUILLONREPUBLIQUE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 528175 && shift.name === 'Service du Vendredi'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 4
    && shift.charge_param.charge_per_guests === 4 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 21600
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function rosiePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_ROSIE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 43203 && shift.name === 'Midi Semaine'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 5
    && shift.charge_param.charge_per_guests === 10 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 21600
    && shift.cancelation_param.enduser_cancelable_reference === 'booking';
}
export function rosieLouPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_ROSIELOU.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 118503 && shift.name === 'Service midi semaine'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 5
    && shift.charge_param.charge_per_guests === 10 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 43200
    && shift.cancelation_param.enduser_cancelable_reference === 'booking';
}
export function rosieJoliePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_ROSIEJOLIE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 298043 && shift.name === 'DÉJEUNER'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 21600
    && shift.cancelation_param.enduser_cancelable_reference === 'booking';
}
export function petitSommelierPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_PETITSOMMELIER.venueId && state.restaurantComment?.fr === ''
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 37613 && shift.name === 'MIDI'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 21600
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function chezSavyPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CHEZSAVY.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 68279 && shift.name === 'Midi'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 6
    && shift.charge_param.charge_per_guests === 20 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function chezRenePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CHEZRENE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 68277 && shift.name === 'Midi'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 4
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 5
    && shift.charge_param.charge_per_guests === 50 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function bistrotParisPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BISTROTPARIS.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 68145 && shift.name === 'Midi'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 4
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 6
    && shift.charge_param.charge_per_guests === 20 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 1800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function auxBonsCrusPolicy(state, shift, party) {
  const onlyRoom = rooms => Array.isArray(rooms) && rooms.length === 1 && rooms[0] === 10289;
  return party === 2 && state?.restaurantId === ZENCHEF_AUXBONSCRUS.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === true
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.rooms) && state.rooms.length === 1
    && state.rooms[0].id === 10289 && state.rooms[0].name === 'Salle principale'
    && shift?.id === 20711 && shift.name === 'Semaine Midi'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 14400
    && shift.cancelation_param.enduser_cancelable_reference === 'shift'
    && onlyRoom(shift.bookable_rooms) && Array.isArray(shift.shift_slots) && shift.shift_slots.length > 0
    && shift.shift_slots.every(slot => !slot.possible_guests?.includes(2) || onlyRoom(slot.available_rooms?.[2]));
}
export function auxCrusBourgognePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_AUXCRUSBOURGOGNE.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 22200 && shift.name === 'Déjeuner service 1'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 4
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 7200
    && shift.cancelation_param.enduser_cancelable_reference === 'booking';
}
export function petitRetroPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_PETITRETRO.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 116623 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 6
    && shift.charge_param.charge_per_guests === 10 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function moulinVentPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_MOULINVENT.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 139531 && shift.name === 'Déjeuner'
    && shift.comment?.fr === "Votre table est disponible pour une durée de 1h30, en raison d'un double service."
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function petitPontoisePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_PETITPONTOISE.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 9493 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 4
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 6
    && shift.charge_param.charge_per_guests === 25 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 0
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function leFlorentinPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_LEFLORENTIN.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 283681 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function marthaPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_MARTHA.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 159369 && shift.name === 'MIDI 1er service'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function cafeMarlyPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CAFEMARLY.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 122853 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 6
    && shift.charge_param.charge_per_guests === 50 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 18300
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function cafeRucPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CAFERUC.venueId
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 32216 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === false && shift.charge_param.min_guests === 1
    && shift.charge_param.charge_per_guests === 40 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 21600
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaBonneNouvellePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANABONNENOUVELLE.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 253448 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 11
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaRichelieuPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANARICHELIEU.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 276858 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 14
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaBeaugrenellePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANABEAUGRENELLE.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 281252 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaTolbiacPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANATOLBIAC.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 243266 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 20
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const noRoomLunchPolicy = (venue, state, shift, party) => venue === ZENCHEF_BOFINGER
  ? bofingerPolicy(state, shift, party) : venue === ZENCHEF_LACOUPOLE ? laCoupolePolicy(state, shift, party)
    : venue === ZENCHEF_TERMINUSNORD ? terminusNordPolicy(state, shift, party)
      : venue === ZENCHEF_PROCOPE ? procopePolicy(state, shift, party)
        : venue === ZENCHEF_LALORRAINE ? laLorrainePolicy(state, shift, party)
          : venue === ZENCHEF_PIEDDECOCHON ? piedDeCochonPolicy(state, shift, party)
            : venue === ZENCHEF_GRANDCAFE ? grandCafePolicy(state, shift, party)
              : venue === ZENCHEF_VAGENENDE ? vagenendePolicy(state, shift, party)
                : venue === ZENCHEF_BOUILLONJULIEN ? bouillonJulienPolicy(state, shift, party)
                  : venue === ZENCHEF_BOUILLONRACINE ? bouillonRacinePolicy(state, shift, party)
                    : venue === ZENCHEF_BOUILLONREPUBLIQUE ? bouillonRepubliquePolicy(state, shift, party)
                      : venue === ZENCHEF_ROSIE ? rosiePolicy(state, shift, party)
                        : venue === ZENCHEF_ROSIELOU ? rosieLouPolicy(state, shift, party)
                          : venue === ZENCHEF_ROSIEJOLIE ? rosieJoliePolicy(state, shift, party)
                            : venue === ZENCHEF_PETITSOMMELIER ? petitSommelierPolicy(state, shift, party)
                              : venue === ZENCHEF_CHEZSAVY ? chezSavyPolicy(state, shift, party)
                                : venue === ZENCHEF_CHEZRENE ? chezRenePolicy(state, shift, party)
                                  : venue === ZENCHEF_BISTROTPARIS ? bistrotParisPolicy(state, shift, party)
                                    : venue === ZENCHEF_AUXBONSCRUS ? auxBonsCrusPolicy(state, shift, party)
                                      : venue === ZENCHEF_AUXCRUSBOURGOGNE ? auxCrusBourgognePolicy(state, shift, party)
                                        : venue === ZENCHEF_PETITRETRO ? petitRetroPolicy(state, shift, party)
                                          : venue === ZENCHEF_MOULINVENT ? moulinVentPolicy(state, shift, party)
                                            : venue === ZENCHEF_PETITPONTOISE ? petitPontoisePolicy(state, shift, party)
                                              : venue === ZENCHEF_LEFLORENTIN ? leFlorentinPolicy(state, shift, party)
                                                : venue === ZENCHEF_MARTHA ? marthaPolicy(state, shift, party)
                                                  : venue === ZENCHEF_CAFEMARLY ? cafeMarlyPolicy(state, shift, party)
                                                    : venue === ZENCHEF_CAFERUC ? cafeRucPolicy(state, shift, party)
                                                      : venue === ZENCHEF_INDIANABONNENOUVELLE ? indianaBonneNouvellePolicy(state, shift, party)
                                                        : venue === ZENCHEF_INDIANARICHELIEU ? indianaRichelieuPolicy(state, shift, party)
                                                          : venue === ZENCHEF_INDIANABEAUGRENELLE ? indianaBeaugrenellePolicy(state, shift, party)
                                                          : venue === ZENCHEF_INDIANATOLBIAC && indianaTolbiacPolicy(state, shift, party);

// Read only the server-rendered provider state, never execute or mutate its store.
// Candidate slots are not held, selected, confirmed or guaranteed bookable later.
export function zenchefAvailabilityEvidence(data, query, observedAt = Date.now(), venue = ZENCHEF_ARPEGE) {
  zenchefSearchUrl(query, venue);
  const state = data?.props?.initialState?.appStoreState;
  const day = state?.dailyAvailabilities?.[query.date];
  if (data?.page !== '/results' || ([ZENCHEF_PETITSOMMELIER, ZENCHEF_PETITPONTOISE, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC].includes(venue) && data.query?.pid !== '1001') || data.query?.rid !== venue.venueId || data.query?.day !== query.date
    || String(data.query?.pax) !== String(query.party) || state?.restaurantId !== venue.venueId
    || state.initializedSSR !== true || state.wish?.day !== query.date || state.wish?.pax !== query.party
    || state.wish.waiting_list !== false || state.restaurantTimezone !== venue.timezone
    || ![false, 0].includes(state.isDisabled) || day?.date !== query.date || !Array.isArray(day.shifts)) {
    throw new ZenchefError('provider_state_unverified', 502);
  }
  const localNow = new Intl.DateTimeFormat('sv-SE', { timeZone: venue.timezone, year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(observedAt);
  const inWindow = row => {
    const valid = v => v === null || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v));
    return valid(row.bookable_from) && valid(row.bookable_to)
      && (row.bookable_from === null || row.bookable_from <= localNow)
      && (row.bookable_to === null || row.bookable_to > localNow);
  };
  const candidates = [];
  for (const shift of day.shifts) {
    if (venue.shiftId && shift.id !== venue.shiftId) continue;
    if (NO_ROOM_LUNCH_VENUES.includes(venue) && !noRoomLunchPolicy(venue, state, shift, query.party)) continue;
    if (shift.closed !== false || shift.marked_as_full !== false || !inWindow(shift) || !Array.isArray(shift.shift_slots)) continue;
    for (const slot of shift.shift_slots) {
      if (venue === ZENCHEF_BOUILLONREPUBLIQUE && !venue.lunchTimes.includes(slot.name)) continue;
      if (venue === ZENCHEF_DEKAS) {
        if (slot.closed !== false || slot.marked_as_full !== false || !inWindow(slot)
          || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.name)) continue;
        const offer = deKasChoice(state, shift, slot, query, inWindow);
        if (offer) candidates.push({ time: slot.name, shiftId: shift.id, offers: [offer] });
        continue;
      }
      if (slot.closed !== false || slot.marked_as_full !== false || !inWindow(slot)
        || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.name) || !slot.possible_guests?.includes(query.party)
        || (!NO_ROOM_LUNCH_VENUES.includes(venue) && (!Array.isArray(slot.available_rooms?.[query.party]) || !slot.available_rooms[query.party].length))) continue;
      if (venue.rooms) {
        const rooms = venue.rooms.filter(room => slot.available_rooms[query.party].includes(room.id)
          && state.rooms?.some(native => native.id === room.id && native.name === room.name));
        if (state.isRoomMandatory !== true || !rooms.length) continue;
        candidates.push({ time: slot.name, shiftId: shift.id, rooms });
      } else candidates.push({ time: slot.name, shiftId: shift.id });
    }
  }
  return { source: 'provider_server_rendered', restaurantId: venue.restaurantId,
    date: query.date, party: query.party, observedAt: new Date(observedAt).toISOString(),
    candidates, selectable: false, confirmationVerified: false,
    limitation: 'offer_room_card_and_submission_not_verified' };
}

// Deliberately NOT a generic GET allowlist. Even GET can create supplier state.
// No live scripts, inventory API, redirects, form posts or arbitrary clicks yet.
export function allowedZenchefInspectionRequest(request, query = null, venue = ZENCHEF_ARPEGE) {
  let expected;
  try { expected = query ? zenchefSearchUrl(query, venue) : venue.url; } catch { return false; }
  return request.method() === 'GET' && request.resourceType() === 'document'
    && !request.redirectedFrom() && request.url() === expected;
}

/** Bokabord-shaped lifecycle; shared routing, auth and journal remain integrator-owned.
 * reserveSubmission(details, session) must durably exclude duplicates before submit.
 * recordResult(session) must persist unknown outcomes, never retry them automatically.
 * Fixture selectors describe ONLY the local test protocol, not Zenchef's actual DOM.
 */
export class ZenchefPlaywright {
  #sessions = new Map();
  #pending = new Set();
  #browserPromise;
  #closed = false;
  constructor({ browserFactory, mode = 'inspect', fixtureHtml, enableSubmission = false,
    reserveSubmission, recordResult, now = Date.now } = {}) {
    if (!['inspect', 'prepare', 'fixture'].includes(mode)) throw new ZenchefError('live_not_verified');
    if (mode !== 'fixture' && fixtureHtml !== undefined) throw new ZenchefError('fixture_forbidden');
    if (mode === 'fixture' && (typeof fixtureHtml !== 'string' || !fixtureHtml)) throw new ZenchefError('fixture_required');
    this.mode = mode; this.fixtureHtml = fixtureHtml;
    this.enableSubmission = enableSubmission === true;
    this.reserveSubmission = reserveSubmission; this.recordResult = recordResult;
    this.now = now;
    this.browserFactory = browserFactory || (() => import('playwright').then(({ chromium }) => chromium.launch({ headless: true })));
  }
  async create(owner, restaurantId) {
    if (this.#closed) throw new ZenchefError('closed', 503);
    if (typeof owner !== 'string' || !owner) throw new ZenchefError('auth', 401);
    const venue = Object.hasOwn(VENUES, restaurantId) ? VENUES[restaurantId] : null;
    if (!venue) throw new ZenchefError('unsupported_restaurant');
    await this.expire();
    if (this.#pending.has(owner) || [...this.#sessions.values()].some(s => s.owner === owner)) throw new ZenchefError('session_exists', 409);
    if (this.#pending.size + this.#sessions.size >= 4) throw new ZenchefError('capacity', 429);
    this.#pending.add(owner);
    let context;
    try {
      this.#browserPromise ||= Promise.resolve().then(() => this.browserFactory()).catch(e => { this.#browserPromise = null; throw e; });
      const browser = await this.#browserPromise;
      if (this.#closed) throw new ZenchefError('closed', 503);
      context = await browser.newContext({ viewport: { width: 420, height: 760 },
        locale: 'fr-FR', timezoneId: venue.timezone, serviceWorkers: 'block', acceptDownloads: false });
      const s = { id: crypto.randomUUID(), owner, restaurantId, restaurant: venue.name, venue,
        provider: 'Zenchef', destination: [ZENCHEF_ARPEGE, ...NO_ROOM_LUNCH_VENUES].includes(venue) ? 'Paris' : venue === ZENCHEF_PESQUIERE ? 'Saint-Tropez' : venue === ZENCHEF_PIROUETTE ? 'Nice' : venue === ZENCHEF_DEKAS ? 'Amsterdam' : 'St. Barts', context, revision: 0, touched: this.now(),
        busy: false, attempted: false, state: 'inspect_only', result: null, blockedRequests: 0 };
      await context.route('**/*', async route => {
        const r = route.request();
        const readback = s.readback;
        if (readback && r.url() === readback.url && ['GET', 'OPTIONS'].includes(r.method()) && !r.redirectedFrom()
          && ['fetch', 'xhr'].includes(r.resourceType()) && this.readbackBound(s, readback)) {
          const preflight = r.method() === 'OPTIONS';
          if (preflight ? readback.preflightUsed : readback.used) return route.abort();
          if (preflight) readback.preflightUsed = true; else readback.used = true;
          try {
            // Native browser GET (or its CORS preflight), no POST headers copied.
            const response = await route.fetch({ maxRedirects: 0, maxRetries: 0, timeout: 8000 });
            if (!preflight) {
              const data = await response.json().catch(() => null);
              if (this.readbackBound(s, readback)) readback.result = savedBookingResult(response.status(), data, readback);
            }
            if (response.status() < 200 || response.status() >= 300) return route.abort();
            return route.fulfill({ response });
          } catch { return route.abort().catch(() => {}); }
        }
        const bookingUrl = `https://bookings-middleware.zenchef.com/booking?restaurantId=${venue.venueId}`;
        if (this.mode === 'prepare' && r.method() === 'POST' && r.url() === bookingUrl && s.armed && !s.attempted && s.noCardAllowed
          && [ZENCHEF_FISHCORNER, ...READBACK_VENUES].includes(venue)) {
          s.attempted = true;
          try {
            const payload = approvedZenchefPayload(r.postDataJSON(), s.approval);
            if (!payload || r.redirectedFrom()) throw new ZenchefError('payload_mismatch');
            const reserved = await bounded(() => this.reserveSubmission(s.approval, s), 5000);
            if (reserved?.sendAllowed !== true || !reserved.attempt?.attemptId || !reserved.attempt?.idempotencyKey || this.#closed) throw new ZenchefError('attempt_not_authorized');
            if (READBACK_VENUES.includes(venue) && !attemptMatchesApproval(reserved.attempt, s.approval)) throw new ZenchefError('attempt_binding_mismatch');
            s.attempt = structuredClone(reserved.attempt);
            // Exactly one transmission, no redirects/retries. Unknown stays locked.
            const response = await route.fetch({ maxRedirects: 0, maxRetries: 0, timeout: 20000, postData: JSON.stringify(payload) });
            const data = await response.json().catch(() => null);
            s.result = zenchefBookingResult(response.status(), data, s.approval);
            if (READBACK_VENUES.includes(venue) && response.status() >= 200 && response.status() < 300
              && ownReadbackUrl(data, s.approval)) {
              s.result = await this.readOwnBooking(s, data);
            }
            s.result.verification = { verified: ['confirmed', 'pending', 'payment_required'].includes(s.result.status), source: 'provider', provider: 'Zenchef', mode: 'live', phase: 'booking', restaurantId,
              policySource: venue.policySource || ZENCHEF_POLICY_SOURCE, reviewFingerprint: s.review.digest,
              sessionId: s.id, attemptId: s.attempt.attemptId, idempotencyKey: s.attempt.idempotencyKey,
              detailsDigest: s.review.digest,
              ...(venue === ZENCHEF_DEKAS ? { offerId: s.approval.offer.offerId, offerCount: s.approval.offer.count,
                offerVersion: s.approval.offer.version, ...(s.readbackVerified ? { offerEvidence: 'own_booking_readback' } : {}) } : {}),
              ...(NO_ROOM_LUNCH_VENUES.includes(venue) && s.readbackVerified ? { bookingEvidence: 'own_booking_readback', shiftId:venue.shiftId } : {}),
              ...(venue.rooms ? { roomId: s.approval.roomId, roomName: s.approval.roomName,
                ...(s.readbackVerified ? { roomEvidence: 'own_booking_readback' } : {}) } : {}) };
            try { await bounded(() => this.recordResult(s), 5000); }
            catch { s.result = { status: 'unknown', reason: 'result_persistence_failed' }; }
            await route.fulfill({ response });
          } catch { s.result = { status: 'unknown' }; await route.abort().catch(() => {}); }
          finally { s.state = 'result'; s.submitDone?.(); }
          return;
        }
        if (this.mode === 'fixture') {
          if (r.url() === FIXTURE_URL && r.method() === 'GET' && r.resourceType() === 'document' && !r.redirectedFrom()) {
            return route.fulfill({ status: 200, contentType: 'text/html', body: this.fixtureHtml });
          }
        } else if (s.formSelection ? allowedZenchefPreparationRequest(r, s.formSelection, venue) : allowedZenchefInspectionRequest(r, s.searchQuery, venue)) {
          // fetch with redirects disabled, then fulfill: route.continue can follow an
          // unreviewed redirect without running this route guard a second time.
          try {
            const response = await route.fetch({ maxRedirects: 0, timeout: 10000 });
            if (response.status() >= 200 && response.status() < 300) return route.fulfill({ response });
          } catch { /* fail closed */ }
        }
        s.blockedRequests++;
        return route.abort();
      });
      await context.routeWebSocket('**/*', socket => socket.close());
      s.page = await context.newPage();
      context.on('page', page => { if (page !== s.page) page.close().catch(() => {}); });
      s.page.setDefaultTimeout(3000);
      await s.page.goto(this.mode === 'fixture' ? FIXTURE_URL : venue.url,
        { waitUntil: 'domcontentloaded', timeout: 12000 });
      if (this.#closed) throw new ZenchefError('closed', 503);
      if (this.mode === 'fixture') s.state = 'search';
      const snapshot = await this.snapshot(s);
      this.#sessions.set(s.id, s);
      return snapshot;
    } catch (error) { await context?.close(); throw error; }
    finally { this.#pending.delete(owner); }
  }
  owned(id, owner) {
    const s = this.#sessions.get(id);
    if (!s || s.owner !== owner || this.now() - s.touched >= TTL) throw new ZenchefError('session_expired', 404);
    return s;
  }
  current(owner) {
    const s = [...this.#sessions.values()].find(s => s.owner === owner);
    if (!s) throw new ZenchefError('session_expired', 404);
    this.owned(s.id, owner);
    return structuredClone({ ...s.lastSnapshot, ...(s.submissionStarted ? { state: s.state, canSubmit: false, result: s.result } : {}) });
  }
  readbackBound(s, binding) {
    return !this.#closed && s.readback === binding && s.attempted && s.submissionStarted
      && s.owner === binding.owner && s.id === binding.sessionId
      && s.attempt?.attemptId === binding.attemptId && s.attempt?.idempotencyKey === binding.idempotencyKey
      && s.review?.digest === binding.reviewFingerprint && s.approval?.reviewFingerprint === binding.reviewFingerprint
      && attemptMatchesApproval(s.attempt, binding.approval);
  }
  async readOwnBooking(s, created) {
    const url = ownReadbackUrl(created, s.approval);
    if (!url || !attemptMatchesApproval(s.attempt, s.approval)) return { status: 'unknown' };
    // Immutable identity/approval; only transport completion flags are mutable.
    const binding = { url, owner: s.owner, sessionId: s.id, attemptId: s.attempt.attemptId,
      idempotencyKey: s.attempt.idempotencyKey, reviewFingerprint: s.review.digest,
      bookingId: String(created.id), uuid: created.uuid, approval: Object.freeze(structuredClone(s.approval)),
      used: false, preflightUsed: false, result: { status: 'unknown' } };
    for (const key of ['url', 'owner', 'sessionId', 'attemptId', 'idempotencyKey', 'reviewFingerprint', 'bookingId', 'uuid', 'approval'])
      Object.defineProperty(binding, key, { writable: false });
    s.readback = binding;
    try {
      const completed = await bounded(() => s.page.evaluate(async url => {
        const headers = {};
        // Source getMetadata uses the normally available AWS SDK. Never
        // manufacture, log or replay a token. Absent SDK has the native no-metadata
        // fallback; an available SDK failure is conservatively treated as unknown.
        if (typeof window.AwsWafIntegration?.getToken === 'function') {
          let timer;
          try {
            const token = await Promise.race([window.AwsWafIntegration.getToken(), new Promise((_, reject) => {
              timer = setTimeout(() => reject(Error('metadata_timeout')), 3000);
            })]);
            if (typeof token !== 'string' || !token) return false;
            headers['x-aws-waf-token'] = token;
          } catch { return false; } finally { clearTimeout(timer); }
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(url, { method: 'GET', headers, redirect: 'error', credentials: 'same-origin', signal: controller.signal });
          await response.arrayBuffer();
          return response.ok;
        } catch { return false; } finally { clearTimeout(timer); }
      }, url), 12000);
      if (!completed || !binding.used || !this.readbackBound(s, binding)) return { status: 'unknown' };
      s.readbackVerified = binding.result.status === 'confirmed';
      return binding.result;
    } catch { return { status: 'unknown' }; }
    finally { s.readback = null; }
  }
  async verifyDeKasChoice(s, selected) {
    const choice = selected ? s.offerChoice : s.offerChoices?.[0];
    const expected = zenchefFormUrl(s.formSelection, s.venue);
    const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
    const state = data?.props?.initialState?.appStoreState;
    if (data.page !== '/offers' || state?.wish?.slot !== s.formSelection.time || state.wish.offers?.length !== 0)
      throw new ZenchefError('offer_changed', 409);
    const fresh = zenchefAvailabilityEvidence({ ...data, page: '/results' }, s.searchQuery, this.now(), s.venue);
    const current = fresh.candidates.find(c => c.time === s.formSelection.time && c.shiftId === s.venue.shiftId)?.offers?.[0];
    if (!current || current.version !== choice?.version) throw new ZenchefError('offer_changed', 409);
    const supported = ['firstname', 'lastname', 'email', 'phone_number', 'country', 'civility'];
    if (!state.mandatoryFields || Object.entries(state.mandatoryFields).some(([key,value]) => value === 'required' && !supported.includes(key)))
      throw new ZenchefError('provider_fields_unverified', 409);
    if (!choice || s.page.url() !== (selected ? expected : expected.replace('/form?', '/offers?')))
      throw new ZenchefError('offer_changed', 409);
    const name = selected ? s.page.getByText(choice.name, { exact: true }) : s.page.getByText(choice.name, { exact: true }).filter({ visible: true });
    if (await name.count() !== 1 || (await name.textContent())?.trim() !== choice.name)
      throw new ZenchefError('offer_changed', 409);
    if (!selected) {
      if (!await name.isVisible() || !await s.page.getByText(choice.description.replace(/\s+/g, ' ').trim(), { exact: true }).filter({ visible: true }).isVisible()
        || await s.page.locator('[data-testid="disabled-continue-btn"]').count() !== 1)
        throw new ZenchefError('offer_changed', 409);
    } else {
      // Mobile collapses the native menu summary; inspect its text, never treat
      // it as an independently saved receipt. Integrator must display our choice.
      if (await s.page.getByText(/^\s*\u00d7\s*2\s*$/).count() !== 1
        || await s.page.getByText(s.terms.seatingNotice, { exact: true }).count() !== 1
        || await s.page.locator('[data-testid="eula-checkbox"]').innerText() !== s.terms.text)
        throw new ZenchefError('stale_review', 409);
    }
  }
  async verifyNativeRoom(s) {
    const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
    const form = data?.props?.initialState?.appStoreState;
    if ([ZENCHEF_PETITSOMMELIER, ZENCHEF_PETITPONTOISE, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC].includes(s.venue) && data?.query?.pid !== '1001')
      throw new ZenchefError('stale_review', 409);
    // Form requirements can change after selection or review. Recheck before
    // approval and the durable send grant, not only when opening the form.
    const supported = ['firstname', 'lastname', 'email', 'phone_number', 'country', 'civility'];
    if (!form?.mandatoryFields || Object.entries(form.mandatoryFields).some(([key, value]) => value === 'required' && !supported.includes(key)))
      throw new ZenchefError('provider_fields_unverified', 409);
    if (NO_ROOM_LUNCH_VENUES.includes(s.venue)) {
      const shift = form?.dailyAvailabilities?.[s.searchQuery.date]?.shifts?.find(row => row.id === s.venue.shiftId);
      const text = await s.page.locator('[data-testid="eula-checkbox"]').innerText();
      if (s.page.url() !== zenchefFormUrl(s.formSelection, s.venue) || form?.wish?.slot !== s.formSelection.time
        || form?.wish?.day !== s.searchQuery.date || form?.wish?.pax !== 2
        || (s.noCardAllowed && !noRoomLunchPolicy(s.venue, form, shift, 2))
        || digest([text, form.restaurantComment || null, shift || null]) !== s.terms?.version)
        throw new ZenchefError('stale_review', 409);
    }
    if (s.venue === ZENCHEF_DEKAS) await this.verifyDeKasChoice(s, true);
    if (!s.venue.rooms) return;
    if (s.venue === ZENCHEF_PIROUETTE) {
      const seating = s.page.getByText(/^Jusqu'\u00e0 \d{2}:\d{2}$/);
      if (await seating.count() !== 1 || !await seating.isVisible() || await seating.innerText() !== s.terms?.seatingNotice)
        throw new ZenchefError('stale_review', 409);
    }
    const { roomId, roomName } = s.formSelection;
    if (s.page.url() !== zenchefFormUrl(s.formSelection, s.venue) || form?.wish?.room_id !== roomId
      || !await s.page.getByText(roomName, { exact: true }).isVisible()) throw new ZenchefError('provider_room_mismatch', 409);
  }
  async nativeCountry(s) {
    const phoneWidget = s.page.locator(PROVIDER_FIELDS.phone).locator('xpath=ancestor::div[contains(concat(" ",normalize-space(@class)," ")," iti ")][1]');
    const flag = phoneWidget.locator('.iti__selected-country .iti__flag');
    if (await flag.count() !== 1) return '';
    const codes = ((await flag.getAttribute('class')) || '').split(/\s+/).filter(c => /^iti__[a-z]{2}$/.test(c));
    if (codes.length !== 1) return '';
    const code = codes[0].slice(5);
    // At the mobile viewport the country list is not mounted until opened.
    // Read the selected visible control, not a possibly absent dropdown option.
    const selected = phoneWidget.locator('.iti__selected-country');
    return await selected.count() === 1 && await selected.getAttribute('title')
      && await selected.getAttribute('aria-label') ? code : '';
  }
  async snapshot(s) {
    let fields = null;
    if (this.mode === 'prepare' && ['contact', 'review'].includes(s.state)) {
      fields = [];
      for (const name of FIELDS) fields.push({ name, value: await s.page.locator(PROVIDER_FIELDS[name]).inputValue() });
      const selected = s.page.locator('input[name="civility"]:checked');
      fields.push({ name: 'civility', value: await selected.count() === 1 ? await selected.inputValue() : '', options: ['mr', 'mrs', 'mx'] });
      fields.push({ name: 'country', value: await this.nativeCountry(s), readOnly: true, source: 'provider_phone_country', label: 'Telephone country (selected by provider from phone number)' });
    }
    const shot = await s.page.screenshot({ type: 'png', animations: 'disabled' });
      const snapshot = { id: s.id, restaurantId: s.restaurantId, restaurant: s.restaurant,
      provider: 'Zenchef', mode: this.mode, evidenceMode: this.mode === 'fixture' ? 'local_fixture' : this.mode === 'prepare' ? 'native_provider_form' : 'readonly_shell',
      revision: ++s.revision, state: s.state, width: 420, height: 760,
      image: `data:image/png;base64,${shot.toString('base64')}`,
      imageHash: crypto.createHash('sha256').update(shot).digest('hex'),
      capturedAt: new Date(this.now()).toISOString(), expiresIn: TTL / 1000,
      liveAvailabilitySupported: false, canSubmit: s.state === 'review' && !s.attempted && !s.submissionStarted
        && typeof this.reserveSubmission === 'function' && typeof this.recordResult === 'function'
        && (this.mode === 'fixture' || (this.mode === 'prepare' && this.enableSubmission && s.noCardAllowed
          && !!s.details?.country && s.review?.revision === s.revision)),
      offerChoices: s.offerChoices ? structuredClone(s.offerChoices) : null,
      fields, details: s.details ? structuredClone(s.details) : null, result: s.result ? structuredClone(s.result) : null,
      availabilityEvidence: s.availabilityEvidence ? structuredClone(s.availabilityEvidence) : null,
      phase: 'booking', reviewFingerprint: s.review?.digest || null,
      reviewToken: s.review?.revision === s.revision ? s.review.token : null,
      terms: s.terms ? { ...s.terms } : null,
      checkoutBlocker: s.formSelection && !s.noCardAllowed ? 'card_and_supplier_submission_unverified'
        : s.formSelection && !this.enableSubmission ? 'submission_disabled' : null,
      blockedRequests: s.blockedRequests,
      blocker: this.mode === 'fixture' ? 'local_fixture_only' : this.mode === 'inspect' ? 'inspection_only' : null };
    s.lastSnapshot = snapshot;
    return structuredClone(snapshot);
  }
  async action(id, owner, action) {
    const s = this.owned(id, owner);
    if (s.busy) throw new ZenchefError('busy', 409);
    if (!action || action.revision !== s.revision) throw new ZenchefError('stale_view', 409);
    if (this.mode === 'inspect' && !['refresh', 'search'].includes(action.type)) throw new ZenchefError('inspect_only', 409);
    s.busy = true; s.touched = this.now();
    try {
      if (action.type === 'refresh') return await this.snapshot(s);
      if (s.submissionStarted) throw new ZenchefError('already_attempted', 409);
      if (this.mode !== 'fixture' && action.type === 'search') {
        const query = { date: action.date, party: action.party };
        const url = zenchefSearchUrl(query, s.venue);
        s.searchQuery = query; s.formSelection = null; s.details = null; s.review = null; s.noCardAllowed = false; s.terms = null;
        s.availabilityEvidence = null; s.offerChoices = null; s.offerChoice = null; s.state = 'inspect_only';
        await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
        s.availabilityEvidence = zenchefAvailabilityEvidence(data, query, this.now(), s.venue);
        s.state = 'availability_observed';
        return await this.snapshot(s);
      }
      if (this.mode === 'prepare') {
        if (s.venue === ZENCHEF_DEKAS && action.type === 'select_offer' && s.state === 'offers') {
          if (this.now() - s.offerObservedAt > 120000) throw new ZenchefError('slot_stale_or_unverified', 409);
          const choice = s.offerChoices?.find(o => o.offerId === action.offerId && o.count === action.count && o.version === action.offerVersion);
          if (!choice || s.offerChoices.length !== 1) throw new ZenchefError('explicit_offer_required', 409);
          await this.verifyDeKasChoice(s, false);
          const add = s.page.locator('[data-testid="add-to-cart-btn"]');
          if (await add.count() !== 1 || !await add.isEnabled()) throw new ZenchefError('offer_control_unverified', 409);
          // One explicit guest action; native same-for-all handler sets count=pax.
          // No API/store injection, no automatic/highlighted menu preselection.
          await add.click();
          await s.page.locator('[data-testid="go-to-form-btn"]').click();
          await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({ state: 'visible', timeout: 20000 });
          s.offerChoice = structuredClone(choice);
          const termsLabel = s.page.locator('[data-testid="eula-checkbox"]');
          const text = await termsLabel.innerText();
          const seating = s.page.getByText(/^Until \d{1,2}:\d{2} [AP]M$/);
          if (!text.trim() || await seating.count() !== 1) throw new ZenchefError('seating_terms_unverified', 409);
          s.terms = { text, seatingNotice: await seating.innerText(), url: 'https://bookings.zenchef.com/gtc?rid=386643&lang=en',
            mealPrice: null, priceStatus: choice.priceStatus, menuSource: choice.menuSource };
          s.terms.version = digest([s.terms, choice]);
          s.formSelection.offer = structuredClone(choice);
          await this.verifyDeKasChoice(s, true);
          s.noCardAllowed = true; s.state = 'contact'; s.review = null;
          return await this.snapshot(s);
        }
        if (action.type === 'select' && s.state === 'availability_observed') {
          const evidence = s.availabilityEvidence;
          const matches = evidence?.candidates.filter(row => row.time === action.time);
          if (!matches || matches.length !== 1 || matches[0].shiftId !== action.shiftId
            || this.now() - Date.parse(evidence.observedAt) > 120000) throw new ZenchefError('slot_stale_or_unverified', 409);
          const room = s.venue.rooms ? matches[0].rooms?.find(room => room.id === action.roomId) : null;
          if (s.venue.rooms ? !room : action.roomId !== undefined) throw new ZenchefError('room_required_or_unverified', 409);
          s.formSelection = { ...s.searchQuery, time: action.time, ...(NO_ROOM_LUNCH_VENUES.includes(s.venue) ? {shiftId:s.venue.shiftId} : {}), ...(room ? { roomId: room.id, roomName: room.name } : {}) };
          const url = zenchefFormUrl(s.formSelection, s.venue);
          if (s.venue === ZENCHEF_DEKAS) {
            s.offerChoices = null; s.offerChoice = null; s.review = null; s.terms = null; s.noCardAllowed = false;
            await s.page.goto(url.replace('/form?', '/offers?'), { waitUntil: 'domcontentloaded', timeout: 20000 });
            await s.page.locator('[data-testid="add-to-cart-btn"]').waitFor({ state: 'visible', timeout: 20000 });
            const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
            if (data.page !== '/offers' || data.props?.initialState?.appStoreState?.wish?.slot !== action.time)
              throw new ZenchefError('provider_form_mismatch', 502);
            // Same validated SSR contract, using only a local copy of its page tag.
            const fresh = zenchefAvailabilityEvidence({ ...data, page: '/results' }, s.searchQuery, this.now(), s.venue);
            const candidate = fresh.candidates.find(c => c.time === action.time && c.shiftId === action.shiftId);
            if (!candidate || candidate.offers.length !== 1 || candidate.offers[0].version !== matches[0].offers[0].version)
              throw new ZenchefError('offer_changed', 409);
            s.offerChoices = candidate.offers; s.offerObservedAt = this.now();
            await this.verifyDeKasChoice(s, false);
            s.state = 'offers';
            return await this.snapshot(s);
          }
          await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({ state: 'visible', timeout: 20000 });
          const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
          const form = data?.props?.initialState?.appStoreState;
          if (s.page.url() !== url || data.page !== '/form' || ([ZENCHEF_PETITSOMMELIER, ZENCHEF_PETITPONTOISE, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC].includes(s.venue) && data.query?.pid !== '1001') || form?.restaurantId !== s.venue.venueId
            || form.wish?.day !== s.searchQuery.date || form.wish?.pax !== s.searchQuery.party
            || form.wish?.slot !== action.time || form.wish?.waiting_list !== false) throw new ZenchefError('provider_form_mismatch', 502);
          if (room && (form.wish.room_id !== room.id || form.isRoomMandatory !== true
            || !form.rooms?.some(native => native.id === room.id && native.name === room.name)
            || !await s.page.getByText(room.name, { exact: true }).isVisible())) throw new ZenchefError('provider_room_mismatch', 502);
          const supported = ['firstname', 'lastname', 'email', 'phone_number', 'country', 'civility'];
          if (!form.mandatoryFields || Object.entries(form.mandatoryFields).some(([key, value]) => value === 'required' && !supported.includes(key))) {
            throw new ZenchefError('provider_fields_unverified', 409);
          }
          const shift = form.dailyAvailabilities?.[s.searchQuery.date]?.shifts?.find(row => row.id === s.venue.shiftId);
          s.noCardAllowed = s.venue === ZENCHEF_FISHCORNER && shift?.id === 545372 && shift.charge_param === null
            && shift.shift_slots?.some(slot => slot.name === action.time && slot.closed === false && slot.marked_as_full === false && slot.possible_guests?.includes(s.searchQuery.party))
            && shift.closed === false && shift.marked_as_full === false && shift.prepayment_param === null && shift.is_offer_required === false && shift.confirmation?.is_auto === true
            && form.isRoomMandatory === false && Array.isArray(form.wish.offers) && !form.wish.offers.length && form.wish.room_id === null;
          const noRoomCard = s.venue === ZENCHEF_PESQUIERE ? shift?.charge_param?.is_web_booking_askable === false
            : s.venue === ZENCHEF_PIROUETTE && shift?.charge_param?.is_web_booking_askable === true
              && shift.charge_param.min_guests === 3 && s.searchQuery.party === 2
              && shift.confirmation?.is_auto_until === null;
          if (ROOM_VENUES.includes(s.venue)) s.noCardAllowed = shift?.id === s.venue.shiftId
            && noRoomCard && shift.prepayment_param === null
            && shift.is_offer_required === false && shift.confirmation?.is_auto === true
            && shift.closed === false && shift.marked_as_full === false
            && shift.shift_slots?.some(slot => slot.name === action.time && slot.closed === false && slot.marked_as_full === false
              && slot.possible_guests?.includes(s.searchQuery.party) && slot.available_rooms?.[s.searchQuery.party]?.includes(room.id))
            && Array.isArray(form.wish.offers) && !form.wish.offers.length;
          if (NO_ROOM_LUNCH_VENUES.includes(s.venue)) s.noCardAllowed = noRoomLunchPolicy(s.venue, form, shift, s.searchQuery.party)
            && shift.closed === false && shift.marked_as_full === false
            && shift.shift_slots?.some(slot => slot.name === action.time && slot.closed === false && slot.marked_as_full === false && slot.possible_guests?.includes(2));
          const termsLabel = s.page.locator('[data-testid="eula-checkbox"]');
          const text = await termsLabel.count() === 1 ? await termsLabel.innerText() : '';
          s.terms = { text, version: digest([text, form.restaurantComment || null, shift || null]),
            url: `https://bookings.zenchef.com/gtc?rid=${s.venue.venueId}&lang=fr` };
          if (s.venue === ZENCHEF_PIROUETTE) {
            const seating = s.page.getByText(/^Jusqu'\u00e0 \d{2}:\d{2}$/);
            if (await seating.count() !== 1 || !await seating.isVisible()) throw new ZenchefError('seating_terms_unverified', 409);
            s.terms.seatingNotice = await seating.innerText();
            s.terms.version = digest([s.terms.version, s.terms.seatingNotice]);
          }
          if (NO_ROOM_LUNCH_VENUES.includes(s.venue)) {
            s.terms.restaurantNotice = form.restaurantComment?.fr || '';
            if (s.venue === ZENCHEF_MOULINVENT) s.terms.seatingNotice = shift?.comment?.fr || '';
            if (!s.terms.restaurantNotice.trim() && !(s.venue === ZENCHEF_PETITSOMMELIER && form.restaurantComment?.fr === '')) s.noCardAllowed = false;
          }
          if (!text.trim()) s.noCardAllowed = false;
          s.state = 'contact'; s.review = null;
          return await this.snapshot(s);
        }
        if (action.type === 'fill' && ['contact', 'review'].includes(s.state)) {
          const fields = action.fields;
          if (!fields || ![5, 6].includes(Object.keys(fields).length) || Object.keys(fields).some(k => ![...FIELDS, 'civility', 'country'].includes(k))
            || (fields.country !== undefined && !/^[a-z]{2}$/.test(fields.country)) || FIELDS.some(k => typeof fields[k] !== 'string'
            || !fields[k].trim() || fields[k].length > 200) || !['mr', 'mrs', 'mx'].includes(fields.civility)
            || !/^\+\d{7,15}$/.test(fields.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new ZenchefError('contact_fields');
          s.review = null; s.state = 'contact';
          for (const k of FIELDS) {
            await s.page.locator(PROVIDER_FIELDS[k]).fill(fields[k]);
            await s.page.locator(PROVIDER_FIELDS[k]).blur();
          }
          const radio = s.page.locator(`input[name="civility"][value="${fields.civility}"]`);
          // Zenchef hides the native radio and handles clicks on its visible label.
          await radio.locator('xpath=ancestor::label[1]').click();
          if (!await radio.isChecked()) throw new ZenchefError('provider_field_not_applied', 409);
          // Never opt into storage/marketing or infer acceptance of provider terms.
          for (const box of await s.page.locator('input[type="checkbox"]').all()) if (await box.isChecked()) {
            await box.locator('xpath=ancestor::label[1]').click();
            if (await box.isChecked()) throw new ZenchefError('provider_consent_not_cleared', 409);
          }
          return await this.snapshot(s);
        }
        if (action.type === 'review' && ['contact', 'review'].includes(s.state)) {
          await this.verifyNativeRoom(s);
          const details = { ...s.formSelection, civility: await s.page.locator('input[name="civility"]:checked').inputValue() };
          for (const k of FIELDS) details[k] = await s.page.locator(PROVIDER_FIELDS[k]).inputValue();
          details.country = await this.nativeCountry(s);
          if (FIELDS.some(k => !details[k]?.trim())) throw new ZenchefError('contact_required');
          s.details = details; s.state = 'review';
          s.review = { token: crypto.randomUUID(), revision: s.revision + 1,
            digest: digest([s.owner, s.id, s.restaurantId, details, s.terms?.version]) };
          return await this.snapshot(s);
        }
        if (action.type === 'submit') {
          if (s.state !== 'review' || action.confirm !== true || action.terms !== true
            || !s.review || s.review.revision !== s.revision || action.reviewToken !== s.review.token) throw new ZenchefError('confirmation_required', 409);
          await this.verifyNativeRoom(s);
          const actual = { ...s.formSelection, civility: await s.page.locator('input[name="civility"]:checked').inputValue() };
          for (const k of FIELDS) actual[k] = await s.page.locator(PROVIDER_FIELDS[k]).inputValue();
          actual.country = await this.nativeCountry(s);
          if (digest([s.owner, s.id, s.restaurantId, actual, s.terms?.version]) !== s.review.digest) throw new ZenchefError('stale_review', 409);
          // Arpège's actual form requires a card imprint; no card/booking request
          // has been verified or authorized. Do not click its validate button.
          if (!s.noCardAllowed) throw new ZenchefError('card_and_supplier_submission_unverified', 409);
          if (!this.enableSubmission || !s.lastSnapshot.canSubmit) throw new ZenchefError('submission_disabled', 409);
          if (action.termsVersion !== s.terms.version || !/^[a-zA-Z0-9_-]{16,100}$/.test(action.idempotencyKey || '')) throw new ZenchefError('confirmation_required', 409);
          if (await s.page.locator('[data-testid="eula-checkbox"]').innerText() !== s.terms.text) throw new ZenchefError('stale_review', 409);
          s.approval = { ...actual, terms: true, termsVersion: s.terms.version, reviewToken: s.review.token,
            revision: s.revision, idempotencyKey: action.idempotencyKey, reviewFingerprint: s.review.digest,
            provider: 'Zenchef', restaurantId: s.restaurantId, phase: 'booking', mode: 'live', sessionId: s.id, owner: s.owner,
            details: { date: actual.date, time: actual.time, party: actual.party,
              ...(NO_ROOM_LUNCH_VENUES.includes(s.venue) ? {shiftId:s.venue.shiftId} : {}),
              ...(s.venue === ZENCHEF_DEKAS ? { offer: structuredClone(actual.offer) } : {}),
              ...(s.venue.rooms ? { roomId: actual.roomId, roomName: actual.roomName } : {}) } };
          s.submissionStarted = true; s.result = { status: 'unknown' }; s.state = 'result';
          try {
            // Never preserve invisible/default marketing or storage opt-ins.
            for (const box of await s.page.locator('input[type="checkbox"]').all()) if (await box.isChecked()) {
              await box.locator('xpath=ancestor::label[1]').click();
            }
            await s.page.locator('[data-testid="eula-checkbox"]').click();
            if (!await s.page.locator('[data-testid="eula-checkbox"] input').isChecked()) throw new ZenchefError('confirmation_required');
            const done = new Promise(resolve => { s.submitDone = resolve; });
            s.armed = true;
            await s.page.locator('[data-testid="validate-btn"]').click();
            await bounded(() => done, 45000);
          } catch { s.result = { status: 'unknown' }; }
          finally { s.armed = false; s.state = 'result'; }
          return await this.snapshot(s);
        }
        throw new ZenchefError('invalid_transition', 409);
      }
      if (s.attempted) throw new ZenchefError('already_attempted', 409);
      const click = name => s.page.locator(`[data-zenchef-test="${name}"]`).click();
      if (action.type === 'search' && s.state === 'search') {
        const date = String(action.date || '');
        const parsed = new Date(date + 'T12:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed)
          || parsed.toISOString().slice(0, 10) !== date || !Number.isInteger(action.party)
          || action.party < 1 || action.party > 20) throw new ZenchefError('search_fields');
        await s.page.locator('[data-zenchef-test="date"]').fill(date);
        await s.page.locator('[data-zenchef-test="party"]').fill(String(action.party));
        await click('search');
        s.details = { date, party: action.party }; s.state = 'slots';
      } else if (action.type === 'select' && s.state === 'slots') {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(action.time)) throw new ZenchefError('time');
        const slot = s.page.locator(`[data-zenchef-test="slot"][data-time="${action.time}"]`);
        if (await slot.count() !== 1 || !await slot.isEnabled() || !await slot.isVisible()) throw new ZenchefError('slot_unavailable');
        const kind = await slot.getAttribute('data-kind');
        if (kind !== 'reservation') throw new ZenchefError(kind === 'waitlist' ? 'waitlist_unsupported' : 'slot_unverified');
        await slot.click(); s.details.time = action.time; s.state = 'contact';
      } else if (action.type === 'contact' && s.state === 'contact') {
        const fields = action.fields;
        if (!fields || Object.keys(fields).length !== FIELDS.length || FIELDS.some(k => typeof fields[k] !== 'string'
          || !fields[k].trim() || fields[k].length > 200)) throw new ZenchefError('contact_fields');
        for (const k of FIELDS) await s.page.locator(`[data-zenchef-test="${k}"]`).fill(fields[k]);
        await click('review'); s.details = { ...s.details, ...fields }; s.state = 'review';
      } else if (action.type === 'submit' && s.state === 'review') {
        if (!s.lastSnapshot.canSubmit || action.confirm !== true || action.terms !== true) throw new ZenchefError('confirmation_required', 409);
        // Attempt stays consumed if the durable hook fails or a response is lost.
        s.attempted = true; s.state = 'unknown'; s.result = { status: 'sandbox_unknown' };
        try {
          const reservation = await this.reserveSubmission({ ...s.details, terms: true }, s);
          // The provider-neutral journal (PR146) returns an explicit decision.
          // Keep legacy throwing hooks compatible, but never ignore a denial.
          if (reservation !== undefined && reservation?.sendAllowed !== true) {
            throw new ZenchefError('attempt_not_authorized', 409);
          }
          if (this.#closed) throw new ZenchefError('closed', 503);
          await click('submit');
          const result = s.page.locator('[data-zenchef-test="result"]');
          await result.waitFor({ state: 'visible' });
          const status = await result.getAttribute('data-status');
          const reference = await result.getAttribute('data-reference');
          if (status === 'confirmed' && reference) {
            s.result = { status: 'sandbox_confirmed', reference }; s.state = 'sandbox_confirmed';
          } else if (status === 'rejected') { s.result = { status: 'sandbox_rejected' }; s.state = 'rejected'; }
          else if (status === 'payment_required') { s.result = { status: 'sandbox_payment_required' }; s.state = 'payment_required'; }
        } catch { /* unknown, no automatic retry */ }
        try { await this.recordResult(s); }
        catch { s.state = 'unknown'; s.result = { status: 'sandbox_unknown', reason: 'result_persistence_failed' }; }
      } else throw new ZenchefError('invalid_transition', 409);
      return await this.snapshot(s);
    } catch (error) {
      // Invalidate screenshots after any partially completed browser interaction.
      try { await this.snapshot(s); }
      catch { this.#sessions.delete(s.id); await s.context.close().catch(() => {}); }
      throw error;
    } finally { s.busy = false; }
  }
  async remove(id, owner) {
    const s = this.#sessions.get(id);
    if (!s || s.owner !== owner) throw new ZenchefError('session_expired', 404);
    if (s.busy) throw new ZenchefError('busy', 409);
    this.#sessions.delete(id); await s.context.close();
  }
  async expire() {
    for (const s of this.#sessions.values()) if (!s.busy && this.now() - s.touched >= TTL) await this.remove(s.id, s.owner);
  }
  async close() {
    this.#closed = true;
    await Promise.all([...this.#sessions.values()].map(s => s.context.close().catch(() => {})));
    const browser = await this.#browserPromise?.catch(() => null);
    await browser?.close(); this.#sessions.clear();
  }
}
