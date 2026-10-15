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
// Request metadata must survive every public path, without leaking registry data.
const requestRow={...sr,bookingMode:'request_only',liveAvailabilitySupported:false,responseTimeHours:{min:24,max:72,privateNote:'omit'},paymentRequirement:'card_guarantee',cancellationPolicyStatus:'unknown',privateSecret:'omit'};
let metadataFetches=0;
const requestService=new AvailabilitySearch({registry:{request:requestRow},restaurants:{destinations:{TEST:{destination:'Test',restaurants:[{placeId:'request',name:'Request'}]}}},now:()=>Date.parse('2026-10-16T12:00Z'),fetcher:async()=>{metadataFetches++;throw Error('must not fetch')},adapters:{SevenRooms:async()=>{metadataFetches++;throw Error('must not call adapter')}}});
const direct=await requestService.venue('request',requestRow,q);
const job=requestService.start(q),duplicateJob=requestService.start(q);
await Promise.all([...requestService.inflight.values()]);await new Promise(resolve=>setImmediate(resolve));
const finalJob=requestService.status(job.searchId);
const [search,deduped]=await Promise.all([requestService.search(q),requestService.search(q)]);
const paths={direct,initial:job.results[0],duplicate:duplicateJob.results[0],completed:finalJob.results[0],search:search.results[0],deduped:deduped.results[0]};
for(const [path,result]of Object.entries(paths)){
 assert.equal(result.status,'request_only',path);assert.equal(result.bookingMode,'request_only',path);
 assert.deepEqual(result.responseTimeHours,{min:24,max:72},path);assert.equal(result.paymentRequirement,'card_guarantee',path);assert.equal(result.cancellationPolicyStatus,'unknown',path);
 assert.equal(result.privateSecret,undefined,path);assert.notEqual(result.responseTimeHours,requestRow.responseTimeHours,path);
}
assert.equal(metadataFetches,0);
for(const result of Object.values(paths))result.responseTimeHours.min=999;
assert.equal(requestRow.responseTimeHours.min,24,'results cannot mutate registry');
assert.equal(requestService.status(job.searchId).results[0].responseTimeHours.min,24,'results cannot poison future snapshots');
const a=requestService.status(job.searchId),b=requestService.status(job.searchId);a.results[0].responseTimeHours.max=1;assert.equal(b.results[0].responseTimeHours.max,72,'snapshots do not share nested metadata');
for(const invalid of [undefined,null,{min:'24',max:72},{min:-1,max:72},{min:24,max:23},{min:0,max:Infinity},{min:1.5,max:72},{min:0,max:Number.MAX_SAFE_INTEGER+1}]){
 requestRow.responseTimeHours=invalid;requestRow.paymentRequirement='anything';requestRow.cancellationPolicyStatus='free';
 const result=await requestService.venue('request',requestRow,q);
 assert.equal(result.responseTimeHours,undefined);assert.equal(result.paymentRequirement,undefined);assert.equal(result.cancellationPolicyStatus,undefined);
}
assert.equal(metadataFetches,0);
console.log('PASS request metadata: all six paths, safe field projection, invalid-value rejection and nested-object mutation isolation; zero upstream calls.');
const sanitized=requestService.status(job.searchId).results[0];
assert.equal(sanitized.responseTimeHours,undefined,'removed/invalid terms cannot survive cached snapshots');
assert.equal(sanitized.paymentRequirement,undefined);
assert.equal(sanitized.cancellationPolicyStatus,undefined);

// Hartwood publishes only an upper bound. Preserve it across all six paths,
// including existing job snapshots, without inventing a minimum.
async function allRequestPaths() {
 const direct=await requestService.venue('request',requestRow,q);
 const initial=requestService.start(q),duplicate=requestService.start(q);
 await Promise.all([...requestService.inflight.values()]);await new Promise(resolve=>setImmediate(resolve));
 const completed=requestService.status(initial.searchId);
 const [search,deduped]=await Promise.all([requestService.search(q),requestService.search(q)]);
 return {direct,initial:initial.results[0],duplicate:duplicate.results[0],completed:completed.results[0],search:search.results[0],deduped:deduped.results[0]};
}
for(const max of [0,48,Number.MAX_SAFE_INTEGER]) {
 requestRow.responseTimeHours={max,privateNote:'omit'};
 const results=await allRequestPaths();
 for(const [path,result] of Object.entries(results)) {
  assert.equal(result.status,'request_only',path);assert.deepEqual(result.slots,[],path);
  assert.deepEqual(result.responseTimeHours,{max},path);assert.equal(Object.hasOwn(result.responseTimeHours,'min'),false,path);
  result.responseTimeHours.max=-1;
 }
 assert.equal(requestRow.responseTimeHours.max,max,'max-only results cannot mutate registry');
 const a=requestService.status(job.searchId),b=requestService.status(job.searchId);
 assert.deepEqual(a.results[0].responseTimeHours,{max},'old cached min must be purged');
 a.results[0].responseTimeHours.max=-1;
 assert.deepEqual(b.results[0].responseTimeHours,{max},'max-only snapshots are independently cloned');
}
for(const invalid of [{max:-1},{max:1.5},{max:'48'},{max:Infinity},{max:Number.MAX_SAFE_INTEGER+1},{min:undefined,max:48},{min:null,max:48},{min:49,max:48},{min:-1,max:48},{},null,undefined,[]]) {
 requestRow.responseTimeHours=invalid;
 for(const [path,result] of Object.entries(await allRequestPaths())) {
  assert.equal(result.status,'request_only',path);
  assert.equal(result.responseTimeHours,undefined,`${path}: invalid max-only metadata must not survive cache`);
 }
}
assert.equal(metadataFetches,0,'all max-only and invalid paths stay offline');
console.log('PASS max-only response bounds: six paths, no invented minimum, cache purge, clone isolation and invalid rejection; zero upstream calls.');
