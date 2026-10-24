import fs from 'node:fs';
import assert from 'node:assert/strict';
import {AvailabilitySearch} from '../api/availability-search.mjs';
const registry=JSON.parse(fs.readFileSync(new URL('../data/booking-providers.json',import.meta.url)));
const evidence=JSON.parse(fs.readFileSync(new URL('../docs/sevenrooms-search-qualification.json',import.meta.url)));
let calls=0;
const service=new AvailabilitySearch({registry,restaurants:{},fetcher:async(url)=>{calls++;assert.equal(url.pathname,'/api-yoa/availability/ng/widget/range');assert.equal(url.searchParams.get('party_size'),'2');assert.equal(url.searchParams.get('start_date'),evidence.query.date);return {ok:true,json:async()=>({status:200,data:{availability:{[evidence.query.date]:[{times:[{type:'book',time:'19:00'}]}]}}})};}});
for(const row of evidence.results){const before=calls;const r=await service.venue(row.restaurantId,registry[row.restaurantId],evidence.query);
 if(row.status==='not_probed'){assert.equal(r.status,'unsupported');assert.equal(calls,before);assert.equal(registry[row.restaurantId].liveAvailabilitySupported,false);}
 else {assert.equal(r.status,'available');assert.equal(calls,before+1);assert.equal(r.slots.length,1);assert.equal(registry[row.restaurantId].completionTracking,'unsupported');}
}
assert.equal(calls,16);assert.equal(new Set(evidence.requests.map(r=>r.url)).size,15);
console.log('PASS: 16 qualified catalogue rows use the adapter; three scoped exclusions remain gated; 15 distinct upstream identities, no booking confirmation claim. Mocked only.');
