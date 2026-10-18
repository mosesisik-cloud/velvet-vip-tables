import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
for (const [restaurantId,shiftId,name] of [['curated-PAR-bofinger',19170,'Bofinger'],['curated-PAR-la-coupole',20148,'La Coupole'],['curated-PAR-terminus-nord',19380,'Terminus Nord'],['curated-PAR-le-procope',18190,'Le Procope'],['curated-PAR-la-lorraine',16674,'La Lorraine'],['curated-PAR-au-pied-de-cochon',29,'Au Pied de Cochon']]) test(name+' durable service, owner and independent receipt survive restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bofinger-journal-'));
 let ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));
 const policy='TEST-ONLY-POLICY';
 const make=()=>createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',restaurants:{[restaurantId]:{name,city:'Paris',shiftId,confirmationPolicySource:policy}},register:{upsert(){}}});
 let journal=make();
 const intent={provider:'Zenchef',restaurantId,owner:'owner',sessionId:'session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,shiftId}};
 try {
  for(const details of [{...intent.details,shiftId:shiftId+1},{...intent.details,shiftId:undefined},{...intent.details,party:3}])assert.throws(()=>journal.reserveAttempt({...intent,details}),/shift_binding/);
  const {attempt}=journal.reserveAttempt(intent);assert.deepEqual(attempt.details,{shiftId});
  ledger.close();ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));journal=make();
  assert.deepEqual(ledger.get('owner',attempt.attemptId).details,{shiftId});
  assert.equal(ledger.get('other',attempt.attemptId),null);
  assert.throws(()=>journal.reserveAttempt(intent),/already_attempted/);
  assert.throws(()=>ledger.record('owner',attempt.attemptId,{...attempt,details:{shiftId:shiftId+1}}),/evidence_mismatch/);
  const proof={verified:true,source:'fixture',provider:'Zenchef',restaurantId,sessionId:'session',attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:intent.reviewFingerprint,policySource:policy,bookingEvidence:'own_booking_readback',shiftId};
  for(const bad of [{...proof,shiftId:shiftId+1},{...proof,bookingEvidence:undefined}])assert.equal(journal.recordAttempt({intent,attempt,result:{status:'confirmed',reference:'TEST-REF',verification:bad}}).status,'unknown');
  const result={status:'confirmed',reference:'TEST-REF',verification:proof};
  assert.equal(journal.recordAttempt({intent,attempt,result}).status,'confirmed');
  const snapshot={id:'session',restaurantId,details:intent.details,result};
  assert.equal(journal.verifySnapshot(snapshot,'owner').verification.shiftId,shiftId);
  assert.equal(journal.verifySnapshot({...snapshot,details:{...intent.details,shiftId:shiftId+1}},'owner'),null);
  assert.equal(journal.verifySnapshot(snapshot,'other'),null);
 } finally {ledger.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});
