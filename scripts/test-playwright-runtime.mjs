import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlaywrightRuntime, PlaywrightRuntimeError } from '../api/playwright-runtime.mjs';
function fixture(enabled = true) {
  let count = 0, time = 0, closed = 0;
  const adapter = { create: async () => ({id:`session-${++count}`,revision:1}),
    action: async () => ({id:'session-1',revision:2}), remove: async () => {}, close: async () => { closed++; } };
  const providers = Object.fromEntries(['Zenchef','SevenRooms'].map(provider => [provider,{restaurantId:provider,adapter,current:async id => ({id,revision:1})}]));
  return { runtime: new PlaywrightRuntime({providers,enabled,now:()=>time}), adapter, tick:()=>{time=600001;}, closed:()=>closed };
}
test('inspection is disabled by default and never advertised as live booking', async () => {
  const {runtime} = fixture(false);
  await assert.rejects(runtime.create('owner',true,{provider:'Zenchef',restaurantId:'Zenchef'}), /disabled/);
  assert(runtime.capabilities().every(c => !c.enabled && !c.liveBooking && !c.availabilityVerified));
});
test('operator gate, cross-owner denial, write rejection and shared provider capacity', async () => {
  const {runtime} = fixture();
  await assert.rejects(runtime.create('owner',false,{}), /operator/);
  await assert.rejects(runtime.create('owner',true,{provider:'__proto__',restaurantId:'Zenchef'}), /unsupported/);
  const s = await runtime.create('owner',true,{provider:'Zenchef',restaurantId:'Zenchef'});
  assert.equal(s.canSubmit,false);
  await assert.rejects(runtime.create('other',true,{provider:'SevenRooms',restaurantId:'SevenRooms'}), /capacity/);
  await assert.rejects(runtime.run(s.id,'other',true,'current'), /session_expired/);
  await assert.rejects(runtime.run(s.id,'owner',true,'action',{type:'submit',revision:1}), /inspect_only/);
  assert.equal((await runtime.run(s.id,'owner',true,'current')).id,s.id);
  await runtime.run(s.id,'owner',true,'remove');
  await runtime.create('other',true,{provider:'SevenRooms',restaurantId:'SevenRooms'});
  await runtime.close();
});
test('pending create consumes capacity and expiry releases the shared slot', async () => {
  const {runtime,adapter,tick} = fixture();
  let finish;
  adapter.create = () => new Promise(resolve => {finish=resolve;});
  const pending = runtime.create('owner',true,{provider:'Zenchef',restaurantId:'Zenchef'});
  await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(runtime.create('other',true,{provider:'SevenRooms',restaurantId:'SevenRooms'}), /capacity/);
  finish({id:'pending',revision:1}); await pending;
  tick(); await runtime.expire(); assert.equal(runtime.sessions.size,0);
  await runtime.close();
});
test('native expiry before wrapper expiry cannot permanently consume capacity', async () => {
  const {runtime,adapter,tick}=fixture();
  const expired=()=>{throw new PlaywrightRuntimeError('session_expired',404);};
  const first=await runtime.create('owner',true,{provider:'Zenchef',restaurantId:'Zenchef'});
  runtime.providers.Zenchef.current=async()=>expired();
  adapter.remove=async()=>expired();
  await assert.rejects(runtime.run(first.id,'owner',true,'current'),/session_expired/);
  assert.equal(runtime.sessions.size,0);
  await runtime.create('owner',true,{provider:'Zenchef',restaurantId:'Zenchef'});
  tick();await runtime.expire();assert.equal(runtime.sessions.size,0);
  await runtime.create('other',true,{provider:'SevenRooms',restaurantId:'SevenRooms'});
  await runtime.close();
});
test('configured live guest sessions resume, gate writes and discard body ownership', async () => {
  const {runtime,adapter}=fixture(false);
  Object.assign(runtime.providers.SevenRooms,{mode:'live',enabled:true,actions:['refresh','hold','fill','review','submit']});
  const snapshot={id:'live-session',restaurantId:'SevenRooms',mode:'prepare',revision:1,canHold:true};
  adapter.create=async()=>snapshot;
  runtime.providers.SevenRooms.current=async()=>snapshot;
  const calls=[];
  adapter.action=async(id,owner,action)=>{calls.push({id,owner,action});return snapshot;};
  const session=await runtime.create('guest',false,{provider:'SevenRooms',restaurantId:'SevenRooms'});
  snapshot.result={status:'held',phase:'hold'};
  snapshot.canSubmit=true;
  const held=await runtime.run(session.id,'guest',false,'current');
  assert.deepEqual(held.result,{status:'held',phase:'hold'});
  assert.equal(held.canHold,false);
  assert.equal(held.canSubmit,true);
  snapshot.result=null;
  assert.equal(session.mode,'live');assert.equal(session.canHold,true);
  assert.equal(runtime.guestProvider('SevenRooms','SevenRooms'),true);
  assert.equal((await runtime.create('guest',false,{provider:'SevenRooms',restaurantId:'SevenRooms',resume:true})).id,session.id);
  await assert.rejects(runtime.run(session.id,'guest',false,'action',{type:'hold',revision:1}),/confirmation_required/);
  await assert.rejects(runtime.run(session.id,'guest',false,'action',{type:'submit',revision:1,confirm:true,reviewFingerprint:'a'.repeat(64)}),/confirmation_required/);
  await runtime.run(session.id,'guest',false,'action',{type:'hold',revision:1,confirm:true,reviewFingerprint:'a'.repeat(64),owner:'forged',mode:'fixture'});
  assert.equal(calls.length,1);assert.equal(calls[0].owner,'guest');assert.equal(calls[0].action.owner,undefined);assert.equal(calls[0].action.mode,undefined);
  await runtime.close();
});
test('public runtime rejects fixture sessions and unpersisted confirmation claims',async()=>{
  const {runtime,adapter}=fixture();let removed=0;
  Object.assign(runtime.providers.Zenchef,{mode:'live',enabled:true});
  adapter.remove=async()=>{removed++;};
  adapter.create=async()=>({id:'fixture',restaurantId:'Zenchef',mode:'fixture'});
  await assert.rejects(runtime.create('guest',false,{provider:'Zenchef',restaurantId:'Zenchef'}),/fixture_forbidden/);
  assert.equal(removed,1);assert.equal(runtime.sessions.size,0);
  adapter.create=async()=>({id:'live',restaurantId:'Zenchef',mode:'live',result:{status:'confirmed',reference:'not-evidence'}});
  const snapshot=await runtime.create('guest',false,{provider:'Zenchef',restaurantId:'Zenchef'});
  assert.equal(snapshot.result.status,'unknown');assert.equal(snapshot.canSubmit,false);
  await runtime.close();
});
