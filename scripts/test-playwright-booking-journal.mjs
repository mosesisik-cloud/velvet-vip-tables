import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BokabordMirror, RESTAURANT_DETAILS } from '../api/bokabord-mirror.mjs';
import { BookingLedger } from '../api/bokabord-ledger.mjs';
import { PlaywrightAttemptLedger } from '../api/playwright-attempt-ledger.mjs';
import { createBookingJournalHooks } from '../api/playwright-booking-journal.mjs';
import { NOEMA_LUNCH_RECEIPT_POLICY } from '../api/bokabord-receipt-confirmation.mjs';
const restaurantId = 'curated-STO-zink-italian-cuisine';
const approval = {date:'2030-01-15',time:'19:00',party:2,firstname:'Test',lastname:'Person',email:'test@example.com',phone:'0700000000',comment:'',mealid:9778,hash:RESTAURANT_DETAILS[restaurantId].hash,terms:true};
async function nativeFixture(hooks, {venueId=restaurantId,approved=approval}={}) {
  let routeHandler, sent=0, aborted=0,reply=null,transportFailure=false;
  const events=new Map();
  const frame={};let documentUrl='',documentText='',onCapture=null;
  const page={on:(name,listener)=>events.set(name,listener),setDefaultTimeout(){},goto:async()=>{},
    mainFrame:()=>frame,url:()=>documentUrl,waitForLoadState:async()=>{},
    evaluate:async()=>{onCapture?.();return {url:documentUrl,text:documentText};},
    locator:()=>({first:()=>({waitFor:async()=>{}}),innerText:async()=>documentText})};
  const context={route:async(_pattern,handler)=>{routeHandler=handler;},newPage:async()=>page,on(){},close:async()=>{}};
  const mirror=new BokabordMirror({prepare:true,live:true,...hooks});
  mirror.browser=async()=>({newContext:async()=>context}); mirror.settle=async()=>{};
  mirror.snapshot=async s=>(s.lastSnapshot={id:s.id,revision:0,canSubmit:true,result:null});
  await mirror.create('owner',venueId);
  const session=[...mirror.sessions.values()][0];
  session.armed=true;session.approval=approved;
  const transmit=()=>routeHandler({request:()=>({method:()=> 'POST',url:()=> 'https://app.bokabord.se/reservation/api/booking/saveBooking',postDataJSON:()=>({...approved,amount:approved.party,terms:{general:true,restaurant:false,bokabord:false},products:[],waitlist:false,giftcard:null,linked_meals:[],bookingid:null})}),
    fetch:async options=>{assert.equal(options.maxRetries,0);assert.equal(options.maxRedirects,0);sent++;if(transportFailure)throw new Error('lost_reply');return {json:async()=>reply,ok:()=>true};},
    fulfill:async()=>{},continue:async()=>{sent++;},abort:async()=>{aborted++;}});
  return {mirror,session,transmit,events,frame,setResponse:(data,fail=false)=>{reply=data;transportFailure=fail;},setCaptureHook:fn=>{onCapture=fn;},setDocument:(url,text)=>{documentUrl=url;documentText=text;},counts:()=>({sent,aborted})};
}

test('Noema receipt capture requires the matching successful main-frame document before durable confirmation',async()=>{
  for(const scenario of ['complete','wrong-code','wrong-reference','iframe','failed-document','unfinished-document','navigation-during-capture','missing-prefix','transport-failure','disabled']) {
    const directory=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-noema-'));
    const ledger=new PlaywrightAttemptLedger(':memory:');let f;
    const policy=NOEMA_LUNCH_RECEIPT_POLICY;
    const approved={...approval,hash:policy.hash,mealid:policy.mealid};
    const hooks=createBookingJournalHooks({ledger,legacyLedger:new BookingLedger(path.join(directory,'legacy')),
      register:{upsert(){}},restaurants:RESTAURANT_DETAILS,receiptPolicies:scenario==='disabled'?[]:[policy]});
    try {
      f=await nativeFixture(hooks,{venueId:policy.restaurantId,approved});
      const data={success:true,booking:{...approved,id:4242,status:1,meal:{type:'2'},amount:2,
        short_code:'PRIVATE-TEST-CODE',waitlist:0,products:[],require_noshow:false}};
      f.setResponse(data,scenario==='transport-failure');await f.transmit();
      f.events.get('response')({url:()=> 'https://app.bokabord.se/reservation/api/booking/saveBooking',json:async()=>{if(scenario!=='disabled')throw new Error('body_evicted_after_navigation');return data;},ok:()=>true});
      await f.session.resultPromise;
      assert.equal(ledger.list('owner')[0].status,'unknown',scenario+': response alone is not confirmation');
      const url='https://app.bokabord.se/reservation/booking/?code='+(scenario==='wrong-code'?'OTHER':'PRIVATE-TEST-CODE')+'&new=1';
      const text=[scenario==='missing-prefix'?'Not a receipt':'Tack för din bokning.',
        'Du är nu klar och bekräftelse har skickats via epost.','Noema','2 pers. (Lunch)',
        'Bokningsreferens',scenario==='wrong-reference'?'# 9999':'# 4242','Gästinformation'].join('\n');
      f.setDocument(url,text);
      const request={method:()=> 'GET',isNavigationRequest:()=>true,frame:()=>scenario==='iframe'?{}:f.frame};
      f.events.get('request')(request);f.events.get('framenavigated')(request.frame());
      if(scenario==='navigation-during-capture')f.setCaptureHook(()=>{
        f.events.get('request')({...request});f.events.get('framenavigated')(f.frame);
      });
      f.events.get('response')({url:()=>url,ok:()=>scenario!=='failed-document',finished:()=>scenario==='unfinished-document'?new Promise(()=>{}):Promise.resolve(),
        request:()=>request});
      await f.session.receiptPromise;
      assert.equal(ledger.list('owner')[0].status,scenario==='complete'?'confirmed':'unknown',scenario);
      assert.equal(f.counts().sent,1,'receipt observation never sends another request');
      assert(!JSON.stringify(ledger.list('owner')).includes('PRIVATE-TEST-CODE'));
      assert(!JSON.stringify(ledger.list('owner')).includes(approval.email));
      assert.equal(ledger.list('other').length,0);
    } finally {await f?.mirror.close();ledger.close();fs.rmSync(directory,{recursive:true,force:true});}
  }
});
test('actual native route + shared hook permits one mock transmission; restart/key rotation cannot resend',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-journal-'));
  const file=path.join(directory,'attempts.sqlite'), legacyLedger=new BookingLedger(path.join(directory,'legacy'));
  let ledger=new PlaywrightAttemptLedger(file);
  const rows=[];
  const hooks=()=>createBookingJournalHooks({ledger,legacyLedger,register:{upsert:r=>rows.push(r)},restaurants:RESTAURANT_DETAILS});
  let first,second,third;
  try {
    first=await nativeFixture(hooks()); await first.transmit();
    assert.deepEqual(first.counts(),{sent:1,aborted:0});
    assert.equal(ledger.list('owner')[0].status,'unknown');
    assert.equal(ledger.list('other').length,0);
    await first.mirror.close(); first=null; ledger.close(); ledger=new PlaywrightAttemptLedger(file);
    second=await nativeFixture(hooks()); await second.transmit();
    assert.deepEqual(second.counts(),{sent:0,aborted:1});
    assert.equal(second.session.result.status,'already_attempted');
    assert.equal(ledger.list('owner').length,1);
    assert.equal(fs.existsSync(legacyLedger.directory),false,'no dual journal writes');
    const recovered=hooks().recover('owner');assert.equal(recovered[0].status,'unknown');
    assert(!JSON.stringify(recovered).includes('test@example.com'));
    // An existing legacy attempt is a read-only barrier even if its JSON is corrupt.
    fs.mkdirSync(legacyLedger.directory);
    fs.writeFileSync(path.join(legacyLedger.directory,legacyLedger.key(approval,{owner:'owner',restaurantId})+'.json'),'partial');
    third=await nativeFixture(hooks());await third.transmit();
    assert.deepEqual(third.counts(),{sent:0,aborted:1});
  } finally {
    await first?.mirror.close(); await second?.mirror.close(); await third?.mirror.close(); ledger.close();
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
test('actual response listener verifies the narrow Zink policy and persists matching proof',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-confirmation-'));
  const ledger=new PlaywrightAttemptLedger(path.join(directory,'attempts.sqlite'));
  const rows=[];
  const hooks=createBookingJournalHooks({ledger,legacyLedger:new BookingLedger(path.join(directory,'legacy')),register:{upsert:r=>rows.push(r)},restaurants:RESTAURANT_DETAILS});
  let f;
  try {
    f=await nativeFixture(hooks);await f.transmit();
    const data={success:true,booking:{id:123,status:1,confirmed:0,restid:1359,mealid:9778,meal:{type:3},
      date:approval.date,time:approval.time,amount:approval.party,firstname:approval.firstname,lastname:approval.lastname,
      email:approval.email,phone:46700000000,waitlist:0,products:[],require_noshow:false,group_booking:false,parent_order:null}};
    const result=hooks.verifyResult(data,f.session);
    assert.equal(result.status,'confirmed');
    assert.equal(result.verification.detailsDigest,f.session.playwrightAttempt.reviewFingerprint);
    // A proof copied from another session must not be written as confirmed.
    f.session.result={...result,verification:{...result.verification,sessionId:'wrong-session'}};
    hooks.recordResult(f.session);assert.equal(ledger.list('owner')[0].status,'unknown');
    f.events.get('response')({url:()=> 'https://app.bokabord.se/reservation/api/booking/saveBooking',ok:()=>true,json:async()=>data});
    await f.session.resultPromise;
    const saved=ledger.list('owner')[0];assert.equal(saved.status,'confirmed');assert.equal(saved.reference,'123');
    assert.equal(saved.verification.reviewFingerprint,result.verification.detailsDigest);
    assert.equal(f.mirror.current('owner').result.status,'confirmed');
    assert.equal(f.mirror.current('owner').canSubmit,false);
    assert.equal(rows.at(-1).status,'confirmed');assert.equal(f.counts().sent,1);
    assert(!JSON.stringify(saved).includes('test@example.com'));
  } finally {await f?.mirror.close();ledger.close();fs.rmSync(directory,{recursive:true,force:true});}
});
