import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';

for (const purpose of ['déjeuner/ dîner','grignotter','boire un verre ']) test('Les Halles exact enum '+JSON.stringify(purpose)+' survives restart and cannot be replaced or replayed',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'les-halles-reason-'));
 const file=path.join(dir,'attempt.sqlite'),restaurantId='curated-PAR-indiana-cafe-les-halles',policy='TEST-ONLY-POLICY';
 let ledger=new PlaywrightAttemptLedger(file);
 const rows=[];
 const make=()=>createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',restaurants:{[restaurantId]:{name:'Les Halles',shiftId:275998,confirmationPolicySource:policy},'curated-PAR-indiana-cafe-tolbiac':{name:'Tolbiac',shiftId:243266,confirmationPolicySource:policy}},register:{upsert:r=>rows.push(r)}});
 let journal=make();
 const intent={provider:'Zenchef',restaurantId,owner:'owner',sessionId:'session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,shiftId:275998,reservationVisitReason:purpose}};
 try {
  for(const reservationVisitReason of [undefined,null,'','  ',42,8000,'8000','boire un verre',' déjeuner/ dîner','dîner','a\nb','a\u0000b'])assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,reservationVisitReason}}),/visit_reason_binding/);
  assert.throws(()=>journal.reserveAttempt({...intent,restaurantId:'curated-PAR-indiana-cafe-tolbiac',details:{...intent.details,shiftId:243266}}),/visit_reason_binding/);
  const gate=journal.reserveAttempt(intent),attempt=gate.attempt;assert.equal(gate.sendAllowed,true);assert.deepEqual(attempt.details,{shiftId:275998,reservationVisitReason:purpose});
  const direct={owner:'owner',provider:'Zenchef',restaurantId,sessionId:'session',mode:'fixture',phase:'booking',idempotencyKey:attempt.idempotencyKey,reviewFingerprint:intent.reviewFingerprint,date:intent.details.date,time:'12:00',party:2,details:attempt.details};
  for(const reservationVisitReason of [undefined,null,'',' ',42,'x'.repeat(201),'a\nb'])assert.throws(()=>ledger.reserve({...direct,details:{shiftId:275998,reservationVisitReason}}),/invalid_reservation_visit_reason/);
  assert.throws(()=>ledger.reserve({...direct,details:{...attempt.details,extra:'x'}}),/invalid_shift/);
  ledger.close();ledger=new PlaywrightAttemptLedger(file);journal=make();
  assert.equal(ledger.get('owner',attempt.attemptId).details.reservationVisitReason,purpose);assert.equal(ledger.get('other',attempt.attemptId),null);
  assert.equal(ledger.reserve(direct).sendAllowed,false);
  assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,reservationPurpose:'not this venue'}}),/purpose_binding/);
  const other = purpose === 'grignotter' ? 'déjeuner/ dîner' : 'grignotter';
  assert.throws(()=>ledger.reserve({...direct,details:{...attempt.details,reservationVisitReason:other}}),/idempotency_conflict/);
  assert.throws(()=>ledger.reserve({...direct,details:{...attempt.details,reservationVisitReason:'boire un verre'}}),/invalid_reservation_visit_reason/);
  assert.equal(ledger.reserve({...direct,idempotencyKey:'another-idempotency-key',reviewFingerprint:'b'.repeat(64),details:{...attempt.details,reservationVisitReason:other}}).sendAllowed,false);
  assert.throws(()=>journal.reserveAttempt(intent),/already_attempted/);
  assert.throws(()=>ledger.record('owner',attempt.attemptId,{...attempt,details:{...attempt.details,reservationVisitReason:other}}),/evidence_mismatch/);
  const proof={verified:true,source:'fixture',provider:'Zenchef',restaurantId,sessionId:'session',attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:intent.reviewFingerprint,policySource:policy,bookingEvidence:'own_booking_readback',shiftId:275998};
  const result={status:'confirmed',reference:'TEST-REF',verification:proof};
  for(const delta of [{reservationVisitReason:other},{reservationVisitReason:other},{date:'2030-01-16'},{time:'12:30'}])assert.throws(()=>journal.recordAttempt({intent:{...intent,details:{...intent.details,...delta}},attempt,result}),/attempt_binding/);
  assert.equal(journal.recordAttempt({intent,attempt,result:{...result,verification:{...proof,verified:false}}}).status,'unknown');
  assert.equal(ledger.get('owner',attempt.attemptId).details.reservationVisitReason,purpose);
  assert.equal(journal.recordAttempt({intent,attempt,result}).status,'confirmed');
  const snapshot={id:'session',restaurantId,details:intent.details,result};
  assert.equal(journal.verifySnapshot(snapshot,'owner').verification.shiftId,275998);
  for(const delta of [{reservationVisitReason:undefined},{reservationVisitReason:other},{reservationVisitReason:other},{date:'2030-01-16'},{time:'12:30'},{party:3}])assert.equal(journal.verifySnapshot({...snapshot,details:{...intent.details,...delta}},'owner'),null);
  assert.equal(journal.verifySnapshot(snapshot,'other'),null);
  assert(!JSON.stringify(rows).includes('reservationVisitReason'),'purpose stays in private ledger, not history rows');
 } finally {ledger.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});
