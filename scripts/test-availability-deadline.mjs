import assert from 'node:assert/strict';
import {AvailabilitySearch} from '../api/availability-search.mjs';
const query={city:'Test',date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:'17:00',party:2};
let resolveLate;
const service=new AvailabilitySearch({
 searchTimeoutMs:30,
 registry:{a:{provider:'Fake',name:'Hanging'},b:{provider:'Fake',name:'Ready'}},
 restaurants:{destinations:{TST:{destination:'Test',restaurants:[{placeId:'a',name:'Hanging'},{placeId:'b',name:'Ready'}]}}},
 adapters:{Fake:async row=>row.restaurantId==='a'?new Promise(resolve=>resolveLate=resolve):{restaurantId:'b',restaurant:'Ready',status:'available',slots:[{time:'17:00'}],checkedAt:new Date().toISOString()}},
});
const job=service.start(query);
const limit=Date.now()+1000;
while(!service.status(job.searchId)?.complete && Date.now()<limit) await new Promise(resolve=>setTimeout(resolve,10));
const completed=service.status(job.searchId);
assert.equal(completed.complete,true,'Server deadline completes a stalled search');
assert.equal(completed.results.find(r=>r.restaurantId==='a').status,'error','Unfinished venue is unknown/error, never unavailable');
assert.equal(completed.results.find(r=>r.restaurantId==='b').status,'available','Already received result survives deadline');
assert.equal(service.active,0,'Search capacity is released at deadline');
assert.equal(service.inflight.size,0,'Dead inflight search cannot be reused forever');
const snapshot=JSON.stringify(completed);
resolveLate({restaurantId:'a',restaurant:'Late result',status:'available',slots:[{time:'17:30'}],checkedAt:new Date().toISOString()});
await new Promise(resolve=>setTimeout(resolve,30));
assert.equal(JSON.stringify(service.status(job.searchId)),snapshot,'Late adapter cannot rewrite completed partial job');
assert.equal(service.active,0,'Late settlement must not double-release capacity');
const retry=service.start({...query,time:'18:00'});
assert.notEqual(retry.searchId,job.searchId,'Next query can run after timeout');
while(!service.status(retry.searchId)?.complete && Date.now()<limit+1000) await new Promise(resolve=>setTimeout(resolve,10));
assert.equal(service.status(retry.searchId).complete,true);
assert.equal(service.active,0);
console.log('PASS server search deadline: retained partial results, error for unfinished venues, released capacity, ignored late results and retry.');
