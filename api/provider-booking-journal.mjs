import crypto from 'node:crypto';
import { publicBookingResult } from './booking-result.mjs';

// Server-only adapter hooks. There is deliberately no HTTP reserve/record API.
// Provider URLs, policy, owner and intent must come from the configured adapter.
export function createProviderJournal({ ledger, register, provider, restaurants,
  mode = 'live', confirmationPolicySource = null }) {
  const fail = code => { throw Object.assign(new Error(code), {status:409}); };
  const venue = id => Object.hasOwn(restaurants, id) && restaurants[id];
  const row = (attempt, owner) => ({
    id:`PB-${attempt.attemptId}`,userId:owner,provider,restaurantId:attempt.restaurantId,
    restaurant:venue(attempt.restaurantId)?.name || attempt.restaurantId,
    destination:venue(attempt.restaurantId)?.city || '',date:attempt.date,time:attempt.time,
    party:attempt.party,status:attempt.status,providerReference:attempt.reference || '',
    createdAt:attempt.createdAt,updatedAt:attempt.updatedAt,
  });
  function scope(intent) {
    if (!intent || intent.provider !== provider || !venue(intent.restaurantId)
      || !['hold','booking'].includes(intent.phase) || !intent.owner || !intent.sessionId
      || !/^[a-f0-9]{64}$/.test(intent.reviewFingerprint || '')) fail('intent_binding');
    const rooms = venue(intent.restaurantId).rooms;
    if (rooms && !rooms.some(room=>room.id === intent.details?.roomId && room.name === intent.details?.roomName)) fail('room_binding');
  }
  function proofMatches(result, attempt) {
    const proof=result?.verification;
    const policy = venue(attempt.restaurantId)?.confirmationPolicySource ?? confirmationPolicySource;
    const rooms = venue(attempt.restaurantId)?.rooms;
    return typeof policy === 'string' && policy.length > 0
      && (!rooms || (rooms.some(room=>room.id === attempt.roomId && room.name === attempt.roomName)
        && proof?.roomId === attempt.roomId && proof?.roomName === attempt.roomName))
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
        ...(venue(intent.restaurantId).rooms ? {roomId:intent.details.roomId,roomName:intent.details.roomName} : {})});
      if (!gate.sendAllowed) fail('already_attempted');
      if (intent.phase === 'booking') register.upsert(row(gate.attempt,intent.owner));
      return gate;
    },
    recordAttempt({intent,attempt:claimed,result}) {
      scope(intent);
      const attempt=ledger.get(intent.owner,claimed?.attemptId);
      if (!attempt || attempt.provider !== provider || attempt.mode !== mode
        || ['restaurantId','sessionId','phase','reviewFingerprint'].some(key=>attempt[key]!==intent[key])
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
      if (!attempt || attempt.provider !== provider || attempt.mode !== mode || !venue(attempt.restaurantId)
        || attempt.phase !== 'booking' || attempt.status !== 'confirmed'
        || attempt.restaurantId !== snapshot.restaurantId || attempt.sessionId !== snapshot.id
        || (venue(attempt.restaurantId).rooms && (snapshot.details?.roomId !== attempt.roomId || snapshot.details?.roomName !== attempt.roomName))
        || attempt.reference !== snapshot.result.reference || !proofMatches(snapshot.result,attempt)) return null;
      return publicBookingResult({...snapshot.result,verification:{...proof,detailsDigest:attempt.reviewFingerprint}});
    },
  };
}
