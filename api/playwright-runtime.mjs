import { publicBookingResult } from './booking-result.mjs';
// Native provider lifecycle. Capability and write mode are server configuration;
// a screenshot or an adapter's unverified status never grants booking authority.
export class PlaywrightRuntimeError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
export class PlaywrightRuntime {
  constructor({ providers, enabled = false, now = Date.now, limit = 1, resultVerifier = null }) {
    this.providers = providers;
    this.enabled = enabled;
    this.now = now;
    this.limit = limit;
    this.sessions = new Map();
    this.pending = new Set();
    this.closed = false;
    this.resultVerifier = resultVerifier;
  }
  mode(entry) { return entry?.mode === 'live' ? 'live' : 'inspect'; }
  active(entry) { return entry?.enabled ?? this.enabled; }
  guestProvider(provider, restaurantId) {
    const entry = Object.hasOwn(this.providers, provider) && this.providers[provider];
    return !!entry && entry.restaurantId === restaurantId && this.mode(entry) === 'live' && this.active(entry) && !this.closed;
  }
  capabilities() {
    return Object.entries(this.providers).map(([provider, entry]) => ({
      provider, restaurantId: entry.restaurantId, mode: this.mode(entry),
      enabled: this.active(entry), operatorOnly: this.mode(entry) !== 'live', liveBooking: this.mode(entry) === 'live' && this.active(entry),
      semanticContract: false, availabilityVerified: false,
      reason: this.mode(entry) === 'live' && this.active(entry) ? null : 'supplier_checkout_unverified',
    }));
  }
  authorize(owner, operator, entry) {
    if (!owner || this.mode(entry) !== 'live' && !operator) throw new PlaywrightRuntimeError('operator', 403);
    if (!(entry ? this.active(entry) : this.enabled) || this.closed) throw new PlaywrightRuntimeError('playwright_disabled', 503);
  }
  async create(owner, operator, { provider, restaurantId, width, resume = false } = {}) {
    const entry = Object.hasOwn(this.providers, provider) && this.providers[provider];
    this.authorize(owner, operator, entry);
    if (!entry || restaurantId !== entry.restaurantId) throw new PlaywrightRuntimeError('unsupported_restaurant');
    await this.expire();
    const existing = [...this.sessions.entries()].find(([,s]) => s.owner === owner);
    if (existing && resume === true) {
      if (existing[1].entry !== entry) throw new PlaywrightRuntimeError('other_restaurant', 409);
      return this.run(existing[0], owner, operator, 'current');
    }
    if (this.pending.has(owner) || [...this.sessions.values()].some(s => s.owner === owner)) throw new PlaywrightRuntimeError('session_exists', 409);
    if (this.sessions.size + this.pending.size >= this.limit) throw new PlaywrightRuntimeError('capacity', 429);
    this.pending.add(owner);
    let createdId;
    try {
      const snapshot = await entry.adapter.create(owner, restaurantId, width);
      createdId = snapshot.id;
      if (this.closed) { await entry.adapter.remove(snapshot.id, owner); throw new PlaywrightRuntimeError('playwright_disabled', 503); }
      const projected = this.project(snapshot, entry, owner);
      this.sessions.set(snapshot.id, { owner, entry, touched: this.now(), busy: false });
      return projected;
    } catch (error) {
      if (createdId) { this.sessions.delete(createdId); await entry.adapter.remove(createdId, owner).catch(() => {}); }
      throw error;
    } finally { this.pending.delete(owner); }
  }
  project(snapshot, entry, owner) {
    if (!snapshot?.id) throw new PlaywrightRuntimeError('session_expired', 404);
    if (snapshot.mode === 'fixture') throw new PlaywrightRuntimeError('fixture_forbidden', 409);
    if (this.mode(entry) === 'live') {
      if (snapshot.restaurantId !== entry.restaurantId) throw new PlaywrightRuntimeError('provider_binding', 409);
      // A successfully acquired temporary hold is not a booking outcome.
      const held = snapshot.result?.phase === 'hold' && snapshot.result.status === 'held';
      let result = held ? {status:'held',phase:'hold'} : snapshot.result ? publicBookingResult(snapshot.result) : null;
      if (snapshot.result?.status === 'confirmed') {
        const verified = this.resultVerifier?.(snapshot, owner, entry);
        result = verified?.status === 'confirmed' && verified.verification?.source === 'provider'
          ? publicBookingResult(verified) : {status:'unknown',reason:'confirmation_not_persisted'};
      }
      return {...snapshot, mode:'live', canHold:snapshot.canHold === true && !result,
        canSubmit:snapshot.canSubmit === true && (!result || held), result, semanticContract:false, liveBooking:true};
    }
    return { ...snapshot, mode: 'inspect', canHold: false, canSubmit: false, result: null,
      readiness: 'unverified', liveBooking: false, semanticContract: false };
  }
  async run(id, owner, operator, operation, action) {
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner) throw new PlaywrightRuntimeError('session_expired', 404);
    this.authorize(owner, operator, s.entry);
    if (s.busy) throw new PlaywrightRuntimeError('busy', 409);
    if (this.now() - s.touched >= 600_000) {
      try { await s.entry.adapter.remove(id, owner); }
      catch (error) { if (error.message !== 'session_expired' || error.status !== 404) throw error; }
      this.sessions.delete(id);
      throw new PlaywrightRuntimeError('session_expired', 404);
    }
    if (!['current','action','remove'].includes(operation)) throw new PlaywrightRuntimeError('method', 405);
    const actions = this.mode(s.entry) === 'live' ? (s.entry.actions || ['refresh']) : ['refresh'];
    if (operation === 'action' && !actions.includes(action?.type)) throw new PlaywrightRuntimeError('inspect_only', 409);
    if (operation === 'action' && ['hold','submit'].includes(action.type)
      && (action.confirm !== true || action.type === 'submit' && action.terms !== true
        || typeof action.reviewFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(action.reviewFingerprint))) {
      throw new PlaywrightRuntimeError('confirmation_required', 409);
    }
    const payload = operation === 'action' ? Object.fromEntries(
      ['type','revision','confirm','terms','reviewFingerprint','fields','x','y','delta','dy','date','party','time','slotId','idempotencyKey']
        .filter(key => Object.hasOwn(action, key)).map(key => [key, action[key]])) : null;
    s.busy = true;
    try {
      if (operation === 'remove') {
        await s.entry.adapter.remove(id, owner); this.sessions.delete(id); return { ok: true };
      }
      const snapshot = operation === 'current'
        ? await s.entry.current(id, owner)
        : await s.entry.adapter.action(id, owner, payload);
      if (snapshot?.id !== id) throw new PlaywrightRuntimeError('session_expired', 404);
      s.touched = this.now();
      return this.project(snapshot, s.entry, owner);
    } catch (error) {
      if (error.message === 'session_expired' && error.status === 404) {
        this.sessions.delete(id);
        if (operation === 'remove') return { ok: true };
      }
      throw error;
    } finally { s.busy = false; }
  }
  async expire() {
    for (const [id, s] of this.sessions) if (!s.busy && this.now() - s.touched >= 600_000) {
      try { await s.entry.adapter.remove(id, s.owner); }
      catch (error) { if (error.message !== 'session_expired' || error.status !== 404) throw error; }
      this.sessions.delete(id);
    }
  }
  async close() {
    this.closed = true;
    await Promise.allSettled(Object.values(this.providers).map(entry => entry.adapter.close()));
    this.sessions.clear();
  }
}
