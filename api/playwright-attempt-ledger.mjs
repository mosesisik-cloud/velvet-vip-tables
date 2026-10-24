import { cleanBookingOffer, sameBookingOffer } from './booking-offer.mjs';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class AttemptLedgerError extends Error {
  constructor(code, status = 409) { super(code); this.status = status; }
}
const fail = code => { throw new AttemptLedgerError(code, 400); };
const token = (value, name) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 256 || /[\x00-\x1f\x7f]/.test(value)) fail(name);
  return value;
};
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const bindKeys = ['provider', 'restaurantId', 'sessionId', 'mode', 'idempotencyKey', 'reviewFingerprint', 'roomId', 'roomName'];
const states = new Set(['unknown', 'pending', 'confirmed', 'rejected', 'payment_required']);
const holdStates = new Set(['unknown', 'pending', 'rejected']);
const phaseOf = value => value.phase === undefined ? 'booking' : value.phase;
const decode = payload => { const attempt = JSON.parse(payload); return { ...attempt, phase: phaseOf(attempt) }; };

function validate(input) {
  if (!input || typeof input !== 'object') fail('invalid_attempt');
  const clean = {};
  for (const key of ['owner', 'provider', 'restaurantId', 'sessionId']) clean[key] = token(input[key], `invalid_${key}`);
  if (!['live', 'fixture'].includes(input.mode)) fail('invalid_mode');
  const cartPhase=['cart_init','cart','cart_update'].includes(phaseOf(input));
  if (!['hold', 'booking'].includes(phaseOf(input)) && !(cartPhase && input.provider==='TableCheck'
    && input.restaurantId==='osm-BAL-sazon' && input.party===2)) fail('invalid_phase');
  if (typeof input.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(input.idempotencyKey)) fail('invalid_idempotency_key');
  if (typeof input.reviewFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(input.reviewFingerprint)) fail('invalid_review_fingerprint');
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) fail('invalid_date');
  const date = new Date(input.date + 'T12:00:00Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0, 10) !== input.date) fail('invalid_date');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-bistrot-de-lyon' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-cerf-volant' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-merciere' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-shiyo' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-vivarais' && ![2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-brasserie-roseaux' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-nosch' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-maison-moly' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-comptoir-chabert' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-bistrot-abel' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-cafe-comptoir-abel' && ![1,2,3,4,5].includes(date.getUTCDay())) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-PAR-bouillon-julien' && ['12-24','12-25','12-31'].includes(input.date.slice(5))) fail('special_date_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-PAR-brasserie-rosie-jolie' && input.date.slice(5) >= '08-03' && input.date.slice(5) <= '08-23') fail('special_date_unsupported');
  if (typeof input.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) fail('invalid_time');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-PAR-bouillon-republique' && !['11:30','12:00','12:30','13:00','13:30','14:00','14:30'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-bistrot-de-lyon' && !['12:00','12:30','13:00','13:30','14:00'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-cerf-volant' && !['12:00','12:30','13:00','13:15','13:30'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-merciere' && !['12:00','12:15','12:30','13:30','13:45','14:00','14:15','14:30'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-shiyo' && !['11:45','12:00','12:15','12:30','12:45','13:00'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-le-vivarais' && !['12:00','12:15','12:45','13:00'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-brasserie-roseaux' && !['12:00','12:15','12:30','12:45','13:00','13:15','13:30'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-nosch' && !['12:00','12:15','12:30','12:45','13:30'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-maison-moly' && !['12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-comptoir-chabert' && !['12:00','12:15','12:30','12:45','13:00'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-bistrot-abel' && !['12:00','12:15','12:30','12:45','13:00','13:15','13:30'].includes(input.time)) fail('lunch_time_unsupported');
  if (input.provider === 'Zenchef' && input.restaurantId === 'curated-LYO-cafe-comptoir-abel' && !['12:00','12:15','12:30','12:45','13:00','13:15'].includes(input.time)) fail('lunch_time_unsupported');
  if (!Number.isInteger(input.party) || input.party < 1 || input.party > 100) fail('invalid_party');
  if (input.roomId !== undefined || input.roomName !== undefined) {
    if (!Number.isSafeInteger(input.roomId) || input.roomId <= 0) fail('invalid_room');
    clean.roomId = input.roomId; clean.roomName = token(input.roomName,'invalid_room');
  }
  const lunchShift = input.provider === 'Zenchef' ? (input.restaurantId === 'curated-PAR-bofinger' ? 19170 : input.restaurantId === 'curated-PAR-la-coupole' ? 20148 : input.restaurantId === 'curated-PAR-terminus-nord' ? 19380 : input.restaurantId === 'curated-PAR-le-procope' ? 18190 : input.restaurantId === 'curated-PAR-la-lorraine' ? 16674 : input.restaurantId === 'curated-PAR-au-pied-de-cochon' ? 29 : input.restaurantId === 'curated-PAR-le-grand-cafe-capucines' ? 19590 : input.restaurantId === 'curated-PAR-brasserie-vagenende' ? 63972 : input.restaurantId === 'curated-PAR-bouillon-julien' ? 12711 : input.restaurantId === 'curated-PAR-bouillon-racine' ? 93989 : input.restaurantId === 'curated-PAR-bouillon-republique' ? 528175 : input.restaurantId === 'curated-PAR-brasserie-rosie' ? 43203 : input.restaurantId === 'curated-PAR-brasserie-rosie-lou' ? 118503 : input.restaurantId === 'curated-PAR-brasserie-rosie-jolie' ? 298043 : input.restaurantId === 'curated-PAR-le-petit-sommelier' ? 37613 : input.restaurantId === 'curated-PAR-chez-savy' ? 68279 : input.restaurantId === 'curated-PAR-chez-rene' ? 68277 : input.restaurantId === 'curated-PAR-le-bistrot-de-paris' ? 68145 : input.restaurantId === 'curated-PAR-aux-bons-crus' ? 20711 : input.restaurantId === 'curated-PAR-aux-crus-de-bourgogne' ? 22200 : input.restaurantId === 'curated-PAR-le-petit-retro' ? 116623 : input.restaurantId === 'curated-PAR-au-moulin-a-vent' ? 139531 : input.restaurantId === 'curated-PAR-le-petit-pontoise' ? 9493 : input.restaurantId === 'curated-PAR-le-florentin' ? 283681 : input.restaurantId === 'curated-PAR-martha-pizze-amore' ? 159369 : input.restaurantId === 'curated-PAR-le-cafe-marly' ? 122853 : input.restaurantId === 'curated-PAR-le-cafe-ruc' ? 32216 : input.restaurantId === 'curated-PAR-indiana-cafe-bonne-nouvelle' ? 253448 : input.restaurantId === 'curated-PAR-indiana-cafe-richelieu-drouot' ? 276858 : input.restaurantId === 'curated-PAR-indiana-cafe-beaugrenelle' ? 281252 : input.restaurantId === 'curated-PAR-indiana-cafe-tolbiac' ? 243266 : input.restaurantId === 'curated-PAR-indiana-cafe-montparnasse' ? 314295 : input.restaurantId === 'curated-PAR-indiana-cafe-republique' ? 274078 : input.restaurantId === 'curated-PAR-indiana-cafe-bercy-village' ? 245385 : input.restaurantId === 'curated-PAR-indiana-cafe-denfert-rochereau' ? 278132 : input.restaurantId === 'curated-PAR-indiana-cafe-les-halles' ? 275998 : input.restaurantId === 'curated-PAR-indiana-cafe-ternes' ? 276269 : input.restaurantId === 'curated-PAR-okomusu' ? 87616 : input.restaurantId === 'curated-PAR-chez-fernand-christine' ? 121338 : input.restaurantId === 'curated-LYO-le-bistrot-de-lyon' ? 428393 : input.restaurantId === 'curated-LYO-le-cerf-volant' ? 325474 : input.restaurantId === 'curated-LYO-le-merciere' ? 101507 : input.restaurantId === 'curated-LYO-shiyo' ? 304033 : input.restaurantId === 'curated-LYO-le-vivarais' ? 58213 : input.restaurantId === 'curated-LYO-brasserie-roseaux' ? 378092 : input.restaurantId === 'curated-LYO-nosch' ? 107873 : input.restaurantId === 'curated-LYO-maison-moly' ? 137085 : input.restaurantId === 'curated-LYO-comptoir-chabert' ? 41399 : input.restaurantId === 'curated-LYO-bistrot-abel' ? 77813 : input.restaurantId === 'curated-LYO-cafe-comptoir-abel' ? 77701 : input.restaurantId === 'curated-PAR-chez-fernand-guisarde' ? 429732 : input.restaurantId === 'curated-PAR-ibrik-kitchen' ? 17983 : input.restaurantId === 'curated-PAR-le-cornichon-goncourt' ? 172864 : input.restaurantId === 'curated-PAR-escudella' ? 4974 : input.restaurantId === 'curated-PAR-comptoir-petits-champs' ? 292 : input.restaurantId === 'curated-PAR-les-canailles-pigalle' ? 107333 : input.restaurantId === 'curated-PAR-brasserie-jaja-amsterdam' ? 347295 : input.restaurantId === 'curated-PAR-bien-eleve' ? 36016 : input.restaurantId === 'curated-PAR-ardent' ? 82526 : input.restaurantId === 'curated-PAR-office-paris' ? 12173 : input.restaurantId === 'curated-PAR-batistou' ? 176469 : input.restaurantId === 'curated-PAR-becco' ? 177844 : input.restaurantId === 'curated-PAR-jules-jo' ? 86920 : input.restaurantId === 'curated-PAR-savannah-cafe' ? 300276 : input.restaurantId === 'curated-PAR-biche-paris8' ? 149228 : input.restaurantId === 'curated-PAR-casimir' ? 160340 : input.restaurantId === 'curated-PAR-cafe-des-musees' ? 7248 : input.restaurantId === 'curated-PAR-la-plage-parisienne' ? 535548 : input.restaurantId === 'curated-PAR-zen-restaurant' ? 192088 : null) : null;
  if (input.details !== undefined) {
    if (lunchShift) {
      if (input.details?.shiftId !== lunchShift || Object.keys(input.details).length !== (['curated-PAR-chez-fernand-christine','curated-PAR-indiana-cafe-montparnasse','curated-PAR-indiana-cafe-les-halles','curated-PAR-indiana-cafe-ternes','curated-PAR-la-plage-parisienne'].includes(input.restaurantId) ? 2 : 1)
        || input.party !== 2 || phaseOf(input) !== 'booking') fail('invalid_shift');
      clean.details = {shiftId:lunchShift};
      if (input.restaurantId === 'curated-PAR-chez-fernand-christine') {
        const offer=cleanBookingOffer(input.details.offer,input.restaurantId);
        if (!offer) fail('invalid_offer');
        clean.details.offer=offer;
      }
      if (input.restaurantId === 'curated-PAR-la-plage-parisienne') {
        if (input.details.reservationSaturdayDurationAcknowledged !== true) fail('invalid_duration_acknowledgement');
        clean.details.reservationSaturdayDurationAcknowledged = true;
      }
      if (['curated-PAR-indiana-cafe-les-halles','curated-PAR-indiana-cafe-ternes'].includes(input.restaurantId)) {
        const values = input.restaurantId === 'curated-PAR-indiana-cafe-ternes' ? ['Déjeuner / Diner','Grignoter','Boire une verre'] : ['déjeuner/ dîner','grignotter','boire un verre '];
        if (!values.includes(input.details.reservationVisitReason)) fail('invalid_reservation_visit_reason');
        clean.details.reservationVisitReason = input.details.reservationVisitReason;
      }
      if (input.restaurantId === 'curated-PAR-indiana-cafe-montparnasse') {
        if (typeof input.details.reservationPurpose !== 'string' || input.details.reservationPurpose.length > 200) fail('invalid_reservation_purpose');
        clean.details.reservationPurpose = token(input.details.reservationPurpose,'invalid_reservation_purpose');
      }
    } else {
    const offer=cleanBookingOffer(input.details?.offer,input.restaurantId);
    if (input.provider !== 'Zenchef' || input.restaurantId !== 'curated-AMS-de-kas'
      || !offer || Object.keys(input.details).length !== 1 || input.party !== offer.count) fail('invalid_offer');
    clean.details={offer};
    }
  }
  if (lunchShift && !clean.details) fail('invalid_shift');
  return { ...clean, mode: input.mode, phase: phaseOf(input), idempotencyKey: input.idempotencyKey,
    reviewFingerprint: input.reviewFingerprint, date: input.date, time: input.time, party: input.party };
}

/** Internal server capability, never expose reserve/record directly to request bodies.
 * The integrator supplies authenticated owner and a SERVER-computed fingerprint of
 * venue/selection/guest/terms/revision. This module cannot verify supplier evidence:
 * record() accepts only evidence already validated by the provider adapter.
 *
 * const gate = ledger.reserve(serverBoundReview);
 * if (!gate.sendAllowed) return recovery(gate.attempt); // NEVER send on replay
 * // A crash after reserve and before send still consumes the attempt: unknown.
 * await providerSubmitOnce(); // real writes require separate authorization
 * ledger.record(owner, gate.attempt.attemptId, adapterVerifiedEvidence);
 *
 * Existing reserveSubmission(approval, session) hooks ignore return values:
 * their SERVER wrapper must throw if !gate.sendAllowed, and set session.attemptId
 * only for a newly granted attempt. Returning false from that hook is NOT a gate.
 * get/list are read-only recovery; neither creates permission to send again.
 *
 * One SQLite database must be shared by workers on the same host. Independent
 * replicas/databases do not share locks; do not use SQLite WAL over network FS.
 * No automatic retry, deletion, expiry or guest/account ownership transfer here.
 * Booking is the default phase, retaining the original v1 keys byte-for-byte.
 * Hold uses a separate namespace, never confirms a reservation, and never stores
 * provider hold references/tokens. Keep those in the adapter's private session.
 * A hold grant is not permission to submit a booking: each phase needs its own
 * explicit user approval and reserve gate. Unknown holds never auto-unlock.
 */
export class PlaywrightAttemptLedger {
  constructor(file, { now = Date.now } = {}) {
    if (typeof file !== 'string' || !file) fail('database_required');
    if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file);
    this.now = now;
    try {
      if (file !== ':memory:') fs.chmodSync(file, 0o600);
      this.db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
        CREATE TABLE IF NOT EXISTS playwright_attempts_v1 (
          id TEXT PRIMARY KEY, owner TEXT NOT NULL, idem TEXT NOT NULL,
          scope TEXT NOT NULL UNIQUE, payload TEXT NOT NULL,
          UNIQUE(owner, idem)
        );`);
    } catch (error) { this.db.close(); throw error; }
  }
  transaction(work) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const value = work(); this.db.exec('COMMIT'); return value; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  reserve(input) {
    const bound = validate(input);
    // Reusing a browser key across sessions/providers is a conflict, not a new send.
    const idem = hash(bound.phase === 'booking' ? bound.idempotencyKey : [bound.phase, bound.idempotencyKey]);
    // Changing the client key/review does not re-arm the same owner's same table request.
    const selection = [bound.owner, bound.mode, bound.provider, bound.restaurantId, bound.date, bound.time, bound.party];
    const scope = hash(bound.phase === 'booking' ? selection : [bound.phase, ...selection]);
    return this.transaction(() => {
      const replay = this.db.prepare('SELECT payload FROM playwright_attempts_v1 WHERE owner=? AND idem=?').get(bound.owner, idem);
      if (replay) {
        const attempt = decode(replay.payload);
        if ([...bindKeys, 'phase', 'date', 'time', 'party'].some(key => attempt[key] !== bound[key]) || !sameBookingOffer(attempt.details?.offer,bound.details?.offer) || attempt.details?.shiftId !== bound.details?.shiftId || attempt.details?.reservationPurpose !== bound.details?.reservationPurpose || attempt.details?.reservationVisitReason !== bound.details?.reservationVisitReason || attempt.details?.reservationSaturdayDurationAcknowledged !== bound.details?.reservationSaturdayDurationAcknowledged) throw new AttemptLedgerError('idempotency_conflict');
        return { sendAllowed: false, reason: 'already_attempted', attempt };
      }
      const duplicate = this.db.prepare('SELECT payload FROM playwright_attempts_v1 WHERE scope=?').get(scope);
      if (duplicate) return { sendAllowed: false, reason: `${bound.phase}_already_attempted`, attempt: decode(duplicate.payload) };
      const { owner, ...metadata } = bound;
      const timestamp = new Date(this.now()).toISOString();
      const attempt = { attemptId: crypto.randomUUID(), ...metadata, status: 'unknown',
        createdAt: timestamp, updatedAt: timestamp, reference: null, verification: null };
      this.db.prepare('INSERT INTO playwright_attempts_v1 VALUES(?,?,?,?,?)')
        .run(attempt.attemptId, owner, idem, scope, JSON.stringify(attempt));
      return { sendAllowed: true, attempt };
    });
  }
  get(owner, attemptId) {
    token(owner, 'invalid_owner'); token(attemptId, 'invalid_attempt_id');
    const row = this.db.prepare('SELECT payload FROM playwright_attempts_v1 WHERE owner=? AND id=?').get(owner, attemptId);
    return row ? decode(row.payload) : null;
  }
  list(owner) {
    token(owner, 'invalid_owner');
    return this.db.prepare('SELECT payload FROM playwright_attempts_v1 WHERE owner=? ORDER BY rowid DESC LIMIT 100')
      .all(owner).map(row => decode(row.payload));
  }
  record(owner, attemptId, evidence) {
    return this.transaction(() => {
      const attempt = this.get(owner, attemptId);
      if (!attempt) throw new AttemptLedgerError('attempt_not_found', 404);
      if (!evidence || phaseOf(evidence) !== attempt.phase || bindKeys.some(key => evidence[key] !== attempt[key]) || evidence.attemptId !== attemptId || !sameBookingOffer(evidence.details?.offer,attempt.details?.offer) || evidence.details?.shiftId !== attempt.details?.shiftId || evidence.details?.reservationPurpose !== attempt.details?.reservationPurpose || evidence.details?.reservationVisitReason !== attempt.details?.reservationVisitReason || evidence.details?.reservationSaturdayDurationAcknowledged !== attempt.details?.reservationSaturdayDurationAcknowledged)
        throw new AttemptLedgerError('evidence_mismatch');
      if (!states.has(evidence.status)) throw new AttemptLedgerError('unknown_result_status');
      if (attempt.phase === 'hold' && !holdStates.has(evidence.status)) throw new AttemptLedgerError('invalid_hold_status');
      if (attempt.phase === 'hold' && evidence.reference !== undefined && evidence.reference !== null)
        throw new AttemptLedgerError('hold_reference_private');
      if (['cart_init','cart','cart_update'].includes(attempt.phase)) {
        if (!holdStates.has(evidence.status)) throw new AttemptLedgerError('invalid_cart_status');
        if (evidence.reference != null) throw new AttemptLedgerError('cart_reference_private');
      }
      const expectedSource = attempt.mode === 'live' ? 'provider' : 'fixture';
      if (evidence.source !== expectedSource) throw new AttemptLedgerError('evidence_source_mismatch');
      if (evidence.status !== 'unknown' && evidence.verified !== true) throw new AttemptLedgerError('unverified_result');
      let reference = null;
      if (evidence.reference !== undefined && evidence.reference !== null) reference = token(evidence.reference, 'invalid_reference');
      if (evidence.status === 'confirmed' && !reference) throw new AttemptLedgerError('confirmation_reference_required');
      // Final decisions cannot be overwritten by delayed timeout/payment/rejection callbacks.
      if (['confirmed', 'rejected'].includes(attempt.status)) {
        if (attempt.status !== evidence.status || attempt.reference !== reference) throw new AttemptLedgerError('terminal_result_conflict');
        return attempt;
      }
      attempt.status = evidence.status;
      attempt.reference = reference;
      attempt.updatedAt = new Date(this.now()).toISOString();
      attempt.verification = evidence.verified === true ? {
        verified: true, source: expectedSource, provider: attempt.provider, phase: attempt.phase,
        restaurantId: attempt.restaurantId, sessionId: attempt.sessionId,
        attemptId, idempotencyKey: attempt.idempotencyKey, reviewFingerprint: attempt.reviewFingerprint,
      } : null;
      this.db.prepare('UPDATE playwright_attempts_v1 SET payload=? WHERE owner=? AND id=?')
        .run(JSON.stringify(attempt), owner, attemptId);
      return attempt;
    });
  }
  close() { this.db.close(); }
}
