import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { PlaywrightAttemptLedger } from '../api/playwright-attempt-ledger.mjs';

const review = (overrides = {}) => ({ owner: 'guest:fixture-owner', provider: 'Zenchef',
  restaurantId: 'fixture-restaurant', sessionId: 'fixture-session', mode: 'fixture',
  idempotencyKey: 'fixture-key-00000001', reviewFingerprint: 'a'.repeat(64),
  date: '2026-12-20', time: '19:00', party: 2, ...overrides });
const evidence = (attempt, overrides = {}) => ({ ...attempt, status: 'confirmed',
  source: attempt.mode === 'fixture' ? 'fixture' : 'provider', verified: true,
  reference: 'LOCAL-FIXTURE-ONLY', ...overrides });
function memory() { return new PlaywrightAttemptLedger(':memory:'); }
async function onDisk(run) {
  const root = path.resolve('work'); fs.mkdirSync(root, { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, 'attempt-ledger-test-'));
  try { return await run(path.join(dir, 'attempts.sqlite')); }
  finally {
    assert.equal(path.dirname(path.resolve(dir)), root);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('first reserve grants one send; replay returns owned recovery without permission', () => {
  const ledger = memory();
  try {
    const first = ledger.reserve(review());
    assert.equal(first.sendAllowed, true); assert.equal(first.attempt.status, 'unknown');
    assert.notEqual(first.attempt.attemptId, review().idempotencyKey);
    const replay = ledger.reserve(review());
    assert.equal(replay.sendAllowed, false); assert.deepEqual(replay.attempt, first.attempt);
    assert.equal(ledger.get('other-owner', first.attempt.attemptId), null);
    assert.deepEqual(ledger.list('other-owner'), []);
    assert.equal(ledger.list(review().owner).length, 1);
  } finally { ledger.close(); }
});

test('same key cannot change session, review, venue, provider, mode or selection', () => {
  const ledger = memory();
  try {
    ledger.reserve(review());
    for (const change of [{sessionId:'other'}, {reviewFingerprint:'b'.repeat(64)},
      {restaurantId:'other'}, {provider:'SevenRooms'}, {mode:'live'},
      {date:'2026-12-21'}, {time:'20:00'}, {party:3}]) {
      assert.throws(() => ledger.reserve(review(change)), /idempotency_conflict/);
    }
  } finally { ledger.close(); }
});

test('rotating client key or review cannot re-arm the same booking', () => {
  const ledger = memory();
  try {
    const first = ledger.reserve(review());
    const duplicate = ledger.reserve(review({idempotencyKey:'fixture-key-00000002',sessionId:'new-session',reviewFingerprint:'b'.repeat(64)}));
    assert.equal(duplicate.sendAllowed, false);
    assert.equal(duplicate.reason, 'booking_already_attempted');
    assert.equal(duplicate.attempt.attemptId, first.attempt.attemptId);
    assert.equal(ledger.reserve(review({owner:'other-owner'})).sendAllowed, true);
  } finally { ledger.close(); }
});

test('restart after reserve keeps unknown and never grants a retry', async () => onDisk(file => {
  let ledger = new PlaywrightAttemptLedger(file);
  const first = ledger.reserve(review()); ledger.close();
  ledger = new PlaywrightAttemptLedger(file);
  try {
    assert.equal(ledger.get(review().owner, first.attempt.attemptId).status, 'unknown');
    assert.equal(ledger.reserve(review()).sendAllowed, false);
  } finally { ledger.close(); }
}));

test('record accepts only owner-bound, same-attempt, same-review server evidence', () => {
  const ledger = memory();
  try {
    const {attempt} = ledger.reserve(review());
    assert.throws(() => ledger.record('other-owner', attempt.attemptId, evidence(attempt)), /attempt_not_found/);
    for (const change of [{attemptId:'other'}, {restaurantId:'other'}, {sessionId:'other'},
      {provider:'other'}, {mode:'live'}, {idempotencyKey:'fixture-key-00000002'}, {reviewFingerprint:'b'.repeat(64)}]) {
      assert.throws(() => ledger.record(review().owner, attempt.attemptId, evidence(attempt,change)), /evidence_mismatch/);
    }
    assert.equal(ledger.get(review().owner, attempt.attemptId).status, 'unknown');
  } finally { ledger.close(); }
});

test('missing/unknown status, unverified confirmation and empty reference cannot confirm', () => {
  const ledger = memory();
  try {
    const {attempt} = ledger.reserve(review());
    for (const status of [undefined, null, 1, 'success', 'sandbox_confirmed'])
      assert.throws(() => ledger.record(review().owner, attempt.attemptId, evidence(attempt,{status})), /unknown_result_status/);
    for (const verified of [false, undefined, 'true'])
      assert.throws(() => ledger.record(review().owner, attempt.attemptId, evidence(attempt,{verified})), /unverified_result/);
    for (const reference of [null, undefined, '', ' '])
      assert.throws(() => ledger.record(review().owner, attempt.attemptId, evidence(attempt,{reference})), /reference/);
    assert.equal(ledger.get(review().owner, attempt.attemptId).status, 'unknown');
  } finally { ledger.close(); }
});

test('fixture evidence cannot become live proof, or vice versa', () => {
  const ledger = memory();
  try {
    for (const mode of ['live','fixture']) {
      const input = review({mode,idempotencyKey:`mode-specific-key-${mode}`});
      const {attempt} = ledger.reserve(input);
      assert.throws(() => ledger.record(input.owner, attempt.attemptId,
        evidence(attempt,{source:mode==='live'?'fixture':'provider'})), /evidence_source_mismatch/);
      const result = ledger.record(input.owner, attempt.attemptId, evidence(attempt));
      assert.equal(result.mode, mode);
      assert.equal(result.verification.source, mode==='live'?'provider':'fixture');
      assert.equal(result.verification.idempotencyKey, input.idempotencyKey);
      assert.equal(result.verification.attemptId, attempt.attemptId);
    }
    // These are trusted-server synthetic records, not actual supplier confirmations.
  } finally { ledger.close(); }
});

test('confirmed/rejected final outcomes cannot be overwritten by late callbacks', () => {
  const ledger = memory();
  try {
    for (const status of ['confirmed','rejected']) {
      const input=review({idempotencyKey:`terminal-key-${status}`,time:status==='confirmed'?'19:00':'20:00'});
      const {attempt}=ledger.reserve(input);
      const final=evidence(attempt,{status});
      const result=ledger.record(input.owner,attempt.attemptId,final);
      assert.deepEqual(ledger.record(input.owner,attempt.attemptId,final),result);
      for(const next of ['unknown','pending','payment_required',status==='confirmed'?'rejected':'confirmed'])
        assert.throws(()=>ledger.record(input.owner,attempt.attemptId,evidence(attempt,{status:next})),/terminal_result_conflict/);
      assert.throws(()=>ledger.record(input.owner,attempt.attemptId,evidence(attempt,{status,reference:'different'})),/terminal_result_conflict/);
    }
  } finally {ledger.close();}
});

test('unknown and payment-required stay distinct; only verified follow-up can confirm', () => {
  const ledger=memory();
  try {
    const {attempt}=ledger.reserve(review());
    const unknown=ledger.record(review().owner,attempt.attemptId,evidence(attempt,{status:'unknown',verified:false,reference:null}));
    assert.equal(unknown.verification,null);
    const payment=ledger.record(review().owner,attempt.attemptId,evidence(attempt,{status:'payment_required'}));
    assert.equal(payment.status,'payment_required');
    assert.equal(ledger.reserve(review()).sendAllowed,false);
    assert.equal(ledger.record(review().owner,attempt.attemptId,evidence(attempt)).status,'confirmed');
  } finally {ledger.close();}
});

test('persisted record projects metadata, excludes guest/contact/card/body data and returns copies', async()=>onDisk(file=>{
  const ledger=new PlaywrightAttemptLedger(file);
  try {
    const {attempt}=ledger.reserve(review({email:'PRIVATE-FIXTURE-EMAIL',phone:'PRIVATE-FIXTURE-PHONE',card:'PRIVATE-CARD',body:{secret:'PRIVATE-BODY'}}));
    attempt.status='confirmed';
    assert.equal(ledger.get(review().owner,attempt.attemptId).status,'unknown');
    const row=ledger.db.prepare('SELECT payload FROM playwright_attempts_v1').get();
    assert.doesNotMatch(row.payload,/PRIVATE-|guest:fixture-owner/);
    assert.equal(ledger.db.prepare('PRAGMA synchronous').get().synchronous,2);
    assert.equal(ledger.db.prepare('PRAGMA journal_mode').get().journal_mode,'wal');
  } finally {ledger.close();}
}));

test('invalid input fails before creating any attempt',()=>{
  const ledger=memory();
  try {
    for(const change of [{owner:''},{provider:'x\n'},{mode:'inspect'},{idempotencyKey:'short'},
      {reviewFingerprint:'not-a-hash'},{date:'2026-02-30'},{time:'25:00'},{party:0},{party:2.5}])
      assert.throws(()=>ledger.reserve(review(change)),/invalid_/);
    assert.deepEqual(ledger.list(review().owner),[]);
  } finally {ledger.close();}
});

for (const phase of ['booking', 'hold']) test(`two independent processes sharing one DB grant exactly one ${phase} send`,async()=>onDisk(async file=>{
  // Initialize schema before concurrent worker startup; both workers use real transactions.
  new PlaywrightAttemptLedger(file).close();
  const moduleUrl=new URL('../api/playwright-attempt-ledger.mjs',import.meta.url).href;
  const code=`import {PlaywrightAttemptLedger} from ${JSON.stringify(moduleUrl)};
    const ledger=new PlaywrightAttemptLedger(process.argv[1]);
    try { console.log(JSON.stringify(ledger.reserve(JSON.parse(process.argv[2])))); }
    finally { ledger.close(); }`;
  const worker=()=>new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['--input-type=module','-e',code,file,JSON.stringify(review({phase}))],{windowsHide:true});
    let output='',errors=''; child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>errors+=chunk);
    const timer=setTimeout(()=>{child.kill();reject(new Error('worker_timeout'));},15000);
    child.on('error',error=>{clearTimeout(timer);reject(error);});
    child.on('close',code=>{clearTimeout(timer);if(code!==0)reject(new Error(errors));else {try{resolve(JSON.parse(output));}catch(error){reject(error);}}});
  });
  const results=await Promise.all([worker(),worker()]);
  assert.equal(results.filter(r=>r.sendAllowed).length,1);
  assert.equal(results[0].attempt.attemptId,results[1].attempt.attemptId);
}));

test('pre-phase v1 booking rows retain exact scope and idempotency barriers after restart',async()=>onDisk(file=>{
  let ledger=new PlaywrightAttemptLedger(file);
  const input=review(), {owner,...metadata}=input;
  const legacy={attemptId:'legacy-server-attempt',...metadata,status:'unknown',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',reference:null,verification:null};
  const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const idem=hash(input.idempotencyKey);
  const scope=hash([owner,input.mode,input.provider,input.restaurantId,input.date,input.time,input.party]);
  ledger.db.prepare('INSERT INTO playwright_attempts_v1 VALUES(?,?,?,?,?)').run(legacy.attemptId,owner,idem,scope,JSON.stringify(legacy));
  ledger.close();ledger=new PlaywrightAttemptLedger(file);
  try {
    for(const phase of [undefined,'booking']) {
      const replay=ledger.reserve(review({phase}));
      assert.equal(replay.sendAllowed,false);assert.equal(replay.attempt.attemptId,legacy.attemptId);
      assert.equal(replay.attempt.phase,'booking');
      const rotated=ledger.reserve(review({phase,idempotencyKey:'rotated-key-00000001',sessionId:'new-session'}));
      assert.equal(rotated.sendAllowed,false);assert.equal(rotated.attempt.attemptId,legacy.attemptId);
    }
    assert.throws(()=>ledger.reserve(review({time:'20:00'})),/idempotency_conflict/);
    const stored=ledger.db.prepare('SELECT idem,scope,payload FROM playwright_attempts_v1').get();
    assert.equal(stored.idem,idem);assert.equal(stored.scope,scope);assert.equal(stored.payload,JSON.stringify(legacy));
    assert.equal(ledger.reserve(review({phase:'hold'})).sendAllowed,true);
    // A pre-upgrade caller may still send evidence without a phase.
    assert.equal(ledger.record(owner,legacy.attemptId,evidence(legacy)).status,'confirmed');
  }finally{ledger.close();}
}));

test('hold and booking get separate grants but rotating a hold key cannot re-arm it',()=>{
  const ledger=memory();
  try {
    const hold=ledger.reserve(review({phase:'hold'}));
    const booking=ledger.reserve(review());
    assert.equal(hold.sendAllowed,true);assert.equal(booking.sendAllowed,true);
    assert.notEqual(hold.attempt.attemptId,booking.attempt.attemptId);
    assert.equal(booking.attempt.phase,'booking');
    const replay=ledger.reserve(review({phase:'hold',idempotencyKey:'hold-rotated-key-01',sessionId:'new-session',reviewFingerprint:'b'.repeat(64)}));
    assert.equal(replay.sendAllowed,false);assert.equal(replay.reason,'hold_already_attempted');
    assert.equal(replay.attempt.attemptId,hold.attempt.attemptId);
    assert.throws(()=>ledger.reserve(review({phase:'hold',time:'20:00'})),/idempotency_conflict/);
    for(const phase of [null,'','payment',false])assert.throws(()=>ledger.reserve(review({phase})),/invalid_phase/);
  }finally{ledger.close();}
});

test('hold evidence must bind the phase and can never confirm or expose provider capabilities',()=>{
  const ledger=memory();
  try {
    const {attempt}=ledger.reserve(review({phase:'hold',holdId:'PRIVATE-HOLD',holdToken:'PRIVATE-TOKEN'}));
    for(const phase of [undefined,'booking',null])assert.throws(()=>ledger.record(review().owner,attempt.attemptId,evidence(attempt,{phase,status:'pending',reference:null})),/evidence_mismatch/);
    for(const status of ['confirmed','payment_required'])assert.throws(()=>ledger.record(review().owner,attempt.attemptId,evidence(attempt,{status,reference:null})),/invalid_hold_status/);
    assert.throws(()=>ledger.record(review().owner,attempt.attemptId,evidence(attempt,{status:'pending',reference:'PRIVATE-HOLD'})),/hold_reference_private/);
    const saved=ledger.record(review().owner,attempt.attemptId,evidence(attempt,{status:'pending',reference:null,holdId:'PRIVATE-HOLD',holdToken:'PRIVATE-TOKEN',expiresAt:'PRIVATE-EXPIRY'}));
    assert.equal(saved.status,'pending');assert.equal(saved.reference,null);assert.equal(saved.verification.phase,'hold');
    assert.doesNotMatch(JSON.stringify(ledger.list(review().owner)),/PRIVATE-/);
    assert.doesNotMatch(ledger.db.prepare('SELECT payload FROM playwright_attempts_v1').get().payload,/PRIVATE-/);
    assert.throws(()=>ledger.record('other-owner',attempt.attemptId,evidence(attempt,{status:'pending',reference:null})),/attempt_not_found/);
  }finally{ledger.close();}
});

test('unknown holds survive restart and elapsed time without granting retry; rejection stays terminal',async()=>onDisk(file=>{
  let ledger=new PlaywrightAttemptLedger(file,{now:()=>0});
  const {attempt}=ledger.reserve(review({phase:'hold'}));ledger.close();
  ledger=new PlaywrightAttemptLedger(file,{now:()=>Date.now()+86400000});
  try {
    assert.equal(ledger.get(review().owner,attempt.attemptId).status,'unknown');
    assert.equal(ledger.reserve(review({phase:'hold'})).sendAllowed,false);
    ledger.record(review().owner,attempt.attemptId,evidence(attempt,{status:'rejected',reference:null}));
    assert.throws(()=>ledger.record(review().owner,attempt.attemptId,evidence(attempt,{status:'pending',reference:null})),/terminal_result_conflict/);
    assert.equal(ledger.reserve(review({phase:'hold',idempotencyKey:'retry-hold-key-00001'})).sendAllowed,false);
  }finally{ledger.close();}
}));

test('Sazon cart and cart_update are separate consumed phases without persisted capabilities',async()=>onDisk(file=>{
  let ledger=new PlaywrightAttemptLedger(file);const base=review({provider:'TableCheck',restaurantId:'osm-BAL-sazon'});
  try{
    for(const phase of ['cart_init','cart','cart_update','booking'])assert(ledger.reserve({...base,phase}).sendAllowed);
    const cart=ledger.list(base.owner).find(a=>a.phase==='cart');
    assert.throws(()=>ledger.record(base.owner,cart.attemptId,evidence(cart)),/invalid_cart_status/);
    assert.throws(()=>ledger.record(base.owner,cart.attemptId,evidence(cart,{status:'pending',reference:'PRIVATE-CART'})),/cart_reference_private/);
    const result=ledger.record(base.owner,cart.attemptId,evidence(cart,{status:'unknown',verified:false,reference:null,cartId:'PRIVATE-CART',accessToken:'PRIVATE-TOKEN'}));
    assert(!JSON.stringify(result).includes('PRIVATE'));
    ledger.close();ledger=new PlaywrightAttemptLedger(file);
    for(const phase of ['cart_init','cart','cart_update','booking']){
      const retry=ledger.reserve({...base,phase,idempotencyKey:'rotated-key-00000001',sessionId:'rotated',reviewFingerprint:'c'.repeat(64)});
      assert.equal(retry.sendAllowed,false);assert.equal(retry.reason,`${phase}_already_attempted`);
    }
    for(const change of [{provider:'Zenchef'},{restaurantId:'other'},{party:3}])
      assert.throws(()=>ledger.reserve({...base,...change,phase:'cart'}),/invalid_phase/);
  }finally{ledger.close();}
}));
