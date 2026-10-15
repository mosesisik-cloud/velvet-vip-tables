import assert from 'node:assert/strict';
import {AvailabilitySearch} from '../api/availability-search.mjs';
const q={city:'Test',date:'2026-10-18',time:'19:00',party:2};
const sr={name:'Test',city:'Test',provider:'SevenRooms',venueId:'test',url:'https://www.sevenrooms.com/reservations/test'};
const registry={disabled:{...sr,liveAvailabilitySupported:false},request:{...sr,bookingMode:'request_only'},both:{...sr,liveAvailabilitySupported:false,bookingMode:'request_only'},adapterDisabled:{...sr,provider:'Fixture',liveAvailabilitySupported:false},adapterRequest:{...sr,provider:'Fixture',bookingMode:'request_only'},legacy:{...sr},external:{...sr,integrationMode:'external_link',liveAvailabilitySupported:true},adapterExternal:{...sr,provider:'Fixture',integrationMode:'external_link',liveAvailabilitySupported:true}};
let fetches=0,adapterCalls=0;
const service=new AvailabilitySearch({registry,now:()=>Date.parse('2026-10-16T12:00Z'),restaurants:{destinations:{TEST:{destination:'Test',restaurants:Object.keys(registry).map(placeId=>({placeId,name:placeId}))}}},fetcher:async()=>{fetches++;return{ok:true,json:async()=>({status:200,data:{availability:{[q.date]:[{times:[{type:'book',time:'19:00'}]}]}}})}},adapters:{Fixture:async row=>{adapterCalls++;return{restaurantId:row.restaurantId,status:'available',slots:[{time:'19:00'}]}}}});
const gated=['disabled','request','both','adapterDisabled','adapterRequest'];
function check(row,id){assert.equal(row.status,id.toLowerCase().includes('request')||id==='both'?'request_only':'unsupported');assert.equal(row.slots.length,0);assert.equal(row.checkedAt,null);assert.equal(row.reason,row.status==='request_only'?'request_only':'live_availability_disabled');}
for(const id of gated)check(await service.venue(id,registry[id],q),id);
assert.equal(fetches+adapterCalls,0,'direct venue gates must run before fetch/adapters');
let initial=service.start(q);
for(const id of gated)check(initial.results.find(r=>r.restaurantId===id),id);
const same=service.start(q);assert.equal(same.searchId,initial.searchId);
await Promise.all([...service.inflight.values()]);await new Promise(resolve=>setImmediate(resolve));
const completed=service.status(initial.searchId);assert.equal(completed.complete,true);
for(const id of gated)check(completed.results.find(r=>r.restaurantId===id),id);
assert.equal(fetches,2,'legacy undefined and enabled external SevenRooms stay live');assert.equal(adapterCalls,1,'external mode does not disable approved adapter');
const results=await service.search(q);for(const id of gated)check(results.results.find(r=>r.restaurantId===id),id);
assert.equal(fetches,4);assert.equal(adapterCalls,2);
// Stored completed jobs must not revive results after an explicit registry gate.
registry.legacy.liveAvailabilitySupported=false;
const cached=service.status(initial.searchId).results.find(r=>r.restaurantId==='legacy');assert.equal(cached.status,'unsupported');assert.deepEqual(cached.slots,[]);
// In-flight deduplication rechecks the gate after upstream work already began.
let release;service.adapters.Fixture=async row=>{await new Promise(resolve=>{release=resolve});return{restaurantId:row.restaurantId,status:'available',slots:[{time:'19:00'}]}};
const first=service.search(q),second=service.search(q);
await new Promise(resolve=>setImmediate(resolve));registry.adapterExternal.bookingMode='request_only';release();
for(const response of await Promise.all([first,second])){const row=response.results.find(r=>r.restaurantId==='adapterExternal');assert.equal(row.status,'request_only');assert.deepEqual(row.slots,[]);}
console.log('PASS availability gates: direct, initial jobs, ranking, adapters, completed snapshots, deduped in-flight results; legacy and approved external compatibility. No live calls.');
