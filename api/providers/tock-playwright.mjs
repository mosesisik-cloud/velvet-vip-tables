import crypto from 'node:crypto';

export const TOCK_DELTA_ID = 'curated-ATH-delta-restaurant';
const FIXTURE_URL = 'https://velvet-tock-fixture.invalid/';
const clone = value => structuredClone(value);
export class TockError extends Error {
  constructor(code, status = 400) { super(code); this.status = status; }
}

// No production Tock protocol has been verified. Never turn this fixture driver
// into a live adapter by changing its URL or by enabling a submission flag.
export class TockPlaywright {
  constructor({ mode = 'live', fixtureHtml, browserFactory, reserveSubmission, recordResult,
    now = Date.now, ttlMs = 600000, timeoutMs = 10000, maxSessions = 4 } = {}) {
    if (!['live', 'fixture'].includes(mode)) throw new TockError('invalid_mode');
    if (mode === 'fixture' && (typeof fixtureHtml !== 'string' || !fixtureHtml)) throw new TockError('fixture_required');
    this.mode = mode; this.fixtureHtml = fixtureHtml; this.browserFactory = browserFactory;
    this.reserveSubmission = reserveSubmission; this.recordResult = recordResult;
    this.now = now; this.ttlMs = ttlMs; this.timeoutMs = timeoutMs; this.maxSessions = maxSessions;
    this.sessions = new Map(); this.pendingOwners = new Set(); this.browserPromise = null;
    this.closed = false;
    this.timer = setInterval(() => this.expire().catch(() => {}), 30000);
    this.timer.unref();
  }
  async browser() {
    this.browserPromise ??= (this.browserFactory ? this.browserFactory() :
      import('playwright').then(({ chromium }) => chromium.launch({ headless: true })));
    return this.browserPromise;
  }
  async create(owner, restaurantId) {
    if (this.closed) throw new TockError('closed', 503);
    if (typeof owner !== 'string' || !owner) throw new TockError('auth', 401);
    if (restaurantId !== TOCK_DELTA_ID) throw new TockError('unknown_restaurant', 404);
    if (this.pendingOwners.has(owner) || [...this.sessions.values()].some(s => s.owner === owner)) throw new TockError('session_exists', 409);
    if (this.sessions.size + this.pendingOwners.size >= this.maxSessions) throw new TockError('capacity', 429);
    this.pendingOwners.add(owner);
    const s = { id: crypto.randomUUID(), owner, restaurantId, revision: 1, touched: this.now(),
      stage: 'selection', selection: {}, guest: {}, slots: [], result: null, busy: false,
      attempted: false, reviewToken: null, terms: null, blockedRequests: 0 };
    try {
      if (this.mode === 'live') {
        s.stage = 'result'; s.result = { status: 'error', reason: 'provider_protocol_unverified', supplierConfirmed: false };
      } else {
        const browser = await this.browser();
        s.context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false });
        if (typeof s.context.routeWebSocket !== 'function') throw new TockError('websocket_guard_unavailable', 503);
        await s.context.routeWebSocket('**/*', socket => { s.blockedRequests++; socket.close(); });
        await s.context.route('**/*', route => {
          const r = route.request();
          // Everything is either fulfilled locally or aborted, including GETs,
          // redirects and popup/frame traffic. There is no route.continue().
          if (r.url() === FIXTURE_URL && r.method() === 'GET' && r.isNavigationRequest()) {
            return route.fulfill({ status: 200, contentType: 'text/html', body: this.fixtureHtml,
              headers: { 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'" } });
          }
          s.blockedRequests++; return route.abort();
        });
        s.page = await s.context.newPage();
        s.page.setDefaultTimeout(this.timeoutMs);
        s.context.on('page', p => { if (p !== s.page) p.close().catch(() => {}); });
        await s.page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs });
        await s.page.locator('[data-fixture="tock-contract-v1"]').waitFor();
      }
      if (this.closed) throw new TockError('closed', 503);
      this.sessions.set(s.id, s);
      return this.snapshot(s);
    } catch (e) { await s.context?.close(); throw e; }
    finally { this.pendingOwners.delete(owner); }
  }
  owned(id, owner) {
    const s = this.sessions.get(id);
    if (!s || s.owner !== owner || this.now() - s.touched >= this.ttlMs) throw new TockError('session_expired', 404);
    return s;
  }
  snapshot(s) {
    return clone({ contractVersion: 1, id: s.id, restaurantId: s.restaurantId, provider: 'Tock',
      restaurantName: 'Delta Restaurant', mode: this.mode, revision: s.revision, stage: s.stage,
      evidenceMode: this.mode === 'fixture' ? 'local_fixture' : 'blocked',
      selection: s.selection, guest: s.guest,
      availability: s.observedAt ? { source: 'fixture', observedAt: s.observedAt, slots: s.slots } : null,
      terms: s.terms, reviewToken: s.reviewToken,
      canSubmit: this.mode === 'fixture' && s.stage === 'review' && !s.attempted && !s.busy &&
        typeof this.reserveSubmission === 'function' && typeof this.recordResult === 'function',
      result: s.result, liveAvailabilitySupported: false, liveBookingSupported: false,
      blockedRequests: s.blockedRequests, expiresAt: new Date(s.touched + this.ttlMs).toISOString(),
      expiresIn: Math.max(0, (this.ttlMs - (this.now() - s.touched)) / 1000) });
  }
  current(owner) {
    const s = [...this.sessions.values()].find(x => x.owner === owner);
    if (!s) throw new TockError('session_expired', 404);
    return this.snapshot(this.owned(s.id, owner));
  }
  async action(id, owner, action) {
    const s = this.owned(id, owner);
    if (s.busy) throw new TockError('busy', 409);
    if (!action || action.revision !== s.revision) throw new TockError('stale_view', 409);
    if (action.type === 'refresh') return this.snapshot(s);
    if (this.mode !== 'fixture') throw new TockError('provider_protocol_unverified', 409);
    if (s.attempted) throw new TockError('already_attempted', 409);
    s.busy = true; s.touched = this.now();
    try {
      switch (action.type) {
        case 'search': {
          if (!['selection', 'slots'].includes(s.stage)) throw new TockError('wrong_stage', 409);
          const { date, party } = action;
          const parsed = new Date(`${date}T12:00:00Z`);
          if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed) ||
            parsed.toISOString().slice(0, 10) !== date || !Number.isInteger(party) || party < 1 || party > 20) throw new TockError('invalid_search');
          await s.page.locator('#date').fill(date);
          await s.page.locator('#party').fill(String(party));
          await s.page.locator('#search').click();
          s.slots = await s.page.locator('[data-slot]').evaluateAll(nodes => nodes.map(n => ({ id: n.dataset.slot, time: n.dataset.time, label: n.textContent })));
          s.selection = { date, party }; s.stage = 'slots'; s.reviewToken = null; s.terms = null;
          s.observedAt = new Date(this.now()).toISOString(); break;
        }
        case 'select': {
          if (s.stage !== 'slots') throw new TockError('wrong_stage', 409);
          const index = s.slots.findIndex(x => x.id === action.slotId);
          if (index < 0) throw new TockError('invalid_slot');
          await s.page.locator('[data-slot]').nth(index).click();
          s.selection = { ...s.selection, slotId: s.slots[index].id, time: s.slots[index].time };
          s.stage = 'guest'; break;
        }
        case 'guest': {
          if (s.stage !== 'guest') throw new TockError('wrong_stage', 409);
          const fields = action.guest;
          const names = ['firstname', 'lastname', 'email', 'phone'];
          if (!fields || typeof fields !== 'object' || Array.isArray(fields) || Object.keys(fields).some(k => ![...names, 'comment'].includes(k)) ||
            names.some(k => typeof fields[k] !== 'string' || !fields[k].trim() || fields[k].length > 200) ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || !/^\+?[0-9 ()-]{7,30}$/.test(fields.phone) ||
            (fields.comment !== undefined && (typeof fields.comment !== 'string' || fields.comment.length > 300))) throw new TockError('invalid_guest');
          for (const k of names) await s.page.locator(`#${k}`).fill(fields[k]);
          await s.page.locator('#comment').fill(fields.comment ?? '');
          await s.page.locator('#review').click();
          const terms = await s.page.locator('#terms').evaluate(n => ({ version: n.dataset.version, text: n.textContent }));
          if (!terms.version || !terms.text) throw new TockError('terms_unavailable');
          s.guest = clone(fields); s.terms = terms; s.reviewToken = crypto.randomUUID(); s.stage = 'review'; break;
        }
        case 'back': {
          if (!['guest', 'review', 'slots'].includes(s.stage) || !['selection', 'guest'].includes(action.target) ||
            (action.target === 'guest' && !s.selection.slotId)) throw new TockError('wrong_stage', 409);
          s.stage = action.target; s.reviewToken = null; s.terms = null;
          if (action.target === 'selection') { s.selection = {}; s.slots = []; }
          break;
        }
        case 'submit': {
          if (s.stage !== 'review') throw new TockError('wrong_stage', 409);
          if (action.confirm !== true || action.terms !== true || action.termsVersion !== s.terms.version ||
            action.reviewToken !== s.reviewToken) throw new TockError('confirmation_required', 409);
          if (typeof action.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(action.idempotencyKey)) throw new TockError('invalid_idempotency_key');
          if (typeof this.reserveSubmission !== 'function' || typeof this.recordResult !== 'function') throw new TockError('journal_required', 503);
          const currentTerms = await s.page.locator('#terms').evaluate(n => ({ version: n.dataset.version, text: n.textContent }));
          if (JSON.stringify(currentTerms) !== JSON.stringify(s.terms)) throw new TockError('stale_terms', 409);
          const attempt = { mode: 'fixture', provider: 'Tock', owner, sessionId: id, restaurantId: s.restaurantId,
            selection: clone(s.selection), guest: clone(s.guest), terms: clone(s.terms), revision: s.revision,
            reviewToken: s.reviewToken, idempotencyKey: action.idempotencyKey,
            date: s.selection.date, time: s.selection.time, party: s.selection.party,
            reviewFingerprint: crypto.createHash('sha256').update(JSON.stringify([
              s.restaurantId, s.selection, s.guest, s.terms, s.revision,
            ])).digest('hex') };
          // Terminal intent is visible in current() immediately, even if a hook
          // times out. No resume/snapshot can resurrect the submit button.
          s.attempted = true; s.reviewToken = null; s.stage = 'result';
          s.result = { status: 'unknown', source: 'fixture', supplierConfirmed: false };
          const bounded = promise => {
            let timer;
            return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new TockError('attempt_timeout', 504)), this.timeoutMs); })])
              .finally(() => clearTimeout(timer));
          };
          try {
            const gate = await bounded(Promise.resolve().then(() => this.reserveSubmission(clone(attempt))));
            // A fulfilled hook is not permission: the shared journal returns
            // sendAllowed=false for replays. Require exact server-side binding.
            if (gate?.sendAllowed !== true || typeof gate.attempt?.attemptId !== 'string' || !gate.attempt.attemptId ||
              ['provider', 'restaurantId', 'sessionId', 'mode', 'idempotencyKey', 'reviewFingerprint', 'date', 'time', 'party']
                .some(key => gate.attempt[key] !== attempt[key])) throw new TockError('journal_not_authorized', 409);
            attempt.attemptId = gate.attempt.attemptId;
            await s.page.locator('#submit').click();
            await s.page.locator('#result[data-status]').waitFor({ state: 'attached' });
            const r = await s.page.locator('#result').evaluate(n => ({ status: n.dataset.status, reference: n.dataset.reference }));
            const status = ['confirmed', 'rejected', 'payment_required'].includes(r.status) &&
              (r.status !== 'confirmed' || /^FIXTURE-/.test(r.reference ?? '')) ? r.status : 'unknown';
            const result = { status, source: 'fixture', supplierConfirmed: false,
              ...(status === 'confirmed' ? { reference: r.reference } : {}),
              ...(status !== 'unknown' ? { verification: { verified: true, source: 'fixture', provider: 'Tock',
                restaurantId: s.restaurantId, sessionId: s.id, attemptId: attempt.attemptId,
                idempotencyKey: attempt.idempotencyKey, reviewFingerprint: attempt.reviewFingerprint } } : {}) };
            await bounded(Promise.resolve().then(() => this.recordResult(clone(attempt), clone(result))));
            s.result = result;
          } catch { s.result = { status: 'unknown', source: 'fixture', supplierConfirmed: false }; }
          break;
        }
        default: throw new TockError('invalid_action');
      }
    } catch (e) {
      // A partially executed browser operation is not replayable on the same view.
      if (!(e instanceof TockError)) {
        s.stage = 'result'; s.attempted = true; s.reviewToken = null;
        s.result = { status: 'error', source: 'fixture', reason: 'fixture_browser_error', supplierConfirmed: false };
      }
      throw e;
    } finally { s.busy = false; s.revision++; }
    return this.snapshot(s);
  }
  async remove(id, owner) {
    const s = this.owned(id, owner);
    if (s.busy) throw new TockError('busy', 409);
    this.sessions.delete(id); await s.context?.close();
  }
  async expire() {
    for (const [id, s] of this.sessions) if (!s.busy && this.now() - s.touched >= this.ttlMs) {
      this.sessions.delete(id); await s.context?.close();
    }
  }
  async close() {
    this.closed = true;
    clearInterval(this.timer);
    await Promise.all([...this.sessions.values()].map(s => s.context?.close()));
    this.sessions.clear();
    if (this.browserPromise) await (await this.browserPromise).close();
  }
}
