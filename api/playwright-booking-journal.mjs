import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Bridge the native Bokabord hook to the shared ledger. The old JSON journal is
// a read-only duplicate guard; all new attempts have exactly one write authority.
export function createBookingJournalHooks({ ledger, legacyLedger, register, restaurants }) {
  const row = (attempt, owner, restaurant) => ({
    id: `PB-${attempt.attemptId}`, userId: owner, restaurantId: attempt.restaurantId,
    restaurant, destination: 'Stockholm', provider: attempt.provider,
    date: attempt.date, time: attempt.time, party: attempt.party,
    status: attempt.status, providerReference: attempt.reference || '',
    createdAt: attempt.createdAt, updatedAt: attempt.updatedAt,
  });
  return {
    reserveSubmission(approval, session) {
      if (!restaurants[session.restaurantId] || !session.owner || !session.id) throw new Error('invalid_session');
      const oldKey = legacyLedger.key(approval, session);
      // Existence, including an unreadable/partial old journal, must fail closed.
      if (fs.existsSync(path.join(legacyLedger.directory, `${oldKey}.json`))) throw new Error('already_attempted');
      const input = {
        owner: session.owner, provider: 'BokaBord', restaurantId: session.restaurantId,
        sessionId: session.id, mode: 'live', idempotencyKey: session.id,
        reviewFingerprint: crypto.createHash('sha256').update(JSON.stringify({
          restaurantId: session.restaurantId, revision: session.revision, approval,
        })).digest('hex'),
        date: approval.date, time: approval.time, party: approval.party,
      };
      const gate = ledger.reserve(input);
      // Native adapters do not inspect hook return values. Throw BEFORE any send.
      if (!gate.sendAllowed) throw new Error('already_attempted');
      session.playwrightAttempt = gate.attempt;
      register.upsert(row(gate.attempt, session.owner, session.restaurant));
    },
    recordResult(session) {
      const attempt = session.playwrightAttempt;
      if (!attempt) return;
      const result = session.result || { status: 'unknown' };
      // Current native Bokabord verifier has no reviewed positive confirmation
      // mapping. Only explicitly recognized payment/rejection can be final here.
      const known = ['payment_required', 'rejected'].includes(result.status);
      const saved = ledger.record(session.owner, attempt.attemptId, {
        ...attempt, status: known ? result.status : 'unknown',
        reference: result.reference || null, source: 'provider', verified: known,
      });
      session.playwrightAttempt = saved;
      register.upsert(row(saved, session.owner, session.restaurant));
    },
    recover(owner) {
      const attempts = ledger.list(owner);
      for (const attempt of attempts) register.upsert(row(attempt, owner, restaurants[attempt.restaurantId]?.name || attempt.restaurantId));
      return attempts;
    },
  };
}
