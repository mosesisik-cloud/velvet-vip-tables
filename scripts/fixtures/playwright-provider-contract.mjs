// Offline transport double for the REAL BokaBord adapter. No browser is launched
// and no provider document, script, availability or confirmation is fetched.
import { BokabordMirror, RESTAURANTS } from '../../api/bokabord-mirror.mjs';

export const fixturePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');
export function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

export async function createBokabordContractFixture() {
  const contexts = [];
  let gate = null;
  let readySignal = null;
  let failure = null;
  const browser = {
    async newContext(options) {
      const context = { options, closed: false, listeners: new Map(),
        async route(pattern, callback) { this.routeHandler = callback; },
        on(name, callback) { this.listeners.set(name, callback); },
        async close() { this.closed = true; },
      };
      const locator = {
        first() { return this; }, async waitFor() {},
        async isVisible() { return false; },
        async innerText() { return 'OFFLINE CONTRACT FIXTURE — no availability'; },
      };
      const page = {
        on() {}, setDefaultTimeout() {},
        async goto(url) { context.requestedUrl = url; },
        locator() { return locator; }, getByRole() { return locator; },
        async waitForFunction() {
          if (gate) { readySignal.resolve(); await gate.promise; }
          if (failure) { const error = failure; failure = null; throw error; }
        },
        async evaluate() {},
        async screenshot() { return fixturePng; },
        mouse: { async click() {}, async move() {}, async wheel() {} },
      };
      context.newPage = async () => page;
      contexts.push(context);
      return context;
    },
    async close() {},
  };
  const adapter = new BokabordMirror();
  // Browser factory substitution only: lifecycle, snapshot, ownership, revision,
  // action and expiration methods remain the production implementation.
  adapter.browser = async () => browser;
  return {
    name: 'BokaBord', adapter, restaurantId: Object.keys(RESTAURANTS)[0], contexts,
    current: (owner, id) => adapter.current(owner),
    revisionAction: revision => ({ type: 'refresh', revision }),
    expireSession(id) { adapter.sessions.get(id).touched = Date.now() - 11 * 60_000; },
    resultStatuses: ['unknown', 'confirmed', 'payment_required', 'rejected', 'payload_mismatch', 'already_attempted'],
    injectObservedResult(id, result) { adapter.sessions.get(id).result = result; },
    holdNextAction() {
      gate = deferred(); readySignal = deferred();
      return { entered: readySignal.promise, release() { const previous = gate; gate = null; previous.resolve(); } };
    },
    failNextAction() { failure = new Error('fixture_transport_interrupted'); },
  };
}

// Uses the actual owner-supplied Zenchef class, not a reimplementation of its
// state machine. Inspection document navigation is a no-op in this transport.
export async function createZenchefContractFixture({ ZenchefPlaywright, ZENCHEF_ARPEGE }) {
  const contexts = [];
  let now = Date.UTC(2030, 0, 1);
  let gate, signal, failure;
  const adapter = new ZenchefPlaywright({ mode: 'inspect', now: () => now,
    browserFactory: async () => ({
      async close() {},
      async newContext(options) {
        const context = { options, closed: false,
          async route() {}, async routeWebSocket() {}, on() {},
          async close() { this.closed = true; },
          async newPage() { return {
            setDefaultTimeout() {}, async goto() {},
            async screenshot() {
              if (gate) { signal.resolve(); await gate.promise; }
              if (failure) { const error = failure; failure = null; throw error; }
              return fixturePng;
            },
          }; },
        };
        contexts.push(context); return context;
      },
    }),
  });
  return {
    name: 'Zenchef', adapter, contexts, restaurantId: ZENCHEF_ARPEGE.restaurantId,
    current: owner => adapter.current(owner), removeWrongOwnerRejects: true,
    revisionAction: revision => ({ type: 'refresh', revision }),
    expireSession() { now += 600001; },
    holdNextAction() {
      gate = deferred(); signal = deferred();
      return { entered: signal.promise, release() { const previous = gate; gate = null; previous.resolve(); } };
    },
    failNextAction() { failure = new Error('fixture_transport_interrupted'); },
  };
}
