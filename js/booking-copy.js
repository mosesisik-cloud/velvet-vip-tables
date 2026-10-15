/** Booking shell copy. Restaurant-authored policies remain the provider's own text. */
const COPY = {
  sv: {
    requestWindowMax: "Restaurangen behandlar förfrågningar inom {max} timmar.",
    manualEmail: "Mejla om bordsbokning",
    manualPhone: "Ring om bordsbokning",
    manualPhoneNotice: "Ring restaurangen för att fråga om bord. Velvet visar inga lediga tider och bekräftar ingen bokning; restaurangen måste bekräfta bordet.",
    club55PhoneOnly: "Club 55 tar endast emot bordsbokningar per telefon, inte via nätet eller mejl. Numret gäller restaurangen, inte solbäddar.",
    denDirectPhone: "Den tar endast emot bokningar direkt från gästen per telefon, inte via nätet eller mellanhänder. Bokningen är klar först när du får restaurangens bekräftelse via mejl. Velvet visar inga lediga tider.",
    denCallWindow: "Bokningssamtal: måndag–lördag 12:00–17:00, lokal tid i Tokyo (Asia/Tokyo). Middagstid: 18:00–20:00. Bokning upp till två kalendermånader framåt, samma datum, för högst fyra gäster. Kontrollera aktuella stängningsdagar på restaurangens sida.",
    denCancellation: "Den anger att avbokning eller minskat antal gäster samma dag debiteras hela menypriset. Meddela avbokning eller ändring senast två dagar före besöket; för måndagsbokningar senast lördag. Kontrollera villkoren för din bokning med restaurangen.",
    manualPaymentUnknown: "Kortgaranti och förskottsbetalning är inte verifierade. Fråga restaurangen om betalningsvillkoren innan du bokar.",

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
    requestWindowMax: "The restaurant processes requests within {max} hours.",
    manualEmail: "Email to request a table",
    manualPhone: "Call to request a table",
    manualPhoneNotice: "Call the restaurant to ask for a table. Velvet shows no availability and confirms no reservation; the restaurant must confirm your table.",
    club55PhoneOnly: "Club 55 accepts table reservations only by telephone, not online or by email. This is the restaurant number, not the sunbed line.",
    denDirectPhone: "Den accepts reservations only by telephone directly from the guest, not online or through intermediaries. Your reservation is complete only when you receive the restaurant's confirmation email. Velvet shows no availability.",
    denCallWindow: "Reservation calls: Monday–Saturday 12:00–17:00, Tokyo local time (Asia/Tokyo). Dining hours: 18:00–20:00. Book up to two calendar months ahead, same date, for up to four guests. Check the restaurant's page for current closure dates.",
    denCancellation: "Den states that same-day cancellations or reductions in party size incur the full menu price. Notify the restaurant of cancellation or changes no later than two days before your visit; for Monday reservations, by Saturday. Confirm the terms for your booking with the restaurant.",
    manualPaymentUnknown: "Card guarantee and prepayment requirements have not been verified. Ask the restaurant about payment terms before booking.",

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
    requestWindowMax: "El restaurante tramita las solicitudes en un plazo de {max} horas.",
    manualEmail: "Enviar un correo para solicitar mesa",
    manualPhone: "Llamar para solicitar mesa",
    manualPhoneNotice: "Llama al restaurante para solicitar mesa. Velvet no muestra disponibilidad ni confirma reservas; el restaurante debe confirmar tu mesa.",
    club55PhoneOnly: "Club 55 acepta reservas de mesa solo por teléfono, no por internet ni por correo electrónico. Este número es del restaurante, no de las tumbonas.",
    denDirectPhone: "Den acepta reservas únicamente por teléfono y directamente del comensal, no por internet ni mediante intermediarios. La reserva se completa al recibir el correo de confirmación del restaurante. Velvet no muestra disponibilidad.",
    denCallWindow: "Llamadas para reservar: lunes–sábado 12:00–17:00, hora local de Tokio (Asia/Tokyo). Horario de cena: 18:00–20:00. Reservas hasta dos meses naturales antes, el mismo día del mes, para un máximo de cuatro personas. Consulta los cierres actuales en la página del restaurante.",
    denCancellation: "Den indica que las cancelaciones o reducciones de comensales el mismo día se cobran al precio completo del menú. Comunica las cancelaciones o cambios al menos dos días antes de la visita; para reservas del lunes, a más tardar el sábado. Confirma las condiciones de tu reserva con el restaurante.",
    manualPaymentUnknown: "No se han verificado los requisitos de garantía con tarjeta ni de pago anticipado. Consulta las condiciones de pago con el restaurante antes de reservar.",

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
    requestWindowMax: "Le restaurant traite les demandes sous {max} heures.",
    manualEmail: "Envoyer un e-mail pour demander une table",
    manualPhone: "Appeler pour demander une table",
    manualPhoneNotice: "Appelez le restaurant pour demander une table. Velvet n’affiche aucune disponibilité et ne confirme aucune réservation ; le restaurant doit confirmer votre table.",
    club55PhoneOnly: "Club 55 accepte les réservations de table uniquement par téléphone, ni en ligne ni par e-mail. Ce numéro est celui du restaurant, pas celui des transats.",
    denDirectPhone: "Den accepte les réservations uniquement par téléphone, directement auprès du client, ni en ligne ni par un intermédiaire. La réservation est finalisée à réception de l’e-mail de confirmation du restaurant. Velvet n’affiche aucune disponibilité.",
    denCallWindow: "Appels pour réserver : lundi–samedi 12:00–17:00, heure locale de Tokyo (Asia/Tokyo). Dîner : 18:00–20:00. Réservations jusqu’à deux mois calendaires à l’avance, au même quantième, pour quatre personnes maximum. Consultez les dates de fermeture actuelles sur le site du restaurant.",
    denCancellation: "Den indique que les annulations ou réductions du nombre de convives le jour même sont facturées au prix intégral du menu. Prévenez le restaurant au plus tard deux jours avant la visite ; pour une réservation le lundi, au plus tard le samedi. Confirmez les conditions de votre réservation auprès du restaurant.",
    manualPaymentUnknown: "Les exigences de garantie par carte et de prépaiement n’ont pas été vérifiées. Demandez les conditions de paiement au restaurant avant de réserver.",

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
  // A maximum-only response promise must not acquire an invented minimum.
  // Zero/invalid maxima do not establish an immediate response or confirmation.
  if (Number.isSafeInteger(hours?.max) && hours.max > 0) {
    if (!Object.hasOwn(hours, 'min')) notes.push(formatBookingCopy(copy.requestWindowMax, hours));
    else if (Number.isSafeInteger(hours.min) && hours.min >= 0 && hours.min <= hours.max) {
      notes.push(formatBookingCopy(copy.requestWindow, hours));
    }
  }
  if (booking.paymentRequirement === 'card_guarantee') notes.push(copy.requestCard);
  if (booking.paymentRequirement === 'not_specified') notes.push(copy.manualPaymentUnknown);
  if (booking.cancellationPolicyStatus === 'unknown') notes.push(copy.requestUnknownPolicy);
  return notes;
}
