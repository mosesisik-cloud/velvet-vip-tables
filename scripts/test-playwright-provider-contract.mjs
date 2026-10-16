import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { createBokabordContractFixture, createZenchefContractFixture, createSevenRoomsContractFixture } from './fixtures/playwright-provider-contract.mjs';

// Provider-neutral assertions against real adapters. Profiles describe native
// differences rather than pretending the pixel mirror is normalized UI v1.
// Add reviewed adapter fixture factories here after owner contract agreement.
const profiles = [createBokabordContractFixture];
// Explicit module path permits testing a pinned, isolated provider checkout
// before integration. No remote imports or silently skipped claimed coverage.
if (process.env.ZENCHEF_CONTRACT_MODULE) {
  const module = await import(pathToFileURL(path.resolve(process.env.ZENCHEF_CONTRACT_MODULE)).href);
  profiles.push(async function ZenchefContractFixture() { return createZenchefContractFixture(module); });
} else console.log('Zenchef not covered: set ZENCHEF_CONTRACT_MODULE to a reviewed local module.');
if (process.env.SEVENROOMS_CONTRACT_MODULE) {
  const module = await import(pathToFileURL(path.resolve(process.env.SEVENROOMS_CONTRACT_MODULE)).href);
  profiles.push(async function SevenRoomsContractFixture() { return createSevenRoomsContractFixture(module); });
} else console.log('SevenRooms not covered: set SEVENROOMS_CONTRACT_MODULE to a reviewed local module.');

function snapshotContract(snapshot, restaurantId) {
  assert.ok(snapshot && typeof snapshot === 'object');
  assert.equal(snapshot.restaurantId, restaurantId);
  assert.equal(typeof snapshot.id, 'string');
  assert.ok(snapshot.id.length > 0);
  assert.ok(Number.isSafeInteger(snapshot.revision) && snapshot.revision > 0);
  assert.equal(typeof snapshot.canSubmit, 'boolean');
  assert.ok(Number.isFinite(snapshot.expiresIn) && snapshot.expiresIn > 0);
  assert.match(snapshot.image, /^data:image\/png;base64,/);
  const png = Buffer.from(snapshot.image.split(',')[1], 'base64');
  assert.equal(snapshot.imageHash, crypto.createHash('sha256').update(png).digest('hex'));
  assert.ok(Number.isFinite(Date.parse(snapshot.capturedAt)));
  assert.ok(!Object.hasOwn(snapshot, 'owner'), 'owner credential must not be public');
  assert.ok(!Object.hasOwn(snapshot, 'context'), 'browser context must not be public');
}

for (const factory of profiles) {
  test(`${factory.name}: native lifecycle contract (offline transport)`, { timeout: 10000 }, async t => {
    let f;
    t.beforeEach(async () => { f = await factory(); });
    t.afterEach(async () => { await f?.adapter.close(); });

    await t.test('create/current/action/remove preserve venue, revision and image integrity', async () => {
      const { adapter, restaurantId } = f;
      const first = await adapter.create('fixture-owner', restaurantId, 420);
      snapshotContract(first, restaurantId);
      assert.equal(first.canSubmit, false, 'inspection is not submission permission');
      assert.equal(first.result, null);
      const current = await f.current('fixture-owner', first.id);
      assert.equal(current.revision, first.revision + (f.currentAdvancesRevision ? 1 : 0));
      const next = await adapter.action(first.id, 'fixture-owner', f.revisionAction(current.revision));
      snapshotContract(next, restaurantId);
      assert.ok(next.revision > first.revision);
      assert.equal(next.id, first.id);
      await adapter.remove(first.id, 'fixture-owner');
      await assert.rejects(adapter.action(first.id, 'fixture-owner', f.revisionAction(next.revision)), /session_expired/);
      assert.ok(f.contexts.every(c => c.closed));
    });

    await t.test('owner isolation and stale revisions reject actions without advancing state', async () => {
      const first = await f.adapter.create('alice', f.restaurantId);
      await assert.rejects(f.adapter.action(first.id, 'bob', f.revisionAction(first.revision)), /session_expired/);
      if (f.removeWrongOwnerRejects) await assert.rejects(f.adapter.remove(first.id, 'bob'), /session_expired/);
      else await f.adapter.remove(first.id, 'bob');
      const current = await f.current('alice', first.id);
      assert.equal(current.id, first.id);
      await assert.rejects(f.adapter.action(first.id, 'alice', f.revisionAction(first.revision - 1)), /stale_view/);
      assert.equal((await f.current('alice', first.id)).revision, current.revision + (f.currentAdvancesRevision ? 1 : 0));
      const other = await f.adapter.create('bob', f.restaurantId);
      assert.notEqual(other.id, first.id);
      assert.equal((await f.current('bob', other.id)).id, other.id);
    });

    await t.test('concurrent action is busy and successful completion advances once', async () => {
      const first = await f.adapter.create('alice', f.restaurantId);
      const gate = f.holdNextAction();
      const pending = f.adapter.action(first.id, 'alice', f.revisionAction(first.revision));
      try {
        await gate.entered;
        await assert.rejects(f.adapter.action(first.id, 'alice', f.revisionAction(first.revision)), /busy/);
      } finally { gate.release(); }
      const next = await pending;
      assert.equal(next.revision, first.revision + 1);
    });

    await t.test('transport failure releases busy lock without inventing a result', async () => {
      const first = await f.adapter.create('alice', f.restaurantId);
      f.failNextAction();
      await assert.rejects(f.adapter.action(first.id, 'alice', f.revisionAction(first.revision)), /fixture_transport_interrupted/);
      const current = await f.current('alice', first.id);
      const next = await f.adapter.action(first.id, 'alice', f.revisionAction(current.revision));
      assert.equal(next.result, null);
      assert.equal(next.canSubmit, false);
    });

    await t.test('expired owner session cannot accept an action and is closed', async () => {
      const first = await f.adapter.create('alice', f.restaurantId);
      f.expireSession(first.id);
      await assert.rejects(f.adapter.action(first.id, 'alice', f.revisionAction(first.revision)), /session_expired/);
      await f.adapter.expire();
      assert.ok(f.contexts.every(c => c.closed));
    });

    await t.test('snapshot exposes supported outcome labels without private supplier payload', async () => {
      let view = await f.adapter.create('alice', f.restaurantId);
      if (!f.resultStatuses) {
        view = await f.adapter.action(view.id, 'alice', f.revisionAction(view.revision));
        assert.equal(view.result, null, 'inspection cannot manufacture a supplier outcome');
        f.assertInspection(view);
        assert.equal(view.canSubmit, false);
      }
      for (const status of f.resultStatuses || []) {
        // Injected outcome tests serialization only, NEVER supplier confirmation.
        const reference = status === 'confirmed' ? 'OFFLINE-FIXTURE-REFERENCE' : undefined;
        f.injectObservedResult(view.id, { status, reference, booking: { privateMarker: 'do-not-expose' } });
        view = await f.adapter.action(view.id, 'alice', f.revisionAction(view.revision));
        assert.equal(view.result.status, status);
        assert.equal(view.result.reference, reference);
        assert.ok(!Object.hasOwn(view.result, 'booking'));
        assert.equal(view.canSubmit, false);
      }
    });
  });
}
