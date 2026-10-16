import { randomUUID } from 'node:crypto';

export const THEFORK_RESTAURANT = 'curated-CRV-baumaniere-1850';
export const THEFORK_SOURCE = 'https://www.hotelstrato.com/fr/page/hotel-restaurant-courchevel.4375.html';
export const THEFORK_URL = 'https://module.lafourchette.com/fr_FR/module/746638-05a75';
const clone = value => structuredClone(value);
const fail = code => { throw Object.assign(new Error(code), { code }); };

// A supplier driver is intentionally NOT guessed from the external widget URL.
// Fixture drivers must be explicitly injected by tests. Production fails closed.
export class TheForkPlaywright {
  #sessions = new Map();
  #pending = new Set();
  constructor({ mode = 'live', fixtureDriverFactory, reserveSubmission, recordResult,
    clock = Date.now, ttl = 600_000, capacity = 4 } = {}) {
    if (!['live', 'fixture'].includes(mode)) fail('invalid_mode');
    if (mode === 'live' && fixtureDriverFactory) fail('fixture_in_live');
    Object.assign(this, { mode, fixtureDriverFactory, reserveSubmission, recordResult, clock, ttl, capacity });
  }
  async create(owner, restaurantId) {
    if (!owner) fail('auth');
    if (restaurantId !== THEFORK_RESTAURANT) fail('unsupported_restaurant');
    // No supplier navigation or side effect occurs before the contract is vetted.
    if (this.mode === 'live') fail('provider_contract_unverified');
    if (!this.fixtureDriverFactory) fail('fixture_driver_required');
    await this.expire();
    if (this.#pending.has(owner) || [...this.#sessions.values()].some(s => s.owner === owner)) fail('session_exists');
    if (this.#sessions.size + this.#pending.size >= this.capacity) fail('capacity');
    this.#pending.add(owner);
    let driver;
    try {
      driver = await this.fixtureDriverFactory();
      const s = { id: randomUUID(), owner, restaurantId, revision: 0, stage: 'selection',
        mode: 'fixture', driver, busy: false, attempted: false, touched: this.clock(),
        selection: null, availability: null, guest: null, terms: null, reviewToken: null, result: null };
      this.#sessions.set(s.id, s);
      return this.#snapshot(s);
    } catch (error) { await driver?.close(); throw error; }
    finally { this.#pending.delete(owner); }
  }
  #owned(id, owner) {
    const s = this.#sessions.get(id);
    if (!s || s.owner !== owner) fail('session_expired');
    if (this.clock() - s.touched >= this.ttl) fail('session_expired');
    return s;
  }
  #snapshot(s) {
    return clone({ contractVersion: 1, id: s.id, restaurantId: s.restaurantId, provider: 'TheFork',
      revision: s.revision, mode: 'fixture', stage: s.stage, selection: s.selection,
      availability: s.availability, guest: s.guest, terms: s.terms, reviewToken: s.reviewToken,
      canSubmit: s.stage === 'review' && !s.attempted && !s.busy,
      result: s.result, simulation: true });
  }
  current(id, owner) { return this.#snapshot(this.#owned(id, owner)); }
  async action(id, owner, action) {
    const s = this.#owned(id, owner);
    if (s.busy) fail('busy');
    if (action.revision !== s.revision) fail('stale_view');
    if (s.attempted) fail('already_attempted');
    s.busy = true;
    try {
      if (action.type === 'search') {
        if (!['selection', 'slots'].includes(s.stage)) fail('invalid_stage');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(action.date || '') ||
          !Number.isFinite(Date.parse(action.date)) || new Date(action.date).toISOString().slice(0, 10) !== action.date ||
          !Number.isInteger(action.party) || action.party < 1 || action.party > 20) fail('invalid_selection');
        const slots = await s.driver.search({ date: action.date, party: action.party });
        s.selection = { date: action.date, party: action.party };
        s.availability = { source: 'fixture', observedAt: new Date(this.clock()).toISOString(), slots: clone(slots) };
        s.reviewToken = null; s.terms = null; s.guest = null; s.stage = 'slots';
      } else if (action.type === 'select') {
        if (s.stage !== 'slots') fail('invalid_stage');
        const slot = s.availability.slots.find(x => x.id === action.slotId);
        if (!slot) fail('invalid_slot');
        await s.driver.select(slot.id);
        s.selection = { ...s.selection, slotId: slot.id, time: slot.time };
        s.stage = 'guest';
      } else if (action.type === 'guest') {
        if (s.stage !== 'guest') fail('invalid_stage');
        const guest = action.guest;
        if (!guest || Object.keys(guest).some(k => !['firstname', 'lastname', 'email', 'phone', 'comment'].includes(k)) ||
          !['firstname', 'lastname', 'email', 'phone'].every(k => typeof guest[k] === 'string' && guest[k].trim() && guest[k].length <= 254) ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email) ||
          (guest.comment !== undefined && (typeof guest.comment !== 'string' || guest.comment.length > 1000))) fail('invalid_guest');
        const terms = await s.driver.guest(clone(guest));
        if (!terms?.version || !terms?.text) fail('terms_missing');
        s.guest = clone(guest); s.terms = clone(terms); s.reviewToken = randomUUID(); s.stage = 'review';
      } else if (action.type === 'back') {
        if (!['slots', 'guest', 'review'].includes(s.stage) || !['selection', 'guest'].includes(action.target) ||
          (action.target === 'guest' && s.stage !== 'review')) fail('invalid_stage');
        await s.driver.back(action.target);
        s.reviewToken = null; s.terms = null; s.stage = action.target;
        if (action.target === 'selection') { s.selection = null; s.availability = null; s.guest = null; }
      } else if (action.type === 'submit') {
        if (s.stage !== 'review' || action.confirm !== true || action.terms !== true ||
          action.termsVersion !== s.terms.version || action.reviewToken !== s.reviewToken ||
          typeof action.idempotencyKey !== 'string' || !/^[\w-]{16,128}$/.test(action.idempotencyKey)) fail('confirmation_required');
        if (!this.reserveSubmission || !this.recordResult) fail('durable_hooks_required');
        const attempt = clone({ id: s.id, owner, restaurantId: s.restaurantId, provider: 'TheFork', mode: 'fixture',
          selection: s.selection, guest: s.guest, terms: s.terms, revision: s.revision,
          reviewToken: s.reviewToken, idempotencyKey: action.idempotencyKey });
        // Seal before awaiting persistence: ambiguous persistence must not permit a retry.
        s.attempted = true; s.stage = 'result'; s.reviewToken = null;
        s.result = { status: 'unknown', source: 'fixture', reason: 'attempt_reserved_or_uncertain' };
        const reservation = await this.reserveSubmission(attempt);
        if (reservation?.sendAllowed === false) fail('already_attempted');
        try {
          const result = await s.driver.submit();
          s.result = result?.status === 'fixture_confirmed' && result.reference
            ? { status: 'sandbox_confirmed', reference: result.reference, source: 'fixture', supplierVerified: false,
              verification: { verified: true, source: 'fixture', restaurantId: s.restaurantId, sessionId: s.id,
                attemptId: reservation?.attempt?.attemptId || randomUUID(), idempotencyKey: attempt.idempotencyKey } }
            : { status: 'unknown', source: 'fixture', reason: 'unrecognized_fixture_response' };
          await this.recordResult(attempt, clone(s.result));
        } catch {
          s.result = { status: 'unknown', source: 'fixture', reason: 'submission_or_persistence_uncertain' };
          await this.recordResult(attempt, clone(s.result)).catch(() => {});
        }
      } else fail('unsupported_action');
      s.revision++; s.touched = this.clock();
    } finally { s.busy = false; }
    return this.#snapshot(s);
  }
  async remove(id, owner) {
    const s = this.#sessions.get(id);
    if (!s || s.owner !== owner) fail('session_expired');
    if (s.busy) fail('busy');
    this.#sessions.delete(id); await s.driver.close();
  }
  async expire() {
    for (const s of this.#sessions.values()) if (!s.busy && this.clock() - s.touched >= this.ttl) await this.remove(s.id, s.owner);
  }
  async close() { for (const s of [...this.#sessions.values()]) await this.remove(s.id, s.owner); }
}

// Development transport only: adapt the isolated lifecycle to the existing UI.
// The UI must also be mounted with mode:'fixture'; a live UI rejects these snapshots.
export function createTheForkFixtureTransport(adapter, owner) {
  if (adapter.mode !== 'fixture' || !owner) fail('fixture_transport_only');
  let sessionId = null;
  const check = request => {
    if (request.restaurantId !== THEFORK_RESTAURANT || request.id && request.id !== sessionId) fail('session_expired');
  };
  const normalized = snapshot => {
    if (snapshot.mode !== 'fixture') fail('fixture_transport_only');
    if (snapshot.result?.status === 'sandbox_confirmed') {
      const proof = snapshot.result.verification;
      if (!proof?.verified || proof.source !== 'fixture' || proof.sessionId !== snapshot.id ||
        proof.restaurantId !== snapshot.restaurantId || !proof.attemptId || !proof.idempotencyKey) fail('invalid_fixture_proof');
      return { ...snapshot, result: { ...snapshot.result, status: 'confirmed' } };
    }
    return snapshot;
  };
  return {
    async create(request) {
      check(request);
      if (sessionId) return normalized(adapter.current(sessionId, owner));
      const result = await adapter.create(owner, request.restaurantId); sessionId = result.id;
      return normalized(result);
    },
    async current(request) { check(request); return sessionId ? normalized(adapter.current(sessionId, owner)) : null; },
    async action(request) { check(request); return normalized(await adapter.action(request.id, owner, request)); },
    async remove(request) { check(request); await adapter.remove(request.id, owner); sessionId = null; }
  };
}
