import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlaywrightRuntime } from '../api/playwright-runtime.mjs';
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
