// Independent native-route -> journal -> SQLite register recovery integration.
// Browser and supplier transport are doubles; no external requests are permitted.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {BokabordMirror,RESTAURANT_DETAILS} from '../api/bokabord-mirror.mjs';
import {BookingLedger} from '../api/bokabord-ledger.mjs';
import {BookingRegister} from '../api/booking-register.mjs';
import {PlaywrightAttemptLedger} from '../api/playwright-attempt-ledger.mjs';
import {createBookingJournalHooks} from '../api/playwright-booking-journal.mjs';
const restaurantId='curated-STO-zink-italian-cuisine';
const endpoint='https://app.bokabord.se/reservation/api/booking/saveBooking';
const approval={date:'2030-01-15',time:'19:00',party:2,firstname:'Fixture',lastname:'Only',email:'never-send@example.invalid',phone:'0700000000',comment:'PRIVATE-FIXTURE',mealid:1,hash:RESTAURANT_DETAILS[restaurantId].hash,terms:true};
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('External fetch forbidden by this test');};
process.once('exit',()=>{globalThis.fetch=originalFetch;});
async function setup(t){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'velvet-native-recovery-5351-'));
 let ledger=new PlaywrightAttemptLedger(path.join(directory,'attempts.sqlite'));
 const register=new BookingRegister(path.join(directory,'register.sqlite'));
 const legacyLedger=new BookingLedger(path.join(directory,'legacy'));
 const mirrors=[];
 t.after(async()=>{for(const m of mirrors)await m.close();ledger.close();register.close();fs.rmSync(directory,{recursive:true,force:true});});
 const hooks=(overrides={})=>createBookingJournalHooks({ledger,register,legacyLedger,restaurants:RESTAURANT_DETAILS,...overrides});
 async function native(custom=hooks()){
  let route,listener,sent=0,aborted=0;
  const page={on:(event,callback)=>{if(event==='response')listener=callback;},setDefaultTimeout(){},goto:async()=>{},locator:()=>({first:()=>({waitFor:async()=>{}})})};
  const context={route:async(_,callback)=>{route=callback;},newPage:async()=>page,on(){},close:async()=>{}};
  const mirror=new BokabordMirror({prepare:true,live:true,...custom});mirrors.push(mirror);
  mirror.browser=async()=>({newContext:async()=>context});mirror.settle=async()=>{};
  mirror.snapshot=async s=>(s.lastSnapshot={id:s.id,revision:s.revision,canSubmit:true,result:null});
  await mirror.create('alice',restaurantId);
  const s=[...mirror.sessions.values()][0];s.armed=true;s.approval=approval;
  const transmit=()=>route({request:()=>({method:()=> 'POST',url:()=>endpoint,postDataJSON:()=>({...approval,amount:2,terms:{general:true,restaurant:false,bokabord:false},products:[],waitlist:false})}),continue:async()=>{sent++;},abort:async()=>{aborted++;}});
  const respond=async(data,ok=true)=>{listener({url:()=>endpoint,ok:()=>ok,json:async()=>data});await s.resultPromise;};
  return {mirror,s,transmit,respond,counts:()=>({sent,aborted})};
 }
 return {native,hooks,register,get ledger(){return ledger;},restart(){ledger.close();ledger=new PlaywrightAttemptLedger(path.join(directory,'attempts.sqlite'));}};
}
for(const [label,data,ok,status] of [
 ['payment required',{success:true,booking:{id:123,status:0}},true,'payment_required'],
 ['explicit rejection',{success:false},true,'rejected'],
 ['unverified positive code',{success:true,booking:{id:123,status:1}},true,'unknown'],
 ['HTTP error with success-shaped body',{success:true,booking:{id:123,status:0}},false,'unknown'],
])test(`native response persists and recovers ${label} without replay`,async t=>{
 const f=await setup(t),n=await f.native();await n.transmit();assert.equal(n.counts().sent,1);
 await n.respond(data,ok);
 const current=n.mirror.current('alice');assert.equal(current.result.status,status);assert.equal(current.canSubmit,false);
 assert.equal(f.ledger.list('alice')[0].status,status);assert.equal(f.register.list(['alice'])[0].status,status);
 assert.deepEqual(f.ledger.list('bob'),[]);assert.deepEqual(f.register.list(['bob']),[]);
 await n.mirror.close();f.restart();
 const recovered=f.hooks().recover('alice');assert.equal(recovered[0].status,status);
 assert(!JSON.stringify(recovered).includes(approval.email));assert(!JSON.stringify(f.register.list(['alice'])).includes(approval.comment));
 const retry=await f.native();await retry.transmit();assert.deepEqual(retry.counts(),{sent:0,aborted:1});assert.equal(f.ledger.list('alice').length,1);
});
test('register failure before dispatch consumes durable attempt and prevents a later resend',async t=>{
 const f=await setup(t);const n=await f.native(f.hooks({register:{upsert(){throw Error('simulated register disk failure');}}}));
 await n.transmit();assert.deepEqual(n.counts(),{sent:0,aborted:1});assert.equal(f.ledger.list('alice')[0].status,'unknown');
 f.restart();assert.equal(f.hooks().recover('alice')[0].status,'unknown');
 const retry=await f.native();await retry.transmit();assert.equal(retry.counts().sent,0);
 assert.equal(f.register.list(['alice'])[0].status,'unknown');
});
test('result persistence failure after dispatch stays unknown through current and restart',async t=>{
 const f=await setup(t);const hooks=f.hooks();const n=await f.native({...hooks,recordResult(){throw Error('simulated persistence failure');}});
 await n.transmit();await n.respond({success:true,booking:{id:123,status:0}});
 assert.equal(n.mirror.current('alice').result.status,'unknown');assert.equal(n.mirror.current('alice').canSubmit,false);
 f.restart();assert.equal(f.hooks().recover('alice')[0].status,'unknown');
 const retry=await f.native();await retry.transmit();assert.equal(retry.counts().sent,0);
});
