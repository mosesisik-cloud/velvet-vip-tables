import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { bokabordApprovalDigest, verifyZinkBookingConfirmation } from './bokabord-confirmation-policy.mjs';
import { classifyBokabordResult } from './booking-result.mjs';
import { createBokabordReceiptVerifier } from './bokabord-receipt-confirmation.mjs';

// Bridge the native Bokabord hook to the shared ledger. The old JSON journal is
// a read-only duplicate guard; all new attempts have exactly one write authority.
export function createBookingJournalHooks({ ledger, legacyLedger, register, restaurants, receiptPolicies = [] }) {
  const receiptVerifiers = new Map(receiptPolicies.map(policy => [policy.restaurantId,createBokabordReceiptVerifier(policy)]));
  const mealLabels = new Map(receiptPolicies.filter(policy => policy.mealLabel).map(policy => [policy.restaurantId,policy.mealLabel]));
  const row = (attempt, owner, restaurant) => ({
    id: `PB-${attempt.attemptId}`, userId: owner, restaurantId: attempt.restaurantId,
    restaurant, destination: 'Stockholm', provider: attempt.provider,
    date: attempt.date, time: attempt.time, party: attempt.party,
    ...(mealLabels.has(attempt.restaurantId) ? {mealLabel:mealLabels.get(attempt.restaurantId)} : {}),
    status: attempt.status, providerReference: attempt.reference || '',
    createdAt: attempt.createdAt, updatedAt: attempt.updatedAt,
  });
  return {
    reserveSubmission(approval, session) {
      if (!restaurants[session.restaurantId] || !session.owner || !session.id) throw new Error('invalid_session');
      const oldKey = legacyLedger.key(approval, session);
      // Existence, including an unreadable/partial old journal, must fail closed.
      if (fs.existsSync(path.join(legacyLedger.directory, `${oldKey}.json`))) throw new Error('already_attempted');
      const receiptDigest = receiptVerifiers.get(session.restaurantId)?.approvalDigest(approval);
      const input = {
        owner: session.owner, provider: 'BokaBord', restaurantId: session.restaurantId,
        sessionId: session.id, mode: 'live', idempotencyKey: session.id,
        reviewFingerprint: receiptDigest || bokabordApprovalDigest(approval) || crypto.createHash('sha256').update(JSON.stringify({
          restaurantId: session.restaurantId, revision: session.revision, approval,
        })).digest('hex'),
        date: approval.date, time: approval.time, party: approval.party,
      };
      const gate = ledger.reserve(input);
      // Native adapters do not inspect hook return values. Throw BEFORE any send.
      if (!gate.sendAllowed) throw new Error('already_attempted');
      session.playwrightAttempt = gate.attempt;
      session.receiptVerificationEnabled = !!receiptDigest;
      register.upsert(row(gate.attempt, session.owner, session.restaurant));
    },
    verifyResult(data, session, receiptObservation = null) {
      const reserved = session.playwrightAttempt;
      if (reserved && session.submitted === true) {
        // One canonical approved-details digest across policy and durable store.
        // The observation originates only in this session's intercepted response.
        const attempt = { ...reserved, detailsDigest: reserved.reviewFingerprint, dispatched: true };
        const receiptVerifier = receiptVerifiers.get(session.restaurantId);
        if (receiptVerifier && session.receiptVerificationEnabled && receiptObservation) {
          const verified = receiptVerifier.verify({...attempt,dispatchedAt:session.dispatchObservation?.dispatchedAt},session.approval,{
            ...attempt,source:'provider',data,...receiptObservation,
          });
          if (verified.status === 'confirmed') return verified;
        }
        const verified = verifyZinkBookingConfirmation(attempt, session.approval, {
          ...attempt, httpOk: true, source: 'provider', data,
        });
        if (verified.status === 'confirmed') return verified;
      }
      return classifyBokabordResult(data);
    },
    recordResult(session) {
      const attempt = session.playwrightAttempt;
      if (!attempt) return;
      const result = session.result || { status: 'unknown' };
      const proof = result.verification;
      const confirmed = result.status === 'confirmed' && proof?.verified === true
        && proof.source === 'provider' && proof.detailsDigest === attempt.reviewFingerprint
        && ['provider','restaurantId','sessionId','attemptId','idempotencyKey'].every(key => proof[key] === attempt[key]);
      const known = confirmed || ['payment_required', 'rejected'].includes(result.status);
      const saved = ledger.record(session.owner, attempt.attemptId, {
        ...attempt, status: known ? result.status : 'unknown',
        reference: result.reference || null, source: 'provider', verified: known,
      });
      session.playwrightAttempt = saved;
      register.upsert(row(saved, session.owner, session.restaurant));
    },
    recover(owner) {
      const attempts = ledger.list(owner);
      for (const attempt of attempts) if (attempt.provider === 'BokaBord' && (attempt.phase ?? 'booking') === 'booking') {
        register.upsert(row(attempt, owner, restaurants[attempt.restaurantId]?.name || attempt.restaurantId));
      }
      return attempts;
    },
  };
}
