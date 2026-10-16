// Local-only browser tests of the real UI module. No provider adapters/endpoints.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {validateBookingSnapshot} from '../js/velvet-playwright-booking.js';

const source = await fs.readFile(new URL('../js/velvet-playwright-booking.js', import.meta.url));
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/ui.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/ui.js' ? source : '<!doctype html><meta charset="utf-8"><main id="booking"></main>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const context = await browser.newContext({serviceWorkers: 'block'});
const unexpected = [];
await context.route('**/*', route => {
  if (new URL(route.request().url()).origin === origin) return route.continue();
  unexpected.push(route.request().url()); return route.abort();
});
await context.routeWebSocket('**/*', socket => socket.close());
const page = await context.newPage();
const errors = []; page.on('pageerror', error => errors.push(error.message));
let passed = 0;
async function boot(options = {}) {
  await page.goto(origin);
  await page.evaluate(async options => {
    sessionStorage.clear();
    const {mountVelvetPlaywrightBooking} = await import('/ui.js');
    window.calls = []; window.snapshot = null; window.resultStatus = options.resultStatus || 'confirmed';
    window.fixture = true; window.holdSubmit = options.holdSubmit || false; window.failSubmit = options.failSubmit || false;
    window.transport = {
      async current() { window.calls.push({type: 'current'}); return window.snapshot && structuredClone(window.snapshot); },
      async create({restaurantId}) {
        window.calls.push({type: 'create'});
        window.snapshot = {contractVersion: 1, id: 'session-local', restaurantId, revision: 0, mode: 'fixture', stage: 'selection'};
        return structuredClone(window.snapshot);
      },
      async remove() { window.calls.push({type: 'remove'}); window.snapshot = null; },
      async action(action) {
        window.calls.push(structuredClone(action));
        if (window.holdAction) await new Promise(resolve => {window.releaseAction = resolve;});
        if (window.actionError) {const error = window.actionError; window.actionError = null; throw new Error(error);}
        const s = window.snapshot;
        if (action.revision !== s.revision) throw new Error('stale_view');
        s.revision++;
        if (action.type === 'search') {
          s.selection = {date: action.date, party: action.party}; s.stage = 'slots';
          s.availability = {source: 'fixture', observedAt: new Date().toISOString(), slots: [{id: 'local-1900', time: '19:00'}]};
        } else if (action.type === 'select') {
          s.selection = {...s.selection, slotId: action.slotId, time: '19:00'}; s.stage = 'guest';
        } else if (action.type === 'guest') {
          s.guest = action.guest; s.stage = 'review'; s.reviewToken = 'review-' + s.revision;
          s.terms = {version: 'terms1', text: 'Lokala testvillkor. Ingen riktig bokning.', url: 'javascript:alert(1)'}; s.canSubmit = true;
        } else if (action.type === 'back') {s.stage = action.target;}
        else if (action.type === 'submit') {
          if (window.holdSubmit) await new Promise(resolve => {window.release = resolve;});
          if (window.failSubmit) throw new Error('connection');
          s.stage = 'result';
          s.result = {status: window.resultStatus, reference: options.noReference ? undefined : 'LOCAL-REFERENCE',
            verification: options.noProof ? undefined : {verified: true, source: 'fixture', restaurantId: s.restaurantId, sessionId: s.id,
              attemptId: options.serverAttempt ? 'server-owned-attempt' : options.wrongAttempt ? 'wrong' : action.idempotencyKey,
              ...(options.serverAttempt ? {idempotencyKey: action.idempotencyKey} : {})}};
        }
        return structuredClone(s);
      },
    };
    window.mount = async (extra = {}) => {
      window.ui?.destroy();
      window.ui = mountVelvetPlaywrightBooking(document.querySelector('#booking'), {restaurantId: 'fixture-restaurant', restaurantName: '<img src=x onerror=alert(1)> Test', mode: 'fixture', transport: window.transport, ...extra});
      await window.ui.ready;
    };
    await window.mount();
  }, options);
}
const click = action => page.locator(`[data-action="${action}"]`).click();
async function toReview() {
  await click('start');
  await page.locator('[name=date]').fill('2026-12-20'); await page.locator('[name=party]').fill('2'); await click('search');
  await click('select');
  for (const [name, value] of Object.entries({firstname:'Test', lastname:'Guest', email:'guest@example.invalid', phone:'+46000000000', comment:'Local fixture only'})) await page.locator(`[name=${name}]`).fill(value);
  await click('guest');
  assert.equal(await page.locator('[data-vpb]').getAttribute('data-stage'), 'review');
}
async function submit() { await page.locator('[name=terms]').check(); await click('submit'); }
async function result(status) { await page.waitForSelector(`[data-booking-status="${status}"]`); }
async function test(name, run) { await run(); passed++; console.log('PASS:', name); }
try {
  await test('Fixture journey stays in Velvet; consent and attempt-bound provider proof required', async () => {
    await boot(); await toReview();
    assert.equal(await page.locator('[data-fixture-banner]').count(), 1);
    assert.equal(await page.locator('iframe,img').count(), 0, 'Untrusted restaurant text must not create markup');
    assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
    assert.equal(await page.locator('[data-action=submit]').isDisabled(), true);
    assert.equal(await page.evaluate(() => calls.filter(a => a.type === 'submit').length), 0);
    await submit(); await result('confirmed');
    const action = await page.evaluate(() => calls.find(a => a.type === 'submit'));
    assert.equal(action.confirm, true); assert.equal(action.terms, true); assert.equal(action.termsVersion, 'terms1'); assert.equal(action.reviewToken, 'review-3');
    assert.equal(action.revision, 3); assert.match(action.idempotencyKey, /^[a-z0-9-]+$/i);
    assert.match(await page.locator('[role=status]').textContent(), /^TESTRESULTAT:/);
    const saved = await page.evaluate(() => JSON.stringify(Object.values(sessionStorage)));
    assert(!saved.includes('guest@example.invalid')); assert(!saved.includes('Local fixture only'));
  });
  await test('Double click dispatches one submission; late response cannot re-arm confirmation', async () => {
    await boot({holdSubmit: true}); await toReview(); await page.locator('[name=terms]').check();
    await page.locator('[data-action=submit]').evaluate(node => {node.click(); node.click();});
    assert.equal(await page.evaluate(() => calls.filter(a => a.type === 'submit').length), 1);
    assert.equal(await page.locator('[name=terms]').isDisabled(), true);
    await page.evaluate(() => window.release()); await result('confirmed');
  });
  for (const options of [{noReference:true}, {noProof:true}, {wrongAttempt:true}]) {
    await test(`Unverified confirmation fails closed ${JSON.stringify(options)}`, async () => {
      await boot(options); await toReview(); await submit(); await result('unknown');
      assert.equal(await page.locator('[data-reference]').count(), 0);
    });
  }
  await test('Server attempt identifier may differ when proof separately binds client key', async () => {
    await boot({serverAttempt:true}); await toReview(); await submit(); await result('confirmed');
  });
  for (const status of ['pending', 'unknown', 'payment_required', 'rejected', 'error']) {
    await test(`${status} is explicit and never offers automatic resubmission`, async () => {
      await boot({resultStatus: status}); await toReview(); await submit(); await result(status);
      assert.equal(await page.locator('[data-action=submit]').count(), 0);
      assert.equal(await page.locator('[data-action=start]').count(), 0);
    });
  }
  await test('Lost submit acknowledgement survives remount and missing server session', async () => {
    await boot({failSubmit:true}); await toReview(); await submit(); await result('unknown');
    await page.evaluate(() => window.mount()); await result('unknown');
    assert.equal(await page.evaluate(() => calls.filter(a => a.type === 'submit').length), 1);
    await page.evaluate(async () => {window.snapshot = null; await window.mount();}); await result('unknown');
    assert.equal(await page.locator('[data-action=start]').count(), 0);
  });
  await test('Read-only reconciliation can recover verified confirmation without another submit', async () => {
    await boot({failSubmit:true}); await toReview(); await submit(); await result('unknown');
    await page.evaluate(() => {
      const action = calls.find(a => a.type === 'submit'); snapshot.stage = 'result'; snapshot.revision++;
      snapshot.result = {status:'confirmed', reference:'RECOVERED', verification:{verified:true,source:'fixture',restaurantId:snapshot.restaurantId,sessionId:snapshot.id,attemptId:action.idempotencyKey}};
    });
    await click('refresh'); await result('confirmed'); assert.equal(await page.evaluate(() => calls.filter(a => a.type === 'submit').length), 1);
  });
  await test('Hung submit times out to unknown; late completion requires explicit reconciliation', async () => {
    await boot({holdSubmit:true}); await toReview(); await page.evaluate(() => window.mount({requestTimeoutMs:30}));
    await submit(); await result('unknown');
    await page.evaluate(() => window.release());
    await page.waitForFunction(() => window.snapshot.stage === 'result');
    await result('unknown'); await click('refresh'); await result('confirmed');
    assert.equal(await page.evaluate(() => calls.filter(a => a.type === 'submit').length), 1);
  });
  await test('Expired pre-submit session can restart only after current confirms expiry', async () => {
    await boot(); await toReview();
    await page.evaluate(() => {window.transport.current = async () => {throw new Error('session_expired');};});
    await click('refresh'); assert.equal(await page.locator('[data-action=start]').count(), 1);
    assert.equal(await page.locator('[data-action=submit]').count(), 0);
  });
  await test('Refresh invalidates consent; changed review terms require a fresh explicit check', async () => {
    await boot(); await toReview(); await page.locator('[name=terms]').check();
    await page.evaluate(() => {snapshot.revision++; snapshot.reviewToken='new-review'; snapshot.terms.version='new-terms';});
    await click('refresh'); assert.equal(await page.locator('[name=terms]').isChecked(), false);
    assert.equal(await page.locator('[data-action=submit]').isDisabled(), true);
    await submit(); const action = await page.evaluate(() => calls.find(a => a.type === 'submit'));
    assert.equal(action.reviewToken, 'new-review'); assert.equal(action.termsVersion, 'new-terms');
  });
  await test('Stale action locks mutation until current snapshot is reconciled', async () => {
    await boot(); await toReview(); await page.evaluate(() => {window.actionError='stale_view';});
    await click('back'); await result('unknown'); assert.equal(await page.locator('[data-action=submit]').count(), 0);
    await click('refresh'); assert.equal(await page.locator('[data-action=submit]').isDisabled(), true);
  });
  await test('Live UI rejects fixture snapshots and never renders mock slots', async () => {
    await boot(); await click('start'); await page.locator('[name=date]').fill('2026-12-20'); await click('search');
    await page.evaluate(() => window.mount({mode:'live'}));
    assert.equal(await page.locator('[data-action=select]').count(), 0);
    assert.equal(await page.locator('[role=alert]').count(), 1);
  });
  await test('Wrong venue and lower revision responses cannot replace reviewed state', async () => {
    await boot(); await toReview(); await page.evaluate(() => {snapshot.restaurantId='another-restaurant';});
    await click('refresh'); await result('unknown'); assert.equal(await page.locator('[data-action=submit]').count(), 0);
    await page.evaluate(() => {snapshot.restaurantId='fixture-restaurant'; snapshot.revision=0;});
    await click('refresh'); await result('unknown');
  });
  await test('Unavailable durable client marker prevents submit dispatch', async () => {
    await boot(); await toReview(); await page.evaluate(() => window.mount({storage:null}));
    await submit(); assert.equal(await page.evaluate(() => calls.filter(a => a.type === 'submit').length), 0);
    assert.equal(await page.locator('[role=alert]').count(), 1);
  });
  await test('Failed guest save retains draft privately through reconciliation', async () => {
    await boot(); await toReview(); await click('back');
    await page.locator('[name=firstname]').fill('Retained draft');
    await page.evaluate(() => {window.actionError='connection';});
    await click('guest'); await result('unknown'); await click('refresh');
    assert.equal(await page.locator('[name=firstname]').inputValue(), 'Retained draft');
    assert.equal(await page.evaluate(() => JSON.stringify(Object.values(sessionStorage)).includes('Retained draft')), false);
  });
  await test('Empty availability never invents slots and offers date editing', async () => {
    await boot(); await click('start'); await page.locator('[name=date]').fill('2026-12-20'); await click('search');
    await page.evaluate(() => {snapshot.revision++; snapshot.availability.slots=[];}); await click('refresh');
    assert.equal(await page.locator('[data-action=select]').count(), 0); assert.equal(await page.locator('[data-action=back]').count(), 1);
  });
  await test('Mobile review fits viewport and confirmation is keyboard-operable', async () => {
    await page.setViewportSize({width:390,height:844}); await boot(); await toReview();
    assert.equal(await page.evaluate(() => document.body.scrollWidth <= innerWidth), true);
    await page.locator('[name=terms]').focus(); await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'submit');
    await page.keyboard.press('Enter'); await result('confirmed');
    await page.setViewportSize({width:1280,height:720});
  });
  await test('New restaurant cannot resume another venue session or show its guest details', async () => {
    await boot(); await toReview();
    await page.evaluate(() => window.mount({restaurantId:'other-restaurant'}));
    assert.equal(await page.locator('[data-action=submit]').count(), 0);
    assert.equal((await page.locator('[data-vpb]').textContent()).includes('guest@example.invalid'), false);
    assert.equal(await page.locator('[data-action=start]').count(), 0);
  });
  await test('Missing terms cannot present an actionable review', async () => {
    await boot(); await toReview(); await page.evaluate(() => {snapshot.terms=null; snapshot.revision++;});
    await click('refresh'); await result('unknown'); assert.equal(await page.locator('[data-action=submit]').count(), 0);
  });
  await test('Destroy ignores delayed responses; expired snapshots cannot submit', async () => {
    await boot(); await toReview(); await page.evaluate(() => {snapshot.expiresAt='2000-01-01T00:00:00Z';});
    await click('refresh'); assert.equal(await page.locator('[data-action=submit]').count(), 0);
    await boot(); await click('start'); await page.evaluate(() => {window.holdAction=true;});
    await page.locator('[name=date]').fill('2026-12-20'); await click('search');
    await page.evaluate(() => {window.ui.destroy(); window.releaseAction();});
    await page.waitForTimeout(50); assert.equal(await page.locator('[data-vpb]').count(), 0);
  });
  const base = {contractVersion:1,id:'unit',restaurantId:'unit',revision:1,mode:'live',stage:'slots',selection:{date:'2026-12-20',party:2},availability:{source:'fixture',observedAt:new Date().toISOString(),slots:[{id:'1',time:'19:00'}]}};
  assert.throws(() => validateBookingSnapshot(base, {restaurantId:'unit',mode:'live'}), /invalid_availability/);
  assert.deepEqual(unexpected, []); assert.deepEqual(errors, []);
  console.log(`PASS: ${passed} local browser scenarios; no external requests. No live booking/provider validation.`);
} finally {
  await context.close(); await browser.close(); await new Promise(resolve => server.close(resolve));
}
