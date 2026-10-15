import assert from 'node:assert/strict';
import {AvailabilitySearch} from '../api/availability-search.mjs';
const date=new Date(Date.now()+86400000).toISOString().slice(0,10),q={city:'Test',date,time:'17:00',party:2};
let finish;const service=new AvailabilitySearch({registry:{a:{provider:'Fake',name:'A'}},restaurants:{destinations:{TST:{destination:'Test',restaurants:[{placeId:'a',name:'A'},{placeId:'b',name:'B'}]}}},adapters:{Fake:async(row)=>{await new Promise(r=>finish=r);return {restaurantId:row.restaurantId,restaurant:'A',status:'available',slots:[{time:'17:00'}],checkedAt:new Date().toISOString()};}}});
const started=service.start(q);assert.equal(started.complete,false);assert.equal(started.results[0].status,'pending');assert.equal(started.results[1].status,'unsupported');assert.equal(service.start(q).searchId,started.searchId);assert.equal(service.status('not-a-job'),null);finish();
await new Promise(r=>setTimeout(r,10));const final=service.status(started.searchId);assert.equal(final.complete,true);assert.equal(final.results[0].status,'available');assert.equal(started.results[0].status,'pending','initial snapshot stays immutable');
service.now=()=>Date.now()+300000;assert.equal(service.status(started.searchId),null);
console.log('PASS progressive search: immediate pending, live per-venue updates, duplicate-job sharing, immutable snapshots and expiry.');
