// Runs against the integrator-owned ledger without copying or changing it.
// Before integration: node scripts/test-tock-ledger-integration.mjs --ledger work/playwright-attempt-ledger.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { TockPlaywright, TOCK_DELTA_ID } from '../api/providers/tock-playwright.mjs';

const option = process.argv.indexOf('--ledger');
const ledgerPath = option >= 0 ? process.argv[option + 1] : 'api/playwright-attempt-ledger.mjs';
if (!ledgerPath) throw Error('--ledger requires a path');
const { PlaywrightAttemptLedger } = await import(pathToFileURL(path.resolve(ledgerPath)));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'velvet-tock-ledger-'));
const dbPath = path.join(dir, 'attempts.sqlite');
let ledger = new PlaywrightAttemptLedger(dbPath);
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
const adapter = new TockPlaywright({ mode: 'fixture',
  fixtureHtml: fs.readFileSync(new URL('./fixtures/tock-playwright.html', import.meta.url), 'utf8'),
  browserFactory: async () => browser,
  reserveSubmission: attempt => ledger.reserve(attempt),
  recordResult: (attempt, result) => ledger.record(attempt.owner, attempt.attemptId, {
    ...attempt, status: result.status, source: result.source,
    verified: result.verification?.verified === true, reference: result.reference,
  }),
});
const owner = 'local-ledger-integration';
async function review() {
  let s = await adapter.create(owner, TOCK_DELTA_ID);
  for (const action of [{ type: 'search', date: '2030-10-20', party: 2 },
    { type: 'select', slotId: 'fixture-dinner' },
    { type: 'guest', guest: { firstname: 'PrivateGuestName', lastname: 'LocalFixture', email: 'private@example.invalid', phone: '+46700000000' } }])
    s = await adapter.action(s.id, owner, { revision: s.revision, ...action });
  return s;
}
const submit = (s, key) => adapter.action(s.id, owner, { revision: s.revision, type: 'submit',
  confirm: true, terms: true, termsVersion: s.terms.version, reviewToken: s.reviewToken, idempotencyKey: key });
try {
  let s = await submit(await review(), 'initial-fixture-key-01');
  assert.equal(s.result.status, 'confirmed'); assert.equal(s.result.supplierConfirmed, false);
  assert.equal(s.result.verification.source, 'fixture');
  const persisted = ledger.get(owner, s.result.verification.attemptId);
  assert.equal(persisted.status, 'confirmed'); assert.equal(persisted.verification.idempotencyKey, 'initial-fixture-key-01');
  assert.equal(ledger.get('wrong-owner', persisted.attemptId), null);
  assert.equal(await adapter.sessions.get(s.id).page.evaluate(() => window.fixtureSubmissions), 1);
  await adapter.remove(s.id, owner);
  ledger.close(); ledger = new PlaywrightAttemptLedger(dbPath);
  assert.equal(ledger.get(owner, persisted.attemptId).status, 'confirmed');
  s = await submit(await review(), 'rotated-fixture-key-02');
  assert.equal(s.result.status, 'unknown'); assert.equal(s.canSubmit, false);
  assert.equal(await adapter.sessions.get(s.id).page.evaluate(() => window.fixtureSubmissions || 0), 0);
  assert.equal(ledger.list(owner).length, 1);
  const serialized = JSON.stringify(ledger.list(owner));
  assert.ok(!serialized.includes('PrivateGuestName')); assert.ok(!serialized.includes('private@example.invalid'));
  console.log('PASS: real SQLite + Chromium fixture; one dispatch, persisted result, owner isolation, restart/key-rotation denial, no guest PII in ledger metadata. No supplier traffic.');
} finally {
  await adapter.close(); ledger.close(); fs.rmSync(dir, { recursive: true, force: true });
}
