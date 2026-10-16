// Native inspection lifecycle. This is deliberately separate from the semantic
// booking contract: screenshots are not inventory and inspection cannot submit.
export class PlaywrightRuntimeError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}
export class PlaywrightRuntime {
  constructor({ providers, enabled = false, now = Date.now, limit = 1 }) {
    this.providers = providers;
    this.enabled = enabled;
    this.now = now;
    this.limit = limit;
    this.sessions = new Map();
    this.pending = new Set();
    this.closed = false;
  }
  capabilities() {
    return Object.entries(this.providers).map(([provider, entry]) => ({
      provider, restaurantId: entry.restaurantId, mode: 'inspect',
      enabled: this.enabled, operatorOnly: true, liveBooking: false,
      semanticContract: false, availabilityVerified: false,
      reason: 'supplier_checkout_unverified',
    }));
  }
  authorize(owner, operator) {
    if (!owner || !operator) throw new PlaywrightRuntimeError('operator', 403);
    if (!this.enabled || this.closed) throw new PlaywrightRuntimeError('playwright_disabled', 503);
  }
  async create(owner, operator, { provider, restaurantId, width } = {}) {
    this.authorize(owner, operator);
    const entry = Object.hasOwn(this.providers, provider) && this.providers[provider];
    if (!entry || restaurantId !== entry.restaurantId) throw new PlaywrightRuntimeError('unsupported_restaurant');
    await this.expire();
    if (this.pending.has(owner) || [...this.sessions.values()].some(s => s.owner === owner)) throw new PlaywrightRuntimeError('session_exists', 409);
    if (this.sessions.size + this.pending.size >= this.limit) throw new PlaywrightRuntimeError('capacity', 429);
    this.pending.add(owner);
    try {
      const snapshot = await entry.adapter.create(owner, restaurantId, width);
      if (this.closed) { await entry.adapter.remove(snapshot.id, owner); throw new PlaywrightRuntimeError('playwright_disabled', 503); }
      this.sessions.set(snapshot.id, { owner, entry, touched: this.now(), busy: false });
      return this.project(snapshot);
    } finally { this.pending.delete(owner); }
  }
  project(snapshot) {
    if (!snapshot?.id) throw new PlaywrightRuntimeError('session_expired', 404);
    return { ...snapshot, mode: 'inspect', canSubmit: false, result: null,
      readiness: 'unverified', liveBooking: false, semanticContract: false };
  }
  async run(id, owner, operator, operation, action) {
    this.authorize(owner, operator);
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner) throw new PlaywrightRuntimeError('session_expired', 404);
    if (s.busy) throw new PlaywrightRuntimeError('busy', 409);
    if (this.now() - s.touched >= 600_000) {
      await s.entry.adapter.remove(id, owner); this.sessions.delete(id);
      throw new PlaywrightRuntimeError('session_expired', 404);
    }
    if (operation === 'action' && action?.type !== 'refresh') throw new PlaywrightRuntimeError('inspect_only', 409);
    s.busy = true;
    try {
      if (operation === 'remove') {
        await s.entry.adapter.remove(id, owner); this.sessions.delete(id); return { ok: true };
      }
      const snapshot = operation === 'current'
        ? await s.entry.current(id, owner)
        : await s.entry.adapter.action(id, owner, { type: 'refresh', revision: action.revision });
      if (snapshot?.id !== id) throw new PlaywrightRuntimeError('session_expired', 404);
      s.touched = this.now();
      return this.project(snapshot);
    } finally { s.busy = false; }
  }
  async expire() {
    for (const [id, s] of this.sessions) if (!s.busy && this.now() - s.touched >= 600_000) {
      await s.entry.adapter.remove(id, s.owner); this.sessions.delete(id);
    }
  }
  async close() {
    this.closed = true;
    await Promise.allSettled(Object.values(this.providers).map(entry => entry.adapter.close()));
    this.sessions.clear();
  }
}
