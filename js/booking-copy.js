/** Booking shell copy. Restaurant-authored policies remain the provider's own text. */
const COPY = {
  sv: {
    requestHeading: "Bokningsförfrågan",
    requestNotice: "Detta är en bokningsförfrågan, inte en omedelbart bekräftad bokning. Bordet är bekräftat först när restaurangen bekräftar din förfrågan.",
    requestWindow: "Restaurangen behandlar förfrågningar inom {min}–{max} timmar.",
    requestOpen: "Öppna bokningsförfrågan",
    requestCard: "Kortgaranti krävs. Kontrollera belopp och villkor i originalformuläret.",
    requestUnknownPolicy: "Avbokningsfrist och eventuell avgift är inte verifierade. Läs villkoren innan du skickar förfrågan; kontakta restaurangen om de saknas.",

    closedHeading: "Permanent stängd",
    closedMessage: "Restaurangen är permanent stängd och tar inte emot bokningar.",
    closedSource: "Information från restaurangen ↗",
    seasonalHeading: "Stängd för säsongen 2026",
    seasonalMessage: "Restaurangens bokningssida skriver: \"We are now closed for the 2026 season.\" Den officiella Cannes-sidan anger öppet maj–september, klockan 12.00–18.00. Velvet tar inte emot en bokningsförfrågan så länge det beskedet gäller.",
    seasonalSource: "Restaurangens bokningssida ↗",
    source: 'Bokning via {provider} · Utan Velvet-konto',
    externalIntro: 'Lediga tider och bokningen visas hos {provider} i en egen flik. Eventuella kontokrav och villkor visas där.',
    externalLink: 'Kontrollera tider hos {provider} ↗',
    originalIntro: 'Restaurangens eget bokningsformulär öppnas här.',
    findTable: 'Hitta ett bord',
    fallbackLink: 'Öppna bokningen i en egen flik ↗',
    activeIntro: 'Lediga tider, villkor och bokningsbekräftelse visas av restaurangen i formuläret.',
    opening: 'Öppnar bokningen…',
    frameTitle: 'Boka bord hos {name} via {provider}',
    loadError: 'Om formuläret inte visas kan du öppna bokningen i en egen flik.',
    policyHeading: 'Avbokningsvillkor',
    policyCheck: 'Kontrollera sista tid för kostnadsfri avbokning, lokal tidszon och eventuell avgift för sen avbokning eller uteblivet besök innan du bekräftar. Kortgaranti och förskottsbetalning kan ha särskilda villkor.',
    unknownPolicy: 'De aktuella villkoren för ditt val visas av restaurangen i bokningsformuläret. Velvet har ännu ingen separat verifierad sammanfattning. Om villkoren saknas eller är otydliga, kontakta restaurangen före bokning.',
    policySource: 'Restaurangens avbokningsvillkor ↗',
    policyChecked: 'Kontrollerade {date}.',
    comparePolicy: 'Jämför med villkoren för just din bokning innan du bekräftar.',
    languageEnglishFallback: 'Bokningstjänsten stöder inte ditt valda språk. Formuläret öppnas på engelska. Restaurangens egna texter och villkor kan vara på ett annat språk.',
    languageVenueDependent: 'Ditt valda språk har skickats till bokningstjänsten. Vilka texter som översätts beror på restaurangen och tjänsten.',
    languageUnknown: 'Vi har ännu inte verifierat språkvalet hos denna bokningstjänst. Formuläret öppnas på tjänstens eget språk; välj språk där om alternativet finns.'
  },
  en: {
    requestHeading: "Booking request",
    requestNotice: "This is a booking request, not an immediately confirmed reservation. Your table is confirmed only when the restaurant confirms your request.",
    requestWindow: "The restaurant processes requests within {min}–{max} hours.",
    requestOpen: "Open booking request",
    requestCard: "A card guarantee is required. Check the amount and terms in the original form.",
    requestUnknownPolicy: "The cancellation deadline and any fee have not been verified. Read the terms before sending your request; contact the restaurant if they are missing.",

    closedHeading: "Permanently closed",
    closedMessage: "This restaurant is permanently closed and is not accepting bookings.",
    closedSource: "Information from the restaurant ↗",
    seasonalHeading: "Closed for the 2026 season",
    seasonalMessage: "The restaurant's reservation page says: \"We are now closed for the 2026 season.\" The official Cannes page lists hours from May to September, 12:00–18:00. Velvet does not accept a booking request while that notice is in effect.",
    seasonalSource: "Restaurant reservation page ↗",
    source: 'Booking via {provider} · No Velvet account needed',
    externalIntro: 'Availability and booking open with {provider} in a separate tab. Any account requirements and terms are shown there.',
    externalLink: 'Check availability with {provider} ↗',
    originalIntro: 'The restaurant’s own booking form opens here.',
    findTable: 'Find a table',
    fallbackLink: 'Open booking in a separate tab ↗',
    activeIntro: 'The restaurant shows availability, terms and booking confirmation in the form.',
    opening: 'Opening booking…',
    frameTitle: 'Book a table at {name} via {provider}',
    loadError: 'If the form does not appear, you can open booking in a separate tab.',
    policyHeading: 'Cancellation policy',
    policyCheck: 'Before confirming, check the deadline for free cancellation, the local time zone and any late cancellation or no-show fee. Card guarantees and prepayments may have specific terms.',
    unknownPolicy: 'The restaurant shows the current terms for your selection in its booking form. Velvet does not yet have a separately verified summary. If the terms are missing or unclear, contact the restaurant before booking.',
    policySource: 'Restaurant cancellation policy ↗',
    policyChecked: 'Checked {date}.',
    comparePolicy: 'Compare these with the terms for your specific booking before confirming.',
    languageEnglishFallback: 'The booking service does not support your selected language. The form opens in English. The restaurant’s own text and terms may be in another language.',
    languageVenueDependent: 'Your selected language has been sent to the booking service. Which text is translated depends on the restaurant and the service.',
    languageUnknown: 'We have not yet verified language selection for this booking service. The form opens in the service’s own language; choose a language there if the option is available.'
  },
  es: {
    requestHeading: "Solicitud de reserva",
    requestNotice: "Esto es una solicitud de reserva, no una reserva confirmada de inmediato. La mesa solo queda confirmada cuando el restaurante confirma tu solicitud.",
    requestWindow: "El restaurante tramita las solicitudes en un plazo de {min}–{max} horas.",
    requestOpen: "Abrir solicitud de reserva",
    requestCard: "Se requiere una garantía con tarjeta. Consulta el importe y las condiciones en el formulario original.",
    requestUnknownPolicy: "El plazo de cancelación y las posibles tarifas no se han verificado. Lee las condiciones antes de enviar la solicitud; contacta con el restaurante si no aparecen.",

    closedHeading: "Cerrado permanentemente",
    closedMessage: "Este restaurante ha cerrado permanentemente y no acepta reservas.",
    closedSource: "Información del restaurante ↗",
    seasonalHeading: "Cerrado por la temporada 2026",
    seasonalMessage: "La página de reservas del restaurante dice: \"We are now closed for the 2026 season.\" La página oficial de Cannes indica horario de mayo a septiembre, de 12:00 a 18:00. Velvet no acepta una solicitud de reserva mientras ese aviso esté vigente.",
    seasonalSource: "Página de reservas del restaurante ↗",
    source: 'Reserva a través de {provider} · Sin cuenta de Velvet',
    externalIntro: 'La disponibilidad y la reserva se muestran en {provider}, en otra pestaña. Allí se indican los requisitos de cuenta y las condiciones aplicables.',
    externalLink: 'Consultar disponibilidad en {provider} ↗',
    originalIntro: 'El formulario de reservas del restaurante se abre aquí.',
    findTable: 'Buscar mesa',
    fallbackLink: 'Abrir la reserva en otra pestaña ↗',
    activeIntro: 'El restaurante muestra la disponibilidad, las condiciones y la confirmación de la reserva en el formulario.',
    opening: 'Abriendo la reserva…',
    frameTitle: 'Reservar mesa en {name} a través de {provider}',
    loadError: 'Si no aparece el formulario, puedes abrir la reserva en otra pestaña.',
    policyHeading: 'Política de cancelación',
    policyCheck: 'Antes de confirmar, comprueba el plazo de cancelación gratuita, la zona horaria local y los posibles cargos por cancelación tardía o por no presentarte. Las garantías con tarjeta y los pagos anticipados pueden tener condiciones específicas.',
    unknownPolicy: 'El restaurante muestra las condiciones vigentes para tu selección en su formulario de reservas. Velvet todavía no dispone de un resumen verificado por separado. Si las condiciones no aparecen o no están claras, contacta con el restaurante antes de reservar.',
    policySource: 'Política de cancelación del restaurante ↗',
    policyChecked: 'Comprobadas el {date}.',
    comparePolicy: 'Compáralas con las condiciones de tu reserva concreta antes de confirmar.',
    languageEnglishFallback: 'El servicio de reservas no admite el idioma seleccionado. El formulario se abre en inglés. Los textos y las condiciones del restaurante pueden estar en otro idioma.',
    languageVenueDependent: 'Se ha enviado el idioma seleccionado al servicio de reservas. Los textos que se traducen dependen del restaurante y del servicio.',
    languageUnknown: 'Todavía no hemos verificado la selección de idioma de este servicio de reservas. El formulario se abre en el idioma del servicio; selecciona otro allí si la opción está disponible.'
  },
  fr: {
    requestHeading: "Demande de réservation",
    requestNotice: "Il s’agit d’une demande de réservation, sans confirmation immédiate. Votre table est confirmée uniquement lorsque le restaurant confirme votre demande.",
    requestWindow: "Le restaurant traite les demandes sous {min}–{max} heures.",
    requestOpen: "Ouvrir la demande de réservation",
    requestCard: "Une garantie par carte est requise. Vérifiez le montant et les conditions dans le formulaire original.",
    requestUnknownPolicy: "Le délai d’annulation et les frais éventuels n’ont pas été vérifiés. Lisez les conditions avant d’envoyer votre demande ; contactez le restaurant si elles sont absentes.",

    closedHeading: "Fermé définitivement",
    closedMessage: "Ce restaurant est définitivement fermé et ne prend plus de réservations.",
    closedSource: "Informations du restaurant ↗",
    seasonalHeading: "Fermé pour la saison 2026",
    seasonalMessage: "La page de réservation du restaurant indique : \"We are now closed for the 2026 season.\" La page officielle de Cannes indique un horaire de mai à septembre, de 12 h 00 à 18 h 00. Velvet n’accepte pas de demande de réservation tant que cet avis est affiché.",
    seasonalSource: "Page de réservation du restaurant ↗",
    source: 'Réservation via {provider} · Sans compte Velvet',
    externalIntro: 'Les disponibilités et la réservation s’affichent chez {provider} dans un autre onglet. Les éventuelles exigences de compte et les conditions y sont indiquées.',
    externalLink: 'Consulter les disponibilités chez {provider} ↗',
    originalIntro: 'Le formulaire de réservation du restaurant s’ouvre ici.',
    findTable: 'Trouver une table',
    fallbackLink: 'Ouvrir la réservation dans un autre onglet ↗',
    activeIntro: 'Le restaurant affiche les disponibilités, les conditions et la confirmation de réservation dans le formulaire.',
    opening: 'Ouverture de la réservation…',
    frameTitle: 'Réserver une table chez {name} via {provider}',
    loadError: 'Si le formulaire ne s’affiche pas, vous pouvez ouvrir la réservation dans un autre onglet.',
    policyHeading: 'Conditions d’annulation',
    policyCheck: 'Avant de confirmer, vérifiez la date limite d’annulation gratuite, le fuseau horaire local et les éventuels frais d’annulation tardive ou de non-présentation. Les garanties par carte et les prépaiements peuvent avoir des conditions particulières.',
    unknownPolicy: 'Le restaurant affiche les conditions en vigueur pour votre sélection dans son formulaire de réservation. Velvet ne dispose pas encore d’un résumé vérifié séparément. Si les conditions sont absentes ou peu claires, contactez le restaurant avant de réserver.',
    policySource: 'Conditions d’annulation du restaurant ↗',
    policyChecked: 'Vérifiées le {date}.',
    comparePolicy: 'Comparez-les aux conditions de votre réservation avant de confirmer.',
    languageEnglishFallback: 'Le service de réservation ne prend pas en charge la langue sélectionnée. Le formulaire s’ouvre en anglais. Les textes et conditions du restaurant peuvent être dans une autre langue.',
    languageVenueDependent: 'La langue sélectionnée a été transmise au service de réservation. Les textes traduits dépendent du restaurant et du service.',
    languageUnknown: 'Nous n’avons pas encore vérifié le choix de langue de ce service de réservation. Le formulaire s’ouvre dans la langue du service ; choisissez une langue sur place si cette option est disponible.'
  }
};
for (const copy of Object.values(COPY)) Object.freeze(copy);
Object.freeze(COPY);
export function getBookingCopy(language) {
  return Object.hasOwn(COPY, language) ? COPY[language] : COPY.en;
}
/** Returns plain text, not escaped HTML: use textContent or the caller's HTML escaper. */
export function formatBookingCopy(template, values = {}) {
  return String(template).replace(/\{([a-zA-Z]+)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key]) : match);
}

/** Plain text request disclosures; never infer provider submission or confirmation. */
export function requestBookingNotes(booking, language = 'sv') {
  const copy = getBookingCopy(language);
  const notes = [copy.requestNotice];
  const hours = booking.responseTimeHours;
  if (Number.isFinite(hours?.min) && Number.isFinite(hours?.max) && hours.min >= 0 && hours.max >= hours.min) {
    notes.push(formatBookingCopy(copy.requestWindow, hours));
  }
  if (booking.paymentRequirement === 'card_guarantee') notes.push(copy.requestCard);
  if (booking.cancellationPolicyStatus === 'unknown') notes.push(copy.requestUnknownPolicy);
  return notes;
}
