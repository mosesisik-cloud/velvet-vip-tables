import { currentLang } from './i18n.js?v=159b';

// Shared cleanup copy: keys map to Swedish, English, Spanish and French.
const copy = {
  draft: ['Utkast – inte skickat', 'Draft – not sent', 'Borrador – sin enviar', 'Brouillon – non envoyé'],
  requested: ['Förfrågan skickad', 'Request sent', 'Solicitud enviada', 'Demande envoyée'],
  received: ['Mottagen av restaurangen', 'Received by the restaurant', 'Recibida por el restaurante', 'Reçue par le restaurant'],
  confirmed: ['Bekräftad av restaurangen', 'Confirmed by the restaurant', 'Confirmada por el restaurante', 'Confirmée par le restaurant'],
  reported: ['Bekräftelse uppgiven av gästen', 'Confirmation reported by guest', 'Confirmación indicada por el cliente', 'Confirmation déclarée par le client'],
  declined: ['Inte bekräftad', 'Not confirmed', 'Sin confirmar', 'Non confirmée'],
  unknown: ['Resultatet behöver kontrolleras', 'Result needs checking', 'Hay que comprobar el resultado', 'Résultat à vérifier'],
  paymentRequired: ['Betalning krävs hos leverantören', 'Payment required with provider', 'Pago requerido con el proveedor', 'Paiement requis chez le prestataire'],
  processing: ['Behandlas', 'Processing', 'En proceso', 'En cours'],
  draftHint: ['Sparat på den här enheten. Ingen förfrågan har skickats till restaurangen.', 'Saved on this device. No request has been sent to the restaurant.', 'Guardado en este dispositivo. No se ha enviado ninguna solicitud al restaurante.', 'Enregistré sur cet appareil. Aucune demande n’a été envoyée au restaurant.'],
  requestedHint: ['Förfrågan har skickats. Bordet är ännu inte bekräftat.', 'Request sent. The table is not yet confirmed.', 'Solicitud enviada. La mesa aún no está confirmada.', 'Demande envoyée. La table n’est pas encore confirmée.'],
  receivedHint: ['Restaurangen har mottagit förfrågan och behöver bekräfta bordet.', 'The restaurant has received the request and must confirm the table.', 'El restaurante ha recibido la solicitud y debe confirmar la mesa.', 'Le restaurant a reçu la demande et doit confirmer la table.'],
  confirmedHint: ['Restaurangen har bekräftat bokningen.', 'The restaurant has confirmed the booking.', 'El restaurante ha confirmado la reserva.', 'Le restaurant a confirmé la réservation.'],
  reportedHint: ['Sparad från gästens uppgifter. Bekräftelsen är inte verifierad av Velvet.', 'Saved from guest details. Velvet has not verified the confirmation.', 'Guardada según los datos del cliente. Velvet no ha verificado la confirmación.', 'Enregistrée selon les informations du client. Velvet n’a pas vérifié la confirmation.'],
  declinedHint: ['Den önskade bokningen kunde inte bekräftas.', 'The requested booking could not be confirmed.', 'No se pudo confirmar la reserva solicitada.', 'La réservation demandée n’a pas pu être confirmée.'],
  unknownHint: ['Kontrollera med restaurangen innan du försöker boka igen.', 'Check with the restaurant before booking again.', 'Consulta con el restaurante antes de volver a reservar.', 'Vérifiez auprès du restaurant avant de réserver à nouveau.'],
  paymentRequiredHint: ['Slutför enligt leverantörens instruktioner. Betalning är inte en bokningsbekräftelse.', 'Follow the provider’s instructions. Payment is not booking confirmation.', 'Sigue las instrucciones del proveedor. El pago no confirma la reserva.', 'Suivez les instructions du prestataire. Le paiement ne confirme pas la réservation.'],
  processingHint: ['Ingen bekräftad reservation finns ännu. Kontrollera status hos restaurangen.', 'No confirmed reservation yet. Check status with the restaurant.', 'Aún no hay una reserva confirmada. Consulta el estado con el restaurante.', 'Aucune réservation confirmée pour le moment. Vérifiez le statut auprès du restaurant.'],
  removeLocal: ['Ta bort från min lista', 'Remove from my list', 'Quitar de mi lista', 'Retirer de ma liste'],
  removeHint: ['Detta avbokar inte hos restaurangen eller klubben.', 'This does not cancel with the restaurant or club.', 'Esto no cancela la reserva con el restaurante o club.', 'Cela n’annule pas auprès du restaurant ou du club.'],
  notPublished: ['Platserna kunde inte publiceras. Sällskapet är endast sparat på den här enheten.', 'Seats could not be published. The group is only saved on this device.', 'No se pudieron publicar las plazas. El grupo solo está guardado en este dispositivo.', 'Les places n’ont pas pu être publiées. Le groupe est enregistré uniquement sur cet appareil.'],
  cardRequired: ['Kort behöver anslutas', 'Card connection required', 'Debes vincular una tarjeta', 'Carte à associer'],
  verificationRequired: ['Verifiering krävs', 'Verification required', 'Verificación requerida', 'Vérification requise'],
  noMethods: ['Betalning är inte tillgänglig just nu. Gå tillbaka till ditt sällskap.', 'Payment is currently unavailable. Return to your group.', 'El pago no está disponible ahora. Vuelve a tu grupo.', 'Le paiement est indisponible pour le moment. Revenez à votre groupe.'],
  pendingPayment: ['Betalningen kontrolleras. Vänta på besked innan du betalar igen.', 'Payment is being checked. Wait for confirmation before paying again.', 'Se está comprobando el pago. Espera la confirmación antes de pagar de nuevo.', 'Le paiement est en cours de vérification. Attendez la confirmation avant de payer à nouveau.'],
  bridgeIntro: ['Förbered dina önskemål för {name}. Bokningen slutförs hos klubben eller dess bokningsleverantör.', 'Prepare your request for {name}. Complete the booking with the club or its booking provider.', 'Prepara tu solicitud para {name}. Completa la reserva con el club o su proveedor.', 'Préparez votre demande pour {name}. Finalisez la réservation auprès du club ou de son prestataire.'],
  prepareRequest: ['Skapa bokningsunderlag', 'Prepare booking details', 'Preparar datos de reserva', 'Préparer les informations de réservation'],
  preparedHint: ['Underlaget är sparat. Det är ingen bekräftad bokning. Fortsätt hos klubben för att slutföra.', 'Details saved. This is not a confirmed booking. Continue with the club to complete it.', 'Datos guardados. No es una reserva confirmada. Continúa con el club para completarla.', 'Informations enregistrées. Ce n’est pas une réservation confirmée. Continuez auprès du club pour la finaliser.'],
  requestFailed: ['Det gick inte att skapa underlaget. Dina val finns kvar; försök igen.', 'Could not prepare the details. Your choices are kept; try again.', 'No se pudieron preparar los datos. Tus opciones se conservan; vuelve a intentarlo.', 'Impossible de préparer les informations. Vos choix sont conservés ; réessayez.'],
  viewRestaurant: ['Visa restaurangen', 'View restaurant', 'Ver restaurante', 'Voir le restaurant'],
};
export function uxT(key, lang = currentLang()) {
  const index = ['sv', 'en', 'es', 'fr'].indexOf(lang);
  return copy[key]?.[index < 0 ? 1 : index] || key;
}
