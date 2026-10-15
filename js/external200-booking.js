import { external200Routes } from './external200-routes-data.js';
import { resolveExternal200ReviewedLink, resolveExternal200ReviewedContact, resolveExternal200ReviewedSource } from './external200-reviewed-links.js';
import { getBookingCopy } from './booking-copy.js?v=180';

const copy = {
  sv: {
    unresolved:'En verifierad bokningsväg saknas. Du kan inte skicka en bokning här ännu.',
    unresolved_branch:'Rätt restaurang eller filial är inte fastställd. Bokning är inte tillgänglig här ännu.',
    closed_reported:'Restaurangen uppges vara stängd, men uppgiften är inte bekräftad av restaurangen. Bokning är inte tillgänglig här.',
    closed:'Restaurangen är stängd och tar inte emot bokningar.',
    walk_in:'Restaurangen tar emot gäster utan bordsbokning. Tillgång till bord avgörs på plats.',
    takeaway:'Restaurangen erbjuder hämtmat. Någon bordsbokning är inte verifierad.',
    manual:'Kontakta restaurangen för att fråga om bord. Din förfrågan blir en bokning först när restaurangen bekräftar den.',
    external:'Öppna restaurangens bokningssida för att se vilka bokningsalternativ som erbjuds.',
    selection:'Formuläret gäller flera restauranger. Välj endast',
    selectionLimit:'Tiden du anger är ett önskemål, inte verifierad tillgänglighet. Invänta restaurangens bekräftelse via mejl.',
    open:'Öppna restaurangens bokningssida', phone:'Ring för bordsbokning', email:'Mejla om bordsbokning', whatsapp:'Öppna WhatsApp för bordsbokning', source:'Restaurangens information',
  },
  en: {
    unresolved:'A verified booking route is not available. You cannot submit a booking here yet.',
    unresolved_branch:'The exact restaurant or branch has not been established. Booking is not available here yet.',
    closed_reported:'This restaurant is reported closed, but the restaurant has not confirmed this. Booking is not available here.',
    closed:'The restaurant is closed and is not accepting bookings.',
    walk_in:'The restaurant accepts walk-in guests. Tables are allocated on arrival.',
    takeaway:'The restaurant offers takeaway. Table reservations have not been verified.',
    manual:'Contact the restaurant to ask for a table. Your request becomes a booking only when the restaurant confirms it.',
    external:'Open the restaurant’s booking page to see the booking options it offers.',
    selection:'This form covers several restaurants. Select only',
    selectionLimit:'The time you enter is a preference, not verified availability. Wait for the restaurant’s confirmation by email.',
    open:'Open the restaurant’s booking page', phone:'Call for a table', email:'Email for a table', whatsapp:'Open WhatsApp to request a table', source:'Restaurant information',
  },
  es: {
    unresolved:'No hay una vía de reserva verificada. Aún no puedes enviar una reserva aquí.',
    unresolved_branch:'No se ha identificado el restaurante o la sucursal exacta. Aún no se puede reservar aquí.',
    closed_reported:'Se informa que el restaurante está cerrado, pero el restaurante no lo ha confirmado. No se puede reservar aquí.',
    closed:'El restaurante está cerrado y no acepta reservas.',
    walk_in:'El restaurante atiende sin reserva. Las mesas se asignan al llegar.',
    takeaway:'El restaurante ofrece comida para llevar. No se han verificado reservas de mesa.',
    manual:'Contacta con el restaurante para solicitar una mesa. La solicitud solo se convierte en reserva cuando el restaurante la confirma.',
    external:'Abre la página de reservas del restaurante para consultar las opciones disponibles.',
    selection:'El formulario incluye varios restaurantes. Selecciona únicamente',
    selectionLimit:'La hora indicada es una preferencia, no disponibilidad verificada. Espera la confirmación del restaurante por correo electrónico.',
    open:'Abrir la página de reservas del restaurante', phone:'Llamar para solicitar mesa', email:'Enviar un correo para solicitar mesa', whatsapp:'Abrir WhatsApp para solicitar mesa', source:'Información del restaurante',
  },
  fr: {
    unresolved:'Aucun moyen de réservation vérifié n’est disponible. Vous ne pouvez pas encore envoyer de réservation ici.',
    unresolved_branch:'Le restaurant ou l’établissement exact n’a pas été identifié. La réservation n’est pas encore disponible ici.',
    closed_reported:'Le restaurant est signalé fermé, mais il ne l’a pas confirmé. La réservation n’est pas disponible ici.',
    closed:'Le restaurant est fermé et n’accepte pas de réservations.',
    walk_in:'Le restaurant accueille sans réservation. Les tables sont attribuées à l’arrivée.',
    takeaway:'Le restaurant propose des plats à emporter. Les réservations de table ne sont pas vérifiées.',
    manual:'Contactez le restaurant pour demander une table. Votre demande devient une réservation uniquement après confirmation du restaurant.',
    external:'Ouvrez la page de réservation du restaurant pour consulter les possibilités proposées.',
    selection:'Ce formulaire concerne plusieurs restaurants. Sélectionnez uniquement',
    selectionLimit:'L’heure indiquée est un souhait, pas une disponibilité vérifiée. Attendez la confirmation du restaurant par e-mail.',
    open:'Ouvrir la page de réservation du restaurant', phone:'Appeler pour une table', email:'Envoyer un e-mail pour une table', whatsapp:'Ouvrir WhatsApp pour demander une table', source:'Informations du restaurant',
  },
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const https = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
export function external200ContactHref(contact) {
  if (!contact) return null;
  const value = String(contact.value || '').trim();
  if (contact.type === 'line' && /^@[a-z0-9_.-]+$/i.test(value)) return https(contact.source);
  if (contact.type === 'email' && /^[a-z0-9.!_+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) return 'mailto:' + value;
  if (['phone','whatsapp'].includes(contact.type) && /^\+[1-9][0-9]{7,14}$/.test(value)) return contact.type === 'phone' ? 'tel:' + value : 'https://wa.me/' + value.slice(1);
  return null;
}

// A validated existing adapter always wins, including request-only terms.
// No form, storage write, request submission, or inventory claim is made here.
export function external200BookingPanel(restaurantId, provider, language = 'en') {
  if (provider || !Object.hasOwn(external200Routes, restaurantId)) return null;
  const row = external200Routes[restaurantId];
  const c = copy[language] || copy.en;
  const binding = resolveExternal200ReviewedLink(restaurantId, row.source, row.externalUrl);
  const external = binding?.url || null;
  const contact = external200ContactHref(resolveExternal200ReviewedContact(restaurantId, row.contact));
  const inactive = ['closed','closed_reported','walk_in','takeaway','unresolved_branch'].includes(row.status);
  const kind = inactive ? row.status : external ? 'external' : contact ? 'manual' : 'unresolved';
  const href = !inactive ? external || contact : null;
  const label = external ? c.open : row.contact?.type === 'line' ? c.source + ' · LINE ' + row.contact.value : c[row.contact?.type];
  const source = resolveExternal200ReviewedSource(restaurantId, row.source);
  const request = kind === 'external' && (binding?.bookingMode || row.bookingMode) === 'request_only' ? `<p>${esc(getBookingCopy(language).requestNotice)}</p>` : '';
  const selection = kind === 'external' && binding?.selection ? `<p class="external200-branch-instruction">${esc(c.selection)} <strong>${esc(binding.selection.branch)}</strong> / <strong>${esc(binding.selection.reservationType)}</strong>. ${esc(c.selectionLimit)}</p>` : '';
  const policy = href ? `<p>${esc(getBookingCopy(language).policyCheck)}</p>` : '';
  const alternative = !inactive && external && contact ? `<p><a class="restaurant-official-book" href="${esc(contact)}"${contact.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(c[row.contact.type] || c.source)}</a></p>` : '';
  return `<div class="external200-booking-status" data-booking-status="${esc(kind)}" role="status"><p>${esc(c[kind])}</p>${request}${selection}${href ? `<a class="btn btn-gold btn-block" href="${esc(href)}"${href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(label)}</a>` : ''}${alternative}${policy}${source ? `<p><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(c.source)} ↗</a></p>` : ''}</div>`;
}
