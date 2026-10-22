import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
const restaurantId='curated-LYO-le-merciere';
test('Le Mercière binds weekday lunch and rejects gifts, extra selections and altered recovery details',()=>{
 const ledger=new PlaywrightAttemptLedger(':memory:');
 const journal=createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',restaurants:{[restaurantId]:{name:'Le Mercière',city:'Lyon',shiftId:101507,confirmationPolicySource:'TEST'}},register:{upsert(){}}});
 const intent={owner:'guest',provider:'Zenchef',restaurantId,sessionId:'abel-session',phase:'booking',reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,shiftId:101507}};
 try {
  for(const change of [{time:'12:45'},{date:'2030-01-19'},{date:'2030-01-20'},{time:'12:45'},{time:'19:00'},{party:3},{shiftId:4974},{giftCode:''},{offers:[]},{custom_field:{1275:'TEST'}},{roomId:1}]) {
   assert.throws(()=>journal.reserveAttempt({...intent,details:{...intent.details,...change}}));
  }
  assert.equal(ledger.list('guest').length,0);
  const {attempt}=journal.reserveAttempt(intent);
  const proof={verified:true,source:'fixture',policySource:'TEST',provider:'Zenchef',restaurantId,sessionId:attempt.sessionId,attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:attempt.reviewFingerprint,shiftId:101507,bookingEvidence:'own_booking_readback'};
  const result={status:'confirmed',reference:'LOCAL-ABEL',verification:proof};
  for(const change of [{date:'2030-01-16'},{time:'12:15'},{party:3},{giftCode:''}]) assert.throws(()=>journal.recordAttempt({intent:{...intent,details:{...intent.details,...change}},attempt,result}));
  journal.recordAttempt({intent,attempt,result});
  const snapshot={id:attempt.sessionId,restaurantId,details:intent.details,result};
  assert.equal(journal.verifySnapshot(snapshot,'guest').verification.shiftId,101507);
  for(const change of [{date:'2030-01-16'},{time:'12:15'},{party:3},{giftCode:''},{custom_field:{}}]) assert.equal(journal.verifySnapshot({...snapshot,details:{...snapshot.details,...change}},'guest'),null);
  assert.equal(journal.verifySnapshot(snapshot,'other-owner'),null);
 }finally{ledger.close();}
});
