import assert from 'node:assert/strict';
import {createDelicityAvailability} from '../api/providers/delicity-availability.mjs';
const id='osm-MCO-sushi-arson',zone='495b2d0e-e62a-4897-8db3-21506f59413b';
const row={restaurantId:id,name:'Sushi Arson',city:'Nice',provider:'Delicity',url:'https://booking.delicity.com/sushi-arson'};
const q={date:'2026-10-17',time:'19:00',party:2};
const metadata={establishment:{establishmentId:337,slug:'sushi-arson'},merchant:{slug:'sushi-arson',address:{city:'Nice'}},settings:{enabled:true,onlineEnabled:true,minGuests:1,maxGuests:4,bookingWindowDays:60},zones:[{id:zone,establishmentId:337,archivedAt:null}]};
const slot=(time,extra={})=>({available:true,hour:time,startIso:`2026-10-17T${time}:00.000+02:00`,seats:20,...extra});
function fixture({meta=metadata,result={slots:[slot('19:00')]},registry={[id]:row},fail=false,now=()=>Date.parse('2026-10-15T12:00:00Z'),expectedQuery=q}={}){
 const calls=[];
 const adapter=createDelicityAvailability({registry,now,fetcher:async(address,options)=>{
  const url=new URL(address);calls.push(url);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(url.origin,'https://gateway.delicity.io');assert.ok(options.signal);
  if(url.pathname.endsWith('/availability')){assert.equal(url.searchParams.get('date'),expectedQuery.date);assert.equal(url.searchParams.get('guests'),String(expectedQuery.party));assert.equal(url.searchParams.get('zoneId'),zone);}
  return {ok:!fail,json:async()=>url.pathname.endsWith('/availability')?result:meta};
 }});return{adapter,calls};
}
let f=fixture({result:{slots:[slot('17:30'),slot('19:00'),slot('19:00'),slot('20:30'),slot('20:45'),slot('19:15',{available:false}),slot('19:30',{available:'true'}),slot('19:45',{startIso:'2026-10-18T19:45:00+02:00'}),slot('20:00',{hour:'20:15'})]}});
let result=await f.adapter(row,q);
assert.deepEqual(result.slots.map(s=>s.time),['17:30','19:00','20:30']);assert.equal(result.status,'available');assert.equal(result.slots[0].requiresCard,null);assert.equal(result.cancellationPolicyStatus,'unknown');
const link=new URL(result.slots[1].bookingUrl);assert.equal(link.searchParams.get('seats'),'2');assert.equal(link.searchParams.get('when'),'2026-10-17T19:00:00');assert.equal(f.calls.length,2);
for(const bad of [{...row,url:row.url+'?redirect=evil'},{...row,url:'https://booking.delicity.com.evil/sushi-arson'},{...row,restaurantId:'other'},{...row,city:'Monaco'}]){f=fixture();assert.equal((await f.adapter(bad,q)).status,'unsupported');assert.equal(f.calls.length,0);}
f=fixture({registry:Object.create({[id]:row})});assert.equal((await f.adapter(row,q)).status,'unsupported');assert.equal(f.calls.length,0);
for(const change of [{establishment:{establishmentId:338,slug:'sushi-arson'}},{merchant:{slug:'other',address:{city:'Nice'}}}]){f=fixture({meta:{...metadata,...change}});assert.equal((await f.adapter(row,q)).status,'error');assert.equal(f.calls.length,1);}
for(const query of [{...q,party:5},{...q,party:0},{...q,party:'2'},{...q,date:'2026-02-30'},{...q,time:'25:00'}]){f=fixture();assert.notEqual((await f.adapter(row,query)).status,'available');assert.ok(f.calls.length<=1);}
for(const response of [{slots:[]},{slots:[slot('19:00',{available:false,seats:20})]}]){f=fixture({result:response});assert.equal((await f.adapter(row,q)).status,'unavailable');}
for(const response of [{slots:null},{slots:[slot('19:00')],guests:3},{slots:[slot('19:00')],date:'2026-10-18'}]){f=fixture({result:response});assert.equal((await f.adapter(row,q)).status,'error');}
f=fixture({fail:true});assert.equal((await f.adapter(row,q)).status,'error');
f=fixture();const controller=new AbortController();controller.abort();assert.equal((await f.adapter(row,{...q,signal:controller.signal})).status,'error');assert.equal(f.calls.length,0);
for(const windowDays of [undefined,null,'60',-1,1.5,NaN,Infinity,367]){
 f=fixture({meta:{...metadata,settings:{...metadata.settings,bookingWindowDays:windowDays}}});
 const result=await f.adapter(row,q);assert.equal(result.status,'unsupported');assert.equal(result.reason,'booking_window_unknown');assert.equal(f.calls.length,1,'unknown window must not query availability');
}
// Inclusive last calendar day; winter/summer UTC offsets and both DST changes.
for(const [instant,date,windowDays,allowed] of [
 ['2026-10-15T12:00:00Z','2026-12-14',60,true],
 ['2026-10-15T12:00:00Z','2026-12-15',60,false],
 ['2026-10-15T22:30:00Z','2026-10-15',60,false], // already Oct16 in Paris
 ['2026-10-15T22:30:00Z','2026-10-16',0,true],
 ['2026-10-15T22:30:00Z','2026-10-17',0,false],
 ['2026-12-31T23:30:00Z','2027-01-01',0,true],
 ['2026-03-28T23:30:00Z','2026-03-30',1,true], // spring forward
 ['2026-10-24T22:30:00Z','2026-10-26',1,true], // fall back
 ['2026-10-24T22:30:00Z','2026-10-27',1,false]
]){
 const query={...q,date};
 f=fixture({now:()=>Date.parse(instant),expectedQuery:query,result:{slots:[]},meta:{...metadata,settings:{...metadata.settings,bookingWindowDays:windowDays}}});
 const result=await f.adapter(row,query);
 assert.equal(result.status,allowed?'unavailable':'unsupported',`${instant} / ${date}`);
 assert.equal(f.calls.length,allowed?2:1,'out-of-window must stop after metadata');
 if(!allowed)assert.equal(result.reason,'outside_booking_window');
}
console.log('PASS Delicity: registry/venue binding, GET only, scope, unknown policy, abort and Paris calendar booking window (inclusive boundaries, midnight, DST, invalid metadata).');
if(process.argv.includes('--live')){
 const adapter=createDelicityAvailability({registry:{[id]:row}});
 const live=await adapter(row,{...q,date:new Date(Date.now()+2*86400000).toISOString().slice(0,10)});
 assert.notEqual(live.status,'error');console.log(JSON.stringify({liveStatus:live.status,city:live.city,times:live.slots.map(s=>s.time),checkedAt:live.checkedAt}));
}
