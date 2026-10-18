import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
for (const [restaurantId,shiftId,name] of [['curated-PAR-bofinger',19170,'Bofinger'],['curated-PAR-la-coupole',20148,'La Coupole'],['curated-PAR-terminus-nord',19380,'Terminus Nord'],['curated-PAR-le-procope',18190,'Le Procope'],['curated-PAR-la-lorraine',16674,'La Lorraine'],['curated-PAR-au-pied-de-cochon',29,'Au Pied de Cochon'],['curated-PAR-le-grand-cafe-capucines',19590,'Le Grand Café Capucines'],['curated-PAR-brasserie-vagenende',63972,'Brasserie Vagenende'],['curated-PAR-bouillon-julien',12711,'Bouillon Julien'],['curated-PAR-bouillon-racine',93989,'Bouillon Racine']]) test(name+' durable service, owner and independent receipt survive restart',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bofinger-journal-'));
 let ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));
 const policy='TEST-ONLY-POLICY';
 const make=()=>createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',restaurants:{[restaurantId]:{name,city:'Paris',shiftId,confirmationPolicySource:policy}},register:{upsert(){}}});
 let journal=make();
 const intent={provider:'Zenchef',restaurantId,owner:'owner',sessionId:'session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,shiftId}};
 try {
  for(const details of [{...intent.details,shiftId:shiftId+1},{...intent.details,shiftId:undefined},{...intent.details,party:3}])assert.throws(()=>journal.reserveAttempt({...intent,details}),/shift_binding/);
  if (restaurantId === 'curated-PAR-bouillon-julien') {
   for (const year of ['2030','2031']) for (const day of ['12-24','12-25','12-31']) {
    const date=year+'-'+day;
    assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,date}}),/special_date_unsupported/);
    assert.throws(()=>ledger.reserve({owner:'owner',provider:'Zenchef',restaurantId,sessionId:'date-test',mode:'fixture',phase:'booking',idempotencyKey:'date-test-idempotency-key',reviewFingerprint:'b'.repeat(64),date,time:'12:00',party:2,details:{shiftId}}),/special_date_unsupported/);
   }
   for (const date of ['2030-12-23','2030-12-26','2030-12-30','2031-01-01']) {
    const gate=journal.reserveAttempt({...intent,sessionId:'boundary-'+date,details:{...intent.details,date}});assert.equal(gate.sendAllowed,true);
   }
  }
  const {attempt}=journal.reserveAttempt(intent);assert.deepEqual(attempt.details,{shiftId});
  ledger.close();ledger=new PlaywrightAttemptLedger(path.join(dir,'attempt.sqlite'));journal=make();
  assert.deepEqual(ledger.get('owner',attempt.attemptId).details,{shiftId});
  assert.equal(ledger.get('other',attempt.attemptId),null);
  assert.throws(()=>journal.reserveAttempt(intent),/already_attempted/);
  assert.throws(()=>ledger.record('owner',attempt.attemptId,{...attempt,details:{shiftId:shiftId+1}}),/evidence_mismatch/);
  const proof={verified:true,source:'fixture',provider:'Zenchef',restaurantId,sessionId:'session',attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:intent.reviewFingerprint,policySource:policy,bookingEvidence:'own_booking_readback',shiftId};
  for(const bad of [{...proof,shiftId:shiftId+1},{...proof,bookingEvidence:undefined}])assert.equal(journal.recordAttempt({intent,attempt,result:{status:'confirmed',reference:'TEST-REF',verification:bad}}).status,'unknown');
  const result={status:'confirmed',reference:'TEST-REF',verification:proof};
  if (restaurantId === 'curated-PAR-bouillon-julien') {
   for (const date of ['2030-12-24','2030-12-25','2030-12-31','2030-01-16']) assert.throws(()=>journal.recordAttempt({intent:{...intent,details:{...intent.details,date}},attempt,result}),/special_date_unsupported|attempt_binding/);
  }
  assert.equal(journal.recordAttempt({intent,attempt,result}).status,'confirmed');
  const snapshot={id:'session',restaurantId,details:intent.details,result};
  assert.equal(journal.verifySnapshot(snapshot,'owner').verification.shiftId,shiftId);
  if (restaurantId === 'curated-PAR-bouillon-julien') for (const date of ['2030-12-24','2030-12-25','2030-12-31','2030-01-16']) assert.equal(journal.verifySnapshot({...snapshot,details:{...snapshot.details,date}},'owner'),null);
  assert.equal(journal.verifySnapshot({...snapshot,details:{...intent.details,shiftId:shiftId+1}},'owner'),null);
  assert.equal(journal.verifySnapshot(snapshot,'other'),null);
 } finally {ledger.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});
