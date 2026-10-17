import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
test('Bofinger durable service, owner and independent receipt survive restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bofinger-journal-'));
 let ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));
 const restaurantId='curated-PAR-bofinger',policy='TEST-ONLY-POLICY';
 const make=()=>createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',restaurants:{[restaurantId]:{name:'Bofinger',city:'Paris',shiftId:19170,confirmationPolicySource:policy}},register:{upsert(){}}});
 let journal=make();
 const intent={provider:'Zenchef',restaurantId,owner:'owner',sessionId:'session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,shiftId:19170}};
 try {
  for(const details of [{...intent.details,shiftId:19171},{...intent.details,shiftId:undefined},{...intent.details,party:3}])assert.throws(()=>journal.reserveAttempt({...intent,details}),/shift_binding/);
  const {attempt}=journal.reserveAttempt(intent);assert.deepEqual(attempt.details,{shiftId:19170});
  ledger.close();ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));journal=make();
  assert.deepEqual(ledger.get('owner',attempt.attemptId).details,{shiftId:19170});
  assert.equal(ledger.get('other',attempt.attemptId),null);
  assert.throws(()=>journal.reserveAttempt(intent),/already_attempted/);
  assert.throws(()=>ledger.record('owner',attempt.attemptId,{...attempt,details:{shiftId:19171}}),/evidence_mismatch/);
  const proof={verified:true,source:'fixture',provider:'Zenchef',restaurantId,sessionId:'session',attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:intent.reviewFingerprint,policySource:policy,bookingEvidence:'own_booking_readback',shiftId:19170};
  for(const bad of [{...proof,shiftId:19171},{...proof,bookingEvidence:undefined}])assert.equal(journal.recordAttempt({intent,attempt,result:{status:'confirmed',reference:'TEST-REF',verification:bad}}).status,'unknown');
  const result={status:'confirmed',reference:'TEST-REF',verification:proof};
  assert.equal(journal.recordAttempt({intent,attempt,result}).status,'confirmed');
  const snapshot={id:'session',restaurantId,details:intent.details,result};
  assert.equal(journal.verifySnapshot(snapshot,'owner').verification.shiftId,19170);
  assert.equal(journal.verifySnapshot({...snapshot,details:{...intent.details,shiftId:19171}},'owner'),null);
  assert.equal(journal.verifySnapshot(snapshot,'other'),null);
 } finally {ledger.close();fs.rmSync(dir,{recursive:true,force:true});}
});
