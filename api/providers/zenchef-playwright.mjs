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
export const ZENCHEF_CHEZ_FERNAND_CHRISTINE = Object.freeze({restaurantId:'curated-PAR-chez-fernand-christine',venueId:'361894',name:'Chez Fernand Christine',
  url:'https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1',timezone:'Europe/Paris',minParty:2,maxParty:2,
  shiftId:121338,offerId:60971,lunchTimes:Object.freeze(['12:00','12:30','13:00','13:30','14:00']),source:'https://www.restaurantchezfernand.fr/',
  menuSource:'https://www.restaurantchezfernand.fr/',policySource:'https://bookings.zenchef.com/gtc?rid=361894&lang=fr'});
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
export const ZENCHEF_INDIANAMONTPARNASSE = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-montparnasse', venueId: '375451', name: 'Indiana Café Montparnasse',
  url: 'https://bookings.zenchef.com/results?rid=375451&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 314295, source: 'https://www.indianacafe.fr/restaurant/montparnasse', policySource: 'https://bookings.zenchef.com/gtc?rid=375451&pid=1001&lang=fr' });
export const ZENCHEF_INDIANAREPUBLIQUE = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-republique', venueId: '375452', name: 'Indiana Café République',
  url: 'https://bookings.zenchef.com/results?rid=375452&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 274078, source: 'https://www.indianacafe.fr/restaurant/republique', policySource: 'https://bookings.zenchef.com/gtc?rid=375452&pid=1001&lang=fr' });
export const ZENCHEF_INDIANABERCYVILLAGE = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-bercy-village', venueId: '373677', name: 'Indiana Café Bercy Village',
  url: 'https://bookings.zenchef.com/results?rid=373677&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 245385, source: 'https://www.indianacafe.fr/restaurant/bercy-village', policySource: 'https://bookings.zenchef.com/gtc?rid=373677&pid=1001&lang=fr' });
export const ZENCHEF_INDIANADENFERTROCHEREAU = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-denfert-rochereau', venueId: '375447', name: 'Indiana Café Denfert Rochereau',
  url: 'https://bookings.zenchef.com/results?rid=375447&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 278132, source: 'https://www.indianacafe.fr/restaurant/denfert-rochereau', policySource: 'https://bookings.zenchef.com/gtc?rid=375447&pid=1001&lang=fr' });
export const ZENCHEF_INDIANALESHALLES = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-les-halles', venueId: '375449', name: 'Indiana Café Les Halles',
  url: 'https://bookings.zenchef.com/results?rid=375449&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 275998, source: 'https://www.indianacafe.fr/restaurant/les-halles', policySource: 'https://bookings.zenchef.com/gtc?rid=375449&pid=1001&lang=fr' });
export const ZENCHEF_INDIANATERNES = Object.freeze({ restaurantId: 'curated-PAR-indiana-cafe-ternes', venueId: '375456', name: 'Indiana Café Ternes',
  url: 'https://bookings.zenchef.com/results?rid=375456&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 276269, source: 'https://www.indianacafe.fr/restaurant/ternes', policySource: 'https://bookings.zenchef.com/gtc?rid=375456&pid=1001&lang=fr' });
export const ZENCHEF_OKOMUSU = Object.freeze({ restaurantId: 'curated-PAR-okomusu', venueId: '359982', name: 'OKOMUSU',
  url: 'https://bookings.zenchef.com/results?rid=359982&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 87616, source: 'https://www.okomusu.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=359982&lang=fr' });
export const ZENCHEF_ZENRESTAURANT = Object.freeze({ restaurantId: 'curated-PAR-zen-restaurant', venueId: '359831', name: 'ZEN',
  url: 'https://bookings.zenchef.com/results?rid=359831&pid=1001&lang=fr', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 192088, source: 'https://www.zenrestaurantparis.fr/en/reservation/', policySource: 'https://bookings.zenchef.com/gtc?rid=359831&pid=1001&lang=fr' });
export const ZENCHEF_LAPLAGEPARISIENNE = Object.freeze({ restaurantId: 'curated-PAR-la-plage-parisienne', venueId: '356799', name: 'La Plage Parisienne',
  url: 'https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=356799&lang=fr&iframePosition=right', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 535548, source: 'https://www.laplageparisienne.com/restaurant', policySource: 'https://bookings.zenchef.com/gtc?rid=356799&lang=fr' });
export const ZENCHEF_CAFEDESMUSEES = Object.freeze({ restaurantId: 'curated-PAR-cafe-des-musees', venueId: '348911', name: 'Café des Musées',
  url: 'https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=348911&lang=fr&showCollapsed=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 7248, source: 'https://www.lecafedesmusees.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=348911&lang=fr' });
export const ZENCHEF_CASIMIR = Object.freeze({ restaurantId: 'curated-PAR-casimir', venueId: '364645', name: 'Casimir',
  url: 'https://bookings.zenchef.com/results?rid=364645&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 160340, source: 'https://www.casimir.paris/en/r%C3%A9servations', policySource: 'https://bookings.zenchef.com/gtc?rid=364645&pid=1001' });
export const ZENCHEF_BICHEPARIS8 = Object.freeze({ restaurantId: 'curated-PAR-biche-paris8', venueId: '363606', name: 'Biche',
  url: 'https://bookings.zenchef.com/results?rid=363606&fullscreen=1&lang=en', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 149228, source: 'https://www.biche-restaurant.com/en/', policySource: 'https://bookings.zenchef.com/gtc?rid=363606&lang=en' });
export const ZENCHEF_SAVANNAHCAFE = Object.freeze({ restaurantId: 'curated-PAR-savannah-cafe', venueId: '377106', name: 'Savannah Café',
  url: 'https://bookings.zenchef.com/results?sdk=1&rid=377106&showCollapsed=0', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 300276, source: 'https://www.savannahcafe.fr/fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=377106&lang=fr' });
export const ZENCHEF_JULESJO = Object.freeze({ restaurantId: 'curated-PAR-jules-jo', venueId: '359960', name: 'Jules Jo',
  url: 'https://bookings.zenchef.com/results?pid=1001&rid=359960', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 86920, source: 'https://www.julesjo.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=359960&lang=fr' });
export const ZENCHEF_BECCO = Object.freeze({ restaurantId: 'curated-PAR-becco', venueId: '365882', name: 'Becco',
  url: 'https://bookings.zenchef.com/results?rid=365882&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 177844, source: 'https://www.becco-paris.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=365882&lang=fr' });
export const ZENCHEF_BATISTOU = Object.freeze({ restaurantId: 'curated-PAR-batistou', venueId: '365881', name: 'Batistou',
  url: 'https://bookings.zenchef.com/results?rid=365881&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 176469, source: 'https://www.batistou-paris.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=365881&lang=fr' });
export const ZENCHEF_OFFICEPARIS = Object.freeze({ restaurantId: 'curated-PAR-office-paris', venueId: '350113', name: "L'office",
  url: 'https://bookings.zenchef.com/results?rid=350113&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 12173, source: 'https://www.office-resto.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=350113&lang=fr' });
export const ZENCHEF_ARDENT = Object.freeze({ restaurantId: 'curated-PAR-ardent', venueId: '358338', name: 'Ardent',
  url: 'https://bookings.zenchef.com/results?rid=358338&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 82526, source: 'https://www.restaurant-ardentparis.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=358338&lang=fr' });
export const ZENCHEF_BIENELEVE = Object.freeze({ restaurantId: 'curated-PAR-bien-eleve', venueId: '354279', name: 'Bien élevé',
  url: 'https://bookings.zenchef.com/results?rid=354279', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 36016, source: 'https://www.bieneleve.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=354279&lang=fr' });
export const ZENCHEF_BRASSERIEJAJA = Object.freeze({ restaurantId: 'curated-PAR-brasserie-jaja-amsterdam', venueId: '373777', name: 'Brasserie Jaja',
  url: 'https://bookings.zenchef.com/results?rid=373777&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 347295, lunchTimes: Object.freeze(['11:45','12:00','12:15']), source: 'https://www.brasseriejaja.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=373777&lang=fr' });
export const ZENCHEF_CANAILLESPIGALLE = Object.freeze({ restaurantId: 'curated-PAR-les-canailles-pigalle', venueId: '361319', name: 'Les Canailles Pigalle',
  url: 'https://bookings.zenchef.com/results?rid=361319&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 107333, lunchTimes: Object.freeze(['12:00','12:30','13:00','13:30']), source: 'https://restaurantlescanailles.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=361319&lang=fr' });
export const ZENCHEF_COMPTOIRPETITSCHAMPS = Object.freeze({ restaurantId: 'curated-PAR-comptoir-petits-champs', venueId: '77441', name: 'Le Comptoir des Petits Champs',
  url: 'https://bookings.zenchef.com/results?rid=77441&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 292, lunchTimes: Object.freeze(['12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00','14:15','14:30']), source: 'https://www.lecomptoirdespetitschamps.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=77441&lang=fr' });
export const ZENCHEF_ESCUDELLA = Object.freeze({ restaurantId: 'curated-PAR-escudella', venueId: '348060', name: "L'Escudella",
  url: 'https://bookings.zenchef.com/results?rid=348060&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 4974, lunchTimes: Object.freeze(['12:00','12:30','13:00','13:30','14:00']), source: 'https://www.escudella.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=348060&lang=fr' });
export const ZENCHEF_CORNICHON_GONCOURT = Object.freeze({ restaurantId: 'curated-PAR-le-cornichon-goncourt', venueId: '366035', name: 'Le Cornichon',
  url: 'https://bookings.zenchef.com/results?rid=366035&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 172864, lunchTimes: Object.freeze(['12:00']), source: 'https://www.lecornichon.paris/', policySource: 'https://bookings.zenchef.com/gtc?rid=366035&lang=fr' });
export const ZENCHEF_IBRIK_KITCHEN = Object.freeze({ restaurantId: 'curated-PAR-ibrik-kitchen', venueId: '352129', name: 'IBRIK KITCHEN',
  url: 'https://bookings.zenchef.com/results?rid=352129&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 17983, lunchTimes: Object.freeze(['12:15','12:45','13:30']), source: 'https://ibrik.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=352129&lang=fr' });
export const ZENCHEF_CHEZ_FERNAND_GUISARDE = Object.freeze({ restaurantId: 'curated-PAR-chez-fernand-guisarde', venueId: '384073', name: 'Chez Fernand Guisarde',
  url: 'https://bookings.zenchef.com/results?rid=384073&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 429732, lunchTimes: Object.freeze(["12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00","14:15"]), source: 'https://www.restaurantchezfernand-guisarde.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=384073&lang=fr' });
export const ZENCHEF_CAFE_COMPTOIR_ABEL = Object.freeze({ restaurantId: 'curated-LYO-cafe-comptoir-abel', venueId: '357745', name: 'Café Comptoir Abel',
  url: 'https://bookings.zenchef.com/results?rid=357745&fullscreen=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 77701, lunchTimes: Object.freeze(['12:00','12:15','12:30','12:45','13:00','13:15']), source: 'https://www.maisonabel.fr/maison-abel/le-cafe-comptoir-chez-abel/', policySource: 'https://bookings.zenchef.com/gtc?rid=357745&lang=fr' });
export const ZENCHEF_BISTROT_ABEL = Object.freeze({ restaurantId: 'curated-LYO-bistrot-abel', venueId: '357746', name: "Le Bistrot d'Abel",
  url: 'https://bookings.zenchef.com/results?rid=357746&fullscreen=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2,
  shiftId: 77813, lunchTimes: Object.freeze(['12:00','12:15','12:30','12:45','13:00','13:15','13:30']), source: 'https://www.maisonabel.fr/maison-abel/contact/', policySource: 'https://bookings.zenchef.com/gtc?rid=357746&lang=fr' });
export const ZENCHEF_COMPTOIR_CHABERT = Object.freeze({ restaurantId: 'curated-LYO-comptoir-chabert', venueId: '354752', name: 'Comptoir Chabert', url: 'https://bookings.zenchef.com/results?rid=354752&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 41399, lunchTimes: Object.freeze(['12:00','12:15','12:30','12:45','13:00']), source: 'https://www.chezchabert.com/informations-contact/', policySource: 'https://bookings.zenchef.com/gtc?rid=354752&lang=fr' });
export const ZENCHEF_MAISON_MOLY = Object.freeze({ restaurantId: 'curated-LYO-maison-moly', venueId: '362732', name: 'Maison Moly', url: 'https://bookings.zenchef.com/results?rid=362732&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 137085, lunchTimes: Object.freeze(['12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45']), source: 'https://www.maisonmoly.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=362732&lang=fr' });
export const ZENCHEF_NOSCH = Object.freeze({ restaurantId: 'curated-LYO-nosch', venueId: '361415', name: 'NOSCH', url: 'https://bookings.zenchef.com/results?rid=361415&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 107873, lunchTimes: Object.freeze(['12:00','12:15','12:30','12:45','13:30']), source: 'https://nosch.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=361415&lang=fr' });
export const ZENCHEF_BRASSERIE_ROSEAUX = Object.freeze({ restaurantId: 'curated-LYO-brasserie-roseaux', venueId: '370036', name: 'Brasserie Roseaux', url: 'https://bookings.zenchef.com/results?rid=370036&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 378092, lunchTimes: Object.freeze(['12:00','12:15','12:30','12:45','13:00','13:15','13:30']), source: 'https://www.brasserieroseaux.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=370036&lang=fr' });
export const ZENCHEF_LE_VIVARAIS = Object.freeze({ restaurantId: 'curated-LYO-le-vivarais', venueId: '356393', name: 'Restaurant Le Vivarais', url: 'https://bookings.zenchef.com/results?rid=356393&fullscreen&lang=fr&withCloseButton=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 58213, lunchTimes: Object.freeze(['12:00','12:15','12:45','13:00']), source: 'https://www.restaurant-levivarais.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=356393&lang=fr' });
export const ZENCHEF_SHIYO = Object.freeze({ restaurantId: 'curated-LYO-shiyo', venueId: '377346', name: 'SHIYO', url: 'https://bookings.zenchef.com/results?rid=377346&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 304033, lunchTimes: Object.freeze(['11:45','12:00','12:15','12:30','12:45','13:00']), source: 'https://www.shiyo.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=377346&lang=fr' });
export const ZENCHEF_LE_MERCIERE = Object.freeze({ restaurantId: 'curated-LYO-le-merciere', venueId: '360735', name: 'Le Mercière', url: 'https://bookings.zenchef.com/results?rid=360735&pid=1001', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 101507, lunchTimes: Object.freeze(['12:00','12:15','12:30','13:30','13:45','14:00','14:15','14:30']), source: 'https://lemerciere.com/', policySource: 'https://bookings.zenchef.com/gtc?rid=360735&lang=fr' });
export const ZENCHEF_LE_CERF_VOLANT = Object.freeze({ restaurantId: 'curated-LYO-le-cerf-volant', venueId: '378221', name: 'Le Cerf-Volant', url: 'https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=378221&showCollapsed=1', timezone: 'Europe/Paris', minParty: 2, maxParty: 2, shiftId: 325474, lunchTimes: Object.freeze(['12:00','12:30','13:00','13:15','13:30']), source: 'https://lecerf-volant.fr/', policySource: 'https://bookings.zenchef.com/gtc?rid=378221&lang=fr' });
const NO_ROOM_LUNCH_VENUES = Object.freeze([ZENCHEF_LE_CERF_VOLANT, ZENCHEF_LE_MERCIERE, ZENCHEF_SHIYO, ZENCHEF_LE_VIVARAIS, ZENCHEF_BRASSERIE_ROSEAUX, ZENCHEF_NOSCH, ZENCHEF_MAISON_MOLY, ZENCHEF_COMPTOIR_CHABERT, ZENCHEF_BISTROT_ABEL, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_CHEZ_FERNAND_CHRISTINE, ZENCHEF_BOFINGER, ZENCHEF_LACOUPOLE, ZENCHEF_TERMINUSNORD, ZENCHEF_PROCOPE, ZENCHEF_LALORRAINE, ZENCHEF_PIEDDECOCHON, ZENCHEF_GRANDCAFE, ZENCHEF_VAGENENDE, ZENCHEF_BOUILLONJULIEN, ZENCHEF_BOUILLONRACINE, ZENCHEF_BOUILLONREPUBLIQUE, ZENCHEF_ROSIE, ZENCHEF_ROSIELOU, ZENCHEF_ROSIEJOLIE, ZENCHEF_PETITSOMMELIER, ZENCHEF_CHEZSAVY, ZENCHEF_CHEZRENE, ZENCHEF_BISTROTPARIS, ZENCHEF_AUXBONSCRUS, ZENCHEF_AUXCRUSBOURGOGNE, ZENCHEF_PETITRETRO, ZENCHEF_MOULINVENT, ZENCHEF_PETITPONTOISE, ZENCHEF_LEFLORENTIN, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_CAFERUC, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC, ZENCHEF_INDIANAMONTPARNASSE, ZENCHEF_INDIANAREPUBLIQUE, ZENCHEF_INDIANABERCYVILLAGE, ZENCHEF_INDIANADENFERTROCHEREAU, ZENCHEF_INDIANALESHALLES, ZENCHEF_INDIANATERNES, ZENCHEF_OKOMUSU, ZENCHEF_ZENRESTAURANT, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_CAFEDESMUSEES, ZENCHEF_CASIMIR, ZENCHEF_BICHEPARIS8, ZENCHEF_SAVANNAHCAFE, ZENCHEF_JULESJO, ZENCHEF_BECCO, ZENCHEF_BATISTOU, ZENCHEF_OFFICEPARIS, ZENCHEF_ARDENT, ZENCHEF_BIENELEVE, ZENCHEF_BRASSERIEJAJA, ZENCHEF_CANAILLESPIGALLE, ZENCHEF_COMPTOIRPETITSCHAMPS, ZENCHEF_ESCUDELLA, ZENCHEF_CORNICHON_GONCOURT, ZENCHEF_IBRIK_KITCHEN, ZENCHEF_CHEZ_FERNAND_GUISARDE]);
const ROOM_VENUES = Object.freeze([ZENCHEF_PESQUIERE, ZENCHEF_PIROUETTE]);
const READBACK_VENUES = Object.freeze([...ROOM_VENUES, ZENCHEF_DEKAS, ...NO_ROOM_LUNCH_VENUES]);
export const ZENCHEF_POLICY_SOURCE = 'https://bookings.zenchef.com/gtc?rid=388090&lang=fr';
const VENUES = Object.freeze({ [ZENCHEF_LE_CERF_VOLANT.restaurantId]:ZENCHEF_LE_CERF_VOLANT, [ZENCHEF_LE_MERCIERE.restaurantId]:ZENCHEF_LE_MERCIERE, [ZENCHEF_SHIYO.restaurantId]:ZENCHEF_SHIYO, [ZENCHEF_LE_VIVARAIS.restaurantId]:ZENCHEF_LE_VIVARAIS, [ZENCHEF_BRASSERIE_ROSEAUX.restaurantId]:ZENCHEF_BRASSERIE_ROSEAUX, [ZENCHEF_NOSCH.restaurantId]: ZENCHEF_NOSCH, [ZENCHEF_MAISON_MOLY.restaurantId]: ZENCHEF_MAISON_MOLY, [ZENCHEF_COMPTOIR_CHABERT.restaurantId]: ZENCHEF_COMPTOIR_CHABERT, [ZENCHEF_BISTROT_ABEL.restaurantId]: ZENCHEF_BISTROT_ABEL, [ZENCHEF_CAFE_COMPTOIR_ABEL.restaurantId]: ZENCHEF_CAFE_COMPTOIR_ABEL, [ZENCHEF_CHEZ_FERNAND_CHRISTINE.restaurantId]:ZENCHEF_CHEZ_FERNAND_CHRISTINE, [ZENCHEF_CHEZ_FERNAND_GUISARDE.restaurantId]: ZENCHEF_CHEZ_FERNAND_GUISARDE, [ZENCHEF_IBRIK_KITCHEN.restaurantId]: ZENCHEF_IBRIK_KITCHEN, [ZENCHEF_CORNICHON_GONCOURT.restaurantId]: ZENCHEF_CORNICHON_GONCOURT, [ZENCHEF_ESCUDELLA.restaurantId]: ZENCHEF_ESCUDELLA, [ZENCHEF_COMPTOIRPETITSCHAMPS.restaurantId]: ZENCHEF_COMPTOIRPETITSCHAMPS, [ZENCHEF_CANAILLESPIGALLE.restaurantId]: ZENCHEF_CANAILLESPIGALLE, [ZENCHEF_BRASSERIEJAJA.restaurantId]: ZENCHEF_BRASSERIEJAJA, [ZENCHEF_BIENELEVE.restaurantId]: ZENCHEF_BIENELEVE, [ZENCHEF_ARDENT.restaurantId]: ZENCHEF_ARDENT, [ZENCHEF_OFFICEPARIS.restaurantId]: ZENCHEF_OFFICEPARIS, [ZENCHEF_BATISTOU.restaurantId]: ZENCHEF_BATISTOU, [ZENCHEF_BECCO.restaurantId]: ZENCHEF_BECCO, [ZENCHEF_JULESJO.restaurantId]: ZENCHEF_JULESJO, [ZENCHEF_SAVANNAHCAFE.restaurantId]: ZENCHEF_SAVANNAHCAFE, [ZENCHEF_BICHEPARIS8.restaurantId]: ZENCHEF_BICHEPARIS8, [ZENCHEF_CASIMIR.restaurantId]: ZENCHEF_CASIMIR, [ZENCHEF_CAFEDESMUSEES.restaurantId]: ZENCHEF_CAFEDESMUSEES, [ZENCHEF_LAPLAGEPARISIENNE.restaurantId]: ZENCHEF_LAPLAGEPARISIENNE, [ZENCHEF_ZENRESTAURANT.restaurantId]: ZENCHEF_ZENRESTAURANT, [ZENCHEF_OKOMUSU.restaurantId]: ZENCHEF_OKOMUSU, [ZENCHEF_INDIANATERNES.restaurantId]: ZENCHEF_INDIANATERNES, [ZENCHEF_INDIANALESHALLES.restaurantId]: ZENCHEF_INDIANALESHALLES, [ZENCHEF_INDIANADENFERTROCHEREAU.restaurantId]: ZENCHEF_INDIANADENFERTROCHEREAU, [ZENCHEF_INDIANABERCYVILLAGE.restaurantId]: ZENCHEF_INDIANABERCYVILLAGE, [ZENCHEF_INDIANAREPUBLIQUE.restaurantId]: ZENCHEF_INDIANAREPUBLIQUE, [ZENCHEF_INDIANAMONTPARNASSE.restaurantId]: ZENCHEF_INDIANAMONTPARNASSE, [ZENCHEF_INDIANATOLBIAC.restaurantId]: ZENCHEF_INDIANATOLBIAC, [ZENCHEF_INDIANABEAUGRENELLE.restaurantId]: ZENCHEF_INDIANABEAUGRENELLE, [ZENCHEF_INDIANARICHELIEU.restaurantId]: ZENCHEF_INDIANARICHELIEU, [ZENCHEF_INDIANABONNENOUVELLE.restaurantId]: ZENCHEF_INDIANABONNENOUVELLE, [ZENCHEF_CAFERUC.restaurantId]: ZENCHEF_CAFERUC, [ZENCHEF_CAFEMARLY.restaurantId]: ZENCHEF_CAFEMARLY, [ZENCHEF_MARTHA.restaurantId]: ZENCHEF_MARTHA, [ZENCHEF_LEFLORENTIN.restaurantId]: ZENCHEF_LEFLORENTIN, [ZENCHEF_PETITPONTOISE.restaurantId]: ZENCHEF_PETITPONTOISE, [ZENCHEF_MOULINVENT.restaurantId]: ZENCHEF_MOULINVENT, [ZENCHEF_PETITRETRO.restaurantId]: ZENCHEF_PETITRETRO, [ZENCHEF_AUXCRUSBOURGOGNE.restaurantId]: ZENCHEF_AUXCRUSBOURGOGNE, [ZENCHEF_AUXBONSCRUS.restaurantId]: ZENCHEF_AUXBONSCRUS, [ZENCHEF_BISTROTPARIS.restaurantId]: ZENCHEF_BISTROTPARIS, [ZENCHEF_CHEZRENE.restaurantId]: ZENCHEF_CHEZRENE, [ZENCHEF_CHEZSAVY.restaurantId]: ZENCHEF_CHEZSAVY, [ZENCHEF_PETITSOMMELIER.restaurantId]: ZENCHEF_PETITSOMMELIER, [ZENCHEF_ROSIEJOLIE.restaurantId]: ZENCHEF_ROSIEJOLIE, [ZENCHEF_ROSIELOU.restaurantId]: ZENCHEF_ROSIELOU, [ZENCHEF_ROSIE.restaurantId]: ZENCHEF_ROSIE, [ZENCHEF_BOUILLONREPUBLIQUE.restaurantId]: ZENCHEF_BOUILLONREPUBLIQUE, [ZENCHEF_BOUILLONRACINE.restaurantId]: ZENCHEF_BOUILLONRACINE, [ZENCHEF_BOUILLONJULIEN.restaurantId]: ZENCHEF_BOUILLONJULIEN, [ZENCHEF_VAGENENDE.restaurantId]: ZENCHEF_VAGENENDE, [ZENCHEF_GRANDCAFE.restaurantId]: ZENCHEF_GRANDCAFE, [ZENCHEF_PIEDDECOCHON.restaurantId]: ZENCHEF_PIEDDECOCHON, [ZENCHEF_LALORRAINE.restaurantId]: ZENCHEF_LALORRAINE, [ZENCHEF_PROCOPE.restaurantId]: ZENCHEF_PROCOPE, [ZENCHEF_TERMINUSNORD.restaurantId]: ZENCHEF_TERMINUSNORD, [ZENCHEF_LACOUPOLE.restaurantId]: ZENCHEF_LACOUPOLE, [ZENCHEF_BOFINGER.restaurantId]: ZENCHEF_BOFINGER, [ZENCHEF_DEKAS.restaurantId]: ZENCHEF_DEKAS, [ZENCHEF_ARPEGE.restaurantId]: ZENCHEF_ARPEGE, [ZENCHEF_FISHCORNER.restaurantId]: ZENCHEF_FISHCORNER, [ZENCHEF_PESQUIERE.restaurantId]: ZENCHEF_PESQUIERE, [ZENCHEF_PIROUETTE.restaurantId]: ZENCHEF_PIROUETTE });
const FIXTURE_URL = 'https://zenchef-fixture.invalid/';
const TTL = 10 * 60_000;
const FIELDS = ['firstname', 'lastname', 'email', 'phone'];
const PROVIDER_FIELDS = Object.freeze({ firstname: '[data-testid="firstname-input"]',
  lastname: '[data-testid="lastname-input"]', email: '[data-testid="email-input"]', phone: '[data-testid="phone-input"]' });
const PURPOSE_SLUG = 'motif-de-la-reservation';
const PURPOSE_KEY = 'custom_field.' + PURPOSE_SLUG;
const STANDARD_REQUIRED_FIELDS = ['firstname', 'lastname', 'email', 'phone_number', 'country', 'civility'];
// Product limits: a single line, nonblank, <=200 UTF-16 units; retain exact text.
export const validReservationPurpose = value => typeof value === 'string' && value.length <= 200
  && value.trim().length > 0 && !/[\x00-\x1f\x7f]/.test(value);
export function montparnassePurposeMetadata(state) {
  const field = state?.customFields?.[0];
  return state?.restaurantId === ZENCHEF_INDIANAMONTPARNASSE.venueId && state.isInUpdateFlow === false
    && Array.isArray(state.customFields) && state.customFields.length === 1
    && field?.id === 4815 && field.restaurant_id === 375451 && field.slug === PURPOSE_SLUG
    && field.title === 'Motif de la réservation' && field.type === 'auto' && field.step === 3
    && field.displayType === 'text' && field.enabled === false && field.required === true
    && Array.isArray(field.options) && field.options.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.mandatoryFields?.[PURPOSE_KEY] === 'required'
    && STANDARD_REQUIRED_FIELDS.every(key => state.mandatoryFields[key] === 'required');
}
export const LES_HALLES_VISIT_REASONS = Object.freeze(['déjeuner/ dîner', 'grignotter', 'boire un verre ']);
const VISIT_REASON_SLUG = 'je-viens-pour', VISIT_REASON_KEY = 'custom_field.' + VISIT_REASON_SLUG;
export const TERNES_VISIT_REASONS = Object.freeze(['Déjeuner / Diner', 'Grignoter', 'Boire une verre']);
const visitConfig = venue => venue === ZENCHEF_INDIANALESHALLES ? {values:LES_HALLES_VISIT_REASONS,slug:VISIT_REASON_SLUG,label:'Je viens pour :'}
  : venue === ZENCHEF_INDIANATERNES ? {values:TERNES_VISIT_REASONS,slug:'je-reserve-pour',label:'Je réserve pour:'} : null;
const visitVenueForId = id => [ZENCHEF_INDIANALESHALLES,ZENCHEF_INDIANATERNES].find(venue=>venue.restaurantId===id);
export const validReservationVisitReason = (value, venue = ZENCHEF_INDIANALESHALLES) => typeof value === 'string' && !!visitConfig(venue)?.values.includes(value);
export function lesHallesVisitMetadata(state) {
  const field = state?.customFields?.[0];
  return state?.restaurantId === ZENCHEF_INDIANALESHALLES.venueId && state.isInUpdateFlow === false
    && Array.isArray(state.customFields) && state.customFields.length === 1
    && field?.id === 4811 && field.restaurant_id === 375449 && field.slug === VISIT_REASON_SLUG
    && field.title === 'Je viens pour :' && field.type === 'auto' && field.step === 3
    && field.displayType === 'select' && field.enabled === false && field.required === true
    && Array.isArray(field.options) && field.options.length === 3
    && field.options.every((option, i) => option.id === 8000 + i && option.module_custom_field_reservation_id === 4811
      && option.text === LES_HALLES_VISIT_REASONS[i] && option.value === LES_HALLES_VISIT_REASONS[i] && option.enabled === 0)
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.mandatoryFields?.[VISIT_REASON_KEY] === 'required'
    && STANDARD_REQUIRED_FIELDS.every(key => state.mandatoryFields[key] === 'required');
}
export function ternesVisitMetadata(state) {
  const field = state?.customFields?.[0];
  return state?.restaurantId === ZENCHEF_INDIANATERNES.venueId && state.isInUpdateFlow === false
    && Array.isArray(state.customFields) && state.customFields.length === 1
    && field?.id === 4812 && field.restaurant_id === 375456 && field.slug === 'je-reserve-pour'
    && field.title === 'Je réserve pour:' && field.type === 'auto' && field.step === 3
    && field.displayType === 'select' && field.enabled === false && field.required === true
    && Array.isArray(field.options) && field.options.length === 3
    && field.options.every((option, i) => option.id === 8003 + i && option.module_custom_field_reservation_id === 4812
      && option.text === TERNES_VISIT_REASONS[i] && option.value === TERNES_VISIT_REASONS[i] && option.enabled === 0)
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.mandatoryFields?.['custom_field.je-reserve-pour'] === 'required'
    && STANDARD_REQUIRED_FIELDS.every(key => state.mandatoryFields[key] === 'required');
}
export const PLAGE_DURATION_SLUG = 'le-samedi-soir-jai-bien-pris-connaissance-que-ma-table-est-reservee-pour-une-duree-de-2h';
export const PLAGE_DURATION_LABEL = 'Le samedi soir, j’ai bien pris connaissance que ma table est réservée pour une durée de 2h';
export function laPlageDurationMetadata(state) {
 const f=state?.customFields?.[0];
 return state?.restaurantId === '356799' && state.isInUpdateFlow === false
  && Array.isArray(state.customFields) && state.customFields.length === 1
  && f?.id === 2069 && f.restaurant_id === 356799 && f.slug === PLAGE_DURATION_SLUG
  && f.title === PLAGE_DURATION_LABEL && f.type === 'checkbox' && f.displayType === 'checkbox' && f.step === 3
  && f.enabled === false && f.required === true && Array.isArray(f.options) && f.options.length === 0
  && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
  && state.mandatoryFields?.['custom_field.'+PLAGE_DURATION_SLUG] === 'required'
  && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields[k] === 'required');
}
export function cafeDesMuseesMetadata(state) {
 const f=state?.customFields?.[0];
 return state?.restaurantId === '348911' && state.isInUpdateFlow === false
  && Array.isArray(state.customFields) && state.customFields.length === 1
  && f?.id === 2397 && f.restaurant_id === 348911 && f.slug === 'code-promo' && f.title === 'Code Promo'
  && f.type === 'auto' && f.displayType === 'text' && f.step === 3 && f.enabled === true && f.required === false
  && Array.isArray(f.options) && f.options.length === 0
  && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
  && state.mandatoryFields?.['custom_field.code-promo'] === 'displayed'
  && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields[k] === 'required');
}
export function bienEleveMetadata(state) {
 const f=state?.customFields?.[0];
 return state?.restaurantId === '354279' && state.isInUpdateFlow === false
  && Array.isArray(state.customFields) && state.customFields.length === 1
  && f?.id === 694 && f.restaurant_id === 354279
  && f.slug === 'terrasse-sous-reserve-de-disponibilite' && f.title === 'Terrasse (sous réserve de disponibilité)'
  && f.type === 'checkbox' && f.displayType === 'checkbox' && f.step === 3
  && f.enabled === false && f.required === false && Array.isArray(f.options) && f.options.length === 0
  && f.created_at === "2020-06-30T13:14:48.000000Z" && f.updated_at === "2020-06-30T13:14:48.000000Z"
  && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
  && state.mandatoryFields?.['custom_field.terrasse-sous-reserve-de-disponibilite'] === 'hidden'
  && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields[k] === 'required');
}
// Preserve the enabled optional gift field and connected-voucher metadata exactly.
// Ordinary bookings never carry a gift number or validated/selected voucher.
export function escudellaMetadata(state) {
  return state?.restaurantId === '348060' && state.isInUpdateFlow === false
    && Array.isArray(state.customFields) && state.customFields.length === 1
    && digest(state.customFields) === 'fe13a35024ed09f85a752aae756410f343b70b5efd4d891fa4634d60449c9f85'
    && !!state.mandatoryFields && digest(state.mandatoryFields) === '8b084a53c62aace653ce019c17969beef00a431d4cda0abee41e935c809c6fa0'
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.hasConnectedVouchers === true && state.shouldDisplayShopVoucher === true
    && !!state.voucherParam && digest(state.voucherParam) === '64f822bfd49327a75404fbcd6f3c99e9272d1d207384d4e127fbbf1fd8e50a33'
    && !!state.voucherCodes && digest(state.voucherCodes) === 'ee2896a3d63cfcf2fe7696df2125a480839763426a3a41aa675508f4eaf87175'
    && !!state.custom_field && typeof state.custom_field === 'object' && !Array.isArray(state.custom_field) && Object.keys(state.custom_field).length === 0;
}
// The observed connected-voucher DOM control is separate from legacy custom field2196.
export async function verifyEscudellaNoGift(page) {
  const gift = page.locator('input#mybeezbox');
  const label = page.getByText('Votre code cadeau', { exact: true });
  if (await gift.count() !== 1 || !await gift.isVisible() || !await gift.isEnabled()
    || await gift.getAttribute('required') !== null || await gift.getAttribute('readonly') !== null
    || ![null, 'text'].includes(await gift.getAttribute('type')) || await gift.getAttribute('name') !== null
    || await gift.inputValue() !== '' || await label.count() !== 1 || !await label.isVisible())
    throw new ZenchefError('provider_fields_unverified', 409);
}
export function cornichonGoncourtMetadata(state) {
  return state?.restaurantId === '366035' && state.isInUpdateFlow === false
    && !!state.mandatoryFields && digest(state.mandatoryFields) === 'f06613843e2f132083ab244658bdb3bcc0a92ed2a4cd2e3b11edeb90ae49e523'
    && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && Array.isArray(state.rooms) && digest(state.rooms) === '299e96d635ba305f6a9dba501de9e171e7d4c2e5dabb5afc7cd75e40ed156e79'
    && state.hasConnectedVouchers === false && state.shouldDisplayShopVoucher === true
    && !Object.hasOwn(state, 'voucherParam')
    && !!state.voucherCodes && digest(state.voucherCodes) === 'ee2896a3d63cfcf2fe7696df2125a480839763426a3a41aa675508f4eaf87175'
    && !!state.custom_field && typeof state.custom_field === 'object' && !Array.isArray(state.custom_field) && Object.keys(state.custom_field).length === 0;
}
// Only the own 12:00 selection has an observed end-time notice in this release.
export async function cornichonGoncourtSeatingNotice(page) {
  const notice = page.getByText(/^Jusqu'à \d{2}:\d{2}$/);
  if (await notice.count() !== 1 || !await notice.isVisible() || await notice.innerText() !== "Jusqu'à 13:00")
    throw new ZenchefError('seating_terms_unverified', 409);
  return "Jusqu'à 13:00";
}
export function ibrikKitchenMetadata(state) {
  return state?.restaurantId === '352129' && state.isInUpdateFlow === false
    && !!state.mandatoryFields && digest(state.mandatoryFields) === 'f06613843e2f132083ab244658bdb3bcc0a92ed2a4cd2e3b11edeb90ae49e523'
    && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && Array.isArray(state.rooms) && digest(state.rooms) === '8ec3776658e4a9b8c8df03854244707b652a51a9ed6ffce06952dc4699e7df89'
    && state.hasConnectedVouchers === false && state.shouldDisplayShopVoucher === true
    && !Object.hasOwn(state, 'voucherParam')
    && !!state.voucherCodes && digest(state.voucherCodes) === 'ee2896a3d63cfcf2fe7696df2125a480839763426a3a41aa675508f4eaf87175'
    && !!state.custom_field && typeof state.custom_field === 'object' && !Array.isArray(state.custom_field) && Object.keys(state.custom_field).length === 0;
}
export function chezFernandGuisardeMetadata(state) {
  return state?.restaurantId === '384073' && state.isInUpdateFlow === false
    && !!state.mandatoryFields && digest(state.mandatoryFields) === 'f06613843e2f132083ab244658bdb3bcc0a92ed2a4cd2e3b11edeb90ae49e523'
    && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && Array.isArray(state.rooms) && digest(state.rooms) === '081e5c91118babdd488331faf3d5484fa0b5a23fa3ba52e048ebbeb024b05204'
    && state.hasConnectedVouchers === false && state.shouldDisplayShopVoucher === true
    && !Object.hasOwn(state, 'voucherParam')
    && !!state.voucherCodes && digest(state.voucherCodes) === 'ee2896a3d63cfcf2fe7696df2125a480839763426a3a41aa675508f4eaf87175'
    && !!state.custom_field && typeof state.custom_field === 'object' && !Array.isArray(state.custom_field) && Object.keys(state.custom_field).length === 0;
}
// Own results/form source: exact optional gift metadata, but ordinary bookings only.
const ABEL_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment"];
export function cafeComptoirAbelMetadata(state) {
  return !!state && !Object.hasOwn(state,'partner_id') && !Object.hasOwn(state,'voucherParam')
    && digest(ABEL_METADATA_KEYS.map(k=>state[k])) === '06f39ac8e822bfb7803ef7ccd21d190854cb91441e2e17313cffc0b14f4776da'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const ABEL_SLOT_POLICIES = {"12:00":"fe0ccc2e6e6c878eba767cbd37ff9618e5c22d35998c3b0a6bd99ddf7ec0ed35","12:15":"1d4ba6570e602546f9f385a77dfee112cdb715ca50b3410c55237a54b53a0550","12:30":"c9f84cf7d0ba2b3278f503fca2ffb23b46aa20d1c440d4a425e0e22fa6f8be97","12:45":"192f5f0ac2a0b34fa449dcb016e9e4fd2abb211583e35de569983b805355e257","13:00":"63ee0eaada6244c240c418912ccadfb76fbeeccf3460fd81092fd7f44155b92f","13:15":"9c93ea6d291078ab787318228b99c5b30b65bd282bd6185d878c9126b20adbfb","13:30":"a1150aed4ee4a9f895d25d602099086afbc24512e4d58fc7dec7d6d3466c1a44","13:45":"c4df7edd7b5ec45f47ab869dd0e4f03e122c53792af249a79c1a8b706e458e1c","14:00":"b8c791edc21930ee4437d4b5bd5bf88b234dd129bbc0d383d320d9810f7ecdb1"};
export function cafeComptoirAbelPolicy(state, shift, party) {
  if (party !== 2 || !cafeComptoirAbelMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 9 || new Set(shift.shift_slots.map(x=>x.name)).size !== 9) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 14:00:00'?'<date> 14:00:00':bookable_to}) !== '53ec22635ae227b7e7237d0b62e503783633b07ca26dda4554e16829582b84f5') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' '+slot.name+':00'?'<date> '+slot.name+':00':bookable_to}) === ABEL_SLOT_POLICIES[slot.name];
  });
}
const cafeComptoirAbelQuery = q => q?.rid === '357745' && q.fullscreen === '1'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','fullscreen','day','pax','slot'].includes(k));
// Bistrot Abel has its own threshold-eight and fixed 11:45 lunch cutoff.
const BISTROT_ABEL_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment"];
export function bistrotAbelMetadata(state) {
  return !!state && !Object.hasOwn(state,'partner_id') && !Object.hasOwn(state,'voucherParam')
    && digest(BISTROT_ABEL_METADATA_KEYS.map(k=>state[k])) === 'e09e411b74a3e3d87562a6eafe8e80fdf15027e0ded7024a15c270b451596ceb'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const BISTROT_ABEL_SLOT_POLICIES = {"12:00":"79a6f20d7b9207019c9acc6c1c5361a9973aad77b5021a10b0391ced9befbbba","12:15":"f03c5ab0417a173fdef47d24efe0c124ebfb1e965e372d7e5c3c1c504e0114ef","12:30":"39125b46f51efac98b1be0785c1f593e013fab88b01a5f7a94f9f4d457086416","12:45":"c4c48ed9be881e3bc770b438a860ece769593f6b7c29a0a86675aeab90a2826f","13:00":"225c6dd69c55f6d9f86f0637aed16a5f77a52da0ff038db8ef3a679643b90a01","13:15":"5e8502e72a6f87c07c9eb7b921d71a211b280ca3ff171a20164a957dbe257844","13:30":"51aa704902e7327943f7ddd46e7f049c1852fdf579fc97b6aab783254072cdac"};
export function bistrotAbelPolicy(state, shift, party) {
  if (party !== 2 || !bistrotAbelMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 7 || new Set(shift.shift_slots.map(x=>x.name)).size !== 7) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 11:45:00'?'<date> 11:45:00':bookable_to}) !== '2326d2b50c06bf895c72e199cd9800be7d498bc99a4faf118ac3ea280b99ac31') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' 11:45:00'?'<date> 11:45:00':bookable_to}) === BISTROT_ABEL_SLOT_POLICIES[slot.name];
  });
}
const bistrotAbelQuery = q => q?.rid === '357746' && q.fullscreen === '1'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','fullscreen','day','pax','slot'].includes(k));
const COMPTOIR_CHABERT_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment","voucherParam"];
export function comptoirChabertMetadata(state) {
  return !!state && !Object.hasOwn(state,'partner_id')
    && digest(COMPTOIR_CHABERT_METADATA_KEYS.map(k=>state[k])) === 'bd10a89821c67b6bc33c98eea30cd70d3940547a843f001bfb8c5ebe0ee61832'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const COMPTOIR_CHABERT_SLOT_POLICIES = {"12:00":"c2f99edc63b73744fcc086d9c0e94d50c705903dc1869b4527d7c206e66dfdb5","12:15":"50326004c22728b4699a0acb12a1ad71e31b34765f9d3c9798f35af8f9327c94","12:30":"ddb91c2a760b731a54bd7e92afc60bbdf44275e9816f9df6e7141f2e9c267362","12:45":"ab9c254e41a9b2e0eb0f9fed0fd87f6eb916b4938c192b0570e7e69c8303718a","13:00":"b180abdf4e340b1f3d19445300dd723d8ab2ba144481ae89dd6e237f3dd30214"};
export function comptoirChabertPolicy(state, shift, party) {
  if (party !== 2 || !comptoirChabertMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 5 || new Set(shift.shift_slots.map(x=>x.name)).size !== 5) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 11:59:00'?'<date> 11:59:00':bookable_to}) !== '77027cbd3aad644409c2309144ae3f4aebcea30e099c1dc0577c485245ada92e') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' 11:59:00'?'<date> 11:59:00':bookable_to}) === COMPTOIR_CHABERT_SLOT_POLICIES[slot.name];
  });
}
const comptoirChabertQuery = q => q?.rid === '354752' && q.fullscreen === '' && q.lang === 'fr' && q.withCloseButton === '1'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','fullscreen','lang','withCloseButton','day','pax','slot'].includes(k));
const MAISON_MOLY_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment"];
export function maisonMolyMetadata(state) {
  return !!state && !Object.hasOwn(state,'partner_id') && !Object.hasOwn(state,'voucherParam')
    && digest(MAISON_MOLY_METADATA_KEYS.map(k=>state[k])) === 'f0632c203e9afb63a71745fa316527caeb355301859e0f6d1dbf1c3d2abdb498'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const MAISON_MOLY_SLOT_POLICIES = {"12:00":"1975b3d938f1b6ebf42ee168c812a7dfed0c4eb9f23dc30e4d689bdcddd51688","12:15":"9cd1e63641011defc2327b8fd7eb4fecf3ca47f8484eb0a10fff5c49534a4fe8","12:30":"c099d1e2aac2d300c53520806b9e8ed01d9413c3c0de593c7dfe37c1d5672dab","12:45":"bda7e75e1b5ece15c455c6bff6956324c52f5315384d7f3440315d488bc8f902","13:00":"87586b47f727b866a1cf4126b3fe2d47e5636e3c9909393fe68aba65aeb39417","13:15":"707c6ad16816391b8e27bd21bfa3ea5576f825feceabca68b2848f3e46fce8fc","13:30":"e45ba470f66ac61401f9a719f995a993f35eda36f3928c1861db3d9cf88b2da8","13:45":"691ed92405d472dda9cce0516cfd7640ca03fb58ebfc1586e8e4cf4aa784df1b"};
export function maisonMolyPolicy(state, shift, party) {
  if (party !== 2 || !maisonMolyMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 8 || new Set(shift.shift_slots.map(x=>x.name)).size !== 8) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 13:45:00'?'<date> 13:45:00':bookable_to}) !== '40574319a8a07668d0aa819bc9335ae8b9ab78b78f6c2f61cfe142a793000425') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' '+slot.name+':00'?'<date> '+slot.name+':00':bookable_to}) === MAISON_MOLY_SLOT_POLICIES[slot.name];
  });
}
const maisonMolyQuery = q => q?.rid === '362732' && q.fullscreen === '' && q.lang === 'fr' && q.withCloseButton === '1'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','fullscreen','lang','withCloseButton','day','pax','slot'].includes(k));
const NOSCH_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment","partner_id"];
export function noschMetadata(state) {
  return !!state && state.partner_id === '1001' && !Object.hasOwn(state,'voucherParam')
    && digest(NOSCH_METADATA_KEYS.map(k=>state[k])) === '07058cc1fb100d86b0ac7094bcde4f925053ab46f0105c04c7554a5153e28bb4'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const NOSCH_SLOT_POLICIES = {"12:00":"e6d1a69dbd8afe7dde8e1fdc6f413c68afeeaecfdb947d620fe2f9b65d3a2994","12:15":"26e95996cc16c343d022cee5150bf290339db995885bbc688b11079192efb341","12:30":"bbd4ee51554f74f99ce7f057212d7d077bff7b7dc2d9deb22aab1c763eda03f0","12:45":"59bd5fda1aefdac752d0b662843d47807edc14b0f72a76ceb727ebe40b78dc89","13:00":"545417245767f2efdba89d95e34d0040eb86eeb5d6495ef624f82271ab0e4b0e","13:15":"54cf38a06ab5bb24de3d1f447c5c3271a6c340499312fd0529da3200877965af","13:30":"c091efdf32bd1ca714212ed2cf8b8b129ddc57fe39bbdc7e1fa6ac55a6635a8e"};
export function noschPolicy(state, shift, party) {
  if (party !== 2 || !noschMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 7 || new Set(shift.shift_slots.map(x=>x.name)).size !== 7) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 11:30:00'?'<date> 11:30:00':bookable_to}) !== '58043d1d290701353e893c93087d16d03bc5fda972dfd9324132f126326a67c4') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' 11:30:00'?'<date> 11:30:00':bookable_to}) === NOSCH_SLOT_POLICIES[slot.name];
  });
}
const noschQuery = q => q?.rid === '361415' && q.pid === '1001'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','pid','day','pax','slot'].includes(k));
const BRASSERIE_ROSEAUX_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment","partner_id"];
export function roseauxMetadata(state) {
  return !!state && state.partner_id === '1001' && !Object.hasOwn(state,'voucherParam')
    && digest(BRASSERIE_ROSEAUX_METADATA_KEYS.map(k=>state[k])) === 'a6dec7345c856a837668ff676302720536b60c1149387063d6ed6ffa76f39618'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const BRASSERIE_ROSEAUX_SLOT_POLICIES = {"12:00":"adae2a3a333f3e73d50250da13677a3fd0950c7ae3de8ad66fe1d75ba72ef28d","12:15":"a40b0ad2278847de8236c28293efc6621480903a86a7d7d68740b1a207acc6da","12:30":"0c62029cb3464d28bf28815339d1598258b824782dbf5e143d9bef97970e0946","12:45":"1991c6f79302a15390152641853eaaaa744431a1674d7c57f3312474b5827d33","13:00":"6f0700ab8f983fe55211059c5b8fe81da04bd4fcc7ce6debfacc158ddf378b1d","13:15":"27952d0be7ecad1b22b08d110a79bbb1750feab33e3670a3b402c36a589a88af","13:30":"fdad2c47a9df78e2c4fb1c60e74bf0d2741547fcd1875d1f83bfe6b8663f8c9d"};
export function roseauxPolicy(state, shift, party) {
  if (party !== 2 || !roseauxMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 7 || new Set(shift.shift_slots.map(x=>x.name)).size !== 7) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 13:30:00'?'<date> 13:30:00':bookable_to}) !== '05593b4807b20289aeeacfd2f65cd58e222d517fcdeee31012aab1fffa2cb10f') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' '+slot.name+':00'?'<date> '+slot.name+':00':bookable_to}) === BRASSERIE_ROSEAUX_SLOT_POLICIES[slot.name];
  });
}
const roseauxQuery = q => q?.rid === '370036' && q.pid === '1001'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','pid','day','pax','slot'].includes(k));
const LE_VIVARAIS_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment"];
export function vivaraisMetadata(state) {
  return !!state && !Object.hasOwn(state,'partner_id') && !Object.hasOwn(state,'voucherParam')
    && digest(LE_VIVARAIS_METADATA_KEYS.map(k=>state[k])) === '8acb3ce95c9a5480e4dcf3a8ed0b0027a9f3e9c6f6b9aa4e7a6998164678add1'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const LE_VIVARAIS_SLOT_POLICIES = {"12:00":"1c59f7cc9e6b18f862b8cd9c7274e036dac118e3d407d85539f609df2d652a53","12:15":"50914cd7170cf345c7cf42acdfd3f35bdebb2140ff26580f09bd62e68865fb81","12:30":"bd4c7a40a0ef389144b7eef541632fca46c1ab45d584d2879f4b588993105686","12:45":"bfdb62f5f5d3e96f1916512a0f799fd7139894906ea05fc71d8e1e97a05b1b72","13:00":"211d129f109e71de4b12a102e949060bb3f84dd50f12ab4176f358005748391f","13:15":"473edcef99da8ca3d00162f2d3ffdfc66d01ca32fd3a6c37ce6528c0a4e421e4"};
export function vivaraisPolicy(state, shift, party) {
  if (party !== 2 || !vivaraisMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 6 || new Set(shift.shift_slots.map(x=>x.name)).size !== 6) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,1,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 13:15:00'?'<date> 13:15:00':bookable_to}) !== 'e970799562b465f3cf2f541f78fd7e5d5b21208f8e62d1caadd140d779451a18') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' '+slot.name+':00'?'<date> '+slot.name+':00':bookable_to}) === LE_VIVARAIS_SLOT_POLICIES[slot.name];
  });
}
const vivaraisQuery = q => q?.rid === '356393' && q.fullscreen === '' && q.lang === 'fr' && q.withCloseButton === '1'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','fullscreen','lang','withCloseButton','day','pax','slot'].includes(k));
async function verifyVivaraisNoGift(page) {
 const field=page.locator('input:not([name]):not([id])');
 if (await field.count() !== 1 || !await field.isVisible() || !await field.isEnabled() || await field.inputValue() !== '') throw new ZenchefError('provider_fields_unverified',409);
 const valid=await field.evaluate(e=>e.type==='text' && !e.required && !e.readOnly && e.parentElement?.parentElement?.textContent.replace(/\s+/g,' ').trim()==='Bon Cadeaux (facultatif)');
 if (!valid) throw new ZenchefError('provider_fields_unverified',409);
}
const SHIYO_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment","partner_id"];
export function shiyoMetadata(state) {
  return !!state && state.partner_id === '1001' && !Object.hasOwn(state,'voucherParam')
    && digest(SHIYO_METADATA_KEYS.map(k=>state[k])) === '5a8261f8ee0f98c594ae0c9deaaed0d468122e66c02ee5343e44941fe688ee56'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const SHIYO_SLOT_POLICIES = {"11:45":"192b42237347ba7a09478720652a0dc29425bc40f2c51698b8c423eb27e47443","12:00":"df7d4b1551a4293ee6e060f1982ef6e94818aa4a6c77ba1e32d75d1c6db45518","12:15":"c8b7e9746b6ec2f8ef075cffe71ef9f75a539bcbf5085f96bab5108d09813977","12:30":"ae5c1f2e36e7c6d5a386e71c994acda43435bb0d3d4fa75bdb6c519b6ba44ecf","12:45":"dbf09869f5128911414927be08dde954aeec3a590f25807760fa5d6319fa21c9","13:00":"418d2014da20b9a19bca6085d43f6b7995c95d6ca5f597e3aca128aa4472ceac","13:15":"be16cd941657bb25995dacc0a573615e08dbd740a7d127f97992c11131ea0de6","13:30":"0de88b20d7177c14f540a8521976a2707f66b29f8cecdcf49de32d8c396e9569","13:45":"39f449b6dfacdf309aa36dd8446f3959c05318fccc4eaf086b7e3ba8c31a5ea1","14:00":"81d046cec07e3f91c5ad87459c97d97d5b067f639a3d8a429a56a302902053f0","14:15":"556c9548a6530c2d05aa0fee963eeda2812ec5c469bcf8ff9774f5630e2a7cc9","14:30":"a1f26f4e0fd1a36e635154a3d7659441e2617b2846015d890d453e3fd81c4100"};
export function shiyoPolicy(state, shift, party) {
  if (party !== 2 || !shiyoMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 12 || new Set(shift.shift_slots.map(x=>x.name)).size !== 12) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 14:30:00'?'<date> 14:30:00':bookable_to}) !== '92cbf7abee69a33c69bfef28bf145d26251c227b1f3c7580b58b20435028f2e5') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' '+slot.name+':00'?'<date> '+slot.name+':00':bookable_to}) === SHIYO_SLOT_POLICIES[slot.name];
  });
}
const shiyoQuery = q => q?.rid === '377346' && q.pid === '1001'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','pid','day','pax','slot'].includes(k));
const LE_MERCIERE_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment","partner_id"];
export function leMerciereMetadata(state) {
  return !!state && state.partner_id === '1001' && !Object.hasOwn(state,'voucherParam')
    && digest(LE_MERCIERE_METADATA_KEYS.map(k=>state[k])) === '596e6b1dac9984e39327a091232bba253bd59f5ba6668969aaf6512de1b97ebb'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const LE_MERCIERE_SLOT_POLICIES = {"12:00":"6153f9418f407388a43c97efe58ce5bd8dd22a9fc4f9a47090eb7aa836290736","12:15":"b26f46c6ec2bba4788caa74b6980df278123dd8a68f24a487716e2f8e4ac415b","12:30":"a8f8153f932447bc4b5c02c9941823158e2cb1d02ce21942968e87bd82bce1a0","12:45":"1441ebee2f4ec32b4023054e978a36539e43eeef90b686e91e48c078c7b68e38","13:00":"65f211d9367d79144b84e20643574d7c13b70113bec95dec4cb7d31c21207df7","13:15":"b601e3d3472fe486b3f28aaf78735975e4fb3a2d4a357b30341c327afc6023c0","13:30":"17a88d3b4586ad8c243584ce3914f21c337dbffae152f997069537d95a6afcf9","13:45":"c889629fa81708af15fe305d5de22a93f944d63198491191083da81f20c9c1ab","14:00":"810cd96c1dba3c669920c37cb350aa3810a73e2eac11b6661b563b9cab219aa7","14:15":"c56639c1273efb1f9089e1195fa255d9c62f321347d2af62b16b447b82f102e7","14:30":"3f414d223292ed63dd612c382fe4db02f4f7df99cf7c128872d657d11664ac37"};
export function leMercierePolicy(state, shift, party) {
  if (party !== 2 || !leMerciereMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 11 || new Set(shift.shift_slots.map(x=>x.name)).size !== 11) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 11:30:00'?'<date> 11:30:00':bookable_to}) !== 'bf1d039a70d7bdca2d4e956cf8957f51160557b7360177e29000a09ed5787bce') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' 11:30:00'?'<date> 11:30:00':bookable_to}) === LE_MERCIERE_SLOT_POLICIES[slot.name];
  });
}
const leMerciereQuery = q => q?.rid === '360735' && q.pid === '1001'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','pid','day','pax','slot'].includes(k));
const LE_CERF_VOLANT_METADATA_KEYS = ["restaurantId","name","address","zip","city","restaurantCountry","restaurantLanguage","language","restaurantTimezone","currency","isInUpdateFlow","mandatoryFields","customFields","customFieldsV2","customFieldsPrivatisation","rooms","hasRoomSelection","isRoomMandatory","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","custom_field","offers","restaurantComment","voucherParam"];
export function cerfVolantMetadata(state) {
  return !!state && !Object.hasOwn(state,'partner_id')
    && digest(LE_CERF_VOLANT_METADATA_KEYS.map(k=>state[k])) === 'db59a1cca2330bb07147ae6bb684ad488864c6e172bd969213196707f12081e6'
    && state.wish?.room_id === null && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
const LE_CERF_VOLANT_SLOT_POLICIES = {"12:00":"11f541059c7af5adf8e3c0f8d391172fb364afc966630f50b73605dd2447fe01","12:15":"15edcfed73afe1620e79a46221a657b120d26e3af482331587393c3daa74328c","12:30":"237818ae5f6f5307506e941a3840d3cb4f4f401e9510f9b854d6773368552d20","12:45":"2dea28c9cbc56f446ddd0259b43fe601f46603a52dded4ac8f118f15372973e1","13:00":"bcd85b3442391bde79282c496d65fc406353b09e2729001fbfa8d3700f63cbfa","13:15":"96194270fc5c45cfd772eb81c2781927e72e38bba8f5343b690db02cf0d1221b","13:30":"6d1109c05038f9bc00f27e2fc36fed4a335881106bb4cb3233c5038ef319c8bc"};
export function cerfVolantPolicy(state, shift, party) {
  if (party !== 2 || !cerfVolantMetadata(state) || !shift || !Array.isArray(shift.shift_slots)
    || shift.shift_slots.length !== 7 || new Set(shift.shift_slots.map(x=>x.name)).size !== 7) return false;
  const day=state.wish?.day;
  if (state.restaurantSpecificCommentsByDay?.[day] !== null) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || [0,6].includes(new Date(day+'T12:00:00Z').getUTCDay())) return false;
  const {shift_slots,closed,marked_as_full,bookable_to,...policy}=shift;
  if (digest({...policy,bookable_to:bookable_to===day+' 13:30:00'?'<date> 13:30:00':bookable_to}) !== 'bb83430ec4ca82bf6428a732a2b2a86463753635a5f0db27c4b8554692bfd4f4') return false;
  return shift_slots.every(slot=>{
    const {possible_guests,waitlist_possible_guests,available_rooms,closed,marked_as_full,bookable_to,...policy}=slot;
    return Array.isArray(possible_guests) && Array.isArray(waitlist_possible_guests)
      && digest({...policy,bookable_to:bookable_to===day+' '+slot.name+':00'?'<date> '+slot.name+':00':bookable_to}) === LE_CERF_VOLANT_SLOT_POLICIES[slot.name];
  });
}
const cerfVolantQuery = q => q?.rid === '378221' && q.sdk === '1' && q.withCloseButton === '1' && q.showCollapsed === '1'
  && typeof q.day === 'string' && q.pax === '2'
  && Object.keys(q).every(k=>['rid','sdk','withCloseButton','showCollapsed','day','pax','slot'].includes(k));
async function verifyCerfVolantNoGift(page) {
 const input=page.locator('[data-testid="voucher-validate-code-input"]'),button=page.locator('[data-testid="voucher-validate-code-btn"]');
 if (await input.count() !== 1 || !await input.isVisible() || !await input.isEnabled() || await input.inputValue() !== '' || !await input.evaluate(e=>e.type==='text' && e.name==='voucher' && !e.required && !e.readOnly) || await button.count() !== 1 || !await button.isVisible() || !await button.isDisabled() || (await button.innerText()).trim() !== 'Appliquer') throw new ZenchefError('provider_fields_unverified',409);
}
export function supportedZenchefFields(state, venue) {
  const purpose = venue === ZENCHEF_INDIANAMONTPARNASSE, visit = visitConfig(venue);
  return (venue !== ZENCHEF_LE_CERF_VOLANT || cerfVolantMetadata(state)) && (venue !== ZENCHEF_LE_MERCIERE || leMerciereMetadata(state)) && (venue !== ZENCHEF_SHIYO || shiyoMetadata(state)) && (venue !== ZENCHEF_LE_VIVARAIS || vivaraisMetadata(state)) && (venue !== ZENCHEF_BRASSERIE_ROSEAUX || roseauxMetadata(state)) && (venue !== ZENCHEF_NOSCH || noschMetadata(state)) && (venue !== ZENCHEF_MAISON_MOLY || maisonMolyMetadata(state)) && (venue !== ZENCHEF_COMPTOIR_CHABERT || comptoirChabertMetadata(state)) && (venue !== ZENCHEF_BISTROT_ABEL || bistrotAbelMetadata(state)) && (venue !== ZENCHEF_CAFE_COMPTOIR_ABEL || cafeComptoirAbelMetadata(state)) && (venue !== ZENCHEF_CHEZ_FERNAND_GUISARDE || chezFernandGuisardeMetadata(state)) && (venue !== ZENCHEF_IBRIK_KITCHEN || ibrikKitchenMetadata(state)) && (venue !== ZENCHEF_CORNICHON_GONCOURT || cornichonGoncourtMetadata(state)) && (venue !== ZENCHEF_ESCUDELLA || escudellaMetadata(state)) && (venue !== ZENCHEF_BIENELEVE || bienEleveMetadata(state)) && (venue !== ZENCHEF_CAFEDESMUSEES || cafeDesMuseesMetadata(state)) && (venue !== ZENCHEF_LAPLAGEPARISIENNE || laPlageDurationMetadata(state)) && !!state?.mandatoryFields && (!purpose || montparnassePurposeMetadata(state)) && (!visit || (venue === ZENCHEF_INDIANATERNES ? ternesVisitMetadata(state) : lesHallesVisitMetadata(state)))
    && !Object.entries(state.mandatoryFields).some(([key, value]) => value === 'required'
      && !STANDARD_REQUIRED_FIELDS.includes(key) && !(purpose && key === PURPOSE_KEY) && !(visit && key === 'custom_field.' + visit.slug) && !(venue === ZENCHEF_LAPLAGEPARISIENNE && key === 'custom_field.'+PLAGE_DURATION_SLUG));
}
const nativeTermsVersion = (text, form, shift, venue) => {
  const base = digest([text, form.restaurantComment || null, shift || null]);
  return [ZENCHEF_INDIANAMONTPARNASSE, ZENCHEF_INDIANALESHALLES, ZENCHEF_INDIANATERNES, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_CAFEDESMUSEES, ZENCHEF_CASIMIR, ZENCHEF_BICHEPARIS8, ZENCHEF_SAVANNAHCAFE, ZENCHEF_JULESJO, ZENCHEF_BECCO, ZENCHEF_BATISTOU, ZENCHEF_OFFICEPARIS, ZENCHEF_ARDENT, ZENCHEF_BIENELEVE, ZENCHEF_BRASSERIEJAJA, ZENCHEF_CANAILLESPIGALLE, ZENCHEF_COMPTOIRPETITSCHAMPS, ZENCHEF_ESCUDELLA, ZENCHEF_CORNICHON_GONCOURT, ZENCHEF_IBRIK_KITCHEN, ZENCHEF_CHEZ_FERNAND_GUISARDE, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_COMPTOIR_CHABERT,ZENCHEF_MAISON_MOLY,ZENCHEF_NOSCH,ZENCHEF_BRASSERIE_ROSEAUX,ZENCHEF_LE_VIVARAIS,ZENCHEF_SHIYO,ZENCHEF_LE_MERCIERE,ZENCHEF_LE_CERF_VOLANT].includes(venue) ? digest([base, purposeSchema(form)]) : base;
};
const purposeSchema = state => digest([state.mandatoryFields, state.customFields, state.customFieldsV2, state.isInUpdateFlow]);
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
  if (approval?.restaurantId === ZENCHEF_LE_CERF_VOLANT.restaurantId && (approval.shiftId !== 325474 || approval.party !== 2 || !ZENCHEF_LE_CERF_VOLANT.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_LE_MERCIERE.restaurantId && (approval.shiftId !== 101507 || approval.party !== 2 || !ZENCHEF_LE_MERCIERE.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_SHIYO.restaurantId && (approval.shiftId !== 304033 || approval.party !== 2 || !ZENCHEF_SHIYO.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_LE_VIVARAIS.restaurantId && (approval.shiftId !== 58213 || approval.party !== 2 || !ZENCHEF_LE_VIVARAIS.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_BRASSERIE_ROSEAUX.restaurantId && (approval.shiftId !== 378092 || approval.party !== 2 || !ZENCHEF_BRASSERIE_ROSEAUX.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_NOSCH.restaurantId && (approval.shiftId !== 107873 || approval.party !== 2 || !ZENCHEF_NOSCH.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_MAISON_MOLY.restaurantId && (approval.shiftId !== 137085 || approval.party !== 2 || !ZENCHEF_MAISON_MOLY.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_COMPTOIR_CHABERT.restaurantId && (approval.shiftId !== 41399 || approval.party !== 2 || !ZENCHEF_COMPTOIR_CHABERT.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_BISTROT_ABEL.restaurantId
    && (approval.shiftId !== 77813 || approval.party !== 2 || !ZENCHEF_BISTROT_ABEL.lunchTimes.includes(approval.time))) return null;
  if (approval?.restaurantId === ZENCHEF_CAFE_COMPTOIR_ABEL.restaurantId
    && (approval.shiftId !== 77701 || approval.party !== 2 || !ZENCHEF_CAFE_COMPTOIR_ABEL.lunchTimes.includes(approval.time))) return null;
  const deKas = approval?.restaurantId === ZENCHEF_DEKAS.restaurantId;
  const christine = approval?.restaurantId === ZENCHEF_CHEZ_FERNAND_CHRISTINE.restaurantId;
  const englishPayload = deKas || approval?.restaurantId === ZENCHEF_BICHEPARIS8.restaurantId;
  const plageVenue = approval?.restaurantId === ZENCHEF_LAPLAGEPARISIENNE.restaurantId;
  const purposeVenue = approval?.restaurantId === ZENCHEF_INDIANAMONTPARNASSE.restaurantId;
  const visitVenue = visitVenueForId(approval?.restaurantId), visit = visitConfig(visitVenue);
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
  const purpose = approval.details?.reservationPurpose;
  if (purposeVenue ? (!validReservationPurpose(purpose) || approval.reservationPurpose !== purpose
    || !exactKeys(body.custom_field, [PURPOSE_SLUG]) || body.custom_field[PURPOSE_SLUG] !== purpose)
    : (Object.hasOwn(approval, 'reservationPurpose') || Object.hasOwn(approval.details || {}, 'reservationPurpose')
      || (!visitVenue && !plageVenue && !exactKeys(body.custom_field, [])))) return null;
  const visitReason = approval.details?.reservationVisitReason;
  if (visitVenue ? (!validReservationVisitReason(visitReason, visitVenue) || approval.reservationVisitReason !== visitReason
    || !exactKeys(body.custom_field, [visit.slug]) || body.custom_field[visit.slug] !== visitReason)
    : (Object.hasOwn(approval, 'reservationVisitReason') || Object.hasOwn(approval.details || {}, 'reservationVisitReason'))) return null;
  if (plageVenue ? (approval.reservationSaturdayDurationAcknowledged !== true || approval.details?.reservationSaturdayDurationAcknowledged !== true
    || !exactKeys(body.custom_field,[PLAGE_DURATION_SLUG]) || body.custom_field[PLAGE_DURATION_SLUG] !== true)
    : (Object.hasOwn(approval,'reservationSaturdayDurationAcknowledged') || Object.hasOwn(approval.details || {},'reservationSaturdayDurationAcknowledged'))) return null;
  const sheet = body.customersheet, phone = String(approval.phone).replace(/\s/g, '');
  if (body.day !== approval.date || body.time !== approval.time || body.nb_guests !== approval.party
    || body.lang !== (englishPayload ? 'en' : 'fr') || body.partner_id !== '1001' || body.type !== 'web' || body.comment !== ''
    || !emptyArray(body.custom_field_v2) || !(christine ? approvedChristineOffers(body.offers, approval) : deKas ? approvedDeKasOffers(body.offers, approval) : emptyArray(body.offers))
    || body.phone_number !== phone || sheet.phone !== phone || sheet.lang !== (englishPayload ? 'en' : 'fr')
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
    || (approval.restaurantId === ZENCHEF_CHEZ_FERNAND_CHRISTINE.restaurantId
      ? (data.wish?.booking_room_id != null || !approvedChristineOffers(data.booking_offers, approval, true))
      : approval.restaurantId === ZENCHEF_DEKAS.restaurantId
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
  && (![ZENCHEF_DEKAS,ZENCHEF_CHEZ_FERNAND_CHRISTINE].some(v=>v.restaurantId===approval.restaurantId) || digest(attempt.details?.offer || null) === digest(approval.offer || null))
  && (approval.restaurantId !== ZENCHEF_INDIANAMONTPARNASSE.restaurantId || (validReservationPurpose(approval.details?.reservationPurpose)
    && attempt.details?.reservationPurpose === approval.details.reservationPurpose
    && approval.reservationPurpose === approval.details.reservationPurpose))
  && (approval.restaurantId !== ZENCHEF_LAPLAGEPARISIENNE.restaurantId || (approval.reservationSaturdayDurationAcknowledged === true && approval.details?.reservationSaturdayDurationAcknowledged === true && attempt.details?.reservationSaturdayDurationAcknowledged === true))
  && (!visitVenueForId(approval.restaurantId) || (validReservationVisitReason(approval.details?.reservationVisitReason, visitVenueForId(approval.restaurantId))
    && attempt.details?.reservationVisitReason === approval.details.reservationVisitReason
    && approval.reservationVisitReason === approval.details.reservationVisitReason));

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
  if ([ZENCHEF_BOUILLONREPUBLIQUE, ZENCHEF_BRASSERIEJAJA, ZENCHEF_CANAILLESPIGALLE, ZENCHEF_COMPTOIRPETITSCHAMPS, ZENCHEF_ESCUDELLA, ZENCHEF_CORNICHON_GONCOURT, ZENCHEF_IBRIK_KITCHEN, ZENCHEF_CHEZ_FERNAND_GUISARDE, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_COMPTOIR_CHABERT,ZENCHEF_MAISON_MOLY,ZENCHEF_NOSCH,ZENCHEF_BRASSERIE_ROSEAUX,ZENCHEF_LE_VIVARAIS,ZENCHEF_SHIYO,ZENCHEF_LE_MERCIERE,ZENCHEF_LE_CERF_VOLANT].includes(venue) && !venue.lunchTimes.includes(selection.time)) throw new ZenchefError('time_outside_lunch_scope');
  if (venue.rooms ? !venue.rooms.some(room => room.id === selection.roomId) : selection.roomId !== undefined) throw new ZenchefError('room_required_or_unverified');
  if (venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE) {
    if (!venue.lunchTimes.includes(selection.time)) throw new ZenchefError('time_outside_lunch_scope');
    return search.replace('/results?', '/form?') + '&slot=' + encodeURIComponent(selection.time);
  }
  return search.replace('/results?', '/form?') + '&slot=' + encodeURIComponent(selection.time)
    + (venue.rooms ? '&room_id=' + selection.roomId : '');
}

// Public bundle and rendered form observed 2026-10-16. API reads remain pinned
// to the venue and selected month; authentication is the provider's normal GET.
// No alternate WAF route, token injection, quotation POST or payment resource.
export function allowedZenchefPreparationRequest(request, selection, venue = ZENCHEF_ARPEGE) {
  if (request.method() !== 'GET' || request.redirectedFrom()) return false;
  let expected, u;
  try { expected = zenchefFormUrl(selection, venue); if (venue === ZENCHEF_DEKAS) expected = expected.replace('/form?', '/offers?'); if (venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE) expected=expected.replace('/form?', '/offers?'); u = new URL(request.url()); } catch { return false; }
  if (request.resourceType() === 'document') return request.url() === expected;
  if (u.origin === 'https://bookings.zenchef.com' && !u.search) {
    return (request.resourceType() === 'script' && (/^\/_next\/static\/chunks\/[A-Za-z0-9_./-]+\.js$/.test(u.pathname)
      || ([ZENCHEF_DEKAS,ZENCHEF_CHEZ_FERNAND_CHRISTINE].includes(venue) && /^\/_next\/static\/[A-Za-z0-9_-]+\/_(buildManifest|ssgManifest)\.js$/.test(u.pathname))))
      || ((request.resourceType() === 'stylesheet' || ([ZENCHEF_DEKAS,ZENCHEF_CHEZ_FERNAND_CHRISTINE].includes(venue) && request.resourceType() === 'fetch')) && /^\/_next\/static\/css\/[A-Za-z0-9_.-]+\.css$/.test(u.pathname))
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

// Christine is deliberately a named, exact policy contract. The public original
// source and native count semantics are documented in PR469. Changed metadata,
// policy, catalogue, slot stock/config or client build requires requalification.
const CHRISTINE_META_KEYS = ["restaurantId","name","address","zip","city","phone","currency","language","restaurantLanguage","restaurantTimezone","isInUpdateFlow","isFullscreen","mandatoryFields","customFields","customFieldsV2","custom_field","hasRoomSelection","isRoomMandatory","rooms","hasConnectedVouchers","shouldDisplayShopVoucher","voucherCodes","selectedHighlightedOffer","offers","imprint_param","prepayment_param","restaurantComment","type"];
const CHRISTINE_METADATA = 'd96903bd492abb6122986b3e88917dd3875b55eefdcf24dfcc0597c907e6614e';
const CHRISTINE_SHIFT = '86ca372efac48f20ad1d37da371025dc3df30f2153213bd1eba412fed8de1650';
const CHRISTINE_SLOTS = {"12:00":"b501795ed79468fce5bbab3ddbf8f28ad7e10c1b972167db9f7483606cc9ba77","12:30":"881878069f07602866428f1b784e6ff9d9dedde1fb56c9f1d1e3d7688a678880","13:00":"ae2b14a7733a322a91ddec8fc51e29eb6acd4a896cbf43a6ac7d0e6b92c78a2b","13:30":"9222423b199e6d22b260f0fc318a9c13e727cdfd2c79c8e7a5502ef9162e2ade","14:00":"12bf5bbbff982fb05f36e2e74fb5bb8ca071e4562752ea70ef73f060cc1e0b8a"};
const CHRISTINE_BUILD = '2b18f39ef7';
const CHRISTINE_NOTICE = 'Vous disposez de votre table pour une durée de 1h30.';
const christineWindowShape = (value, date) => JSON.parse(JSON.stringify(value, (key, item) =>
  ['bookable_from', 'bookable_to'].includes(key) && typeof item === 'string' && item.startsWith(date + ' ')
    ? '<date>' + item.slice(10) : item));
function christineQuery(query, selection) {
  return !!query && Object.keys(query).length === 6 && query.sdk === '1' && query.withCloseButton === '1'
    && query.rid === '361894' && query.showCollapsed === '1' && query.day === selection.date && query.pax === '2';
}
// Own SSR type=null becomes type=web during native hydration. No other type is accepted.
const christineMetadataValues = state => CHRISTINE_META_KEYS.map(k => k === 'type' && state[k] === 'web' ? null : state[k]);
function christineMetadata(state) {
  return !!state && !Object.hasOwn(state, 'partner_id') && !Object.hasOwn(state, 'voucherParam')
    && digest(christineMetadataValues(state)) === CHRISTINE_METADATA;
}
function christineShift(state, shift, party) {
  if (party !== 2 || !christineMetadata(state) || !shift || !Array.isArray(shift.shift_slots)) return false;
  const { shift_slots, ...policy } = shift;
  return state.wish?.room_id === null && state.wish.waiting_list === false
    && state.restaurantSpecificCommentsByDay?.[state.wish.day] === null
    && digest(christineWindowShape(policy, state.wish.day)) === CHRISTINE_SHIFT;
}
function christineChoice(state, shift, slot, query, inWindow) {
  if (!christineShift(state, shift, query.party) || !Object.hasOwn(CHRISTINE_SLOTS, slot.name)
    || digest(christineWindowShape(slot, query.date)) !== CHRISTINE_SLOTS[slot.name]
    || !inWindow(slot) || !inWindow(shift) || !slot.offers.every(inWindow)
    || ![1,2,3,4,5].includes(new Date(query.date + 'T12:00:00Z').getUTCDay())) return null;
  const choice = { offerId: 60971, count: 2, name: 'À la carte', description: '', currency: 'EUR',
    mealPrice: null, priceStatus: 'not_provided_by_booking_form', menuSource: 'https://www.restaurantchezfernand.fr/',
    depositApplies: false, depositMinGuests: 4, selectionSource: 'native_offer', submissionSupported: true };
  choice.version = digest([query, shift, slot, christineMetadataValues(state)]);
  return choice;
}
function approvedChristineOffers(offers, approval, saved = false) {
  const choice = approval?.offer;
  return approval?.shiftId === 121338 && approval.party === 2 && choice?.offerId === 60971 && choice.count === 2
    && /^[a-f0-9]{64}$/.test(choice.version || '') && Array.isArray(offers) && offers.length === 1
    && offers[0]?.offer_id === 60971 && offers[0].count === 2
    && (saved || (Object.keys(offers[0]).length === 2 && Object.hasOwn(offers[0], 'offer_id') && Object.hasOwn(offers[0], 'count')));
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
export function indianaMontparnassePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANAMONTPARNASSE.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 314295 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 30
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaRepubliquePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANAREPUBLIQUE.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 274078 && shift.name === 'Service continu'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaBercyVillagePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANABERCYVILLAGE.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 245385 && shift.name === 'Déjeuner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaDenfertRochereauPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANADENFERTROCHEREAU.venueId
    && state.address === '1 Bis Avenue du Général Leclerc' && state.zip === '75014'
    && state.name === 'Indiana Café Denfert Rochereau'
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 278132 && shift.name === 'Déjeuner'
    && shift.comment?.fr === 'Nous souhaitons vous informer que les réservations doivent inclure un repas.'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 12
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaLesHallesPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANALESHALLES.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 275998 && shift.name === 'Déjeuner'
    && shift.comment?.fr === 'Au-delà de 15 min de retard, nous ne pourrons plus garantir votre table.'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 8
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function indianaTernesPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_INDIANATERNES.venueId
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 276269 && shift.name === 'Déjeuner'
    && shift.comment?.fr === "Nous vous garantissons votre table jusqu'a 15 minutes après votre heure de réservation."
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 20
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 3600
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function okomusuPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_OKOMUSU.venueId
    && !Object.hasOwn(state, 'partner_id') && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 87616 && shift.name === 'Déjeuner week end'
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 5
    && shift.charge_param.charge_per_guests === 8 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 1800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function zenRestaurantPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_ZENRESTAURANT.venueId
    && typeof state.restaurantComment?.fr === 'string' && !!state.restaurantComment.fr.trim()
    && typeof state.restaurantComment?.en === 'string' && !!state.restaurantComment.en.trim()
    && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.partner_id === '1001' && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 1 && state.offers[0].id === 66398
    && state.offers[0].is_private === true && state.offers[0].has_prepayment === true
    && shift?.id === 192088 && shift.name === 'Dîner'
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 4
    && shift.charge_param === null && shift.prepayment_param === null
    && Array.isArray(shift.offers) && shift.offers.length === 1 && shift.offers[0].id === 66398
    && shift.offers[0].config?.is_limited_to_pax === true && shift.offers[0].config.min_pax_available === 8
    && shift.offers[0].has_prepayment === true && shift.offers[0].is_private === true
    && shift.is_offer_required === true && shift.offer_required_from_pax === 9
    && shift.cancelation_param?.enduser_cancelable_before === 86400
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function laPlageParisiennePolicy(state, shift, party) {
 return party === 2 && state?.restaurantId === '356799' && !Object.hasOwn(state,'partner_id')
  && state.currency === 'EUR' && state.language === 'fr' && laPlageDurationMetadata(state)
  && typeof state.restaurantComment?.fr === 'string' && !!state.restaurantComment.fr.trim()
  && typeof state.restaurantComment?.en === 'string' && !!state.restaurantComment.en.trim()
  && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
  && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
  && shift?.id === 535548 && shift.name === 'Déjeuner' && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
  && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 8 && shift.charge_param.charge_per_guests === 50
  && shift.prepayment_param === null && shift.is_offer_required === false && shift.offer_required_from_pax === null
  && shift.cancelation_param?.enduser_cancelable_before === 10800 && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function cafeDesMuseesPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CAFEDESMUSEES.venueId
    && !!state.restaurantComment && Object.keys(state.restaurantComment).length === 1 && state.restaurantComment.fr === ''
    && !Object.hasOwn(state, 'partner_id') && cafeDesMuseesMetadata(state)
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 7248 && shift.name === 'Déjeuner semaine' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === false && shift.charge_param.min_guests === 15
    && shift.charge_param.charge_per_guests === 35 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function casimirPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CASIMIR.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && state.partner_id === '1001' && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.hasRoomSelection === false
    && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && shift?.id === 160340 && shift.name === 'Déjeuner'
    && shift.comment?.fr === "Lorsque vous réservez en premier service : 19h / 19H30, il se peut que votre table soit réservée 2h plus tard pour le deuxième service."
    && Object.keys(shift.comment).length === 1
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true && shift.charge_param.min_guests === 3
    && shift.charge_param.charge_per_guests === 15 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 7200
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function bicheParis8Policy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BICHEPARIS8.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'en' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 2
    && state.restaurantComment?.en === "The Biche restaurant welcomes you in two services. <strong>(⚠️ The first service lasts 2 hours, after which the table must be vacated for the second service.)</strong>\n<br>\n<br>\nFor group requests of 10 people or more, please contact us at: <em>restaurantbiche.event@gmail.com.</em>\n\n<br>\n<br>\nSee you soon! – The Biche Team"
    && state.restaurantComment?.fr === "Le restaurant Biche vous accueille en 2 services. <strong>⚠️ Le premier service dure 2h, la table devra ensuite être libérée. En cas de retard de plus de 20 min, votre table est annulée.</strong><br><br>De 10 à 40 personnes : <a href=\"https://www.biche-restaurant.com/reservation-groupe\">réservez ici</a><br><br>À très vite ! – L’équipe Biche"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 149228 && shift.name === 'Midi Semaine' && shift.comment === null
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 9
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
export function savannahCafePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_SAVANNAHCAFE.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Bienvenue au Savannah Cafe <br/>\nPour toute réservation de plus de 6 personnes, merci de nous appeler au <br/>\n01 43 29 45 77 <br/>\nA très bientôt"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 300276 && shift.name === 'Service déjeuner' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const savannahCafeQuery = query => query?.rid === ZENCHEF_SAVANNAHCAFE.venueId
  && query.sdk === '1' && query.showCollapsed === '0'
  && !Object.hasOwn(query, 'pid') && !Object.hasOwn(query, 'lang');
export function julesJoPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_JULESJO.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && state.partner_id === '1001' && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Aucune réservation possible en terrasse.\n\n\nAu-delà de 6 couverts, merci de nous contacter directement par téléphone 01 77 32 91 91 au ou par mail à contact@julesjo.com"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 86920 && shift.name === 'Déjeuner' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const julesJoQuery = query => query?.rid === ZENCHEF_JULESJO.venueId && query.pid === '1001'
  && ['sdk','lang','fullscreen','showCollapsed'].every(key => !Object.hasOwn(query, key));
export function beccoPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BECCO.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && state.partner_id === '1001' && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Bienvenue au restaurant Becco,  \n<br><br/> \nSi votre demande n'est pas disponible à la réservation, n'hésitez pas à nous contacter directement par téléphone au 01 40 16 34 21.\n<br><br/> \nNous limitons à deux heures la durée des réservations les vendredi et samedi soir.\n<br><br/> \nÀ très bientôt !"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 177844 && shift.name === 'Dejeuner' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const beccoQuery = query => query?.rid === ZENCHEF_BECCO.venueId && query.pid === '1001'
  && ['sdk','lang','fullscreen','showCollapsed'].every(key => !Object.hasOwn(query, key));
export function batistouPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BATISTOU.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && state.partner_id === '1001' && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Bienvenue au restaurant !\n<br><br/>\nPour toute réservation de plus de personnes, contactez-nous au\n<br><br/>\nÀ très bientôt !"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 176469 && shift.name === 'Service Continu' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const batistouQuery = query => query?.rid === ZENCHEF_BATISTOU.venueId && query.pid === '1001'
  && ['sdk','lang','fullscreen','showCollapsed'].every(key => !Object.hasOwn(query, key));
export function officeParisPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_OFFICEPARIS.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Si vous ne trouvez pas de place, vous pouvez vous rendre dans notre second restaurant: Ardent situé au 40 Rue Richer \n\nHâte de vous recevoir"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 12173 && shift.name === 'Déjeuner'
    && Object.keys(shift.comment || {}).length === 1 && shift.comment?.fr === "Nous proposons au déjeuner (hors jours fériés) une formule à 25 € en plus de la carte.\nLa terrasse est ouverte!"
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param?.is_web_booking_askable === true
    && shift.charge_param.min_guests === 12 && shift.charge_param.charge_per_guests === 20 && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const officeParisQuery = query => query?.rid === ZENCHEF_OFFICEPARIS.venueId
  && query.fullscreen === '' && query.lang === 'fr' && query.withCloseButton === '1'
  && ['pid','sdk','showCollapsed','iframePosition'].every(key => !Object.hasOwn(query, key));
export function ardentPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_ARDENT.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Bienvenue au restaurant Ardent !\n<br><br/>\nToute l'équipe est ravie de vous accueillir !\n<br><br/>\nSi nous sommes complets sur un service ou un créneau, vous pouvez réserver dans les autres restaurants du groupe : Bien élevé et l'Office !\n<br><br/>\nÀ très bientôt!"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 82526 && shift.name === 'Midi' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const ardentQuery = query => query?.rid === ZENCHEF_ARDENT.venueId
  && query.fullscreen === '' && query.lang === 'fr' && query.withCloseButton === '1'
  && ['pid','sdk','showCollapsed','iframePosition'].every(key => !Object.hasOwn(query, key));
export function bienElevePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BIENELEVE.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && bienEleveMetadata(state)
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Toute réservation finalisée reçoit un e-mail de confirmation automatique. <br>\nSi nous sommes complets, nous vous invitons à réserver dans notre autre restaurant, Ardent Paris"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 36016 && shift.name === 'Midi semaine' && shift.comment === null
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 10
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const bienEleveQuery = query => query?.rid === ZENCHEF_BIENELEVE.venueId
  && Object.keys(query).every(key => ['rid','day','pax','slot'].includes(key));
export function brasserieJajaPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_BRASSERIEJAJA.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Bienvenue à la Brasserie Jaja.\n<br><br>\nPour toutes réservations de plus de 14 couverts, merci de nous contacter au 09 67 40 85 93\n<br><br>\nA bientôt"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 347295 && shift.name === 'Midi' && shift.comment === null
    && shift.confirmation?.is_auto === false && shift.confirmation.is_auto_until === 6
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const brasserieJajaQuery = query => query?.rid === ZENCHEF_BRASSERIEJAJA.venueId
  && query.fullscreen === '' && query.lang === 'fr' && query.withCloseButton === '1'
  && ['pid','sdk','showCollapsed','iframePosition'].every(key => !Object.hasOwn(query, key));
// Bind the complete observed expired, unselected offer, including original timestamp strings.
// is_active=true alone does not make its 2025-02-14 date relevant to the selected day.
export function canaillesPigalleOfferMetadata(state) {
  return Array.isArray(state?.offers) && state.offers.length === 1
    && digest(state.offers) === '4fa22450fb742152bda07414871060782534d4b6f3afc3b1c9ee030204d3f06b'
    && /^\d{4}-\d{2}-\d{2}$/.test(state.wish?.day || '') && state.wish.day > state.offers[0].date_to
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
export function canaillesPigallePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CANAILLESPIGALLE.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && state.partner_id === '1001' && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "En cas de demande particulière, merci de nous contacter par téléphone au  01 48 74 10 48"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && canaillesPigalleOfferMetadata(state)
    && shift?.id === 107333 && shift.name === 'Déjeuner' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const canaillesPigalleQuery = query => query?.rid === ZENCHEF_CANAILLESPIGALLE.venueId && query.pid === '1001'
  && Object.keys(query).every(key => ['rid','pid','day','pax','slot'].includes(key));
// Both original prepaid holiday objects are expired and unselected; bind every raw field.
export function comptoirPetitsChampsOfferMetadata(state) {
  return Array.isArray(state?.offers) && state.offers.length === 2
    && digest(state.offers) === 'e3a1475d826fdd5e70696d6afda4f35ed183ef130abe6ddb9d18beb83e78ebef'
    && /^\d{4}-\d{2}-\d{2}$/.test(state.wish?.day || '') && state.offers.every(offer => state.wish.day > offer.date_to)
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0;
}
export function comptoirPetitsChampsPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_COMPTOIRPETITSCHAMPS.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && Array.isArray(state.customFields) && state.customFields.length === 0
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 2
    && state.restaurantComment?.fr === "Le restaurant affiche complet? Nous vous proposons de réserver chez <a href=https://chimere-4septembre.fr/\n target=“_blank”> Chimère</a> ou au <a href=https://www.cafevery-paris.fr/\n target=“_blank”>Café Véry</a>. En cas d'impossibilité d'honorer votre réservation, pensez s'il vous plaît à l'annuler afin de libérer votre table et nous permettre de la réattribuer. Merci de votre confiance!"
    && state.restaurantComment?.en === "No table available on the hour you'd like? We will be happy to welcome you at <a href=https://chimere-4septembre.fr/\n target=“_blank”> Chimère</a> (Paris 2) or at <a href=https://www.cafevery-paris.fr/ target=“_blank”>Café Véry</a> (Paris 1), our other restaurants. Thanks for your trust and see you soon!"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && comptoirPetitsChampsOfferMetadata(state)
    && shift?.id === 292 && shift.name === 'Déjeuner semaine' && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 86400
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const comptoirPetitsChampsQuery = query => query?.rid === ZENCHEF_COMPTOIRPETITSCHAMPS.venueId
  && query.fullscreen === '' && query.lang === 'fr' && query.withCloseButton === '1'
  && Object.keys(query).every(key => ['rid','fullscreen','lang','withCloseButton','day','pax','slot'].includes(key));
export function escudellaPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_ESCUDELLA.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && escudellaMetadata(state)
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && digest(state.restaurantComment) === '3a2255ef075cba46ba0e5e6300866891c119e5212a1ee73066911d1c6103e874'
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 4974 && shift.name === 'Déjeuner' && shift.is_voucher_codes_active === true && shift.comment === null
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 14400
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const escudellaQuery = query => query?.rid === ZENCHEF_ESCUDELLA.venueId
  && query.fullscreen === '' && query.lang === 'fr' && query.withCloseButton === '1'
  && Object.keys(query).every(key => ['rid','fullscreen','lang','withCloseButton','day','pax','slot'].includes(key));
export function cornichonGoncourtPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CORNICHON_GONCOURT.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && cornichonGoncourtMetadata(state)
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && Object.keys(state.restaurantComment || {}).length === 1
    && state.restaurantComment?.fr === "Pour les groupes de plus de 8 personnes, merci de nous contacter à l'adresse suivante: lecornichon@panem-circenses.com\n<br><br/>"
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 172864 && shift.name === 'Déjeuner' && shift.is_voucher_codes_active === true && shift.is_voucher_codes_limit_reached === false && shift.comment === null
    && !!shift.capacity && digest(shift.capacity) === 'ed925950932182a5cbf9f2969bcb89389e65c2bf2e20763414330dc2cd40162a'
    && shift.bookable_to === state.wish.day + ' 13:45:00'
    && Array.isArray(shift.shift_slots) && shift.shift_slots.every(slot => !ZENCHEF_CORNICHON_GONCOURT.lunchTimes.includes(slot.name)
      || (slot.bookable_to === state.wish.day + ' 11:45:00' && !!slot.capacity
        && digest(slot.capacity) === 'f7b810d3060048d9c13eada10450dade1bf8a21b68e98616c3f3cf42346301eb'))
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const cornichonGoncourtQuery = query => query?.rid === ZENCHEF_CORNICHON_GONCOURT.venueId
  && query.fullscreen === '' && query.lang === 'fr' && query.withCloseButton === '1'
  && Object.keys(query).every(key => ['rid','fullscreen','lang','withCloseButton','day','pax','slot'].includes(key));
export function ibrikKitchenPolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_IBRIK_KITCHEN.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && state.partner_id === '1001' && ibrikKitchenMetadata(state)
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && !!state.restaurantComment && digest(state.restaurantComment) === 'b0c7f1cbfef9f01752dbc261962092369db33564a6c158a7b4f9a8968167a901'
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 17983 && shift.name === 'Déjeuner' && shift.is_voucher_codes_active === true && shift.is_voucher_codes_limit_reached === false && shift.comment === null
    && !!shift.capacity && digest(shift.capacity) === '84a1efa1677b8c35d87ac00e2aa62b1cb68ce558d3676fc3bd6cd1f09f360cae'
    && shift.bookable_from === null && shift.bookable_to === state.wish.day + ' 14:30:00'
    && Array.isArray(shift.shift_slots) && shift.shift_slots.length > 0 && shift.shift_slots.every(slot =>
      slot.bookable_from === null && slot.bookable_to === state.wish.day + ' ' + slot.name + ':00'
      && !!slot.capacity && digest(slot.capacity) === {"12:00":"d742665d3f3b191b3df73ce77df85f4f49bf73a8439640b20f317974ed96150c","12:15":"472a1f1bf25cba6d7c91e30c90a980e12d65899399c790af872e62bba07ca461","12:30":"b0a1ae3802836b29617a511f38eb5b3805d9eccba19ebac317144d47eb6baa75","12:45":"393a5d82f21f57f6d31c3fd4ae73912086e6164ce96a0d2a631739d3fad32674","13:00":"b295da04b0877c99d51e7e1dc0c1e2ec960e95bebcad3c1ec2e8836bafab9126","13:15":"b0a1ae3802836b29617a511f38eb5b3805d9eccba19ebac317144d47eb6baa75","13:30":"84a1efa1677b8c35d87ac00e2aa62b1cb68ce558d3676fc3bd6cd1f09f360cae","13:45":"b0a1ae3802836b29617a511f38eb5b3805d9eccba19ebac317144d47eb6baa75","14:00":"b295da04b0877c99d51e7e1dc0c1e2ec960e95bebcad3c1ec2e8836bafab9126","14:15":"b0a1ae3802836b29617a511f38eb5b3805d9eccba19ebac317144d47eb6baa75","14:30":"b0a1ae3802836b29617a511f38eb5b3805d9eccba19ebac317144d47eb6baa75"}[slot.name])
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && shift.charge_param === null && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const ibrikKitchenQuery = query => query?.rid === ZENCHEF_IBRIK_KITCHEN.venueId && query.pid === '1001'
  && Object.keys(query).every(key => ['rid','pid','day','pax','slot'].includes(key));
export function chezFernandGuisardePolicy(state, shift, party) {
  return party === 2 && state?.restaurantId === ZENCHEF_CHEZ_FERNAND_GUISARDE.venueId
    && state.isInUpdateFlow === false && STANDARD_REQUIRED_FIELDS.every(k=>state.mandatoryFields?.[k] === 'required')
    && !Object.hasOwn(state, 'partner_id') && chezFernandGuisardeMetadata(state)
    && Array.isArray(state.customFieldsV2) && state.customFieldsV2.length === 0
    && state.currency === 'EUR' && state.language === 'fr' && state.restaurantLanguage === 'fr'
    && !!state.restaurantComment && digest(state.restaurantComment) === '032a3e245a1c677ec7744a0a9f7f4bce2baf4d05e7bfcd6718d5ece70b9b12a6'
    && state.hasRoomSelection === false && state.isRoomMandatory === false && state.wish?.room_id === null
    && Array.isArray(state.wish.offers) && state.wish.offers.length === 0
    && Array.isArray(state.offers) && state.offers.length === 0
    && shift?.id === 429732 && shift.name === 'Déjeuner' && shift.is_voucher_codes_active === true && shift.is_voucher_codes_limit_reached === false && shift.comment === null
    && !!shift.capacity && digest(shift.capacity) === 'f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8'
    && shift.bookable_from === null && shift.bookable_to === state.wish.day + ' 14:15:00'
    && Array.isArray(shift.shift_slots) && shift.shift_slots.length > 0 && shift.shift_slots.every(slot =>
      slot.bookable_from === null && slot.bookable_to === state.wish.day + ' ' + slot.name + ':00'
      && !!slot.capacity && digest(slot.capacity) === {"12:00":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","12:15":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","12:30":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","12:45":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","13:00":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","13:15":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","13:30":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","13:45":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","14:00":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8","14:15":"f3b8251ee433b75287b12fedc6c7512ae36af5346db151c651f99e89812cf9e8"}[slot.name])
    && shift.confirmation?.is_auto === true && shift.confirmation.is_auto_until === null
    && !!shift.charge_param && digest(shift.charge_param) === '5988d71162a02abb9a4640427db278569cc6ab2579af5b256bdcf861d990d9f1' && shift.prepayment_param === null
    && shift.is_offer_required === false && shift.offer_required_from_pax === null
    && shift.cancelation_param?.enduser_cancelable_before === 10800
    && shift.cancelation_param.enduser_cancelable_reference === 'shift';
}
const chezFernandGuisardeQuery = query => query?.rid === ZENCHEF_CHEZ_FERNAND_GUISARDE.venueId
  && query.fullscreen === '' && query.lang === 'fr' && query.withCloseButton === '1'
  && Object.keys(query).every(key => ['rid','fullscreen','lang','withCloseButton','day','pax','slot'].includes(key));
const noRoomLunchPolicy = (venue, state, shift, party) => venue === ZENCHEF_LE_CERF_VOLANT ? cerfVolantPolicy(state,shift,party) : venue === ZENCHEF_LE_MERCIERE ? leMercierePolicy(state,shift,party) : venue === ZENCHEF_SHIYO ? shiyoPolicy(state,shift,party) : venue === ZENCHEF_LE_VIVARAIS ? vivaraisPolicy(state,shift,party) : venue === ZENCHEF_BRASSERIE_ROSEAUX ? roseauxPolicy(state,shift,party) : venue === ZENCHEF_NOSCH ? noschPolicy(state,shift,party) : venue === ZENCHEF_MAISON_MOLY ? maisonMolyPolicy(state,shift,party) : venue === ZENCHEF_COMPTOIR_CHABERT ? comptoirChabertPolicy(state,shift,party) : venue === ZENCHEF_BISTROT_ABEL ? bistrotAbelPolicy(state,shift,party) : venue === ZENCHEF_CAFE_COMPTOIR_ABEL ? cafeComptoirAbelPolicy(state,shift,party) : venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE ? christineShift(state,shift,party) : venue === ZENCHEF_BOFINGER
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
                                                          : venue === ZENCHEF_INDIANATOLBIAC ? indianaTolbiacPolicy(state, shift, party)
                                                            : venue === ZENCHEF_INDIANAMONTPARNASSE ? indianaMontparnassePolicy(state, shift, party)
                                                            : venue === ZENCHEF_INDIANAREPUBLIQUE ? indianaRepubliquePolicy(state, shift, party)
                                                              : venue === ZENCHEF_INDIANABERCYVILLAGE ? indianaBercyVillagePolicy(state, shift, party)
                                                                : venue === ZENCHEF_INDIANADENFERTROCHEREAU ? indianaDenfertRochereauPolicy(state, shift, party)
                                                                  : venue === ZENCHEF_INDIANALESHALLES ? indianaLesHallesPolicy(state, shift, party)
                                                                    : venue === ZENCHEF_INDIANATERNES ? indianaTernesPolicy(state, shift, party)
                                                                      : venue === ZENCHEF_OKOMUSU ? okomusuPolicy(state, shift, party)
                                                                        : venue === ZENCHEF_ZENRESTAURANT ? zenRestaurantPolicy(state, shift, party) : venue === ZENCHEF_LAPLAGEPARISIENNE ? laPlageParisiennePolicy(state, shift, party) : venue === ZENCHEF_CAFEDESMUSEES ? cafeDesMuseesPolicy(state, shift, party) : venue === ZENCHEF_CASIMIR ? casimirPolicy(state, shift, party) : venue === ZENCHEF_BICHEPARIS8 ? bicheParis8Policy(state, shift, party) : venue === ZENCHEF_SAVANNAHCAFE ? savannahCafePolicy(state, shift, party) : venue === ZENCHEF_JULESJO ? julesJoPolicy(state, shift, party) : venue === ZENCHEF_BECCO ? beccoPolicy(state, shift, party) : venue === ZENCHEF_BATISTOU ? batistouPolicy(state, shift, party) : venue === ZENCHEF_OFFICEPARIS ? officeParisPolicy(state, shift, party) : venue === ZENCHEF_ARDENT ? ardentPolicy(state, shift, party) : venue === ZENCHEF_BIENELEVE ? bienElevePolicy(state, shift, party) : venue === ZENCHEF_BRASSERIEJAJA ? brasserieJajaPolicy(state, shift, party) : venue === ZENCHEF_CANAILLESPIGALLE ? canaillesPigallePolicy(state, shift, party) : venue === ZENCHEF_COMPTOIRPETITSCHAMPS ? comptoirPetitsChampsPolicy(state, shift, party) : venue === ZENCHEF_ESCUDELLA ? escudellaPolicy(state, shift, party) : venue === ZENCHEF_CORNICHON_GONCOURT ? cornichonGoncourtPolicy(state, shift, party) : venue === ZENCHEF_IBRIK_KITCHEN ? ibrikKitchenPolicy(state, shift, party) : venue === ZENCHEF_CHEZ_FERNAND_GUISARDE && chezFernandGuisardePolicy(state, shift, party);

// Read only the server-rendered provider state, never execute or mutate its store.
// Candidate slots are not held, selected, confirmed or guaranteed bookable later.
export function zenchefAvailabilityEvidence(data, query, observedAt = Date.now(), venue = ZENCHEF_ARPEGE) {
  zenchefSearchUrl(query, venue);
  const state = data?.props?.initialState?.appStoreState;
  const day = state?.dailyAvailabilities?.[query.date];
  if (venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE && (data?.buildId !== CHRISTINE_BUILD || !christineQuery(data?.query,query))) throw new ZenchefError('provider_state_unverified',502);
  if ((venue === ZENCHEF_LE_CERF_VOLANT && !cerfVolantQuery(data?.query)) || (venue === ZENCHEF_LE_MERCIERE && !leMerciereQuery(data?.query)) || (venue === ZENCHEF_SHIYO && !shiyoQuery(data?.query)) || (venue === ZENCHEF_LE_VIVARAIS && !vivaraisQuery(data?.query)) || (venue === ZENCHEF_BRASSERIE_ROSEAUX && !roseauxQuery(data?.query)) || (venue === ZENCHEF_NOSCH && !noschQuery(data?.query)) || (venue === ZENCHEF_MAISON_MOLY && !maisonMolyQuery(data?.query)) || (venue === ZENCHEF_COMPTOIR_CHABERT && !comptoirChabertQuery(data?.query)) || (venue === ZENCHEF_BISTROT_ABEL && !bistrotAbelQuery(data?.query)) || (venue === ZENCHEF_CAFE_COMPTOIR_ABEL && !cafeComptoirAbelQuery(data?.query)) || (venue === ZENCHEF_CHEZ_FERNAND_GUISARDE && !chezFernandGuisardeQuery(data?.query)) || (venue === ZENCHEF_IBRIK_KITCHEN && !ibrikKitchenQuery(data?.query)) || (venue === ZENCHEF_CORNICHON_GONCOURT && !cornichonGoncourtQuery(data?.query)) || (venue === ZENCHEF_ESCUDELLA && !escudellaQuery(data?.query)) || (venue === ZENCHEF_COMPTOIRPETITSCHAMPS && !comptoirPetitsChampsQuery(data?.query)) || (venue === ZENCHEF_CANAILLESPIGALLE && !canaillesPigalleQuery(data?.query)) || (venue === ZENCHEF_BRASSERIEJAJA && !brasserieJajaQuery(data?.query)) || (venue === ZENCHEF_BIENELEVE && !bienEleveQuery(data?.query)) || (venue === ZENCHEF_ARDENT && !ardentQuery(data?.query)) || (venue === ZENCHEF_OFFICEPARIS && !officeParisQuery(data?.query)) || (venue === ZENCHEF_BATISTOU && !batistouQuery(data?.query)) || (venue === ZENCHEF_BECCO && !beccoQuery(data?.query)) || (venue === ZENCHEF_JULESJO && !julesJoQuery(data?.query)) || (venue === ZENCHEF_SAVANNAHCAFE && !savannahCafeQuery(data?.query)) || (venue === ZENCHEF_BICHEPARIS8 && (data?.query?.lang !== 'en' || data.query?.fullscreen !== '1')) || data?.page !== '/results' || ([ZENCHEF_OKOMUSU, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_CAFEDESMUSEES, ZENCHEF_BICHEPARIS8].includes(venue) && Object.hasOwn(data.query || {}, 'pid')) || ([ZENCHEF_PETITSOMMELIER, ZENCHEF_PETITPONTOISE, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC, ZENCHEF_INDIANAMONTPARNASSE, ZENCHEF_INDIANAREPUBLIQUE, ZENCHEF_INDIANABERCYVILLAGE, ZENCHEF_INDIANADENFERTROCHEREAU, ZENCHEF_INDIANALESHALLES, ZENCHEF_INDIANATERNES, ZENCHEF_ZENRESTAURANT, ZENCHEF_CASIMIR].includes(venue) && data.query?.pid !== '1001') || data.query?.rid !== venue.venueId || data.query?.day !== query.date
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
      if ([ZENCHEF_BOUILLONREPUBLIQUE, ZENCHEF_BRASSERIEJAJA, ZENCHEF_CANAILLESPIGALLE, ZENCHEF_COMPTOIRPETITSCHAMPS, ZENCHEF_ESCUDELLA, ZENCHEF_CORNICHON_GONCOURT, ZENCHEF_IBRIK_KITCHEN, ZENCHEF_CHEZ_FERNAND_GUISARDE, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_COMPTOIR_CHABERT,ZENCHEF_MAISON_MOLY,ZENCHEF_NOSCH,ZENCHEF_BRASSERIE_ROSEAUX,ZENCHEF_LE_VIVARAIS,ZENCHEF_SHIYO,ZENCHEF_LE_MERCIERE,ZENCHEF_LE_CERF_VOLANT].includes(venue) && !venue.lunchTimes.includes(slot.name)) continue;
      if (venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE) {
        const offer=christineChoice(state,shift,slot,query,inWindow);
        if (offer) candidates.push({time:slot.name,shiftId:shift.id,offers:[offer]});
        continue;
      }
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
        provider: 'Zenchef', destination: [ZENCHEF_CAFE_COMPTOIR_ABEL,ZENCHEF_BISTROT_ABEL,ZENCHEF_COMPTOIR_CHABERT,ZENCHEF_MAISON_MOLY,ZENCHEF_NOSCH,ZENCHEF_BRASSERIE_ROSEAUX,ZENCHEF_LE_VIVARAIS,ZENCHEF_SHIYO,ZENCHEF_LE_MERCIERE,ZENCHEF_LE_CERF_VOLANT].includes(venue) ? 'Lyon' : [ZENCHEF_ARPEGE, ...NO_ROOM_LUNCH_VENUES].includes(venue) ? 'Paris' : venue === ZENCHEF_PESQUIERE ? 'Saint-Tropez' : venue === ZENCHEF_PIROUETTE ? 'Nice' : venue === ZENCHEF_DEKAS ? 'Amsterdam' : 'St. Barts', context, revision: 0, touched: this.now(),
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
            if (visitConfig(venue)) {
              await this.verifyNativeRoom(s);
              if (await this.readReservationVisitReason(s) !== s.approval.details.reservationVisitReason) throw new ZenchefError('stale_review',409);
            }
            if (venue === ZENCHEF_INDIANAMONTPARNASSE) {
              await this.verifyNativeRoom(s);
              if (await this.readReservationPurpose(s) !== s.approval.details.reservationPurpose) throw new ZenchefError('stale_review', 409);
            }
            if (venue === ZENCHEF_LAPLAGEPARISIENNE) {
              await this.verifyNativeRoom(s);
              if (await this.readSaturdayDuration(s) !== true) throw new ZenchefError('stale_review',409);
            }
            if ([ZENCHEF_CHEZ_FERNAND_CHRISTINE,ZENCHEF_CAFEDESMUSEES,ZENCHEF_CASIMIR,ZENCHEF_BICHEPARIS8,ZENCHEF_SAVANNAHCAFE,ZENCHEF_JULESJO,ZENCHEF_BECCO,ZENCHEF_BATISTOU, ZENCHEF_OFFICEPARIS, ZENCHEF_ARDENT, ZENCHEF_BIENELEVE, ZENCHEF_BRASSERIEJAJA, ZENCHEF_CANAILLESPIGALLE, ZENCHEF_COMPTOIRPETITSCHAMPS, ZENCHEF_ESCUDELLA, ZENCHEF_CORNICHON_GONCOURT, ZENCHEF_IBRIK_KITCHEN, ZENCHEF_CHEZ_FERNAND_GUISARDE, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_COMPTOIR_CHABERT,ZENCHEF_MAISON_MOLY,ZENCHEF_NOSCH,ZENCHEF_BRASSERIE_ROSEAUX,ZENCHEF_LE_VIVARAIS,ZENCHEF_SHIYO,ZENCHEF_LE_MERCIERE,ZENCHEF_LE_CERF_VOLANT].includes(venue)) await this.verifyNativeRoom(s);
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
              ...([ZENCHEF_DEKAS,ZENCHEF_CHEZ_FERNAND_CHRISTINE].includes(venue) ? { offerId: s.approval.offer.offerId, offerCount: s.approval.offer.count,
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
  async readChristineState(s) {
    // Read only the current mounted provider context. Do not invoke store methods,
    // inject a choice, or fall back to __NEXT_DATA__ (which stays at the initial /offers).
    const state = await s.page.evaluate(keys => {
      const node = document.querySelector('#__next');
      const key = node && Object.keys(node).find(k => k.startsWith('__reactContainer$'));
      const container = key && node[key];
      const root = container?.stateNode?.current;
      if (!root) return null;
      const seen = new Set(), stores = new Set(), pending = [root];
      while (pending.length && seen.size < 10000) {
        const fiber = pending.pop();
        if (!fiber || seen.has(fiber)) continue;
        seen.add(fiber);
        if (fiber.memoizedProps?.value?.appStore) stores.add(fiber.memoizedProps.value.appStore);
        pending.push(fiber.child, fiber.sibling);
      }
      if (stores.size !== 1 || pending.length) return null;
      const state = [...stores][0].state;
      return JSON.parse(JSON.stringify(Object.fromEntries(keys.map(k => [k, state[k]]))));
    }, [...CHRISTINE_META_KEYS, 'partner_id', 'voucherParam', 'wish', 'dailyAvailabilities',
      'restaurantSpecificCommentsByDay', 'initializedSSR', 'isDisabled']);
    if (!state) throw new ZenchefError('provider_state_unverified', 409);
    return state;
  }
  async verifyChristine(s, selected) {
    const raw = await s.page.locator('script#__NEXT_DATA__').textContent();
    const initial = JSON.parse(raw);
    const expected = zenchefFormUrl(s.formSelection, s.venue).replace('/form?', selected ? '/form?' : '/offers?');
    if (initial.buildId !== CHRISTINE_BUILD || initial.page !== '/offers' || initial.query?.slot !== s.formSelection.time
      || digest(initial) !== s.christineInitialHash || s.page.url() !== expected)
      throw new ZenchefError('offer_changed', 409);
    const state = await this.readChristineState(s);
    if (state.type !== 'web' || state.wish?.slot !== s.formSelection.time || state.wish.day !== s.searchQuery.date || state.wish.pax !== 2)
      throw new ZenchefError('offer_changed', 409);
    const {slot: initialSlot, ...query} = initial.query;
    const current = zenchefAvailabilityEvidence({ ...initial, page:'/results', query, props: { initialState: { appStoreState: state } } }, s.searchQuery, this.now(), s.venue)
      .candidates.find(row => row.time === s.formSelection.time && row.shiftId === 121338)?.offers?.[0];
    const choice = selected ? s.offerChoice : s.offerChoices?.[0];
    if (!current || current.version !== choice?.version || (selected
      ? !approvedChristineOffers(state.wish.offers, { party: 2, shiftId: 121338, offer: choice })
      : !Array.isArray(state.wish.offers) || state.wish.offers.length !== 0))
      throw new ZenchefError('offer_changed', 409);
    if (selected) {
      const text = await s.page.locator('[data-testid="eula-checkbox"]').innerText();
      if (text !== s.terms?.text || !await s.page.getByText(CHRISTINE_NOTICE, { exact: true }).isVisible()
        || await s.page.locator('[data-testid="eula-checkbox"] a').getAttribute('href') !== '/gtc?rid=361894&lang=fr'
        || s.terms.version !== digest([text, state.restaurantComment, CHRISTINE_NOTICE, current.version, purposeSchema(state)]))
        throw new ZenchefError('stale_review', 409);
    } else if (!await s.page.getByText('À la carte', { exact: true }).filter({ visible: true }).isVisible()
      || !await s.page.locator('[data-testid="disabled-continue-btn"]').isDisabled())
      throw new ZenchefError('offer_changed', 409);
    return state;
  }
  async selectChristineOffer(s, action) {
    if (this.now() - s.offerObservedAt > 120000) throw new ZenchefError('slot_stale_or_unverified', 409);
    const choice = s.offerChoices?.find(row => row.offerId === action.offerId && row.count === action.count && row.version === action.offerVersion);
    if (!choice || s.offerChoices.length !== 1) throw new ZenchefError('explicit_offer_required', 409);
    await this.verifyChristine(s, false);
    const adds = s.page.locator('[data-testid="add-to-cart-btn"]');
    // Own original order: Formule Déjeuner followed by À la carte, both unselected.
    if (await adds.count() !== 2) throw new ZenchefError('offer_control_unverified', 409);
    await adds.nth(1).click();
    let state = await this.readChristineState(s);
    if (digest(state.wish.offers) !== digest([{offer_id:60971,count:1}])
      || !await s.page.locator('[data-testid="go-to-form-btn"]').isDisabled())
      throw new ZenchefError('offer_changed', 409);
    await s.page.locator('[data-testid="increment-offer-card-offer-60971-btn"]').click();
    state = await this.readChristineState(s);
    if (!approvedChristineOffers(state.wish.offers, {party:2,shiftId:121338,offer:choice}))
      throw new ZenchefError('offer_changed', 409);
    await s.page.locator('[data-testid="go-to-form-btn"]').click();
    await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({state:'visible',timeout:20000});
    s.offerChoice = structuredClone(choice);
    const text = await s.page.locator('[data-testid="eula-checkbox"]').innerText();
    if (!text.trim()) throw new ZenchefError('seating_terms_unverified',409);
    s.terms = {text, seatingNotice:CHRISTINE_NOTICE, restaurantNotice:state.restaurantComment.fr,
      url:s.venue.policySource, mealPrice:null, priceStatus:choice.priceStatus, menuSource:choice.menuSource};
    s.terms.version = digest([text,state.restaurantComment,CHRISTINE_NOTICE,choice.version,purposeSchema(state)]);
    s.formSelection.offer = structuredClone(choice);
    await this.verifyChristine(s,true);
    s.noCardAllowed=true; s.state='contact'; s.review=null;
    return this.snapshot(s);
  }
  async openChristineOffers(s, matches) {
    const url = zenchefFormUrl(s.formSelection,s.venue).replace('/form?','/offers?');
    await s.page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
    const initial=JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
    if (initial.page !== '/offers' || initial.query?.slot !== s.formSelection.time || initial.buildId !== CHRISTINE_BUILD)
      throw new ZenchefError('offer_changed',409);
    const {slot,...query}=initial.query;
    // Validate the own offers SSR using the same availability policy without
    // modifying provider state or inventing a server response.
    const fresh=zenchefAvailabilityEvidence({...initial,page:'/results',query},s.searchQuery,this.now(),s.venue);
    const candidate=fresh.candidates.find(row=>row.time===s.formSelection.time&&row.shiftId===121338);
    if (!candidate || candidate.offers[0].version !== matches[0].offers[0].version)
      throw new ZenchefError('offer_changed',409);
    s.christineInitialHash=digest(initial);
    await s.page.locator('[data-testid="bookings-btn"]').click();
    await s.page.locator('[data-testid="disabled-continue-btn"]').waitFor({state:'visible',timeout:10000});
    s.offerChoices=candidate.offers;s.offerChoice=null;s.terms=null;s.noCardAllowed=false;s.review=null;s.offerObservedAt=this.now();
    await this.verifyChristine(s,false);
    s.state='offers';return this.snapshot(s);
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
    if (s.venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE) { await this.verifyChristine(s,true); return; }
    const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
    const form = data?.props?.initialState?.appStoreState;
    if (s.venue === ZENCHEF_MAISON_MOLY && (!maisonMolyQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_LE_CERF_VOLANT && (!cerfVolantQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_LE_MERCIERE && (!leMerciereQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_SHIYO && (!shiyoQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_LE_VIVARAIS && (!vivaraisQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_BRASSERIE_ROSEAUX && (!roseauxQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_NOSCH && (!noschQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_COMPTOIR_CHABERT && (!comptoirChabertQuery(data?.query) || data.page !== "/form" || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError("stale_review",409);
    if (s.venue === ZENCHEF_BISTROT_ABEL && (!bistrotAbelQuery(data?.query) || data.page !== '/form'
      || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_CAFE_COMPTOIR_ABEL && (!cafeComptoirAbelQuery(data?.query) || data.page !== '/form'
      || data.query.day !== s.searchQuery.date || data.query.slot !== s.formSelection.time)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_CHEZ_FERNAND_GUISARDE && !chezFernandGuisardeQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_IBRIK_KITCHEN && !ibrikKitchenQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_CORNICHON_GONCOURT && !cornichonGoncourtQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_ESCUDELLA && !escudellaQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_COMPTOIRPETITSCHAMPS && !comptoirPetitsChampsQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_CANAILLESPIGALLE && !canaillesPigalleQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_BRASSERIEJAJA && !brasserieJajaQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_BIENELEVE && !bienEleveQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_ARDENT && !ardentQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_OFFICEPARIS && !officeParisQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_BATISTOU && !batistouQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_BECCO && !beccoQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_JULESJO && !julesJoQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_SAVANNAHCAFE && !savannahCafeQuery(data?.query)) throw new ZenchefError('stale_review',409);
    if (s.venue === ZENCHEF_BICHEPARIS8 && (data?.query?.rid !== s.venue.venueId || data.query?.lang !== 'en' || data.query?.fullscreen !== '1')) throw new ZenchefError('stale_review',409);
    if ([ZENCHEF_OKOMUSU, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_CAFEDESMUSEES, ZENCHEF_BICHEPARIS8].includes(s.venue) && Object.hasOwn(data?.query || {}, 'pid')) throw new ZenchefError('stale_review',409);
    if ([ZENCHEF_PETITSOMMELIER, ZENCHEF_PETITPONTOISE, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC, ZENCHEF_INDIANAMONTPARNASSE, ZENCHEF_INDIANAREPUBLIQUE, ZENCHEF_INDIANABERCYVILLAGE, ZENCHEF_INDIANADENFERTROCHEREAU, ZENCHEF_INDIANALESHALLES, ZENCHEF_INDIANATERNES, ZENCHEF_ZENRESTAURANT, ZENCHEF_CASIMIR].includes(s.venue) && data?.query?.pid !== '1001')
      throw new ZenchefError('stale_review', 409);
    // Form requirements can change after selection or review. Recheck before
    // approval and the durable send grant, not only when opening the form.
    if (!supportedZenchefFields(form, s.venue))
      throw new ZenchefError('provider_fields_unverified', 409);
    if ([ZENCHEF_ESCUDELLA, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_BRASSERIE_ROSEAUX].includes(s.venue)) await verifyEscudellaNoGift(s.page);
    if (s.venue === ZENCHEF_LE_VIVARAIS) await verifyVivaraisNoGift(s.page);
    if (s.venue === ZENCHEF_LE_CERF_VOLANT) await verifyCerfVolantNoGift(s.page);
    if (s.venue === ZENCHEF_CORNICHON_GONCOURT && await cornichonGoncourtSeatingNotice(s.page) !== s.terms?.seatingNotice) throw new ZenchefError('stale_review',409);
    if ([ZENCHEF_INDIANAMONTPARNASSE, ZENCHEF_INDIANALESHALLES, ZENCHEF_INDIANATERNES, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_CAFEDESMUSEES, ZENCHEF_CASIMIR, ZENCHEF_BICHEPARIS8, ZENCHEF_SAVANNAHCAFE, ZENCHEF_JULESJO, ZENCHEF_BECCO, ZENCHEF_BATISTOU, ZENCHEF_OFFICEPARIS, ZENCHEF_ARDENT, ZENCHEF_BIENELEVE, ZENCHEF_BRASSERIEJAJA, ZENCHEF_CANAILLESPIGALLE, ZENCHEF_COMPTOIRPETITSCHAMPS, ZENCHEF_ESCUDELLA, ZENCHEF_CORNICHON_GONCOURT, ZENCHEF_IBRIK_KITCHEN, ZENCHEF_CHEZ_FERNAND_GUISARDE, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_COMPTOIR_CHABERT,ZENCHEF_MAISON_MOLY,ZENCHEF_NOSCH,ZENCHEF_BRASSERIE_ROSEAUX,ZENCHEF_LE_VIVARAIS,ZENCHEF_SHIYO,ZENCHEF_LE_MERCIERE,ZENCHEF_LE_CERF_VOLANT].includes(s.venue) && purposeSchema(form) !== s.purposeSchemaVersion)
      throw new ZenchefError('provider_fields_unverified', 409);
    if (NO_ROOM_LUNCH_VENUES.includes(s.venue)) {
      const shift = form?.dailyAvailabilities?.[s.searchQuery.date]?.shifts?.find(row => row.id === s.venue.shiftId);
      const text = await s.page.locator('[data-testid="eula-checkbox"]').innerText();
      if (s.page.url() !== zenchefFormUrl(s.formSelection, s.venue) || form?.wish?.slot !== s.formSelection.time
        || form?.wish?.day !== s.searchQuery.date || form?.wish?.pax !== 2
        || (s.noCardAllowed && !noRoomLunchPolicy(s.venue, form, shift, 2))
        || nativeTermsVersion(text, form, shift, s.venue) !== s.terms?.version)
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
  async openCafeDesMuseesForm(s, url) {
    if (s.venue !== ZENCHEF_CAFEDESMUSEES) throw new ZenchefError('provider_form_mismatch',502);
    const raw=await s.page.locator('script#__NEXT_DATA__').textContent();
    const data=JSON.parse(raw),form=data?.props?.initialState?.appStoreState,sdk=data?.props?.initialState?.sdkStoreState;
    const expected=Object.fromEntries(new URL(url).searchParams),query=data.query || {};
    const shift=form?.dailyAvailabilities?.[s.searchQuery.date]?.shifts?.find(x=>x.id===7248);
    if (s.page.url() !== url || data.page !== '/form' || new URL(url).pathname !== '/form'
      || expected.rid !== '348911' || expected.sdk !== '1' || expected.showCollapsed !== '1'
      || Object.keys(query).length !== Object.keys(expected).length || Object.entries(expected).some(([k,v])=>query[k] !== v)
      || !cafeDesMuseesMetadata(form) || !supportedZenchefFields(form,s.venue)
      || Object.hasOwn(form,'partner_id') || form.wish?.day !== s.searchQuery.date || form.wish?.pax !== 2
      || form.wish?.slot !== expected.slot || form.wish.waiting_list !== false
      || form.hasRoomSelection !== false || form.isRoomMandatory !== false || form.wish.room_id !== null
      || !Array.isArray(form.wish.offers) || form.wish.offers.length || !Array.isArray(form.offers) || form.offers.length
      || shift?.closed !== false || shift.marked_as_full !== false
      || !shift.shift_slots?.some(x=>x.name===expected.slot && x.closed===false && x.marked_as_full===false && x.possible_guests?.includes(2))
      || sdk?.isSdk !== true || sdk.showCollapsed !== true || sdk.isCollapsed !== true || sdk.sdkEntrypoint !== 'restaurant')
      throw new ZenchefError('provider_form_mismatch',502);
    // Own cached handler only expands the selected form when no filter/offer/room is missing.
    // Use the real launcher; never mutate query parameters or application state.
    const launcher=s.page.locator('[data-testid="bookings-btn"]');
    await launcher.waitFor({state:'visible',timeout:10000});
    if (await launcher.count() !== 1 || !await launcher.isEnabled()
      || (await launcher.innerText()).trim() !== 'Réserver une table'
      || await s.page.locator(PROVIDER_FIELDS.firstname).count() !== 0) throw new ZenchefError('provider_form_mismatch',502);
    await launcher.click();
    await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({state:'visible',timeout:10000});
    if (s.page.url() !== url || await s.page.locator('script#__NEXT_DATA__').textContent() !== raw
      || await launcher.isVisible()) throw new ZenchefError('provider_form_mismatch',502);
  }
  async openCerfVolantForm(s, url) {
    if (s.venue !== ZENCHEF_LE_CERF_VOLANT) throw new ZenchefError('provider_form_mismatch',502);
    const raw=await s.page.locator('script#__NEXT_DATA__').textContent();
    const data=JSON.parse(raw),form=data?.props?.initialState?.appStoreState,sdk=data?.props?.initialState?.sdkStoreState;
    const expected=Object.fromEntries(new URL(url).searchParams),query=data.query || {};
    const shift=form?.dailyAvailabilities?.[s.searchQuery.date]?.shifts?.find(x=>x.id===325474);
    if (s.page.url() !== url || data.page !== '/form' || new URL(url).pathname !== '/form'
      || expected.rid !== '378221' || expected.sdk !== '1' || expected.showCollapsed !== '1'
      || Object.keys(query).length !== Object.keys(expected).length || Object.entries(expected).some(([k,v])=>query[k] !== v)
      || !cerfVolantMetadata(form) || !cerfVolantPolicy(form,shift,2) || !supportedZenchefFields(form,s.venue)
      || Object.hasOwn(form,'partner_id') || form.wish?.day !== s.searchQuery.date || form.wish?.pax !== 2
      || form.wish?.slot !== expected.slot || form.wish.waiting_list !== false
      || form.hasRoomSelection !== false || form.isRoomMandatory !== false || form.wish.room_id !== null
      || !Array.isArray(form.wish.offers) || form.wish.offers.length || !Array.isArray(form.offers) || form.offers.length
      || shift?.closed !== false || shift.marked_as_full !== false
      || !shift.shift_slots?.some(x=>x.name===expected.slot && x.closed===false && x.marked_as_full===false && x.possible_guests?.includes(2))
      || sdk?.isSdk !== true || sdk.showCollapsed !== true || sdk.isCollapsed !== true || sdk.sdkEntrypoint !== 'restaurant')
      throw new ZenchefError('provider_form_mismatch',502);
    // Own cached handler only expands the selected form when no filter/offer/room is missing.
    // Use the real launcher; never mutate query parameters or application state.
    const launcher=s.page.locator('[data-testid="bookings-btn"]');
    await launcher.waitFor({state:'visible',timeout:10000});
    if (await launcher.count() !== 1 || !await launcher.isEnabled()
      || (await launcher.innerText()).trim() !== 'Réserver une table'
      || await s.page.locator(PROVIDER_FIELDS.firstname).count() !== 0) throw new ZenchefError('provider_form_mismatch',502);
    await launcher.click();
    await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({state:'visible',timeout:10000});
    if (s.page.url() !== url || await s.page.locator('script#__NEXT_DATA__').textContent() !== raw
      || await launcher.isVisible()) throw new ZenchefError('provider_form_mismatch',502);
  }
  async saturdayDurationInput(s) {
    if (s.venue !== ZENCHEF_LAPLAGEPARISIENNE) throw new ZenchefError('provider_fields_unverified',409);
    const input=s.page.locator('[id="custom_field__'+PLAGE_DURATION_SLUG+'"]');
    const label=s.page.locator('label[for="custom_field__'+PLAGE_DURATION_SLUG+'"]');
    if (await input.count() !== 1 || await label.count() !== 1 || !await label.isVisible()
      || !await input.isEnabled() || await input.evaluate(e=>e.type) !== 'checkbox'
      || (await label.innerText()).trim() !== PLAGE_DURATION_LABEL) throw new ZenchefError('provider_fields_unverified',409);
    return input;
  }
  async readSaturdayDuration(s) { return (await this.saturdayDurationInput(s)).isChecked(); }
  async reservationPurposeInput(s) {
    if (s.venue !== ZENCHEF_INDIANAMONTPARNASSE) throw new ZenchefError('provider_fields_unverified', 409);
    const title = s.page.getByText('Motif de la réservation', { exact: true });
    if (await title.count() !== 1 || !await title.isVisible()) throw new ZenchefError('provider_fields_unverified', 409);
    // Verified against own cached native DOM at 390/1366; no getByLabel association.
    const input = title.locator('xpath=../following-sibling::label/input');
    if (await input.count() !== 1 || !await input.isVisible() || !await input.isEditable()
      || await input.evaluate(element => element.type) !== 'text') throw new ZenchefError('provider_fields_unverified', 409);
    return input;
  }
  async readReservationPurpose(s) {
    return (await this.reservationPurposeInput(s)).inputValue();
  }
  async reservationVisitSelect(s) {
    const config = visitConfig(s.venue);
    if (!config) throw new ZenchefError('provider_fields_unverified', 409);
    const title = s.page.getByText(config.label, { exact: true });
    if (await title.count() !== 1 || !await title.isVisible()) throw new ZenchefError('provider_fields_unverified', 409);
    // Own cached native DOM390/1366: separate title label, wrapper label contains SELECT.
    const select = title.locator('xpath=../following-sibling::label//select');
    if (await select.count() !== 1 || !await select.isVisible() || !await select.isEnabled()) throw new ZenchefError('provider_fields_unverified', 409);
    const state = await select.evaluate(element => ({ tag:element.tagName, multiple:element.multiple,
      options:[...element.options].map(option=>({value:option.value,text:option.textContent,disabled:option.disabled})) }));
    const values = ['', ...config.values];
    if (state.tag !== 'SELECT' || state.multiple || state.options.length !== values.length
      || state.options.some((option,i)=>option.value !== values[i] || option.text !== values[i] || option.disabled)) throw new ZenchefError('provider_fields_unverified',409);
    return select;
  }
  async readReservationVisitReason(s) { return (await this.reservationVisitSelect(s)).inputValue(); }
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
      if (!!visitConfig(s.venue)) fields.push({name:'reservationVisitReason',value:await this.readReservationVisitReason(s),required:true,type:'select',options:[...visitConfig(s.venue).values],label:visitConfig(s.venue).label});
      if (s.venue === ZENCHEF_LAPLAGEPARISIENNE) fields.push({name:'reservationSaturdayDurationAcknowledged',value:await this.readSaturdayDuration(s),required:true,type:'checkbox',label:PLAGE_DURATION_LABEL});
      if (s.venue === ZENCHEF_INDIANAMONTPARNASSE) fields.push({ name: 'reservationPurpose', value: await this.readReservationPurpose(s), required: true, type: 'text', maxLength: 200, label: 'Motif de la réservation' });
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
      fields, details: s.details ? structuredClone(s.details) : s.venue === ZENCHEF_LAPLAGEPARISIENNE && s.state === 'contact'
        ? {reservationSaturdayDurationAcknowledged: fields?.find(f=>f.name === 'reservationSaturdayDurationAcknowledged')?.value === true} : null, result: s.result ? structuredClone(s.result) : null,
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
        s.searchQuery = query; s.formSelection = null; s.details = null; s.enteredReservationPurpose = undefined; s.enteredReservationVisitReason = undefined; s.enteredSaturdayDuration = undefined; s.review = null; s.noCardAllowed = false; s.terms = null;
        s.availabilityEvidence = null; s.offerChoices = null; s.offerChoice = null; s.state = 'inspect_only';
        await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
        s.availabilityEvidence = zenchefAvailabilityEvidence(data, query, this.now(), s.venue);
        s.state = 'availability_observed';
        return await this.snapshot(s);
      }
      if (this.mode === 'prepare') {
        if (s.venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE && action.type === 'select_offer' && s.state === 'offers') return await this.selectChristineOffer(s,action);
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
          if (s.venue === ZENCHEF_CHEZ_FERNAND_CHRISTINE) return await this.openChristineOffers(s,matches);
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
          if (s.venue === ZENCHEF_CAFEDESMUSEES) await this.openCafeDesMuseesForm(s,url);
          if (s.venue === ZENCHEF_LE_CERF_VOLANT) await this.openCerfVolantForm(s,url);
          await s.page.locator(PROVIDER_FIELDS.firstname).waitFor({ state: 'visible', timeout: 20000 });
          const data = JSON.parse(await s.page.locator('script#__NEXT_DATA__').textContent());
          const form = data?.props?.initialState?.appStoreState;
          if ((s.venue === ZENCHEF_LE_CERF_VOLANT && !cerfVolantQuery(data?.query)) || (s.venue === ZENCHEF_LE_MERCIERE && !leMerciereQuery(data?.query)) || (s.venue === ZENCHEF_SHIYO && !shiyoQuery(data?.query)) || (s.venue === ZENCHEF_LE_VIVARAIS && !vivaraisQuery(data?.query)) || (s.venue === ZENCHEF_BRASSERIE_ROSEAUX && !roseauxQuery(data?.query)) || (s.venue === ZENCHEF_NOSCH && !noschQuery(data?.query)) || (s.venue === ZENCHEF_MAISON_MOLY && !maisonMolyQuery(data?.query)) || (s.venue === ZENCHEF_COMPTOIR_CHABERT && !comptoirChabertQuery(data?.query)) || (s.venue === ZENCHEF_BISTROT_ABEL && !bistrotAbelQuery(data?.query)) || (s.venue === ZENCHEF_CAFE_COMPTOIR_ABEL && !cafeComptoirAbelQuery(data?.query)) || (s.venue === ZENCHEF_CHEZ_FERNAND_GUISARDE && !chezFernandGuisardeQuery(data?.query)) || (s.venue === ZENCHEF_IBRIK_KITCHEN && !ibrikKitchenQuery(data?.query)) || (s.venue === ZENCHEF_CORNICHON_GONCOURT && !cornichonGoncourtQuery(data?.query)) || (s.venue === ZENCHEF_ESCUDELLA && !escudellaQuery(data?.query)) || (s.venue === ZENCHEF_COMPTOIRPETITSCHAMPS && !comptoirPetitsChampsQuery(data?.query)) || (s.venue === ZENCHEF_CANAILLESPIGALLE && !canaillesPigalleQuery(data?.query)) || (s.venue === ZENCHEF_BRASSERIEJAJA && !brasserieJajaQuery(data?.query)) || (s.venue === ZENCHEF_BIENELEVE && !bienEleveQuery(data?.query)) || (s.venue === ZENCHEF_ARDENT && !ardentQuery(data?.query)) || (s.venue === ZENCHEF_OFFICEPARIS && !officeParisQuery(data?.query)) || (s.venue === ZENCHEF_BATISTOU && !batistouQuery(data?.query)) || (s.venue === ZENCHEF_BECCO && !beccoQuery(data?.query)) || (s.venue === ZENCHEF_JULESJO && !julesJoQuery(data?.query)) || (s.venue === ZENCHEF_SAVANNAHCAFE && !savannahCafeQuery(data?.query)) || (s.venue === ZENCHEF_BICHEPARIS8 && (data.query?.lang !== 'en' || data.query?.fullscreen !== '1')) || s.page.url() !== url || data.page !== '/form' || ([ZENCHEF_OKOMUSU, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_CAFEDESMUSEES, ZENCHEF_BICHEPARIS8].includes(s.venue) && Object.hasOwn(data.query || {}, 'pid')) || ([ZENCHEF_PETITSOMMELIER, ZENCHEF_PETITPONTOISE, ZENCHEF_MARTHA, ZENCHEF_CAFEMARLY, ZENCHEF_INDIANABONNENOUVELLE, ZENCHEF_INDIANARICHELIEU, ZENCHEF_INDIANABEAUGRENELLE, ZENCHEF_INDIANATOLBIAC, ZENCHEF_INDIANAMONTPARNASSE, ZENCHEF_INDIANAREPUBLIQUE, ZENCHEF_INDIANABERCYVILLAGE, ZENCHEF_INDIANADENFERTROCHEREAU, ZENCHEF_INDIANALESHALLES, ZENCHEF_INDIANATERNES, ZENCHEF_ZENRESTAURANT, ZENCHEF_CASIMIR].includes(s.venue) && data.query?.pid !== '1001') || form?.restaurantId !== s.venue.venueId
            || form.wish?.day !== s.searchQuery.date || form.wish?.pax !== s.searchQuery.party
            || form.wish?.slot !== action.time || form.wish?.waiting_list !== false) throw new ZenchefError('provider_form_mismatch', 502);
          if (room && (form.wish.room_id !== room.id || form.isRoomMandatory !== true
            || !form.rooms?.some(native => native.id === room.id && native.name === room.name)
            || !await s.page.getByText(room.name, { exact: true }).isVisible())) throw new ZenchefError('provider_room_mismatch', 502);
          if (!supportedZenchefFields(form, s.venue)) {
            throw new ZenchefError('provider_fields_unverified', 409);
          }
          if ([ZENCHEF_ESCUDELLA, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_BRASSERIE_ROSEAUX].includes(s.venue)) await verifyEscudellaNoGift(s.page);
    if (s.venue === ZENCHEF_LE_VIVARAIS) await verifyVivaraisNoGift(s.page);
    if (s.venue === ZENCHEF_LE_CERF_VOLANT) await verifyCerfVolantNoGift(s.page);
          if (s.venue === ZENCHEF_LAPLAGEPARISIENNE && await this.readSaturdayDuration(s) !== false) throw new ZenchefError('provider_fields_unverified',409);
          if (!!visitConfig(s.venue) && await this.readReservationVisitReason(s) !== '') throw new ZenchefError('provider_fields_unverified',409);
          if ([ZENCHEF_INDIANAMONTPARNASSE, ZENCHEF_INDIANALESHALLES, ZENCHEF_INDIANATERNES, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_CAFEDESMUSEES, ZENCHEF_CASIMIR, ZENCHEF_BICHEPARIS8, ZENCHEF_SAVANNAHCAFE, ZENCHEF_JULESJO, ZENCHEF_BECCO, ZENCHEF_BATISTOU, ZENCHEF_OFFICEPARIS, ZENCHEF_ARDENT, ZENCHEF_BIENELEVE, ZENCHEF_BRASSERIEJAJA, ZENCHEF_CANAILLESPIGALLE, ZENCHEF_COMPTOIRPETITSCHAMPS, ZENCHEF_ESCUDELLA, ZENCHEF_CORNICHON_GONCOURT, ZENCHEF_IBRIK_KITCHEN, ZENCHEF_CHEZ_FERNAND_GUISARDE, ZENCHEF_CAFE_COMPTOIR_ABEL, ZENCHEF_BISTROT_ABEL,ZENCHEF_COMPTOIR_CHABERT,ZENCHEF_MAISON_MOLY,ZENCHEF_NOSCH,ZENCHEF_BRASSERIE_ROSEAUX,ZENCHEF_LE_VIVARAIS,ZENCHEF_SHIYO,ZENCHEF_LE_MERCIERE,ZENCHEF_LE_CERF_VOLANT].includes(s.venue)) s.purposeSchemaVersion = purposeSchema(form);
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
          s.terms = { text, version: nativeTermsVersion(text, form, shift, s.venue),
            url: `https://bookings.zenchef.com/gtc?rid=${s.venue.venueId}&lang=${s.venue === ZENCHEF_BICHEPARIS8 ? 'en' : 'fr'}` };
          if (s.venue === ZENCHEF_CORNICHON_GONCOURT) s.terms.seatingNotice = await cornichonGoncourtSeatingNotice(s.page);
          if (s.venue === ZENCHEF_PIROUETTE) {
            const seating = s.page.getByText(/^Jusqu'\u00e0 \d{2}:\d{2}$/);
            if (await seating.count() !== 1 || !await seating.isVisible()) throw new ZenchefError('seating_terms_unverified', 409);
            s.terms.seatingNotice = await seating.innerText();
            s.terms.version = digest([s.terms.version, s.terms.seatingNotice]);
          }
          if (NO_ROOM_LUNCH_VENUES.includes(s.venue)) {
            s.terms.restaurantNotice = [ZENCHEF_ZENRESTAURANT, ZENCHEF_LAPLAGEPARISIENNE, ZENCHEF_BICHEPARIS8].includes(s.venue)
              ? `Français:\n${form.restaurantComment?.fr || ''}\n\nEnglish:\n${form.restaurantComment?.en || ''}`
              : form.restaurantComment?.fr || '';
            // Preserve SHIYO's complete lunch pricing/closing notice in the existing pre-consent terms renderer.
            if (s.venue === ZENCHEF_SHIYO) s.terms.restaurantNotice += '\n\n' + shift.comment.fr;
            if ([ZENCHEF_CASIMIR, ZENCHEF_OFFICEPARIS].includes(s.venue)) s.terms.shiftNotice = shift.comment.fr;
            if (s.venue === ZENCHEF_MOULINVENT) s.terms.seatingNotice = shift?.comment?.fr || '';
            if (s.venue === ZENCHEF_INDIANADENFERTROCHEREAU) s.terms.mealNotice = shift.comment.fr;
            if (!!visitConfig(s.venue)) s.terms.shiftNotice = shift.comment.fr;
            if (!s.terms.restaurantNotice.trim() && !((s.venue === ZENCHEF_CHEZ_FERNAND_GUISARDE && chezFernandGuisardePolicy(form,shift,2) || s.venue === ZENCHEF_PETITSOMMELIER || s.venue === ZENCHEF_CAFEDESMUSEES && cafeDesMuseesPolicy(form,shift,2)) && form.restaurantComment?.fr === '')) s.noCardAllowed = false;
          }
          if (!text.trim()) s.noCardAllowed = false;
          s.state = 'contact'; s.review = null;
          return await this.snapshot(s);
        }
        if (action.type === 'fill' && ['contact', 'review'].includes(s.state)) {
          const plageVenue = s.venue === ZENCHEF_LAPLAGEPARISIENNE;
          const fields = action.fields, purposeVenue = s.venue === ZENCHEF_INDIANAMONTPARNASSE, visitVenue = !!visitConfig(s.venue);
          if (!fields || !((purposeVenue || visitVenue || plageVenue) ? [6, 7] : [5, 6]).includes(Object.keys(fields).length)
            || Object.keys(fields).some(k => ![...FIELDS, 'civility', 'country', ...(purposeVenue ? ['reservationPurpose'] : []), ...(visitVenue ? ['reservationVisitReason'] : []), ...(plageVenue ? ['reservationSaturdayDurationAcknowledged'] : [])].includes(k))
            || (plageVenue && typeof fields.reservationSaturdayDurationAcknowledged !== 'boolean')
            || (purposeVenue && !validReservationPurpose(fields.reservationPurpose))
            || (visitVenue && !validReservationVisitReason(fields.reservationVisitReason, s.venue))
            || (fields.country !== undefined && !/^[a-z]{2}$/.test(fields.country)) || FIELDS.some(k => typeof fields[k] !== 'string'
            || !fields[k].trim() || fields[k].length > 200) || !['mr', 'mrs', 'mx'].includes(fields.civility)
            || !/^\+\d{7,15}$/.test(fields.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new ZenchefError('contact_fields');
          s.review = null; s.details = null; s.state = 'contact';
          if (plageVenue) { await this.verifyNativeRoom(s); await this.saturdayDurationInput(s); }
          if (purposeVenue) {
            await this.verifyNativeRoom(s);
            const input = await this.reservationPurposeInput(s);
            await input.fill(fields.reservationPurpose); await input.blur();
            if (await this.readReservationPurpose(s) !== fields.reservationPurpose) throw new ZenchefError('provider_field_not_applied', 409);
            s.enteredReservationPurpose = fields.reservationPurpose;
          }
          if (visitVenue) {
            await this.verifyNativeRoom(s);
            const select = await this.reservationVisitSelect(s);
            await select.selectOption({value:fields.reservationVisitReason}); await select.blur();
            if (await this.readReservationVisitReason(s) !== fields.reservationVisitReason) throw new ZenchefError('provider_field_not_applied',409);
            s.enteredReservationVisitReason = fields.reservationVisitReason;
          }
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
          if (plageVenue) {
            await this.verifyNativeRoom(s);
            const input=await this.saturdayDurationInput(s);
            if (fields.reservationSaturdayDurationAcknowledged === true) await s.page.locator('label[for="custom_field__'+PLAGE_DURATION_SLUG+'"]' ).click();
            if (await input.isChecked() !== fields.reservationSaturdayDurationAcknowledged) throw new ZenchefError('provider_field_not_applied',409);
            s.enteredSaturdayDuration=fields.reservationSaturdayDurationAcknowledged;
          }
          return await this.snapshot(s);
        }
        if (action.type === 'review' && ['contact', 'review'].includes(s.state)) {
          await this.verifyNativeRoom(s);
          const details = { ...s.formSelection, civility: await s.page.locator('input[name="civility"]:checked').inputValue() };
          for (const k of FIELDS) details[k] = await s.page.locator(PROVIDER_FIELDS[k]).inputValue();
          if (s.venue === ZENCHEF_INDIANAMONTPARNASSE) {
            details.reservationPurpose = await this.readReservationPurpose(s);
            if (!validReservationPurpose(details.reservationPurpose)) throw new ZenchefError('contact_required');
            if (details.reservationPurpose !== s.enteredReservationPurpose) throw new ZenchefError('provider_field_not_applied', 409);
          }
          if (!!visitConfig(s.venue)) {
            details.reservationVisitReason = await this.readReservationVisitReason(s);
            if (!validReservationVisitReason(details.reservationVisitReason, s.venue)) throw new ZenchefError('contact_required');
            if (details.reservationVisitReason !== s.enteredReservationVisitReason) throw new ZenchefError('provider_field_not_applied',409);
          }
          if (s.venue === ZENCHEF_LAPLAGEPARISIENNE) {
            details.reservationSaturdayDurationAcknowledged=await this.readSaturdayDuration(s);
            if (details.reservationSaturdayDurationAcknowledged !== true || s.enteredSaturdayDuration !== true) throw new ZenchefError('contact_required');
          }
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
          if (s.venue === ZENCHEF_INDIANAMONTPARNASSE) {
            actual.reservationPurpose = await this.readReservationPurpose(s);
            if (!validReservationPurpose(actual.reservationPurpose)) throw new ZenchefError('stale_review', 409);
          }
          if (!!visitConfig(s.venue)) {
            actual.reservationVisitReason = await this.readReservationVisitReason(s);
            if (!validReservationVisitReason(actual.reservationVisitReason, s.venue)) throw new ZenchefError('stale_review',409);
          }
          if (s.venue === ZENCHEF_LAPLAGEPARISIENNE) {
            actual.reservationSaturdayDurationAcknowledged=await this.readSaturdayDuration(s);
            if (actual.reservationSaturdayDurationAcknowledged !== true || s.enteredSaturdayDuration !== true) throw new ZenchefError('stale_review',409);
          }
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
              ...(s.venue === ZENCHEF_INDIANAMONTPARNASSE ? { reservationPurpose: actual.reservationPurpose } : {}),
              ...(!!visitConfig(s.venue) ? { reservationVisitReason: actual.reservationVisitReason } : {}),
              ...(s.venue === ZENCHEF_LAPLAGEPARISIENNE ? {reservationSaturdayDurationAcknowledged:actual.reservationSaturdayDurationAcknowledged} : {}),
              ...(NO_ROOM_LUNCH_VENUES.includes(s.venue) ? {shiftId:s.venue.shiftId} : {}),
              ...([ZENCHEF_DEKAS,ZENCHEF_CHEZ_FERNAND_CHRISTINE].includes(s.venue) ? { offer: structuredClone(actual.offer) } : {}),
              ...(s.venue.rooms ? { roomId: actual.roomId, roomName: actual.roomName } : {}) } };
          s.submissionStarted = true; s.result = { status: 'unknown' }; s.state = 'result';
          try {
            // Never preserve invisible/default marketing or storage opt-ins.
            for (const box of await s.page.locator('input[type="checkbox"]').all()) if (await box.isChecked()) {
              if (s.venue === ZENCHEF_LAPLAGEPARISIENNE && await box.getAttribute('id') === 'custom_field__'+PLAGE_DURATION_SLUG) continue;
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
      // A failed own-checkbox action invalidates its prior review as well as the screenshot.
      if (s.venue === ZENCHEF_LAPLAGEPARISIENNE && !s.submissionStarted) { s.review=null; s.details=null; if (s.state === 'review') s.state='contact'; }
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
