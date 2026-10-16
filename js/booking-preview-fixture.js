// Browser-local TEST fixture. No supplier, server, network or durable storage.
// This models the proposed normalized v1 contract, NOT a production adapter.
export const FIXTURE_RESTAURANT = 'fixture-velvet-journey';
export const FIXTURE_DATE = '2030-01-15';
export const FIXTURE_REFERENCE = 'FIXTURE-NOT-A-RESERVATION';

const copy = value => value == null ? value : structuredClone(value);
const fail = code => { throw new Error(code); };

export function createJourneyFixture({ outcome = 'confirmed', delayMs = 0 } = {}) {
  const sessions = new Map();
  const attempts = new Map();
  const calls = [];
  let sequence = 0;
  let submissionCount = 0;
  const wait = () => delayMs ? new Promise(resolve => setTimeout(resolve, delayMs)) : Promise.resolve();
  const sessionFor = (owner, id, restaurantId) => {
    const session = sessions.get(id);
    if (!session || session.owner !== owner || session.restaurantId !== restaurantId) fail('session_expired');
    return session;
  };
  const snapshot = session => {
    const { owner, busy, ...state } = session;
    return copy(state);
  };
  const forOwner = owner => ({
    async create({ restaurantId, resume }) {
      calls.push({ owner, method: 'create', restaurantId, resume });
      if (restaurantId !== FIXTURE_RESTAURANT) fail('restaurant_not_supported');
      const existing = [...sessions.values()].find(s => s.owner === owner && s.restaurantId === restaurantId);
      if (existing && resume) return snapshot(existing);
      if (existing) fail('session_exists');
      const state = {
        owner, contractVersion: 1, id: `fixture-session-${++sequence}`, restaurantId,
        revision: 1, mode: 'fixture', stage: 'selection', selection: {},
        availability: null, guest: {}, terms: null, reviewToken: null,
        canSubmit: false, result: null, busy: false,
      };
      sessions.set(state.id, state);
      return snapshot(state);
    },
    async current({ restaurantId }) {
      calls.push({ owner, method: 'current', restaurantId });
      const state = [...sessions.values()].find(s => s.owner === owner && s.restaurantId === restaurantId);
      return state ? snapshot(state) : null;
    },
    async action(payload) {
      calls.push({ owner, method: 'action', ...copy(payload) });
      const { id, restaurantId, revision, type } = payload;
      const state = sessionFor(owner, id, restaurantId);
      if (state.busy) fail('busy');
      if (revision !== state.revision) fail('stale_view');
      if (state.result) fail('already_attempted');
      state.busy = true;
      try {
        await wait();
        if (type === 'search') {
          if (payload.date !== FIXTURE_DATE || !Number.isInteger(Number(payload.party)) || Number(payload.party) < 1) fail('selection');
          state.selection = { date: payload.date, party: Number(payload.party) };
          state.availability = { source: 'fixture', observedAt: '2030-01-01T00:00:00Z', slots: [{ id: 'fixture-slot-1', time: '19:00', label: '19:00 TESTDATA' }] };
          state.stage = 'slots';
        } else if (type === 'select') {
          const slot = state.availability?.slots.find(s => s.id === payload.slotId);
          if (state.stage !== 'slots' || !slot) fail('slot_unavailable');
          state.selection = { ...state.selection, slotId: slot.id, time: slot.time };
          state.stage = 'guest';
        } else if (type === 'guest') {
          if (state.stage !== 'guest') fail('stage');
          for (const field of ['firstname', 'lastname', 'email', 'phone']) if (!payload.guest?.[field]) fail('guest');
          state.guest = copy(payload.guest);
          state.terms = { version: 'fixture-terms-v1', text: 'TESTDATA: fixture conditions only; no real reservation or payment.', url: 'https://terms.invalid/fixture' };
          state.stage = 'review';
          state.reviewToken = `fixture-review-${id}-${state.revision + 1}`;
          state.canSubmit = true;
        } else if (type === 'back') {
          if (!['selection', 'guest'].includes(payload.target)) fail('stage');
          state.stage = payload.target;
          state.reviewToken = null;
          state.canSubmit = false;
        } else if (type === 'submit') {
          if (state.stage !== 'review' || !state.canSubmit || payload.confirm !== true || payload.terms !== true) fail('confirmation_required');
          if (payload.termsVersion !== state.terms?.version || payload.reviewToken !== state.reviewToken) fail('stale_view');
          if (!payload.idempotencyKey || attempts.has(id)) fail('already_attempted');
          // Reserve BEFORE simulated result, including timeouts. Never resubmit.
          attempts.set(id, copy(payload));
          submissionCount++;
          state.canSubmit = false;
          state.stage = 'result';
          state.result = outcome === 'confirmed'
            ? { status: 'confirmed', reference: FIXTURE_REFERENCE, verification: {
                verified: true, source: 'fixture', restaurantId, sessionId: id,
                attemptId: payload.idempotencyKey,
              } }
            : outcome === 'confirmed_without_reference'
              ? { status: 'confirmed' }
              : { status: outcome === 'timeout' ? 'unknown' : outcome };
          state.revision++;
          if (outcome === 'timeout') fail('connection');
          return snapshot(state);
        } else fail('action');
        state.revision++;
        return snapshot(state);
      } finally { state.busy = false; }
    },
    async remove({ id, restaurantId }) {
      calls.push({ owner, method: 'remove', id, restaurantId });
      const state = sessionFor(owner, id, restaurantId);
      // Simulated attempt is retained; closing UI cannot clear uncertainty.
      if (attempts.has(id)) return snapshot(state);
      sessions.delete(id);
      return null;
    },
  });
  return {
    forOwner,
    inspect: () => ({ calls: copy(calls), submissionCount, attempts: copy([...attempts.values()]) }),
    // Test-only way to simulate concurrent server updates, never UI authorization.
    changeTerms(owner) {
      const state = [...sessions.values()].find(s => s.owner === owner);
      if (!state?.terms) fail('stage');
      state.revision++;
      state.terms = { ...state.terms, version: 'fixture-terms-v2', text: 'TESTDATA: changed conditions. Review again.' };
      state.reviewToken = `fixture-review-${state.id}-${state.revision}`;
    },
  };
}
