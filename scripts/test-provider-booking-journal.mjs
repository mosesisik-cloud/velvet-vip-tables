import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createProviderJournal} from '../api/provider-booking-journal.mjs';
const intent=phase=>({owner:'guest',provider:'SevenRooms',restaurantId:'fixture-venue',sessionId:'fixture-session',phase,
  reviewFingerprint:'a'.repeat(64),details:{date:'2030-01-15',time:'19:00',party:2,guest:{email:'private@example.test'}}});
function setup(policy=null){
  const ledger=new PlaywrightAttemptLedger(':memory:'),rows=[];
  const journal=createProviderJournal({ledger,provider:'SevenRooms',mode:'fixture',confirmationPolicySource:policy,
    restaurants:{'fixture-venue':{name:'Fixture',city:'Fixture'}},register:{upsert:row=>rows.push(row)}});
  return {ledger,rows,journal};
}
test('hold and booking are distinct durable grants and hold capabilities never become history',()=>{
  const {ledger,journal,rows}=setup();
  try{
    const hold=intent('hold'),grant=journal.reserveAttempt(hold);
    assert(grant.sendAllowed);assert.equal(rows.length,0);
    assert.throws(()=>journal.reserveAttempt(hold),/already_attempted/);
    journal.recordAttempt({intent:hold,attempt:grant.attempt,result:{status:'confirmed',reference:'PRIVATE-HOLD-CAPABILITY',holdId:'PRIVATE'}});
    assert.equal(ledger.get('guest',grant.attempt.attemptId).status,'unknown');
    assert(!JSON.stringify(ledger.list('guest')).includes('PRIVATE'));
    assert.equal(rows.length,0);
    const booking=journal.reserveAttempt(intent('booking'));
    assert(booking.sendAllowed);assert.equal(rows.length,1);assert.equal(rows[0].status,'unknown');
    journal.recover('guest');assert(rows.every(row=>row.id===`PB-${booking.attempt.attemptId}`));
    assert(!JSON.stringify(ledger.list('guest')).includes('private@example.test'));
  }finally{ledger.close();}
});
test('only the configured server proof, same phase, owner and durable attempt can confirm',()=>{
  const {ledger,journal}=setup('TEST-ONLY-POLICY');
  try{
    const request=intent('booking'),{attempt}=journal.reserveAttempt(request);
    const proof={verified:true,source:'fixture',policySource:'TEST-ONLY-POLICY',provider:attempt.provider,
      restaurantId:attempt.restaurantId,sessionId:attempt.sessionId,attemptId:attempt.attemptId,
      idempotencyKey:attempt.idempotencyKey,detailsDigest:attempt.reviewFingerprint};
    journal.recordAttempt({intent:request,attempt,result:{status:'confirmed',reference:'FIXTURE',verification:{...proof,sessionId:'other'}}});
    assert.equal(ledger.list('guest')[0].status,'unknown');
    assert.throws(()=>journal.recordAttempt({intent:{...request,phase:'hold'},attempt,result:{status:'confirmed'}}),/attempt_binding/);
    const result={status:'confirmed',reference:'FIXTURE',verification:proof};
    journal.recordAttempt({intent:request,attempt,result});
    assert.equal(ledger.list('guest')[0].status,'confirmed');assert.equal(ledger.list('other').length,0);
    const snapshot={id:request.sessionId,restaurantId:request.restaurantId,result};
    assert.equal(journal.verifySnapshot(snapshot,'guest').status,'confirmed');
    assert.equal(journal.verifySnapshot(snapshot,'other'),null);
  }finally{ledger.close();}
});
test('a provider without an approved confirmation policy stays unknown even with an ID',()=>{
  const {ledger,journal}=setup();
  try{
    const request=intent('booking'),{attempt}=journal.reserveAttempt(request);
    journal.recordAttempt({intent:request,attempt,result:{status:'confirmed',reference:'NOT-PROOF',verification:{verified:true,source:'provider'}}});
    assert.equal(ledger.list('guest')[0].status,'unknown');
    assert.throws(()=>journal.reserveAttempt({...request,sessionId:'rotated-session'}),/already_attempted/);
  }finally{ledger.close();}
});

test('room selection and venue-specific confirmation policy remain bound across journal recovery',()=>{
  const ledger=new PlaywrightAttemptLedger(':memory:');
  const rooms=[{id:11,name:'Dining'},{id:12,name:'Terrace'}];
  const journal=createProviderJournal({ledger,provider:'Zenchef',mode:'fixture',confirmationPolicySource:'FISH',
    restaurants:{roomVenue:{name:'Room venue',rooms,confirmationPolicySource:'ROOM'}},register:{upsert:()=>{}}});
  const request={...intent('booking'),provider:'Zenchef',restaurantId:'roomVenue',details:{date:'2030-01-15',time:'19:00',party:2,roomId:11,roomName:'Dining'}};
  try {
    assert.throws(()=>journal.reserveAttempt({...request,details:{...request.details,roomId:12}}),/room_binding/);
    const {attempt}=journal.reserveAttempt(request);
    assert.equal(attempt.roomId,11);assert.equal(ledger.get('guest',attempt.attemptId).roomName,'Dining');
    const proof={verified:true,source:'fixture',policySource:'ROOM',provider:'Zenchef',restaurantId:'roomVenue',sessionId:attempt.sessionId,
      attemptId:attempt.attemptId,idempotencyKey:attempt.idempotencyKey,detailsDigest:attempt.reviewFingerprint,roomId:11,roomName:'Dining'};
    for (const override of [{roomId:12},{roomName:'Terrace'},{policySource:'FISH'}]) {
      journal.recordAttempt({intent:request,attempt,result:{status:'confirmed',reference:'LOCAL',verification:{...proof,...override}}});
      assert.equal(ledger.get('guest',attempt.attemptId).status,'unknown');
    }
    assert.throws(()=>journal.reserveAttempt({...request,sessionId:'new-session',details:{...request.details,roomId:12,roomName:'Terrace'}}),/already_attempted/);
    const result={status:'confirmed',reference:'LOCAL',verification:proof};journal.recordAttempt({intent:request,attempt,result});
    const snapshot={id:request.sessionId,restaurantId:'roomVenue',details:request.details,result};
    assert.equal(journal.verifySnapshot(snapshot,'guest').verification.roomId,11);
    assert.equal(journal.verifySnapshot({...snapshot,details:{...request.details,roomId:12}},'guest'),null);
    assert.equal(journal.verifySnapshot(snapshot,'other'),null);
  } finally {ledger.close();}
});
