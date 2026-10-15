import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const enforce = process.env.VELVET_SAFETY_ENFORCE === '1';
import { BokabordMirror, allowedRequest } from '../api/bokabord-mirror.mjs';
import { BookingLedger } from '../api/bokabord-ledger.mjs';
const endpoint='https://app.bokabord.se/reservation/api/booking/saveBooking';
const approval={date:'2026-10-20',time:'19:00',party:2,firstname:'Fixture',lastname:'Only',email:'fixture@example.invalid',phone:'+46700000000',terms:true};
globalThis.fetch=()=>{throw new Error('network forbidden');};
async function fixture(options={}) {
 const events=new Map(); let routeHandler;
 const page={on:(event,handler)=>events.set(event,handler),setDefaultTimeout(){},goto:async()=>{},locator:()=>({first:()=>({waitFor:async()=>{}})}),mainFrame:()=>({})};
 const context={route:async(_pattern,handler)=>{routeHandler=handler;},newPage:async()=>page,on(){},close:async()=>{}};
 const mirror=new BokabordMirror({prepare:true,live:true,reserveSubmission:async()=>{},...options});
 mirror.browser=async()=>({newContext:async()=>context}); mirror.settle=async()=>{};
 mirror.snapshot=async s=>{s.lastSnapshot={id:s.id,revision:s.revision,details:approval,canSubmit:true,result:null};return s.lastSnapshot;};
 await mirror.create('fixture-owner','curated-STO-zink-italian-cuisine');
 return {mirror,page,session:[...mirror.sessions.values()][0],events,route:()=>routeHandler};
}
test('KNOWN GAP: missing/unknown supplier status becomes confirmed',async()=>{
 const f=await fixture();
 try { for(const status of [undefined,'unrecognized',-1,99]) {
  f.session.submitted=true;
  f.events.get('response')({url:()=>endpoint,json:async()=>({success:true,booking:{id:123,...(status===undefined?{}:{status})}})});
  await f.session.resultPromise;
  if (enforce) assert.notEqual(f.session.result.status,'confirmed','Unknown/missing supplier status must not confirm');
  else assert.equal(f.session.result.status,'confirmed');
 }
 } finally {await f.mirror.close();}
});
test('KNOWN GAP: interrupted submit keeps lastSnapshot actionable although session is unknown',async()=>{
 const f=await fixture();
 try {
 f.mirror.bookingDetails=async()=>approval;
 f.page.getByRole=()=>({isVisible:async()=>true,click:async()=>{f.session.submitted=true;f.session.result={status:'unknown'};throw new Error('simulated timeout after transmission');}});
 f.page.waitForResponse=async()=>null;
 await assert.rejects(f.mirror.action(f.session.id,f.session.owner,{type:'submit',revision:0,confirm:true,terms:true}),/simulated timeout/);
 const snapshot=f.mirror.current(f.session.owner);
 if (enforce) { assert.equal(snapshot.canSubmit,false); assert.equal(snapshot.result?.status,'unknown'); }
 else { assert.equal(snapshot.canSubmit,true); assert.equal(snapshot.result,null); }
 assert.equal(f.session.result.status,'unknown');
 await assert.rejects(f.mirror.action(f.session.id,f.session.owner,{type:'submit',revision:0,confirm:true,terms:true}),/already_attempted/);
 } finally {await f.mirror.close();}
});
test('CONTRACT GAP: guest-to-account owner change changes same-booking durable key',()=>{
 const ledger=new BookingLedger('unused-no-files-written');
 assert.notEqual(ledger.key(approval,{owner:'guest:fixture',restaurantId:'same'}),ledger.key(approval,{owner:'user:fixture',restaurantId:'same'}));
});
test('CONTRACT GAP: unknown GET hold-like endpoint allowed by method policy',()=>{
 assert.equal(allowedRequest('GET','https://app.bokabord.se/reservation/api/booking/hold'),true);
 // Synthetic path only: this does not establish that a real provider GET creates holds.
});


test('durable gate permits only one of two concurrent route attempts',async()=>{
 const root=path.resolve('work');fs.mkdirSync(root,{recursive:true});
 const directory=fs.mkdtempSync(path.join(root,'safety-33857d8d-'));
 const ledger=new BookingLedger(directory);
 const f=await fixture({reserveSubmission:async(a,s)=>ledger.reserve(a,s)});
 try {
 f.session.armed=true;f.session.approval=approval;
 let transmitted=0,aborted=0;
 const request={method:()=> 'POST',url:()=>endpoint,postDataJSON:()=>({...approval,amount:2,waitlist:false,products:[],terms:{general:true,restaurant:false,bokabord:false}})};
 const route={request:()=>request,continue:async()=>{transmitted++;},abort:async()=>{aborted++;}};
 await Promise.all([f.route()(route),f.route()(route)]);
 assert.equal(transmitted,1);assert.equal(aborted,1);
 assert.equal(ledger.list().length,1);assert.equal(ledger.list()[0].status,'unknown');
 assert.throws(()=>new BookingLedger(directory).reserve(approval,f.session),/EEXIST/);
 } finally {await f.mirror.close();assert.equal(path.dirname(path.resolve(directory)),root);fs.rmSync(directory,{recursive:true,force:true});}
});
test('pending creation enforces one owner and global capacity; failures release capacity',async()=>{
 const mirror=new BokabordMirror();const rejects=[];
 mirror.browser=()=>new Promise((_resolve,reject)=>rejects.push(reject));
 const id='curated-STO-zink-italian-cuisine';const pending=[];
 try {
 pending.push(mirror.create('one',id).catch(e=>e.message));
 await assert.rejects(mirror.create('one',id),/session_exists/);
 for(const owner of ['two','three','four']) pending.push(mirror.create(owner,id).catch(e=>e.message));
 assert.equal(mirror.pending,4);
 await assert.rejects(mirror.create('five',id),/capacity/);
 rejects.forEach(reject=>reject(new Error('fixture creation cancelled')));
 await Promise.all(pending);assert.equal(mirror.pending,0);assert.equal(mirror.pendingOwners.size,0);
 } finally {await mirror.close();}
});
test('DEPLOYMENT CONDITION: loopback upstream bypasses application request budget',()=>{
 const source=fs.readFileSync(new URL('../api/server.mjs',import.meta.url),'utf8');
 const start=source.indexOf('function rateLimited(req, res) {');
 const end=source.indexOf('const server =',start);
 assert.ok(start>=0 && end>start);
 let budgetCalls=0;
 const context={process:{env:{}},URL,RATE:{take:()=>{budgetCalls++;return{allowed:false,retryAfter:60};}},send:()=>{}};
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 const req={socket:{remoteAddress:'127.0.0.1'},headers:{'x-forwarded-for':'203.0.113.10'},method:'POST',url:'/restaurant-bookings/mirror'};
 assert.equal(context.rateLimited(req,{}),false);assert.equal(budgetCalls,0);
 req.socket.remoteAddress='192.0.2.10';assert.equal(context.rateLimited(req,{}),true);assert.equal(budgetCalls,1);
 // Whether production uses a loopback reverse proxy requires separate deployment inspection.
});
