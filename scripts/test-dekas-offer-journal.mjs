import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
const offer={offerId:118785,count:2,name:'Lunch',description:'Native lunch description',currency:'EUR',mealPrice:null,
  priceStatus:'not_provided_by_booking_form',menuSource:'https://restaurantdekas.com/eng/menu',depositApplies:false,
  depositMinGuests:7,selectionSource:'native_offer',submissionSupported:true,version:'a'.repeat(64)};
const request={owner:'guest',provider:'Zenchef',restaurantId:'curated-AMS-de-kas',sessionId:'local-session',phase:'booking',
  reviewFingerprint:'b'.repeat(64),details:{date:'2030-01-15',time:'12:00',party:2,offer}};
function journal(ledger,rows=[]) {return createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',
  restaurants:{'curated-AMS-de-kas':{name:'De Kas',offer:{offerId:118785,count:2},confirmationPolicySource:'LOCAL-TEST'}},
  register:{upsert:row=>rows.push(row)}});}
test('menu survives SQLite restart, retains unknown price and cannot re-arm with a changed menu version',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-menu-test-')),file=path.join(dir,'attempts.sqlite');
  let ledger=new PlaywrightAttemptLedger(file);
  try {
    const {attempt}=journal(ledger).reserveAttempt(request); ledger.close(); ledger=new PlaywrightAttemptLedger(file);
    assert.deepEqual(ledger.get('guest',attempt.attemptId).details.offer,offer);
    const rows=[],recovered=journal(ledger,rows); recovered.recover('guest');
    assert.deepEqual(rows[0].offer,offer); assert.equal(rows[0].status,'unknown');
    assert.throws(()=>recovered.reserveAttempt({...request,sessionId:'rotated',details:{...request.details,offer:{...offer,version:'c'.repeat(64)}}}),/already_attempted/);
  } finally {ledger.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('only exact saved-offer proof confirms and metadata remains bound through UI projection',()=>{
  const ledger=new PlaywrightAttemptLedger(':memory:');const j=journal(ledger);
  try {
    const {attempt}=j.reserveAttempt(request);
    const proof={verified:true,source:'fixture',policySource:'LOCAL-TEST',provider:'Zenchef',restaurantId:request.restaurantId,
      sessionId:attempt.sessionId,attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:attempt.reviewFingerprint,
      offerId:118785,offerCount:2,offerVersion:offer.version,offerEvidence:'own_booking_readback'};
    for (const change of [{offerId:1},{offerCount:1},{offerVersion:'c'.repeat(64)},{offerEvidence:undefined},{offerEvidence:'post_echo'}]) {
      j.recordAttempt({intent:request,attempt,result:{status:'confirmed',reference:'LOCAL',verification:{...proof,...change}}});
      assert.equal(ledger.get('guest',attempt.attemptId).status,'unknown');
    }
    const changed={...offer,description:'Changed menu'};
    assert.throws(()=>j.recordAttempt({intent:{...request,details:{...request.details,offer:changed}},attempt,result:{status:'confirmed',reference:'LOCAL',verification:proof}}),/attempt_binding/);
    const result={status:'confirmed',reference:'LOCAL',verification:proof};j.recordAttempt({intent:request,attempt,result});
    const snapshot={id:request.sessionId,restaurantId:request.restaurantId,details:request.details,result};
    assert.equal(j.verifySnapshot(snapshot,'guest').verification.offerEvidence,'own_booking_readback');
    assert.equal(j.verifySnapshot({...snapshot,details:{...request.details,offer:changed}},'guest'),null);
    assert.equal(j.verifySnapshot(snapshot,'other'),null);
  } finally {ledger.close();}
});
test('missing offer, invented free price and unexpected menu fields fail before reservation',()=>{
  const ledger=new PlaywrightAttemptLedger(':memory:');const j=journal(ledger);
  try {
    for (const invalid of [undefined,{...offer,mealPrice:0},{...offer,count:3},{...offer,secret:'unexpected'},{...offer,depositApplies:true}])
      assert.throws(()=>j.reserveAttempt({...request,details:{...request.details,offer:invalid}}),/offer_binding/);
    assert.deepEqual(ledger.list('guest'),[]);
  } finally {ledger.close();}
});
