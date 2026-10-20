import { cleanBookingOffer, sameBookingOffer } from './booking-offer.mjs';
import crypto from 'node:crypto';
import { publicBookingResult } from './booking-result.mjs';

// Server-only adapter hooks. There is deliberately no HTTP reserve/record API.
// Provider URLs, policy, owner and intent must come from the configured adapter.
export function createProviderJournal({ ledger, register, provider, restaurants,
  mode = 'live', confirmationPolicySource = null }) {
  const fail = code => { throw Object.assign(new Error(code), {status:409}); };
  const venue = id => Object.hasOwn(restaurants, id) && restaurants[id];
  const dateInScope = (id,date) => provider !== 'Zenchef' || (id !== 'curated-PAR-bouillon-julien' && id !== 'curated-PAR-brasserie-rosie-jolie') || (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && (id === 'curated-PAR-bouillon-julien' ? !['12-24','12-25','12-31'].includes(date.slice(5)) : !(date.slice(5) >= '08-03' && date.slice(5) <= '08-23')));
  const timeInScope = (id,time) => provider !== 'Zenchef' || id !== 'curated-PAR-bouillon-republique' || ['11:30','12:00','12:30','13:00','13:30','14:00','14:30'].includes(time);
  const christineDetails = (details, contact = false) => !!details && typeof details === 'object' && !Array.isArray(details)
    && Object.keys(details).every(key => ['date','time','party','shiftId','offer',
      ...(contact ? ['firstname','lastname','email','phone','civility','country'] : [])].includes(key));
  const durationVenue = id => provider === 'Zenchef' && id === 'curated-PAR-la-plage-parisienne';
  const purposeVenue = id => provider === 'Zenchef' && id === 'curated-PAR-indiana-cafe-montparnasse';
  const visitReasonVenue = id => provider === 'Zenchef' && ['curated-PAR-indiana-cafe-les-halles','curated-PAR-indiana-cafe-ternes'].includes(id);
  const validVisitReason = (id,value) => (id === 'curated-PAR-indiana-cafe-ternes' ? ['Déjeuner / Diner','Grignoter','Boire une verre'] : ['déjeuner/ dîner','grignotter','boire un verre ']).includes(value);
  const validPurpose = value => typeof value === 'string' && !!value.trim() && value.length <= 200 && !/[\x00-\x1f\x7f]/.test(value);
  const sameScopedDetails = (attempt,details) => durationVenue(attempt.restaurantId) ? (attempt.details?.reservationSaturdayDurationAcknowledged === true && details?.reservationSaturdayDurationAcknowledged === true && details?.date === attempt.date && details?.time === attempt.time && details?.party === attempt.party) : visitReasonVenue(attempt.restaurantId) ? (validVisitReason(attempt.restaurantId,attempt.details?.reservationVisitReason) && details?.reservationVisitReason === attempt.details.reservationVisitReason && details?.date === attempt.date && details?.time === attempt.time && details?.party === attempt.party) : purposeVenue(attempt.restaurantId) ? (validPurpose(attempt.details?.reservationPurpose) && details?.reservationPurpose === attempt.details.reservationPurpose && details?.date === attempt.date && details?.time === attempt.time && details?.party === attempt.party) : !['curated-PAR-chez-fernand-christine','curated-PAR-bouillon-julien','curated-PAR-bouillon-republique','curated-PAR-brasserie-rosie-jolie'].includes(attempt.restaurantId) || (dateInScope(attempt.restaurantId,attempt.date) && timeInScope(attempt.restaurantId,attempt.time) && details?.date === attempt.date && details?.time === attempt.time && details?.party === attempt.party);
  const row = (attempt, owner) => ({
    id:`PB-${attempt.attemptId}`,userId:owner,provider,restaurantId:attempt.restaurantId,
    restaurant:venue(attempt.restaurantId)?.name || attempt.restaurantId,
    destination:venue(attempt.restaurantId)?.city || '',date:attempt.date,time:attempt.time,
    ...(Number.isSafeInteger(attempt.roomId) && attempt.roomName ? {roomId:attempt.roomId,roomName:attempt.roomName} : {}),
    ...(attempt.details?.offer ? {offer:cleanBookingOffer(attempt.details.offer,attempt.restaurantId)} : {}),
    party:attempt.party,status:attempt.status,providerReference:attempt.reference || '',
    createdAt:attempt.createdAt,updatedAt:attempt.updatedAt,
  });
  function scope(intent) {
    const cartPhase=['cart_init','cart','cart_update'].includes(intent?.phase) && provider==='TableCheck'
      && intent.restaurantId==='osm-BAL-sazon' && venue(intent.restaurantId)?.cartPreparation===true;
    if (!intent || intent.provider !== provider || !venue(intent.restaurantId)
      || (!['hold','booking'].includes(intent.phase) && !cartPhase) || !intent.owner || !intent.sessionId
      || !/^[a-f0-9]{64}$/.test(intent.reviewFingerprint || '')) fail('intent_binding');
    if (!dateInScope(intent.restaurantId,intent.details?.date)) fail('special_date_unsupported');
    if (!timeInScope(intent.restaurantId,intent.details?.time)) fail('lunch_time_unsupported');
    if (purposeVenue(intent.restaurantId) ? !validPurpose(intent.details?.reservationPurpose) : intent.details?.reservationPurpose !== undefined) fail('purpose_binding');
    if (visitReasonVenue(intent.restaurantId) ? !validVisitReason(intent.restaurantId,intent.details?.reservationVisitReason) : intent.details?.reservationVisitReason !== undefined) fail('visit_reason_binding');
    if (durationVenue(intent.restaurantId) ? intent.details?.reservationSaturdayDurationAcknowledged !== true : intent.details?.reservationSaturdayDurationAcknowledged !== undefined) fail('duration_acknowledgement_binding');
    if (intent.restaurantId === 'curated-PAR-chez-fernand-christine' && !christineDetails(intent.details)) fail('offer_binding');
    const configured=venue(intent.restaurantId).offer;
    const shift=venue(intent.restaurantId).shiftId;
    if (shift && (intent.details?.shiftId !== shift || intent.details?.party !== 2 || intent.phase !== 'booking')) fail('shift_binding');
    if (configured) {
      const offer=cleanBookingOffer(intent.details?.offer,intent.restaurantId);
      if (!offer || offer.offerId !== configured.offerId || offer.count !== configured.count || offer.count !== intent.details?.party) fail('offer_binding');
    } else if (intent.details?.offer !== undefined) fail('offer_binding');
    const rooms = venue(intent.restaurantId).rooms;
    if (rooms && !rooms.some(room=>room.id === intent.details?.roomId && room.name === intent.details?.roomName)) fail('room_binding');
  }
  function proofMatches(result, attempt) {
    const proof=result?.verification;
    const policy = venue(attempt.restaurantId)?.confirmationPolicySource ?? confirmationPolicySource;
    const rooms = venue(attempt.restaurantId)?.rooms;
    return dateInScope(attempt.restaurantId,attempt.date) && timeInScope(attempt.restaurantId,attempt.time) && typeof policy === 'string' && policy.length > 0
      && (!rooms || (rooms.some(room=>room.id === attempt.roomId && room.name === attempt.roomName)
        && proof?.roomId === attempt.roomId && proof?.roomName === attempt.roomName))
      && (!venue(attempt.restaurantId)?.roomEvidence || proof?.roomEvidence === venue(attempt.restaurantId).roomEvidence)
      && (!venue(attempt.restaurantId)?.orderEvidence || proof?.orderEvidence === venue(attempt.restaurantId).orderEvidence)
      && (!venue(attempt.restaurantId)?.shiftId || (attempt.details?.shiftId === venue(attempt.restaurantId).shiftId
        && attempt.party === 2 && proof?.shiftId === attempt.details.shiftId && proof?.bookingEvidence === 'own_booking_readback'))
      && (!venue(attempt.restaurantId)?.offer || (cleanBookingOffer(attempt.details?.offer,attempt.restaurantId)
        && proof?.offerEvidence === 'own_booking_readback'
        && proof.offerId === attempt.details.offer.offerId && proof.offerCount === attempt.details.offer.count
        && proof.offerVersion === attempt.details.offer.version))
      && proof?.verified === true && proof.policySource === policy
      && proof.source === (mode === 'live' ? 'provider' : 'fixture')
      && (proof.reviewFingerprint ?? proof.detailsDigest) === attempt.reviewFingerprint
      && ['provider','restaurantId','sessionId','attemptId','idempotencyKey'].every(key=>proof[key]===attempt[key]);
  }
  return {
    reserveAttempt(intent) {
      scope(intent);
      const idempotencyKey=crypto.createHash('sha256').update(JSON.stringify([intent.sessionId,intent.phase])).digest('hex');
      const gate=ledger.reserve({owner:intent.owner,provider,restaurantId:intent.restaurantId,
        sessionId:intent.sessionId,phase:intent.phase,mode,idempotencyKey,
        reviewFingerprint:intent.reviewFingerprint,date:intent.details?.date,
        time:intent.details?.time,party:intent.details?.party,
        ...(venue(intent.restaurantId).offer || venue(intent.restaurantId).shiftId ? {details:{
          ...(venue(intent.restaurantId).offer ? {offer:cleanBookingOffer(intent.details.offer,intent.restaurantId)} : {}),
          ...(venue(intent.restaurantId).shiftId ? {shiftId:intent.details.shiftId} : {}),
          ...(purposeVenue(intent.restaurantId) ? {reservationPurpose:intent.details.reservationPurpose} : {}),
          ...(visitReasonVenue(intent.restaurantId) ? {reservationVisitReason:intent.details.reservationVisitReason} : {}),
          ...(durationVenue(intent.restaurantId) ? {reservationSaturdayDurationAcknowledged:true} : {})}} : {}),
        ...(venue(intent.restaurantId).rooms ? {roomId:intent.details.roomId,roomName:intent.details.roomName} : {})});
      if (!gate.sendAllowed) fail('already_attempted');
      if (intent.phase === 'booking') register.upsert(row(gate.attempt,intent.owner));
      return gate;
    },
    recordAttempt({intent,attempt:claimed,result}) {
      scope(intent);
      const attempt=ledger.get(intent.owner,claimed?.attemptId);
      if (!attempt || !sameScopedDetails(attempt,intent.details) || attempt.provider !== provider || attempt.mode !== mode
        || ['restaurantId','sessionId','phase','reviewFingerprint'].some(key=>attempt[key]!==intent[key])
        || !sameBookingOffer(attempt.details?.offer,intent.details?.offer)
        || (venue(intent.restaurantId).shiftId && attempt.details?.shiftId !== intent.details?.shiftId)
        || (venue(intent.restaurantId).rooms && (attempt.roomId !== intent.details.roomId || attempt.roomName !== intent.details.roomName))) fail('attempt_binding');
      // A hold is never a confirmed booking and its capability never leaves the
      // adapter's memory. Unknown dispatch remains consumed across restarts.
      const verified=intent.phase === 'booking' && proofMatches(result,attempt);
      const status=verified && ['confirmed','rejected','payment_required','pending'].includes(result?.status)
        ? result.status : 'unknown';
      const saved=ledger.record(intent.owner,attempt.attemptId,{...attempt,
        source:mode === 'live' ? 'provider' : 'fixture',status,verified,
        reference:verified ? result.reference ?? null : null});
      if (intent.phase === 'booking') register.upsert(row(saved,intent.owner));
      return saved;
    },
    recover(owner) {
      const attempts=ledger.list(owner).filter(a=>a.provider===provider);
      for (const attempt of attempts) if (attempt.phase === 'booking') register.upsert(row(attempt,owner));
      return attempts;
    },
    verifySnapshot(snapshot,owner) {
      const proof=snapshot.result?.verification;
      const attempt=proof?.attemptId && ledger.get(owner,proof.attemptId);
      if ((snapshot.restaurantId === 'curated-PAR-chez-fernand-christine' && !christineDetails(snapshot.details,true))
        || !attempt || !sameScopedDetails(attempt,snapshot.details) || attempt.provider !== provider || attempt.mode !== mode || !venue(attempt.restaurantId)
        || attempt.phase !== 'booking' || attempt.status !== 'confirmed'
        || attempt.restaurantId !== snapshot.restaurantId || attempt.sessionId !== snapshot.id
        || !sameBookingOffer(attempt.details?.offer,snapshot.details?.offer)
        || (venue(attempt.restaurantId).shiftId && snapshot.details?.shiftId !== attempt.details?.shiftId)
        || (venue(attempt.restaurantId).rooms && (snapshot.details?.roomId !== attempt.roomId || snapshot.details?.roomName !== attempt.roomName))
        || attempt.reference !== snapshot.result.reference || !proofMatches(snapshot.result,attempt)) return null;
      return publicBookingResult({...snapshot.result,verification:{...proof,detailsDigest:attempt.reviewFingerprint}});
    },
  };
}
