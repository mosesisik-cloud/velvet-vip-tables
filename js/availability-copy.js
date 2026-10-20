// Independent copy helper: usable by the UI and Node tests without application boot.
const languages = ['sv', 'en', 'es', 'fr'];
const copy = {
  manualConfirmationNote: ['Vissa tider kräver att restaurangen godkänner din förfrågan. Kontrollera bekräftelsesättet för vald tid i originalformuläret.', 'Some times require the restaurant to approve your request. Check how your chosen time is confirmed in the original form.', 'Algunos horarios requieren que el restaurante apruebe tu solicitud. Consulta cómo se confirma el horario elegido en el formulario original.', 'Certains horaires nécessitent l’approbation de votre demande par le restaurant. Vérifiez le mode de confirmation de l’horaire choisi dans le formulaire original.'],
  unknownConfirmationNote: ['Bekräftelsesättet är inte verifierat för alla tider.', 'The confirmation process has not been verified for every time.', 'El proceso de confirmación no se ha verificado para todos los horarios.', 'Le mode de confirmation n’a pas été vérifié pour tous les horaires.'],
  reviewedScopeNote: ['Sökningen omfattar ett begränsat urval för två gäster. Välj rum och meny hos restaurangen; en visad tid är ingen reservation.', 'This search covers a limited selection for two guests. Choose the room and menu with the restaurant; a displayed time is not a reservation.', 'Esta búsqueda cubre una selección limitada para dos personas. Elige la sala y el menú con el restaurante; un horario mostrado no es una reserva.', 'Cette recherche couvre une sélection limitée pour deux personnes. Choisissez la salle et le menu auprès du restaurant ; un horaire affiché ne constitue pas une réservation.'],
  eyebrow: ['ETT BORD ATT LÄNGTA TILL', 'A TABLE TO LOOK FORWARD TO', 'UNA MESA QUE TE ESPERA', 'UNE TABLE À DÉCOUVRIR'],
  title: ['Var vill du äta?', 'Where would you like to eat?', '¿Dónde quieres comer?', 'Où souhaitez-vous manger ?'],
  intro: ['Hitta lediga bord för din kväll. Välj destination, dag och sällskap.', 'Find a table for your evening. Choose a destination, date and party size.', 'Encuentra una mesa para tu velada. Elige destino, fecha y número de comensales.', 'Trouvez une table pour votre soirée. Choisissez une destination, une date et le nombre de personnes.'],
  city: ['Destination', 'Destination', 'Destino', 'Destination'],
  chooseCity: ['Välj destination', 'Choose a destination', 'Elige un destino', 'Choisir une destination'],
  date: ['Datum', 'Date', 'Fecha', 'Date'],
  time: ['Tid', 'Time', 'Hora', 'Heure'],
  guests: ['Gäster', 'Guests', 'Comensales', 'Personnes'],
  guest: ['gäst', 'guest', 'comensal', 'personne'],
  guestPlural: ['gäster', 'guests', 'comensales', 'personnes'],
  prepaymentNote: ['Förskottsbetalning kan krävas för vissa alternativ.', 'Some options may require prepayment.', 'Algunas opciones pueden requerir pago anticipado.', 'Certaines options peuvent nécessiter un prépaiement.'],
  cardNote: ['Kortgaranti kan krävas för vissa alternativ.', 'Some options may require a card guarantee.', 'Algunas opciones pueden requerir garantía con tarjeta.', 'Certaines options peuvent nécessiter une garantie par carte.'],
  paymentUnknownNote: ['Betalningsvillkoren är inte verifierade.', 'Payment terms have not been verified.', 'Las condiciones de pago no se han verificado.', 'Les conditions de paiement n’ont pas été vérifiées.'],
  cancellationUnknownNote: ['Avbokningsvillkoren är inte verifierade.', 'Cancellation terms have not been verified.', 'Las condiciones de cancelación no se han verificado.', 'Les conditions d’annulation n’ont pas été vérifiées.'],
  finalTermsNote: ['Restaurangens originalformulär visar de slutliga villkoren innan du bokar.', 'The restaurant’s original booking form shows the final terms before you book.', 'El formulario original del restaurante muestra las condiciones finales antes de reservar.', 'Le formulaire de réservation original du restaurant présente les conditions définitives avant de réserver.'],
  mixedNote: ['Villkoren varierar mellan alternativen vid samma tid.', 'Terms vary between options at the same time.', 'Las condiciones varían entre opciones a la misma hora.', 'Les conditions varient entre les options au même horaire.'],
  search: ['Sök lediga bord', 'Find available tables', 'Buscar mesas disponibles', 'Rechercher des tables disponibles'],
  searching: ['Söker…', 'Searching…', 'Buscando…', 'Recherche…'],
  note: ['Visar tider inom 90 minuter från ditt val, i restaurangens lokala tid. Du behöver inget Velvet-konto.', 'Shows times within 90 minutes of your choice, in the restaurant’s local time. No Velvet account is needed.', 'Se muestran horarios a 90 minutos o menos de tu elección, en la hora local del restaurante. No necesitas una cuenta de Velvet.', 'Les horaires proposés se situent à moins de 90 minutes de votre choix, à l’heure locale du restaurant. Aucun compte Velvet n’est nécessaire.'],
  initial: ['Välj en destination för att hitta lediga bord.', 'Choose a destination to find available tables.', 'Elige un destino para encontrar mesas disponibles.', 'Choisissez une destination pour trouver des tables disponibles.'],
  selectedInitial: ['Välj datum, tid och antal gäster och sök lediga bord i {city}.', 'Choose a date, time and party size, then find available tables in {city}.', 'Elige fecha, hora y número de comensales y busca mesas disponibles en {city}.', 'Choisissez la date, l’heure et le nombre de personnes, puis recherchez des tables disponibles à {city}.'],
  edited: ['Sök för att visa tider för ditt nya val.', 'Search to see times for your updated choices.', 'Busca para ver horarios con tus nuevos criterios.', 'Lancez une recherche pour afficher les horaires correspondant à vos nouveaux choix.'],
  disclaimer: ['Tillgängligheten kan ändras. Bordet är bokat först när restaurangens bokningssystem bekräftar din reservation.', 'Availability can change. Your table is booked only when the restaurant’s booking system confirms your reservation.', 'La disponibilidad puede cambiar. La mesa solo está reservada cuando el sistema del restaurante confirma tu reserva.', 'La disponibilité peut changer. Votre table est réservée uniquement lorsque le système du restaurant confirme votre réservation.'],
  searchingCity: ['Söker lediga bord i {city}…', 'Finding available tables in {city}…', 'Buscando mesas disponibles en {city}…', 'Recherche de tables disponibles à {city}…'],
  checked: ['Kontrollerat {time}', 'Checked at {time}', 'Comprobado a las {time}', 'Vérifié à {time}'],
  availableOne: ['{count} restaurang har lediga tider', '{count} restaurant has available times', '{count} restaurante tiene horarios disponibles', '{count} restaurant propose des horaires disponibles'],
  availableMany: ['{count} restauranger har lediga tider', '{count} restaurants have available times', '{count} restaurantes tienen horarios disponibles', '{count} restaurants proposent des horaires disponibles'],
  searchingMore: ['Söker vidare', 'Still searching', 'La búsqueda continúa', 'Recherche en cours'],
  remaining: ['{count} restauranger återstår', '{count} restaurants remaining', 'Quedan {count} restaurantes', '{count} restaurants restants'],
  requestResults: ['Här finns restauranger som tar emot bokningsförfrågningar. En förfrågan är inte en bekräftad bokning.', 'These restaurants accept booking requests. A request is not a confirmed reservation.', 'Estos restaurantes aceptan solicitudes de reserva. Una solicitud no es una reserva confirmada.', 'Ces restaurants acceptent des demandes de réservation. Une demande n’est pas une réservation confirmée.'],
  noCheck: ['Vi kunde inte kontrollera lediga tider här ännu. Öppna restaurangens bokning nedan.', 'We could not check availability here yet. Open the restaurant’s booking page below.', 'Todavía no hemos podido comprobar la disponibilidad aquí. Abre la reserva del restaurante a continuación.', 'Nous n’avons pas encore pu vérifier les disponibilités ici. Ouvrez la réservation du restaurant ci-dessous.'],
  none: ['Inga lediga tider hittades i de system vi kunde kontrollera{updated}. Prova en annan tid eller dag.', 'No available times were found in the systems we could check{updated}. Try another time or day.', 'No se encontraron horarios disponibles en los sistemas que pudimos consultar{updated}. Prueba otra hora o día.', 'Aucun horaire disponible dans les systèmes que nous avons pu consulter{updated}. Essayez une autre heure ou un autre jour.'],
  restaurant: ['Restaurang', 'Restaurant', 'Restaurante', 'Restaurant'],
  bookingSystem: ['restaurangens bokningssystem', 'the restaurant’s booking system', 'el sistema de reservas del restaurante', 'le système de réservation du restaurant'],
  via: ['Via {provider}', 'Via {provider}', 'A través de {provider}', 'Via {provider}'],
  available: ['Lediga tider', 'Available times', 'Horarios disponibles', 'Horaires disponibles'],
  slotsFor: ['Lediga tider för {name}', 'Available times for {name}', 'Horarios disponibles para {name}', 'Horaires disponibles pour {name}'],
  bookAt: ['Fortsätt boka {name} klockan {time}', 'Continue booking {name} at {time}', 'Continuar la reserva en {name} a las {time}', 'Poursuivre la réservation chez {name} à {time}'],
  partialNote: ['Visar hittade tider från en del av restaurangens alternativ.', 'Showing times found for some of the restaurant’s options.', 'Se muestran horarios de algunas de las opciones del restaurante.', 'Les horaires affichés concernent une partie des options du restaurant.'],
  continueNote: ['Fortsätt till bokningen för att välja bord och se villkor.', 'Continue to booking to choose a table and see the terms.', 'Continúa con la reserva para elegir mesa y consultar las condiciones.', 'Poursuivez la réservation pour choisir une table et consulter les conditions.'],
  pending: ['Kontrollerar lediga tider…', 'Checking availability…', 'Comprobando disponibilidad…', 'Vérification des disponibilités…'],
  unsupported: ['Kan inte kontrolleras här ännu', 'Cannot be checked here yet', 'Todavía no se puede comprobar aquí', 'Vérification indisponible ici pour le moment'],
  error: ['Kunde inte hämta tider', 'Could not retrieve times', 'No se pudieron obtener los horarios', 'Impossible de récupérer les horaires'],
  unavailable: ['Inga lediga tider i sökningen', 'No available times in this search', 'No hay horarios disponibles en esta búsqueda', 'Aucun horaire disponible pour cette recherche'],
  unconfirmed: ['Tillgänglighet kunde inte bekräftas', 'Availability could not be confirmed', 'No se pudo confirmar la disponibilidad', 'La disponibilité n’a pas pu être confirmée'],
  other: ['Övriga restauranger ({count})', 'Other restaurants ({count})', 'Otros restaurantes ({count})', 'Autres restaurants ({count})'],
  show: ['Visa restaurang', 'View restaurant', 'Ver restaurante', 'Voir le restaurant'],
  empty: ['Vi har ännu inga sökbara restauranger här. Du kan fortfarande utforska destinationens restauranger i Velvet.', 'We do not have searchable restaurants here yet. You can still explore this destination’s restaurants in Velvet.', 'Todavía no hay restaurantes disponibles para buscar aquí. Puedes explorar los restaurantes de este destino en Velvet.', 'Aucun restaurant ne peut encore être recherché ici. Vous pouvez toujours découvrir les restaurants de cette destination dans Velvet.'],
  timeout: ['Sökningen tog för lång tid. Resultaten som redan hittats visas här; återstående restauranger är inte kontrollerade. Sök igen för nya uppgifter.', 'The search took too long. Results already found are shown here; the remaining restaurants have not been checked. Search again for updated information.', 'La búsqueda tardó demasiado. Se muestran los resultados encontrados; los demás restaurantes no se han comprobado. Vuelve a buscar para actualizar la información.', 'La recherche a pris trop de temps. Les résultats déjà trouvés sont affichés ; les autres restaurants n’ont pas été vérifiés. Relancez la recherche pour actualiser les informations.'],
  interrupted: ['Sökningen avbröts. Resultaten som redan hittats visas här; återstående restauranger kunde inte kontrolleras. Försök igen.', 'The search was interrupted. Results already found are shown here; the remaining restaurants could not be checked. Try again.', 'La búsqueda se interrumpió. Se muestran los resultados encontrados; no se pudieron comprobar los demás restaurantes. Inténtalo de nuevo.', 'La recherche a été interrompue. Les résultats déjà trouvés sont affichés ; les autres restaurants n’ont pas pu être vérifiés. Réessayez.'],
  failure: ['Det gick inte att hämta lediga tider just nu. Försök igen.', 'Available times could not be retrieved right now. Try again.', 'No se pudieron obtener los horarios disponibles. Inténtalo de nuevo.', 'Impossible de récupérer les disponibilités pour le moment. Réessayez.'],
};
export function availabilityCopy(requested = globalThis.document?.documentElement?.lang || 'sv') {
  const candidate = String(requested).toLowerCase().split('-')[0];
  const language = languages.includes(candidate) ? candidate : 'en';
  const index = languages.indexOf(language);
  return {
    language,
    locale: {sv:'sv-SE',en:'en-GB',es:'es-ES',fr:'fr-FR'}[language],
    text(key, values = {}) {
      if (!Object.hasOwn(copy, key)) throw new Error('Unknown availability copy key: ' + key);
      return copy[key][index].replace(/\{(\w+)\}/g, (token, key) => values[key] == null ? token : String(values[key]));
    },
  };
}
