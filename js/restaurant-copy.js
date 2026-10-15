// Static restaurant-page chrome. Restaurant and provider content stays unchanged.
const rows = {
restaurant: ['Restaurang','Restaurant','Restaurante','Restaurant'],
loading: ['Laddar restaurang…','Loading restaurant…','Cargando restaurante…','Chargement du restaurant…'],
notFound: ['Restaurangen hittades inte','Restaurant not found','Restaurante no encontrado','Restaurant introuvable'],
backRestaurants: ['Till restauranger','Back to restaurants','Volver a restaurantes','Retour aux restaurants'],
menuOfficial: ['Öppna officiell meny','Open official menu','Abrir menú oficial','Ouvrir le menu officiel'],
menuWebsite: ['Hitta menyn på officiella sidan','Find the menu on the official website','Ver el menú en la web oficial','Consulter le menu sur le site officiel'],
menuGoogle: ['Meny och information på Google','Menu and information on Google','Menú e información en Google','Menu et informations sur Google'],
menuNoteOfficial: ['Länk till restaurangens egen meny. Rätter och priser kan ändras.','Link to the restaurant’s own menu. Dishes and prices may change.','Enlace al menú del restaurante. Los platos y precios pueden cambiar.','Lien vers le menu du restaurant. Les plats et les prix peuvent changer.'],
menuNoteWebsite: ['Öppna restaurangens webbplats för aktuell meny.','Visit the restaurant’s website for the current menu.','Visita la web del restaurante para consultar el menú actual.','Consultez le site du restaurant pour le menu actuel.'],
menuNoteMissing: ['Ingen separat menylänk finns ännu. Kontakta restaurangen för aktuell meny.','No separate menu link is available yet. Contact the restaurant for its current menu.','Aún no hay un enlace específico al menú. Contacta con el restaurante para consultarlo.','Aucun lien direct vers le menu n’est encore disponible. Contactez le restaurant pour le consulter.'],
date: ['Datum','Date','Fecha','Date'], time: ['Tid','Time','Hora','Heure'], confirm: ['Bekräfta','Confirm','Confirmar','Confirmer'],
providerConnection: ['Bokning via Zinks bokningssystem','Booking through Zink’s reservation system','Reserva mediante el sistema de Zink','Réservation via le système de Zink'],
guests: ['Antal gäster','Guests','Número de personas','Nombre de personnes'], guest: ['gäst','guest','persona','personne'], guestPlural: ['gäster','guests','personas','personnes'],
showTimes: ['Visa lediga tider','Show available times','Ver horarios disponibles','Voir les horaires disponibles'],
inlineBooking: ['Välj en tid och fortsätt till gästuppgifter och bekräftelse.','Choose a time and continue to guest details and confirmation.','Elige una hora y continúa con los datos de los comensales y la confirmación.','Choisissez un horaire, puis renseignez les coordonnées et confirmez.'],
callRestaurant: ['Ring restaurangen: {phone}','Call the restaurant: {phone}','Llama al restaurante: {phone}','Appelez le restaurant : {phone}'],
bookAt: ['Boka hos {name}','Book with {name}','Reservar en {name}','Réserver auprès de {name}'],
bookingSystem: ['restaurangens bokningssystem','the restaurant’s reservation system','el sistema de reservas del restaurante','le système de réservation du restaurant'],
externalBooking: ['Du fortsätter till {provider} för att se tider och slutföra bokningen.','Continue to {provider} to view times and complete your booking.','Continúa a {provider} para ver horarios y completar la reserva.','Continuez vers {provider} pour consulter les horaires et finaliser la réservation.'],
chooseTime: ['Välj tid','Choose a time','Elige una hora','Choisissez un horaire'],
name: ['Namn','Name','Nombre','Nom'], email: ['E-post','Email','Correo electrónico','E-mail'],
requests: ['Önskemål','Special requests','Peticiones especiales','Demandes particulières'],
requestsPlaceholder: ['Allergier, barnstol eller annat','Allergies, a high chair or other requests','Alergias, trona u otras peticiones','Allergies, chaise haute ou autres demandes'],
sendRequest: ['Skicka bokningsförfrågan via VELVET','Send a booking request through VELVET','Enviar solicitud de reserva a través de VELVET','Envoyer une demande de réservation via VELVET'],
bookDirect: ['Eller boka direkt hos restaurangen','Or book directly with the restaurant','O reserva directamente con el restaurante','Ou réservez directement auprès du restaurant'],
restaurantsIn: ['Restauranger i {name}','Restaurants in {name}','Restaurantes en {name}','Restaurants à {name}'],
restaurantIn: ['Restaurang i {name}.','Restaurant in {name}.','Restaurante en {name}.','Restaurant à {name}.'],
website: ['Hemsida','Website','Sitio web','Site web'], menu: ['Meny','Menu','Menú','Menu'], map: ['Karta','Map','Mapa','Carte'],
reviews: ['recensioner','reviews','reseñas','avis'], noRating: ['Inget betyg publicerat ännu','No rating published yet','Aún no hay valoración publicada','Aucune note publiée pour le moment'],
photos: ['bilder','photos','fotos','photos'], source: ['källa','source','fuente','source'],
about: ['Om restaurangen','About the restaurant','Sobre el restaurante','À propos du restaurant'], location: ['Plats','Location','Ubicación','Lieu'],
cuisine: ['Kök','Cuisine','Cocina','Cuisine'], price: ['Prisklass','Price range','Precios','Gamme de prix'], hours: ['Öppettider','Opening hours','Horario','Horaires'], phone: ['Telefon','Phone','Teléfono','Téléphone'],
food: ['Mat & dryck','Food & drink','Comida y bebida','Cuisine et boissons'],
socialReviews: ['Sociala medier & recensioner','Social media & reviews','Redes sociales y reseñas','Réseaux sociaux et avis'],
noSocial: ['Inga sociala länkar finns ännu.','No social links are available yet.','Aún no hay enlaces a redes sociales.','Aucun lien vers les réseaux sociaux pour le moment.'],
readReviews: ['Läs recensioner på {source}','Read reviews on {source}','Leer reseñas en {source}','Lire les avis sur {source}'],
cancellation: ['Avbokningsvillkor','Cancellation policy','Condiciones de cancelación','Conditions d’annulation'],
cancellationIntro: ['Kontrollera sista tid för kostnadsfri avbokning, lokal tidszon och eventuell avgift för sen avbokning eller uteblivet besök innan du bekräftar. Kortgaranti och förskottsbetalning kan ha särskilda villkor.','Before confirming, check the free cancellation deadline, local time zone and any late cancellation or no-show fee. Card guarantees and prepayments may have specific terms.','Antes de confirmar, comprueba el plazo de cancelación gratuita, la zona horaria local y los posibles cargos por cancelación tardía o inasistencia. Las garantías con tarjeta y los anticipos pueden tener condiciones específicas.','Avant de confirmer, vérifiez le délai d’annulation gratuite, le fuseau horaire local et les éventuels frais d’annulation tardive ou de non-présentation. Les garanties par carte et les prépaiements peuvent avoir des conditions particulières.'],
cancellationLink: ['Restaurangens avbokningsvillkor','Restaurant cancellation policy','Condiciones de cancelación del restaurante','Conditions d’annulation du restaurant'],
checkedPolicy: ['Kontrollerade {date}. Jämför med villkoren för just din bokning innan du bekräftar.','Checked {date}. Compare with the terms for your specific booking before confirming.','Comprobadas el {date}. Compáralas con las condiciones de tu reserva antes de confirmar.','Vérifiées le {date}. Comparez-les aux conditions de votre réservation avant de confirmer.'],
cancellationMissing: ['De aktuella villkoren för ditt val visas av restaurangen i bokningsformuläret. Velvet har ännu ingen separat verifierad sammanfattning. Om villkoren saknas eller är otydliga, kontakta restaurangen före bokning.','The restaurant displays the terms for your selection in its booking form. Velvet does not yet have a separately verified summary. If the terms are missing or unclear, contact the restaurant before booking.','El restaurante muestra las condiciones de tu selección en el formulario de reserva. Velvet aún no dispone de un resumen verificado por separado. Si faltan condiciones o no están claras, contacta con el restaurante antes de reservar.','Le restaurant affiche les conditions de votre sélection dans son formulaire de réservation. Velvet ne dispose pas encore d’un résumé vérifié séparément. Si les conditions sont absentes ou peu claires, contactez le restaurant avant de réserver.']
};
export const RESTAURANT_COPY = Object.fromEntries(['sv','en','es','fr'].map((lang,index)=>[lang,Object.fromEntries(Object.entries(rows).map(([key,values])=>[key,values[index]]))]));
export function restaurantCopy(lang = 'en') {
  const copy = RESTAURANT_COPY[lang] || RESTAURANT_COPY.en;
  return (key, values = {}) => String(copy[key] || key).replace(/\{(\w+)\}/g, (match, name) => values[name] == null ? match : String(values[name]));
}
