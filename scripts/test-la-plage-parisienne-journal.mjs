import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';

test('La Plage exact boolean acknowledgement survives restart and cannot be replaced or replayed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'la-plage-acknowledgement-'));
 const file=path.join(dir,'attempt.sqlite'),restaurantId='curated-PAR-la-plage-parisienne',acknowledged=true,policy='TEST-ONLY-POLICY';
 let ledger=new PlaywrightAttemptLedger(file);
 const rows=[];
 const make=()=>createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',restaurants:{[restaurantId]:{name:'La Plage Parisienne',shiftId:535548,confirmationPolicySource:policy},'curated-PAR-indiana-cafe-tolbiac':{name:'Tolbiac',shiftId:243266,confirmationPolicySource:policy}},register:{upsert:r=>rows.push(r)}});
 let journal=make();
 const intent={provider:'Zenchef',restaurantId,owner:'owner',sessionId:'session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,shiftId:535548,reservationSaturdayDurationAcknowledged:acknowledged}};
 try {
  for(const reservationSaturdayDurationAcknowledged of [undefined,null,false,'true','false',1,0,{},[]])assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,reservationSaturdayDurationAcknowledged}}),/duration_acknowledgement_binding/);
  assert.throws(()=>journal.reserveAttempt({...intent,restaurantId:'curated-PAR-indiana-cafe-tolbiac',details:{...intent.details,shiftId:243266}}),/duration_acknowledgement_binding/);
  const gate=journal.reserveAttempt(intent),attempt=gate.attempt;assert.equal(gate.sendAllowed,true);assert.deepEqual(attempt.details,{shiftId:535548,reservationSaturdayDurationAcknowledged:acknowledged});
  const direct={owner:'owner',provider:'Zenchef',restaurantId,sessionId:'session',mode:'fixture',phase:'booking',idempotencyKey:attempt.idempotencyKey,reviewFingerprint:intent.reviewFingerprint,date:intent.details.date,time:'12:00',party:2,details:attempt.details};
  for(const reservationSaturdayDurationAcknowledged of [undefined,null,false,'true','false',1,0,{},[]])assert.throws(()=>ledger.reserve({...direct,details:{shiftId:535548,reservationSaturdayDurationAcknowledged}}),/invalid_duration_acknowledgement/);
  assert.throws(()=>ledger.reserve({...direct,details:{...attempt.details,extra:'x'}}),/invalid_shift/);
  ledger.close();ledger=new PlaywrightAttemptLedger(file);journal=make();
  assert.equal(ledger.get('owner',attempt.attemptId).details.reservationSaturdayDurationAcknowledged,acknowledged);assert.equal(ledger.get('other',attempt.attemptId),null);
  assert.equal(ledger.reserve(direct).sendAllowed,false);
  assert.throws(()=>ledger.reserve({...direct,details:{...attempt.details,reservationSaturdayDurationAcknowledged:false}}),/invalid_duration_acknowledgement/);
  assert.equal(ledger.reserve({...direct,idempotencyKey:'another-idempotency-key',reviewFingerprint:'b'.repeat(64),details:attempt.details}).sendAllowed,false);
  assert.throws(()=>journal.reserveAttempt(intent),/already_attempted/);
  assert.throws(()=>ledger.record('owner',attempt.attemptId,{...attempt,details:{...attempt.details,reservationSaturdayDurationAcknowledged:'changed'}}),/evidence_mismatch/);
  const proof={verified:true,source:'fixture',provider:'Zenchef',restaurantId,sessionId:'session',attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:intent.reviewFingerprint,policySource:policy,bookingEvidence:'own_booking_readback',shiftId:535548};
  const result={status:'confirmed',reference:'TEST-REF',verification:proof};
  for(const delta of [{reservationSaturdayDurationAcknowledged:'changed'},{reservationSaturdayDurationAcknowledged:false},{date:'2030-01-16'},{time:'12:30'}])assert.throws(()=>journal.recordAttempt({intent:{...intent,details:{...intent.details,...delta}},attempt,result}),/attempt_binding|duration_acknowledgement_binding/);
  assert.equal(journal.recordAttempt({intent,attempt,result:{...result,verification:{...proof,verified:false}}}).status,'unknown');
  assert.equal(ledger.get('owner',attempt.attemptId).details.reservationSaturdayDurationAcknowledged,acknowledged);
  assert.equal(journal.recordAttempt({intent,attempt,result}).status,'confirmed');
  const snapshot={id:'session',restaurantId,details:intent.details,result};
  assert.equal(journal.verifySnapshot(snapshot,'owner').verification.shiftId,535548);
  assert(!JSON.stringify(journal.verifySnapshot(snapshot,'owner')).includes('reservationSaturdayDurationAcknowledged'),'public proof excludes private acknowledgement');
  for(const delta of [{reservationSaturdayDurationAcknowledged:undefined},{reservationSaturdayDurationAcknowledged:'changed'},{reservationSaturdayDurationAcknowledged:false},{date:'2030-01-16'},{time:'12:30'},{party:3}])assert.equal(journal.verifySnapshot({...snapshot,details:{...intent.details,...delta}},'owner'),null);
  assert.equal(journal.verifySnapshot(snapshot,'other'),null);
  assert(!JSON.stringify(rows).includes('reservationSaturdayDurationAcknowledged'),'acknowledgement stays in private ledger, not history rows');
 } finally {ledger.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});
