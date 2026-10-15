import assert from 'node:assert/strict';
import {BookingAssetCache} from '../api/booking-asset-cache.mjs';
import {BokabordAvailability,selectBookableTimes,safeBokabordRegistry,allowedAvailabilityRequest} from '../api/providers/bokabord-availability.mjs';
assert.deepEqual(selectBookableTimes([{time:'17:00',bookable:true},{time:'18:00',bookable:false},{time:'18:30',bookable:true},{time:'18:30',bookable:true},{time:'20:01',bookable:true},{time:'99:00',bookable:true}], '18:30'),['17:00','18:30']);
assert.equal(safeBokabordRegistry({url:'https://evil.example/reservation/?hash=abcd',hash:'abcd'}),false);
for(const [method,url] of [['POST','https://app.bokabord.se/reservation/api/booking/saveBooking'],['GET','https://app.bokabord.se/reservation/api/booking/saveBooking'],['POST','https://app.bokabord.se/reservation/api/unknown'],['GET','https://app.bokabord.se/reservation/api/unknown'],['POST','https://app.bokabord.se/booking-widget/api/createTemporaryBooking'],['POST','https://evil.example/booking-widget/api/getTimes']])assert.equal(allowedAvailabilityRequest(method,url),false,url);
assert.equal(allowedAvailabilityRequest('POST','https://app.bokabord.se/booking-widget/api/getTimes'),true);
let created=0,closed=0,peak=0;const slow=new BokabordAvailability({maxQueued:1,timeoutMs:1000,browserFactory:async()=>({newContext:async()=>{created++;peak=Math.max(peak,created-closed);return {route:async()=>{},newPage:async()=>({setDefaultTimeout(){},setDefaultNavigationTimeout(){},goto:()=>new Promise(()=>{})}),close:async()=>{closed++;}};},close:async()=>{}})});
const start=Date.now();const timed=await Promise.all(Array.from({length:5},()=>slow.searchVenue({id:'curated-STO-zink-italian-cuisine'},{date:'2026-10-22',time:'19:00',party:2})));
assert.ok(timed.every(r=>r.status==='error'&&r.slots.length===0));assert.ok(Date.now()-start<2500);assert.ok(peak<=2);assert.equal(closed,created);assert.equal(slow.active,0);assert.equal(slow.queue.length,0);await slow.close();
let abortCreated=0,abortClosed=0;
const abortable=new BokabordAvailability({maxQueued:2,browserFactory:async()=>({newContext:async()=>{abortCreated++;let shut=false;return {route:async()=>{},newPage:async()=>({setDefaultTimeout(){},setDefaultNavigationTimeout(){},goto:()=>new Promise(()=>{})}),close:async()=>{if(!shut){shut=true;abortClosed++;}}};},close:async()=>{}})});
const abortController=new AbortController();const abortJobs=Array.from({length:4},()=>abortable.searchVenue({id:'curated-STO-zink-italian-cuisine'},{date:'2026-10-22',time:'19:00',party:2,signal:abortController.signal}));
await new Promise(resolve=>setTimeout(resolve,30));const abortedAt=Date.now();abortController.abort();await Promise.all(abortJobs);assert.ok(Date.now()-abortedAt<500);assert.equal(abortCreated,2);assert.equal(abortClosed,2);assert.equal(abortable.active,0);assert.equal(abortable.queue.length,0);await abortable.close();
let resolveBrowser,lateCreated=0;const late=new BokabordAvailability({browserFactory:()=>new Promise(resolve=>{resolveBrowser=resolve;})});const lateController=new AbortController();const lateJob=late.searchVenue({id:'curated-STO-zink-italian-cuisine'},{date:'2026-10-22',time:'19:00',party:2,signal:lateController.signal});await new Promise(resolve=>setTimeout(resolve,10));lateController.abort();await lateJob;resolveBrowser({newContext:async()=>{lateCreated++;throw Error('must not start');},close:async()=>{}});await new Promise(resolve=>setTimeout(resolve,10));assert.equal(lateCreated,0);await late.close();
const publicAssets=new BookingAssetCache({now:()=>1000});
for(const [method,type,url] of [['GET','document','https://app.bokabord.se/reservation/'],['POST','fetch','https://app.bokabord.se/booking-widget/api/getTimes'],['GET','fetch','https://app.bokabord.se/booking-widget/api/getAvailability'],['GET','script','https://app.bokabord.se/booking-widget/api/getSettings']])assert.equal(publicAssets.eligible({method:()=>method,resourceType:()=>type,url:()=>url}),false);
publicAssets.put('public.js',{'cache-control':'public, max-age=300','content-type':'application/javascript'},Buffer.from('public'),200);assert.equal(publicAssets.entries.size,1);
for(const headers of [{'cache-control':'private, max-age=300','content-type':'application/javascript'},{'cache-control':'public, max-age=300','content-type':'application/json'},{'cache-control':'public, max-age=300','content-type':'text/html'},{'cache-control':'public, max-age=300','content-type':'application/javascript','set-cookie':'private=1'}])publicAssets.put('private',headers,Buffer.from('private'),200);
assert.equal(publicAssets.entries.size,1,'no private/HTML/JSON responses retained');
const adapter=new BokabordAvailability();
try {assert.equal((await adapter.searchVenue({id:'unknown'},{date:'2026-10-19',time:'19:00',party:2})).status,'unsupported');
if(process.env.BOKABORD_LIVE_READONLY==='1'){
 for(const id of (process.env.BOKABORD_IDS||'curated-STO-zink-italian-cuisine,curated-STO-ciccios').split(',')){
 const result=await adapter.searchVenue({id},{date:process.env.BOKABORD_DATE||'2026-10-19',time:'19:00',party:2});console.log(JSON.stringify(result));if(id==='curated-STO-frantzen'){assert.ok(['unsupported','error'].includes(result.status));assert.deepEqual(result.slots,[]);}else assert.ok(['available','unavailable'].includes(result.status),`Read-only flow incomplete: ${id}`);
 }
}
console.log('PASS Bokabord bookability/duplicate/time-window filtering and registry validation; live probes opt-in only');
}finally{await adapter.close();}
