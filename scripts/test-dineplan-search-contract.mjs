import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDineplanSearchContract } from './lib/dineplan-search-contract.mjs';
import { AvailabilitySearch } from '../api/availability-search.mjs';
const row={restaurantId:'osm-CPT-the-hussar-grill',name:'The Hussar Grill',city:'Cape Town',provider:'Dineplan',url:'https://account.dineplan.com/widget/v3/frame/1nWHwN9S',liveAvailabilitySupported:true};
const query={date:'2026-10-26',party:2,time:'19:00'};
const result={status:'options_observed',restaurantId:row.restaurantId,date:query.date,partySize:2,options:[{time:'12:00',enabled:true},{time:'18:30',enabled:true},{time:'19:00',enabled:false},{time:'20:30',enabled:true}]};
test('shared format filters window and leaves terms and confirmation unknown',async()=>{
 const output=await createDineplanSearchContract({search:async()=>result})(row,query);
 assert.equal(output.status,'available');assert.deepEqual(output.slots.map(s=>s.time),['18:30','20:30']);
 assert.ok(output.slots.every(s=>s.paymentRequirement==='not_specified'&&s.confirmationVerified===false&&s.bookingUrl===row.url));
});
test('exact identity and explicit live gate required before transport',async()=>{
 const adapter=createDineplanSearchContract({search:()=>assert.fail('Unexpected transport')});
 for(const changes of [{liveAvailabilitySupported:false},{liveAvailabilitySupported:undefined},{url:row.url+'?x=1'},{restaurantId:'other'},{provider:'other'},{bookingMode:'request_only'}])
  assert.equal((await adapter({...row,...changes},query)).status,'unsupported');
});
test('negative and mismatched evidence never becomes no availability',async()=>{
 for(const changes of [{options:[]},{status:'unknown'},{date:'2026-10-27'},{partySize:3},{restaurantId:'other'},{options:[{time:'bad',enabled:true}]}]){
  const output=await createDineplanSearchContract({search:async()=>({...result,...changes})})(row,query);
  assert.equal(output.status,'error');assert.deepEqual(output.slots,[]);
 }
});
test('actual shared engine honors registry gate including snapshots',async()=>{
 let calls=0;
 const registry={[row.restaurantId]:{...row,liveAvailabilitySupported:false}};
 const engine=new AvailabilitySearch({registry,restaurants:{},adapters:{Dineplan:createDineplanSearchContract({search:async()=>{calls++;return result;}})}});
 assert.equal((await engine.venue(row.restaurantId,row,query)).status,'unsupported');assert.equal(calls,0);
 registry[row.restaurantId].liveAvailabilitySupported=true;
 const positive=await engine.venue(row.restaurantId,row,query);
 assert.equal(positive.status,'available');assert.equal(calls,1);
 registry[row.restaurantId].liveAvailabilitySupported=false;
 assert.equal(engine.applyGate(positive).status,'unsupported');assert.deepEqual(engine.applyGate(positive).slots,[]);
});
