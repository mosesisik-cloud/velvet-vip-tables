// Native provider pixels. The authenticated server owns sessions and all write gates.
export function mountProviderPlaywrightBooking(container, api, {
  provider, restaurantId, restaurantName = '', endpoint = '/restaurant-bookings/playwright',
  onDismiss = null, storage = window.sessionStorage, requestTimeoutMs = 30000,
} = {}) {
  if (!provider || !restaurantId || !endpoint.startsWith('/')) throw new Error('booking_config');
  const isZenchef = provider.toLowerCase() === 'zenchef';
  const lunchShift = restaurantId === 'curated-PAR-bofinger' ? 19170 : restaurantId === 'curated-PAR-la-coupole' ? 20148 : restaurantId === 'curated-PAR-terminus-nord' ? 19380 : restaurantId === 'curated-PAR-le-procope' ? 18190 : restaurantId === 'curated-PAR-la-lorraine' ? 16674 : restaurantId === 'curated-PAR-au-pied-de-cochon' ? 29 : restaurantId === 'curated-PAR-le-grand-cafe-capucines' ? 19590 : restaurantId === 'curated-PAR-brasserie-vagenende' ? 63972 : restaurantId === 'curated-PAR-bouillon-julien' ? 12711 : restaurantId === 'curated-PAR-bouillon-racine' ? 93989 : restaurantId === 'curated-PAR-bouillon-republique' ? 528175 : restaurantId === 'curated-PAR-brasserie-rosie' ? 43203 : restaurantId === 'curated-PAR-brasserie-rosie-lou' ? 118503 : restaurantId === 'curated-PAR-brasserie-rosie-jolie' ? 298043 : restaurantId === 'curated-PAR-le-petit-sommelier' ? 37613 : restaurantId === 'curated-PAR-chez-savy' ? 68279 : restaurantId === 'curated-PAR-chez-rene' ? 68277 : restaurantId === 'curated-PAR-le-bistrot-de-paris' ? 68145 : restaurantId === 'curated-PAR-aux-bons-crus' ? 20711 : restaurantId === 'curated-PAR-aux-crus-de-bourgogne' ? 22200 : restaurantId === 'curated-PAR-le-petit-retro' ? 116623 : restaurantId === 'curated-PAR-au-moulin-a-vent' ? 139531 : restaurantId === 'curated-PAR-le-petit-pontoise' ? 9493 : restaurantId === 'curated-PAR-le-florentin' ? 283681 : restaurantId === 'curated-PAR-martha-pizze-amore' ? 159369 : restaurantId === 'curated-PAR-le-cafe-marly' ? 122853 : restaurantId === 'curated-PAR-le-cafe-ruc' ? 32216 : restaurantId === 'curated-PAR-indiana-cafe-bonne-nouvelle' ? 253448 : restaurantId === 'curated-PAR-indiana-cafe-richelieu-drouot' ? 276858 : restaurantId === 'curated-PAR-indiana-cafe-beaugrenelle' ? 281252 : restaurantId === 'curated-PAR-indiana-cafe-tolbiac' ? 243266 : restaurantId === 'curated-PAR-indiana-cafe-montparnasse' ? 314295 : restaurantId === 'curated-PAR-indiana-cafe-republique' ? 274078 : restaurantId === 'curated-PAR-indiana-cafe-bercy-village' ? 245385 : restaurantId === 'curated-PAR-indiana-cafe-denfert-rochereau' ? 278132 : restaurantId === 'curated-PAR-indiana-cafe-les-halles' ? 275998 : restaurantId === 'curated-PAR-indiana-cafe-ternes' ? 276269 : restaurantId === 'curated-PAR-okomusu' ? 87616 : restaurantId === 'curated-PAR-chez-fernand-christine' ? 121338 : restaurantId === 'curated-LYO-bistrot-abel' ? 77813 : restaurantId === 'curated-LYO-cafe-comptoir-abel' ? 77701 : restaurantId === 'curated-PAR-chez-fernand-guisarde' ? 429732 : restaurantId === 'curated-PAR-ibrik-kitchen' ? 17983 : restaurantId === 'curated-PAR-le-cornichon-goncourt' ? 172864 : restaurantId === 'curated-PAR-escudella' ? 4974 : restaurantId === 'curated-PAR-comptoir-petits-champs' ? 292 : restaurantId === 'curated-PAR-les-canailles-pigalle' ? 107333 : restaurantId === 'curated-PAR-brasserie-jaja-amsterdam' ? 347295 : restaurantId === 'curated-PAR-bien-eleve' ? 36016 : restaurantId === 'curated-PAR-ardent' ? 82526 : restaurantId === 'curated-PAR-office-paris' ? 12173 : restaurantId === 'curated-PAR-batistou' ? 176469 : restaurantId === 'curated-PAR-becco' ? 177844 : restaurantId === 'curated-PAR-jules-jo' ? 86920 : restaurantId === 'curated-PAR-savannah-cafe' ? 300276 : restaurantId === 'curated-PAR-biche-paris8' ? 149228 : restaurantId === 'curated-PAR-casimir' ? 160340 : restaurantId === 'curated-PAR-cafe-des-musees' ? 7248 : restaurantId === 'curated-PAR-la-plage-parisienne' ? 535548 : restaurantId === 'curated-PAR-zen-restaurant' ? 192088 : null;
  const dateInScope = date => restaurantId === 'curated-LYO-bistrot-abel' ? [1,2,3,4,5].includes(new Date(date+'T12:00:00Z').getUTCDay()) : restaurantId === 'curated-LYO-cafe-comptoir-abel' ? [1,2,3,4,5].includes(new Date(date+'T12:00:00Z').getUTCDay()) : !['curated-PAR-bouillon-julien','curated-PAR-brasserie-rosie-jolie'].includes(restaurantId) || (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && (restaurantId === 'curated-PAR-bouillon-julien' ? !['12-24','12-25','12-31'].includes(date.slice(5)) : !(date.slice(5) >= '08-03' && date.slice(5) <= '08-23')));
  const timeInScope = time => restaurantId === 'curated-LYO-bistrot-abel' ? ['12:00','12:15','12:30','12:45','13:00','13:15','13:30'].includes(time) : restaurantId === 'curated-LYO-cafe-comptoir-abel' ? ['12:00','12:15','12:30','12:45','13:00','13:15'].includes(time) : restaurantId !== 'curated-PAR-bouillon-republique' || ['11:30','12:00','12:30','13:00','13:30','14:00','14:30'].includes(time);
  const durationVenue = isZenchef && restaurantId === 'curated-PAR-la-plage-parisienne';
  const durationField = 'reservationSaturdayDurationAcknowledged';
  const durationLabel = 'Le samedi soir, j’ai bien pris connaissance que ma table est réservée pour une durée de 2h';
  const key = `velvet:provider:${encodeURIComponent(provider)}:${encodeURIComponent(restaurantId)}`;
  const aliases = { firstname:'Förnamn', firstName:'Förnamn', lastname:'Efternamn', lastName:'Efternamn', email:'E-post', emailAddress:'E-post', phone:'Telefon', phoneNumber:'Telefon', comment:'Önskemål' };
  if (isZenchef && restaurantId === 'curated-PAR-indiana-cafe-montparnasse') aliases.reservationPurpose = 'Anledning till bokningen (Motif de la réservation)';
  if (durationVenue) aliases[durationField] = durationLabel;
  if (isZenchef) { aliases.civility = 'Tilltal'; aliases.country = 'Telefonens land'; }
  let state = null, busy = false, disposed = false, uncertain = false, marker = null, storageOK = true;
  try {
    const value = storage.getItem(key);
    if (value) {
      marker = JSON.parse(value);
      if (!marker || typeof marker.id !== 'string' || !['open','hold_pending','hold_done','submit_pending','review_required'].includes(marker.phase)) throw new Error('saved_state');
      uncertain = marker.phase === 'hold_pending' || marker.phase === 'submit_pending';
    }
  } catch { storageOK = false; uncertain = true; }
  const visitReasonValues = restaurantId === 'curated-PAR-indiana-cafe-ternes' ? ['Déjeuner / Diner','Grignoter','Boire une verre'] : ['déjeuner/ dîner','grignotter','boire un verre '];
  const visitReasonLabel = restaurantId === 'curated-PAR-indiana-cafe-ternes' ? 'Je réserve pour:' : 'Je viens pour :';
  if (isZenchef && ['curated-PAR-indiana-cafe-les-halles','curated-PAR-indiana-cafe-ternes'].includes(restaurantId)) aliases.reservationVisitReason = `Anledning till besöket (${visitReasonLabel})`;
  const drafts = new Map();
  container.style.maxWidth = '560px'; container.style.marginInline = 'auto';
  container.innerHTML = `<section aria-label="Boka hos restaurangen" style="display:flex;flex-direction:column;max-height:calc(100dvh - 32px)">
    <header style="display:flex;justify-content:space-between;gap:12px"><strong data-title></strong><button type="button" data-dismiss>Stäng vyn</button></header>
    <p role="status" aria-live="polite" data-status></p>
    <div style="overflow:auto;min-height:0"><button type="button" data-start>Hitta ett bord</button>
      <div data-screen hidden><div style="max-height:55dvh;overflow:auto"><img data-image alt="Restaurangens aktuella bokningsformulär" style="display:block;width:100%"></div>
        <div data-navigation><button type="button" data-up>↑ Upp</button><button type="button" data-down>↓ Ned</button></div>
        <form data-search hidden><label>Datum <input type="date" name="date" required></label><label>Antal gäster <input type="number" name="party" min="1" max="20" value="2" required></label><button>Sök tider</button></form>
        <div data-slots></div><div data-offers hidden></div>
        <div data-fields></div><button type="button" data-save hidden>Spara kontaktuppgifter</button><button type="button" data-review hidden>Kontrollera bokningen</button>
        <div data-hold hidden><p data-hold-details></p><label><input type="checkbox" data-hold-consent> Jag godkänner denna tillfälliga reservation.</label><button type="button" data-hold-button>Reservera tillfälligt</button></div>
        <div data-final hidden><p data-final-details></p><div data-final-offer hidden></div><p data-seating-notice hidden></p><p data-meal-notice hidden></p><p data-shift-notice hidden></p><p data-address-notice hidden></p><p data-hours-notice hidden></p><p data-terms-text></p><label><input type="checkbox" data-terms> Jag har kontrollerat uppgifterna och godkänner bokningsvillkoren ovan.</label><button type="button" data-submit>Slutför bokningen</button></div>
        <details><summary>Visa leverantörens formulär som text</summary><pre data-text style="white-space:pre-wrap;font:inherit"></pre></details>
      </div>
    </div><footer style="flex:none"><button type="button" data-refresh>Kontrollera status</button><button type="button" data-end>Avsluta formuläret</button><small>Att stänga vyn avbokar inte en reservation.</small></footer>
  </section>`;
  const el = name => container.querySelector(`[data-${name}]`);
  el('title').textContent = `${restaurantName || restaurantId} · ${provider}`;
  if (restaurantId === 'curated-PAR-bofinger') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Bofinger i Paris för exakt två gäster, i mån av lediga bord. Middag, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-la-coupole') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på La Coupole i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, Dancing, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-terminus-nord') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Terminus Nord i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-procope') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller första lunchsittningen (Déjeuner 1er service) på Le Procope i Paris för exakt två gäster, i mån av lediga bord. Övriga lunchsittningar, middag, kafé, grupper och privata rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-la-lorraine') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på La Lorraine i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, evenemang, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-au-pied-de-cochon') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Au Pied de Cochon i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, evenemang, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Restaurangen har även platser för gäster utan reservation. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-grand-cafe-capucines') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Le Grand Café Capucines i Paris för exakt två gäster, i mån av lediga bord. Frukost, middag, evenemang, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Vid mer än 15 minuters försening garanterar restaurangen inte längre bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-brasserie-vagenende') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Brasserie Vagenende i Paris för exakt två gäster, i mån av lediga bord. Middag, nyårsevenemang, grupper, privata rum, leverans och hämtmat ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-bouillon-julien') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Bouillon Julien i Paris för exakt två gäster, i mån av lediga bord. Den 24, 25 och 31 december ingår inte i denna första bokningsversion, oavsett år. Middag, jul- och nyårsevenemang, grupper och privata rum ingår inte. Kommentarsfältet ändrar inte bokningstiden och hela sällskapet måste vara på plats. Ingen viss placering eller plats utan reservation garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-bouillon-racine') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller första lunchsittningen (Déjeuner 1 service) på Bouillon Racine i Paris för exakt två gäster, i mån av lediga bord. Senare lunchsittningar, middag, bar, grupper, evenemang och privata rum ingår inte. Ingen viss placering garanteras. I det franska bokningsformuläret anges att bordet inte längre garanteras efter 15 minuters försening. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-bouillon-republique') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller Bouillon République på 39 boulevard du Temple i Paris för exakt två gäster, i mån av lediga bord. Endast lunchtiderna 11.30, 12.00, 12.30, 13.00, 13.30, 14.00 och 14.30 inom restaurangens Service du Vendredi ingår. Andra tider och tjänster, middag, grupper, evenemang, privata rum, leverans och hämtmat ingår inte. Hela sällskapet ska anlända i tid. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-brasserie-rosie') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Midi Semaine på Brasserie Rosie, 53 rue du Faubourg Saint-Antoine i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper, evenemang och privata rum ingår inte. Ingen viss placering garanteras. Restaurangen håller bordet i högst 15 minuter vid försening. Om det är fullbokat kan du kontakta eller besöka restaurangen, men det garanterar inget bord. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-brasserie-rosie-lou') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Service midi semaine på Brasserie Rosie Lou, 31 boulevard de Bonne Nouvelle i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper, evenemang och privata rum ingår inte. Ingen viss placering garanteras. Restaurangen håller bordet i högst 15 minuter vid försening. Om det är fullbokat kan du kontakta eller besöka restaurangen, men det garanterar inget bord. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-brasserie-rosie-jolie') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen DÉJEUNER på Brasserie Rosie Jolie, 38 avenue Raymond Poincaré i Paris, för exakt två gäster, i mån av lediga bord. Den 3–23 augusti ingår inte i bokning via Velvet. Detta är en avgränsning i appen eftersom restaurangens sommarstängningsnotis saknar årtal, inte en bekräftad årlig stängning. Middag, grupper, evenemang, privata rum och rooftop Bigoudi ingår inte. Ingen viss placering garanteras. Restaurangen håller bordet i högst 15 minuter vid försening. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-petit-sommelier') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller restaurangens MIDI-service på Le Petit Sommelier, 49 avenue du Maine i Paris, för exakt två gäster, i mån av lediga bord. SOIR-servicen, vinbaren och vinbutiken på rue Daguerre, takeaway, grupper, evenemang och privata rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-chez-savy') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Midi på Chez Savy, 23 rue Bayard i Paris, för exakt två gäster, i mån av lediga bord. Kvällsserveringen Soir, grupper, evenemang och den privata salongen ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-chez-rene') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Midi på Chez René, 14 boulevard Saint-Germain i Paris, för exakt två gäster, i mån av lediga bord. Kvällsserveringen Soir, grupper, evenemang och den privata salongen ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-bistrot-de-paris') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Midi på Le Bistrot de Paris, 33 rue de Lille i Paris, för exakt två gäster, i mån av lediga bord. Kvällsserveringen Soir, grupper, evenemang och den privata salongen ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-aux-bons-crus') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Semaine Midi på Aux Bons Crus, 54 rue Godefroy Cavaignac i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-aux-crus-de-bourgogne') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner service 1 på Aux Crus de Bourgogne, 3 rue Bachaumont i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-petit-retro') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Le Petit Rétro, 5 rue Mesnil i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-au-moulin-a-vent') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Au Moulin à Vent, 20 rue des Fossés Saint-Bernard i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Sittningstiden är 1 timme och 30 minuter. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-petit-pontoise') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Le Petit Pontoise, 9 rue de Pontoise i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-florentin') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Le Florentin, 10 Rue Saint-Florentin i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-martha-pizze-amore') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller första lunchserveringen MIDI 1er service på Martha – Pizze Amore, 48 rue Richard Lenoir i Paris, för exakt två gäster, i mån av lediga bord. Andra lunchserveringen, middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-cafe-marly') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Le Café Marly, 93 rue de Rivoli i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-cafe-ruc') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Le Café Ruc, 159 rue Saint-Honoré i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-bonne-nouvelle') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Bonne Nouvelle, 42 bis Boulevard Bonne Nouvelle i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Terrassplatser kan inte reserveras. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-richelieu-drouot') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Richelieu-Drouot, 18-20 Boulevard Montmartre i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Terrassplatser kan inte reserveras. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-beaugrenelle') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Beaugrenelle, 12 rue Linois i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Terrassplatser kan inte reserveras. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-tolbiac') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Tolbiac, 74 Avenue France i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Terrassplatser kan inte reserveras. Ingen viss placering garanteras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-montparnasse') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Montparnasse, 72 Boulevard du Montparnasse i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Ange anledning till bokningen och kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-republique') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller serveringen Service continu på Indiana Café République, 1 Place de la République i Paris, för exakt två gäster, i mån av lediga bord. Kvällsserveringen Service du soir, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Terrassplatser kan inte reserveras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-bercy-village') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Bercy Village, Chais 59-61, Cour Saint-Emilion i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Terrassplatser kan inte reserveras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-chez-fernand-christine') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunch måndag–fredag på Chez Fernand Christine, 9 Rue Christine i Paris, för exakt två gäster med det uttryckliga valet À la carte för båda. Tiderna är 12:00, 12:30, 13:00, 13:30 och 14:00 i mån av lediga bord. Restaurangens sittningstid är 1 timme och 30 minuter. Matpriset anges inte i bokningsformuläret. Lunchformeln, blandade menyval, middag, större sällskap och val av rum eller terrass ingår inte. Velvet skickar inga särskilda önskemål eller presentkortsuppgifter.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-LYO-bistrot-abel') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent="Bokning i Velvet gäller ordinarie lunch måndag–fredag på Le Bistrot d'Abel, 49 Rue de la Bourse i Lyon, för exakt två gäster, utan presentkort. Tiderna är 12:00, 12:15, 12:30, 12:45, 13:00, 13:15 och 13:30 i mån av lediga bord. Bokningen måste göras före 11:45 samma dag, lokal tid i Lyon. Mer än 15 minuters försening räknas som avbokning. Terrassplatser kan inte reserveras. Middag, större sällskap, specialerbjudanden och val av rum ingår inte. Den allmänna texten om 21:30 anger ingen sluttid för denna lunch. Ingen viss placering, meny eller sluttid garanteras. Velvet skickar inga särskilda önskemål eller presentkortsuppgifter.";
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-LYO-cafe-comptoir-abel') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch måndag–fredag på Café Comptoir Abel, 25 Rue Guynemer i Lyon, för exakt två gäster, utan presentkort. De tider som stöds är 12:00, 12:15, 12:30, 12:45, 13:00 och 13:15 i mån av lediga bord. Restaurangen kan släppa bordet efter 15 minuters försening utan besked. Middag, större sällskap, specialerbjudanden och val av rum eller terrass ingår inte. Ingen viss placering, meny eller sluttid garanteras. Velvet skickar inga särskilda önskemål eller presentkortsuppgifter.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-chez-fernand-guisarde') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Chez Fernand Guisarde, 13 Rue Guisarde i Paris, för exakt två gäster, i mån av lediga bord. De tider som stöds är kvartstider från 12:00 till 14:15. Middag, större sällskap, specialerbjudanden och val av särskilt rum eller terrass ingår inte. Ingen viss placering, meny eller sluttid garanteras. Velvet skickar inga särskilda önskemål, presentkortsuppgifter eller kontaktförfrågningar.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-ibrik-kitchen') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på IBRIK Kitchen, 9 rue de Mulhouse i Paris, för exakt två gäster, i mån av lediga bord. De tider som stöds är 12:15, 12:45 och 13:30. Middag, större sällskap, specialerbjudanden och val av särskilt rum eller terrass ingår inte. Ingen viss placering, meny eller sluttid garanteras. Restaurangens välkomsttext och information om önskemål återges före godkännandet. Velvet skickar inga särskilda önskemål, presentkortsuppgifter eller kontaktförfrågningar.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-le-cornichon-goncourt') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Le Cornichon, 2 rue des Goncourt i Paris, för exakt två gäster, i mån av lediga bord. Den tid som stöds är 12:00 med sluttid 13:00 enligt restaurangens bokningsformulär. Bokning måste göras senast 11:45. Middag, större sällskap, specialerbjudanden och val av särskilt rum ingår inte. Ingen viss placering eller meny garanteras. Kontrollera den valda tidens sittningsvillkor före godkännandet. Restaurangens gruppinformation återges före godkännandet. Velvet gör inga gruppbokningar eller kontaktförfrågningar.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-escudella') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch utan presentkort på L’Escudella, 41 Avenue de Ségur i Paris, för exakt två gäster, i mån av lediga bord. De tider som stöds är 12:00, 12:30, 13:00, 13:30 och 14:00. Presentkortsnummer eller andra presentkortsuppgifter skickas inte. Middag, större sällskap, specialerbjudanden och val av särskilt rum ingår inte. Ingen viss placering, meny eller sittningstid garanteras. Restaurangens gruppinformation återges oförändrad före godkännandet; telefonnumret där skiljer sig från restaurangens nuvarande kontaktuppgift. Velvet gör inga gruppbokningar eller kontaktförfrågningar.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-comptoir-petits-champs') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Le Comptoir des Petits Champs, 17 Rue des Petits-Champs i Paris, för exakt två gäster, i mån av lediga bord. Bokningssystemet erbjuder tider 12:00–14:30. Middag, större sällskap, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Äldre jul- och nyårserbjudanden ingår inte i lunchbokningen. Ingen viss placering, meny eller sittningstid garanteras. Hänvisningarna till Chimère och Café Véry gäller andra restauranger; Velvet gör ingen alternativbokning eller vidarebefordran. Hela restaurangens meddelande, inklusive uppmaningen att avboka vid förhinder, visas före godkännandet.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-les-canailles-pigalle') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Les Canailles Pigalle, 25 Rue La Bruyère i Paris, för exakt två gäster, i mån av lediga bord. De tider som stöds är 12:00, 12:30, 13:00 och 13:30. Middag, större sällskap, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering, meny eller sittningstid garanteras. Ett äldre Alla hjärtans dag-erbjudande i bokningssystemet ingår inte i denna lunchbokning. Restaurangens meddelande om telefonkontakt vid särskilda önskemål visas före godkännandet; Velvet förmedlar inga sådana önskemål eller kontaktförfrågningar.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-brasserie-jaja-amsterdam') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Brasserie Jaja, 47 Rue d’Amsterdam i Paris, för exakt två gäster, i mån av lediga bord. De tider som stöds är 11:45, 12:00 och 12:15. Senare tider, eftermiddagsservering, middag, större sällskap, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering, meny eller sittningstid garanteras. Restaurangens information om kontakt för grupper över 14 personer återges före godkännandet; Velvet gör ingen gruppbokning eller kontaktförfrågan.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-bien-eleve') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Bien élevé, 47 Rue Richer i Paris, för exakt två gäster, i mån av lediga bord. Bokningssystemet erbjuder tider 12:00–13:45. Middag, större sällskap, specialerbjudanden, presentkort och val av särskilt rum eller terrass ingår inte. Ingen viss placering, meny eller sittningstid garanteras. Restaurangens text om automatiskt bekräftelsemejl är information om dess rutiner, inte ett mottaget bokningskvitto. Hänvisningen till Ardent gäller en annan restaurang och innebär ingen automatisk ombokning. Hela meddelandet visas före godkännandet.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-ardent') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på Ardent, 40 Rue Richer i Paris, för exakt två gäster, i mån av lediga bord. Bokningssystemet erbjuder tider 12:00–14:30. Middag, större sällskap, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering, meny eller sittningstid garanteras. Restaurangens hänvisning till Bien élevé och Office gäller andra restauranger och innebär ingen automatisk ombokning. Hela restaurangens meddelande visas före godkännandet.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-office-paris') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller ordinarie lunch på L’office, 3 Rue Richer i Paris, för exakt två gäster, i mån av lediga bord. Bokningssystemet erbjuder tider 12:00–14:30. Middag, större sällskap, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Lunchformeln på 25 euro gäller enligt restaurangen inte på helgdagar; ingen meny väljs här. Att terrassen är öppen garanterar inte en terrassplats. Hänvisningen till Ardent gäller en annan restaurang. Restaurangens fullständiga texter visas före godkännandet.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-batistou') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller Service Continu på Batistou, 65 Boulevard de Ménilmontant i Paris, för exakt två gäster, i mån av lediga bord. Bokningssystemet erbjuder tider 11:30–22:30 inom samma servering. Grupper, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering eller sittningstid garanteras. Restaurangens meddelande saknar gruppantal och telefonnummer; texten återges oförändrad före godkännandet.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-becco') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Dejeuner på Becco, 3 Rue de Maubeuge i Paris, för exakt två gäster, i mån av lediga bord. Restaurangens tvåtimmarsregel gäller fredags- och lördagskvällar; här anges ingen tvåtimmarsgräns för lunch. Eftermiddagsservering, middag, grupper, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering eller sittningstid garanteras. Restaurangens fullständiga villkor visas före godkännandet.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-jules-jo') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Jules Jo, 28 Rue Hermel i Paris, för exakt två gäster, i mån av lediga bord. Terrassbokning är inte möjlig enligt restaurangens villkor. Eftermiddagsservering, middag, grupper, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering eller sittningstid garanteras. Restaurangens fullständiga villkor visas före godkännandet.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-savannah-cafe') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Service déjeuner på Savannah Café, 27 Rue Descartes i Paris, för exakt två gäster, i mån av lediga bord. Restaurangens webbplats anger lunch 12:00–14:00, medan bokningssystemet erbjuder tider från 11:30 till 14:00. Dessa uppgifter skiljer sig; kontrollera vald tid före bokning. Middag, grupper, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering eller sittningstid garanteras.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-biche-paris8') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Midi Semaine på Biche, 129 Rue du Faubourg Saint-Honoré i Paris 8, för exakt två gäster, i mån av lediga bord. Middag, grupper, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering garanteras. Restaurangens engelska och franska villkor visas före godkännandet och skiljer sig åt om förseningar och gruppkontakt. Första sittningen anges som två timmar; inga luckor mellan erbjudna tider fylls i.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-casimir') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Casimir, 6 Rue de Belzunce i Paris, för exakt två gäster, i mån av lediga bord. Middag, grupper, specialerbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering garanteras. Restaurangens serveringstext nämner kvällstider och visas separat före godkännandet; den innebär inte att Velvet anger två timmars sittning för lunch. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-cafe-des-musees') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller serveringen Déjeuner semaine på Café des Musées, 49 rue de Turenne i Paris, för exakt två gäster, i mån av lediga bord. Detta flöde gäller vanliga bokningar utan rabattkod eller presentkort. Middag, privata arrangemang, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Serveringens namn innebär ingen garanti om vilka veckodagar den erbjuds. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-la-plage-parisienne') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på La Plage Parisienne för exakt två gäster, i mån av lediga bord. Middag, grupper, erbjudanden, presentkort och val av särskilt rum ingår inte. Ingen viss placering garanteras. Restaurangens separata obligatoriska ruta om lördagskvällar visas även för andra valda dagar och måste godkännas uttryckligen. Ingen generell lunchöppning eller tvåtimmarsgräns för andra dagar utlovas. Officiell adress: Port de Javel Haut – Statue de la Liberté, 75015 Paris. Bokningssystemets adress: 8 10 quai javel haut, 75015 Paris. Kontrollera båda språkversionerna av villkoren före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-zen-restaurant') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller den vanliga middagsserveringen Dîner på ZEN, 8 rue de L’Echelle i Paris, för exakt två gäster, i mån av lediga bord. Lunch och privat Omakase ingår inte. Grupper och val av särskilt rum ingår inte. Ingen viss placering eller våning garanteras. Restaurangens fullständiga villkor visas före godkännandet. Kontrollera dem före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-okomusu') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller serveringen Déjeuner week end på OKOMUSU, 11 rue Charlot i Paris, för exakt två gäster, i mån av lediga bord. Detta flöde gäller vanliga bokningar. Wonderbox och andra presentkort stöds inte. Middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Enligt restaurangens villkor avbokas bordet automatiskt vid mer än 15 minuters försening om restaurangen inte har meddelats. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-ternes') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Ternes, 237 rue du Faubourg St-Honoré i Paris, för exakt två gäster, i mån av lediga bord. Välj vad besöket gäller i det obligatoriska fältet Je réserve pour:. Frukost, Service continu, middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Terrassplatser kan inte reserveras. Restaurangen garanterar bordet till 15 minuter efter bokad tid. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-les-halles') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Les Halles, 35, Rue du Pont-Neuf i Paris, för exakt två gäster, i mån av lediga bord. Välj vad besöket gäller i det obligatoriska fältet Je viens pour :. Frukost, Service continu, middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Terrassplatser kan inte reserveras. Vid mer än 15 minuters försening kan restaurangen inte längre garantera bordet. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  if (restaurantId === 'curated-PAR-indiana-cafe-denfert-rochereau') {
    const scope=document.createElement('p'); scope.className='booking-scope';
    scope.textContent='Bokning i Velvet gäller lunchserveringen Déjeuner på Indiana Café Denfert-Rochereau för exakt två gäster, i mån av lediga bord. Bokningen måste inkludera en måltid. Bokningssystemets adress: 1 Bis Avenue du Général Leclerc, 75014 Paris. Restaurangens officiella sida anger: 1 Avenue du Général Leclerc, 75014 Paris. Adressuppgifterna skiljer sig; samma entré är inte verifierad. Frukost, Service continu, middag, grupper och val av särskilt rum ingår inte. Ingen viss placering garanteras. Terrassplatser kan inte reserveras. Kontrollera restaurangens aktuella villkor före bokning.';
    container.querySelector('header').after(scope);
  }
  const write = (id, phase, idempotencyKey, reviewFingerprint) => {
    const value = { id, phase, ...(idempotencyKey ? { idempotencyKey } : {}), ...(reviewFingerprint ? { reviewFingerprint } : {}) };
    storage.setItem(key, JSON.stringify(value)); marker = value;
  };
  const isSubmit = () => marker?.phase === 'submit_pending';
  const needsReview = () => marker?.phase === 'review_required';
  const held = snapshot => snapshot?.result?.status === 'held' && snapshot.result.phase === 'hold'
    && ['guest','booking_review'].includes(snapshot.phase);
  const terminal = () => !!state?.result && !held(state);
  const changed = () => { el('terms').checked = false; el('hold-consent').checked = false; controls(); };
  const expiry = value => typeof value === 'number' ? value : Date.parse(value);
  const expired = review => !Number.isFinite(expiry(review?.expiresAt)) || expiry(review.expiresAt) <= Date.now();
  const details = review => review && review.restaurantId === restaurantId
    && /^\d{4}-\d{2}-\d{2}$/.test(review.date) && /^\d{2}:\d{2}/.test(review.time)
    && Number.isInteger(review.party) && review.party > 0
    && (restaurantId !== 'curated-LYO-bistrot-abel' || (review.shiftId === 77813 && review.party === 2 && dateInScope(review.date) && timeInScope(review.time)))
    && (restaurantId !== 'curated-LYO-cafe-comptoir-abel' || (review.shiftId === 77701 && review.party === 2 && dateInScope(review.date) && timeInScope(review.time)))
    && (restaurantId !== 'curated-PAR-chez-fernand-christine' || (review.shiftId === 121338 && review.party === 2))
    && (!durationVenue || (review.reservationSaturdayDurationAcknowledged === true && review.shiftId === 535548 && review.party === 2));
  const fingerprint = value => typeof value === 'string' && value.length > 0;
  const christineVenue = restaurantId === 'curated-PAR-chez-fernand-christine';
  const validOffer = offer => (christineVenue || restaurantId === 'curated-AMS-de-kas')
    && offer?.offerId === (christineVenue ? 60971 : 118785) && offer.count === 2
    && offer.name === (christineVenue ? 'À la carte' : 'Lunch')
    && typeof offer.description === 'string' && (christineVenue ? offer.description === '' : !!offer.description.trim())
    && offer.currency === 'EUR' && offer.mealPrice === null && offer.priceStatus === 'not_provided_by_booking_form'
    && offer.menuSource === (christineVenue ? 'https://www.restaurantchezfernand.fr/' : 'https://restaurantdekas.com/eng/menu')
    && offer.depositApplies === false && offer.depositMinGuests === (christineVenue ? 4 : 7)
    && offer.selectionSource === 'native_offer' && offer.submissionSupported === true
    && /^[a-f0-9]{64}$/.test(offer.version || '');
  function renderOffer(target, offer) {
    target.replaceChildren(); target.hidden = !validOffer(offer);
    if (target.hidden) return;
    for (const text of [`Meny: ${offer.name} · ${offer.count} gäster`, offer.description,
      'Pris anges inte i bokningsformuläret.', 'Ingen deposition krävs för detta sällskap om två gäster.'].filter(Boolean)) {
      const paragraph = document.createElement('p'); paragraph.textContent = text; target.append(paragraph);
    }
    const link = document.createElement('a'); link.href = offer.menuSource; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = christineVenue ? 'Se restaurangens webbplats' : 'Se restaurangens meny'; target.append(link);
  }
  const finalReview = () => state?.bookingReview;
  const finalFingerprint = () => finalReview()?.reviewFingerprint;
  const canHold = () => state?.phase === 'hold_review' && state.canHold === true && details(state.holdReview)
    && fingerprint(state.holdReview.fingerprint) && !expired(state.holdReview) && marker?.phase === 'open';
  const hasReview = () => state?.phase === 'booking_review' && details(finalReview()?.details)
    && ((!christineVenue && finalReview()?.details.offer === undefined) || validOffer(finalReview().details.offer))
    && fingerprint(finalFingerprint()) && (!state.reviewFingerprint || state.reviewFingerprint === finalFingerprint())
    && (!isZenchef || (fingerprint(state.reviewToken) && fingerprint(state.terms?.version)))
    && (finalReview().expiresAt === undefined || !expired(finalReview())) && typeof finalReview().details.termsText === 'string' && !!finalReview().details.termsText.trim();
  const canSubmit = () => dateInScope(state?.details?.date) && timeInScope(state?.details?.time) && !needsReview() && state?.canSubmit === true && hasReview();
  function controls() {
    const locked = busy || uncertain || isSubmit() || needsReview() || !storageOK || terminal() || !!state?.blocked;
    container.querySelectorAll('button,input,textarea,select').forEach(node => { node.disabled = locked; });
    el('dismiss').disabled = false;
    el('refresh').disabled = busy || !storageOK;
    el('end').disabled = busy || uncertain || isSubmit() || !marker?.id;
    for (const button of container.querySelectorAll('[data-requires-room]')) button.disabled = locked || !button.parentElement.querySelector('select')?.value;
    el('save').disabled = locked || !drafts.size || (!!el('fields').querySelector('[data-field=reservationVisitReason]') && !visitReasonValues.includes(el('fields').querySelector('[data-field=reservationVisitReason]').value));
    el('review').hidden = state?.phase !== 'guest' && !needsReview();
    el('review').textContent = needsReview() ? 'Granska uppgifterna igen' : 'Kontrollera bokningen';
    el('review').disabled = (needsReview() ? busy || uncertain || !storageOK || !state || terminal() || !!state.blocked : locked) || drafts.size > 0 || (durationVenue && state?.details?.reservationSaturdayDurationAcknowledged !== true);
    el('hold-button').disabled = locked || !canHold() || !el('hold-consent').checked || drafts.size > 0;
    el('submit').disabled = locked || !canSubmit() || !el('terms').checked || drafts.size > 0;
    el('image').style.cursor = locked || state?.phase !== 'selection' ? 'default' : 'pointer';
  }
  function outcome(result, snapshot) {
    const proof = result?.verification;
    if (result?.status === 'confirmed') {
      if (proof?.verified === true && proof.source === 'provider' && proof.restaurantId === restaurantId
        && (!lunchShift || (proof.bookingEvidence === 'own_booking_readback' && proof.shiftId === lunchShift && dateInScope(snapshot.details?.date) && timeInScope(snapshot.details?.time) && snapshot.details?.shiftId === lunchShift && snapshot.details?.party === 2))
        && proof.sessionId === snapshot.id && typeof proof.attemptId === 'string' && proof.attemptId
        // The durable journal key is server-owned; the UI UUID is only correlation.
        && (!isZenchef || (fingerprint(proof.idempotencyKey)
          && fingerprint(isSubmit() ? marker.reviewFingerprint : snapshot.reviewFingerprint)
          && proof.detailsDigest === (isSubmit() ? marker.reviewFingerprint : snapshot.reviewFingerprint)))
        && (snapshot.details?.roomId === undefined || (proof.roomId === snapshot.details.roomId && proof.roomName === snapshot.details.roomName))
        && ((!christineVenue && snapshot.details?.offer === undefined) || (validOffer(snapshot.details?.offer) && proof.offerEvidence === 'own_booking_readback'
          && proof.offerId === snapshot.details.offer.offerId && proof.offerCount === snapshot.details.offer.count && proof.offerVersion === snapshot.details.offer.version))
        && typeof result.reference === 'string' && result.reference.trim()) return `Bokningen är bekräftad. Referens: ${result.reference}`;
      return 'Bokningen är inte verifierad. Skicka inte en ny bokning. Kontrollera resultatet med restaurangen.';
    }
    return ({pending:'Bokningen behandlas. Skicka inte en ny bokning.', unknown:'Resultatet är okänt. Skicka inte en ny bokning. Kontrollera resultatet med restaurangen.', payment_required:'Bokningen kräver betalning eller kortbekräftelse och är inte färdig.', rejected:'Bokningen accepterades inte av leverantören.', error:'Bokningen kunde inte verifieras. Kontrollera resultatet innan du försöker igen.'})[result?.status] || 'Resultatet är okänt. Skicka inte en ny bokning.';
  }
  async function accept(next) {
    if (!next || next.restaurantId !== restaurantId || next.provider?.toLowerCase() !== provider.toLowerCase()
      || typeof next.id !== 'string' || !next.id || (marker && next.id !== marker.id)
      || !Number.isInteger(next.revision) || next.revision < 0 || (state && next.revision < state.revision)
      || next.mode === 'fixture' || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(next.image || '')
      || !Number.isFinite(next.width) || !Number.isFinite(next.height) || next.width <= 0 || next.height <= 0) throw new Error('snapshot');
    const bytes = Uint8Array.from(atob(next.image.split(',')[1]), c => c.charCodeAt(0));
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2,'0')).join('');
    if (hash !== next.imageHash) throw new Error('image_mismatch');
    const image = new Image(); image.src = next.image; await image.decode();
    if (image.naturalWidth !== next.width || image.naturalHeight !== next.height) throw new Error('image_size');
    if (disposed) return;
    if (isZenchef) {
      // Project the actual Zenchef transport, without changing its wire fields.
      const phase = next.result ? 'result' : ({availability_observed:'slots',offers:'offers',contact:'guest',review:'booking_review'})[next.state] || 'selection';
      next = {...next,phase,bookingReview:next.state === 'review' ? {
        details:{...next.details,restaurantId:next.restaurantId,guest:Object.fromEntries(Object.entries(next.details || {}).filter(([name]) => Object.hasOwn(aliases,name))),termsText:[next.terms?.text,next.terms?.restaurantNotice?.replace(/<\/?br\s*\/?\s*>/gi,'\n').replace(/<\/?p\s*>/gi,'\n').replace(/<\/?(?:b|u|strong|em)\s*>/gi,'').replace(/<\/?span\b[^>]*>/gi,'').replace(/<a\b[^>]*>|<\/a\s*>/gi,'')].filter(Boolean).join('\n\n'),seatingNotice:next.terms?.seatingNotice,mealNotice:next.terms?.mealNotice,shiftNotice:next.terms?.shiftNotice},
        reviewFingerprint:next.reviewFingerprint,
      } : null};
    }
    if (!marker) write(next.id, 'open');
    if (marker.phase === 'hold_pending' && ['guest','booking_review'].includes(next.phase) && next.canHold !== true) write(next.id, 'hold_done');
    uncertain = marker.phase === 'hold_pending' || marker.phase === 'submit_pending';
    state = next;
    el('image').src = next.image; el('image').dataset.sourceHash = hash; el('image').dataset.revision = String(next.revision);
    el('screen').hidden = false; el('start').hidden = true;
    el('text').textContent = typeof next.text === 'string' ? next.text : '';
    el('fields').replaceChildren();
    const seen = new Set();
    for (const field of next.phase === 'guest' ? next.fields || [] : []) {
      if (field.name === durationField && !durationVenue) throw new Error('duration_acknowledgement_schema');
      if (!Object.hasOwn(aliases, field.name) || seen.has(field.name)) continue;
      seen.add(field.name);
      const duration = durationVenue && field.name === durationField;
      if (duration && (field.type !== 'checkbox' || field.required !== true || field.label !== durationLabel || typeof field.value !== 'boolean')) throw new Error('duration_acknowledgement_schema');
      const visitReason = field.name === 'reservationVisitReason';
      if (visitReason && (field.type !== 'select' || field.required !== true || field.label !== visitReasonLabel || JSON.stringify(field.options) !== JSON.stringify(visitReasonValues) || !['',...visitReasonValues].includes(field.value))) throw new Error('visit_reason_schema');
      const label = document.createElement('label'); label.textContent = aliases[field.name];
      const input = document.createElement(field.name === 'civility' || visitReason ? 'select' : field.name === 'comment' ? 'textarea' : 'input');
      input.dataset.field = field.name;
      if (field.name === 'reservationPurpose' || visitReason || duration) input.required = true; input.setAttribute('aria-label', aliases[field.name]);
      if (duration) { input.type = 'checkbox'; input.checked = drafts.has(field.name) ? drafts.get(field.name) === true : field.value; }
      else if (visitReason) {
        for (const [value,text] of [['','Välj anledning till besöket'],...visitReasonValues.map(value => [value,value])]) { const option=document.createElement('option'); option.value=value; option.textContent=text; input.append(option); }
      } else if (field.name === 'civility') {
        for (const [value,text] of [['','Välj tilltal'],['mr','Mr'],['mrs','Mrs'],['mx','Mx']]) { const option = document.createElement('option'); option.value = value; option.textContent = text; input.append(option); }
      } else if (field.name !== 'comment') input.type = /^email/.test(field.name) ? 'email' : /phone/i.test(field.name) ? 'tel' : 'text';
      input.value = drafts.get(field.name) ?? (typeof field.value === 'string' ? field.value : '');
      input.readOnly = field.readOnly === true;
      if (input.readOnly) input.title = 'Hämtas från telefonnumret i restaurangens formulär.';
      input.maxLength = field.name === 'comment' ? 2000 : 200;
      input.oninput = () => { if (!input.readOnly) { drafts.set(field.name,duration ? input.checked : input.value); changed(); } };
      label.append(input); el('fields').append(label);
      if (duration) { const note = document.createElement('p'); note.textContent = 'Restaurangens obligatoriska ruta gäller enligt texten lördagskvällar men finns även i formuläret för den valda bokningen. Markera själv om du godkänner. Detta anger inte två timmars sittning för andra dagar.'; el('fields').append(note); }
    }
    el('save').hidden = !seen.size; el('review').hidden = next.phase !== 'guest';
    el('search').hidden = !['selection','slots'].includes(next.phase);
    el('navigation').hidden = isZenchef;
    el('slots').replaceChildren();
    if (isZenchef && next.phase === 'slots') {
      for (const slot of next.availabilityEvidence?.candidates || []) {
        if (!timeInScope(slot.time)) continue;
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time) || !(typeof slot.shiftId === 'string' || Number.isInteger(slot.shiftId))) continue;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = `${slot.time} · Välj tid`;
        button.dataset.slot = slot.time;
        const row = document.createElement('div');
        let roomSelect = null;
        if (Array.isArray(slot.rooms)) {
          const label = document.createElement('label'); label.textContent = 'Välj rum för ' + slot.time;
          roomSelect = document.createElement('select'); roomSelect.dataset.room = slot.time; roomSelect.setAttribute('aria-label',label.textContent);
          const empty = document.createElement('option'); empty.value=''; empty.textContent='Välj rum'; roomSelect.append(empty);
          for (const room of slot.rooms) {
            if (!Number.isSafeInteger(room.id) || room.id <= 0 || typeof room.name !== 'string' || !room.name.trim()) continue;
            const option=document.createElement('option'); option.value=String(room.id); option.textContent=room.name; roomSelect.append(option);
          }
          button.dataset.requiresRoom='true'; roomSelect.onchange=changed; label.append(roomSelect); row.append(label);
        }
        button.onclick = () => {
          if (roomSelect && !roomSelect.value) return;
          run({type:'select',time:slot.time,shiftId:slot.shiftId,...(roomSelect ? {roomId:Number(roomSelect.value)} : {})});
        };
        row.append(button); el('slots').append(row);
      }
    }
    el('offers').replaceChildren(); el('offers').hidden = next.phase !== 'offers';
    if (next.phase === 'offers') for (const offer of next.offerChoices || []) {
      if (!validOffer(offer)) continue;
      const row = document.createElement('div'); renderOffer(row,offer);
      const button = document.createElement('button'); button.type = 'button'; button.dataset.offer = String(offer.offerId);
      button.textContent = `Välj ${offer.name} för ${offer.count} gäster`;
      button.onclick = () => run({type:'select_offer',offerId:offer.offerId,count:offer.count,offerVersion:offer.version});
      row.append(button); el('offers').append(row);
    }
    el('hold').hidden = !canHold(); el('final').hidden = !hasReview();
    if (canHold()) el('hold-details').textContent = `Tillfällig reservation: ${restaurantName}, ${next.holdReview.date} kl. ${next.holdReview.time}, ${next.holdReview.party} gäster. Giltig till ${new Date(expiry(next.holdReview.expiresAt)).toLocaleString('sv-SE')}. Detta är inte en slutlig bokning.`;
    if (hasReview()) {
      const review = finalReview().details;
      renderOffer(el('final-offer'),review.offer);
      const guest = Object.entries(review.guest || {}).filter(([name,value]) => Object.hasOwn(aliases,name) && typeof value === 'string').map(([name,value]) => `${aliases[name]}: ${value}`).join(', ');
      if (isZenchef && ['curated-PAR-indiana-cafe-montparnasse','curated-PAR-indiana-cafe-les-halles','curated-PAR-indiana-cafe-ternes'].includes(restaurantId)) el('final-details').style.whiteSpace = 'pre-wrap';
      if (durationVenue) el('final-details').style.whiteSpace = 'pre-wrap';
      el('final-details').textContent = `Slutför bokning: ${restaurantName}, ${review.date} kl. ${review.time}, ${review.party} gäster. ${review.roomName ? `Rum: ${review.roomName}. ` : ''}${guest}${durationVenue ? `\nSeparat godkännande: ${durationLabel} — Ja` : ''}`;
      el('seating-notice').textContent = review.seatingNotice ? `Sittning: ${review.seatingNotice}` : '';
      el('seating-notice').hidden = !review.seatingNotice;
      el('meal-notice').textContent = review.mealNotice ? `Bokningen måste inkludera en måltid. Restaurangens villkor: ${review.mealNotice}` : '';
      el('meal-notice').hidden = !review.mealNotice;
      el('shift-notice').textContent = review.shiftNotice ? `${restaurantId === 'curated-PAR-casimir' ? 'Restaurangens text nämner kvällstider; ingen tvåtimmarsgräns för lunch påstås här. ' : ''}Restaurangens serveringsvillkor: ${review.shiftNotice}` : '';
      el('shift-notice').hidden = !review.shiftNotice;
      const denfertAddress = isZenchef && restaurantId === 'curated-PAR-indiana-cafe-denfert-rochereau';
      el('address-notice').textContent = denfertAddress ? 'Bokningssystemets adress: 1 Bis Avenue du Général Leclerc, 75014 Paris. Restaurangens officiella sida anger: 1 Avenue du Général Leclerc, 75014 Paris. Adressuppgifterna skiljer sig; samma entré är inte verifierad.' : '';
      if (durationVenue) el('address-notice').textContent = 'Officiell adress: Port de Javel Haut – Statue de la Liberté, 75015 Paris. Bokningssystemets adress: 8 10 quai javel haut, 75015 Paris. Adressuppgifterna återges separat.';
      el('address-notice').hidden = !denfertAddress && !durationVenue;
      el('hours-notice').textContent = restaurantId === 'curated-PAR-savannah-cafe' ? 'Savannah Café: restaurangens webbplats anger lunch 12:00–14:00, medan bokningssystemet erbjuder 11:30–14:00. Uppgifterna skiljer sig; kontrollera den valda tiden före godkännandet.' : '';
      el('hours-notice').hidden = restaurantId !== 'curated-PAR-savannah-cafe';
      if (restaurantId === 'curated-PAR-becco') {
        el('hours-notice').textContent = 'Becco: restaurangens tvåtimmarsregel gäller fredags- och lördagskvällar. Ingen tvåtimmarsgräns för lunch anges här.';
        el('hours-notice').hidden = false;
      }
      el('terms-text').textContent = review.termsText;
    }
    el('status').textContent = terminal() ? outcome(next.result,next) : uncertain ? 'Resultatet måste kontrolleras. Skicka inte på nytt.' : needsReview() ? 'Servern har bekräftat att bokningen inte skickades. Granska uppgifterna igen innan du godkänner.' : hasReview() && !canSubmit() ? 'Uppgifterna visas för kontroll. Leverantörens slutliga bokningssteg är ännu inte tillgängligt.' : next.phase === 'guest' ? `${held(next) ? 'Tillfälligt reserverat. ' : ''}Fyll i och spara dina kontaktuppgifter. Bokningen är inte slutförd.` : next.blocked ? 'Leverantörens formulär är spärrat.' : 'Välj och kontrollera uppgifterna i leverantörens formulär.';
    el('status').dataset.bookingStatus = next.result?.status === 'confirmed' && !el('status').textContent.startsWith('Bokningen är bekräftad.') ? 'unknown' : next.result?.status || '';
    changed();
  }
  async function request(path, options) {
    let timer;
    try { return await Promise.race([Promise.resolve().then(() => api(path,options)), new Promise((_,reject) => { timer = setTimeout(() => reject(new Error('timeout')),requestTimeoutMs); })]); }
    finally { clearTimeout(timer); }
  }
  const post = (path, body) => request(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  async function run(action = null) {
    if (disposed || busy || (action && (uncertain || isSubmit() || needsReview() && action.type !== 'review' || drafts.size && action.type !== 'fill' || !state || terminal() || state.blocked))) return;
    if (action?.type === 'search' && !dateInScope(action.date)) { el('status').textContent=restaurantId === 'curated-PAR-brasserie-rosie-jolie' ? 'Den 3–23 augusti ingår inte i bokning via Velvet.' : 'Den 24, 25 och 31 december ingår inte i bokning via Velvet.'; return; }
    if (action?.type === 'select' && !timeInScope(action.time)) { el('status').textContent='Endast de angivna lunchtiderna ingår i bokning via Velvet.'; return; }
    if (action?.type === 'hold' && (!canHold() || !el('hold-consent').checked)) return;
    if (action?.type === 'submit' && (!canSubmit() || !el('terms').checked)) return;
    busy = true; controls(); el('status').textContent = 'Kontrollerar…';
    try {
      if (!storageOK) throw new Error('storage');
      if (action?.type === 'hold' || action?.type === 'submit') { write(state.id,`${action.type}_pending`,action.idempotencyKey,action.type === 'submit' ? finalFingerprint() : undefined); uncertain = true; }
      const next = action ? await post(`${endpoint}/${encodeURIComponent(state.id)}/action`,{...action,revision:state.revision})
        : marker ? await post(`${endpoint}/${encodeURIComponent(marker.id)}/current`,{})
        : await post(endpoint,{provider,restaurantId,width:Math.max(320,Math.min(560,Math.round(container.clientWidth))),resume:true});
      if (disposed) return;
      if (next?.error) throw Object.assign(new Error(String(next.error)),next);
      if (action?.type === 'fill' && Object.keys(action.fields).some(name => !next.fields?.some(field => field.name === name && (durationVenue && name === durationField ? typeof field.value === 'boolean' && field.value === action.fields[name] : typeof field.value === 'string')))) throw new Error('field_readback');
      await accept(next);
      if (action?.type === 'review' && needsReview() && hasReview() && !terminal() && !state.blocked) {
        write(state.id,isZenchef ? 'open' : 'hold_done');
        uncertain = false; changed();
        el('status').textContent = 'Kontrollera den nya granskningen och godkänn villkoren innan du slutför bokningen.';
      }
      if (action?.type === 'fill') {
        drafts.clear();
        for (const input of el('fields').querySelectorAll('[data-field]')) { const value = next.fields.find(field => field.name === input.dataset.field).value; if (durationVenue && input.dataset.field === durationField) input.checked = value === true; else input.value = value; }
      }
    } catch (error) {
      if (!disposed) {
        let notDispatched = false;
        // Only the direct response to this submit may release its pending guard.
        // A generic 409, current() response or late timeout reply is not evidence.
        if (action?.type === 'submit' && isSubmit() && error?.error === 'stale_review'
          && error.submissionState === 'not_dispatched' && error.sessionId === marker.id && marker.id === state?.id
          && fingerprint(marker.reviewFingerprint) && error.reviewFingerprint === marker.reviewFingerprint
          && action.reviewFingerprint === marker.reviewFingerprint) {
          try { write(marker.id,'review_required',marker.idempotencyKey,marker.reviewFingerprint); notDispatched = true; } catch { /* Keep the pending guard if durable storage fails. */ }
        }
        uncertain = !notDispatched; changed();
        el('status').textContent = notDispatched ? 'Servern har bekräftat att bokningen inte skickades. Granska uppgifterna igen innan du godkänner.' : 'Kontakten avbröts eller svaret kunde inte verifieras. Kontrollera status. Skicka inte på nytt.';
      }
    } finally { busy = false; if (!disposed) controls(); }
  }
  el('start').onclick = () => run(); el('refresh').onclick = () => run();
  el('up').onclick = () => run({type:'scroll',delta:-500}); el('down').onclick = () => run({type:'scroll',delta:500});
  el('image').onclick = event => {
    if (isZenchef || !state || state.phase !== 'selection' || busy || uncertain || drafts.size) return;
    const rect = el('image').getBoundingClientRect();
    const x = Math.floor((event.clientX-rect.left)*state.width/rect.width), y = Math.floor((event.clientY-rect.top)*state.height/rect.height);
    if (x>=0 && y>=0 && x<state.width && y<state.height) run({type:'click',x,y});
  };
  el('search').onsubmit = event => { event.preventDefault(); const data = new FormData(el('search')); run({type:'search',date:data.get('date'),party:Number(data.get('party'))}); };
  el('save').onclick = () => run({type:'fill',fields:Object.fromEntries([...el('fields').querySelectorAll('[data-field]')].map(node => [node.dataset.field,durationVenue && node.dataset.field === durationField ? node.checked : node.value]))});
  el('review').onclick = async () => {
    if (needsReview()) { await run(); if (disposed || busy || uncertain || !needsReview()) return; }
    await run({type:'review'});
  };
  el('hold-consent').onchange = controls; el('terms').onchange = controls;
  el('hold-button').onclick = () => run({type:'hold',confirm:true,reviewFingerprint:state?.holdReview?.fingerprint});
  el('submit').onclick = () => run(isZenchef
    ? {type:'submit',confirm:true,terms:true,reviewToken:state?.reviewToken,reviewFingerprint:state?.reviewFingerprint,termsVersion:state?.terms?.version,idempotencyKey:crypto.randomUUID()}
    : {type:'submit',confirm:true,terms:true,reviewFingerprint:finalFingerprint()});
  el('dismiss').onclick = () => { destroy(); container.hidden = true; onDismiss?.(); };
  el('end').onclick = async () => {
    if (busy || uncertain || isSubmit() || !marker) return;
    busy = true; controls();
    try {
      await request(`${endpoint}/${encodeURIComponent(marker.id)}`,{method:'DELETE'});
      if (disposed) return;
      storage.removeItem(key); marker = null; state = null; drafts.clear(); el('screen').hidden = true; el('start').hidden = false;
      el('status').textContent = 'Formuläret är avslutat. Detta avbokar inte en reservation.';
    } catch { uncertain = true; el('status').textContent = 'Formuläret kunde inte avslutas. Kontrollera status.'; }
    finally { busy = false; if (!disposed) controls(); }
  };
  function destroy() { disposed = true; drafts.clear(); clearInterval(expiryTimer); }
  const expiryTimer = setInterval(() => { if (!disposed) controls(); },1000);
  controls();
  const ready = marker ? run() : Promise.resolve();
  return {ready,refresh:() => run(),destroy};
}
