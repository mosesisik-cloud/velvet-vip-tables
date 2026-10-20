import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createFlorilegeAvailability,florilegeSearchPolicy,florilegeMenuTimes,florilegeAvailabilityStatus,FLORILEGE_SEARCH as v} from '../api/providers/tablecheck-florilege-availability.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/florilege-search.json',import.meta.url)));
const row={restaurantId:v.id,provider:v.provider,name:v.name,city:v.city,url:v.registryUrl,venueKey:'www.tablecheck.com/shops/florilege/reserve',liveAvailabilitySupported:true};
const registry={[v.id]:{...row}},q={date:'2026-10-23',time:'19:00',party:2};
let html=fixture.html,menu=structuredClone(fixture.menuResponse),status='success',calls=[];
const fetcher=async(url,options)=>{
 calls.push(url);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.body,undefined);
 const u=new URL(url);assert.equal(u.origin,'https://www.tablecheck.com');
 let body;
 if(u.pathname==='/ja/shops/florilege/reserve'){assert.equal(u.search,'');body=html;}
 else if(u.pathname==='/ja/shops/florilege/menu_items'){
  assert.equal(u.searchParams.get('num_people'),'2');assert.equal(u.searchParams.get('date'),q.date);body=JSON.stringify(menu);
 }else{
  assert.equal(u.pathname,'/ja/shops/florilege/available');assert.equal(u.searchParams.size,4);
  assert.equal(u.searchParams.get('reservation[num_people_adult]'),'2');
  assert.equal(u.searchParams.get('reservation[orders_attributes][0][is_group_order]'),'true');
  assert.ok(v.menus.includes(u.searchParams.get('reservation[orders_attributes][0][menu_item_id]')));
  body=JSON.stringify({status,data:status==='success'?['64b68d75ebc897001dbc61a2']:[]});
 }
 return {ok:true,url,text:async()=>body};
};
const adapter=createFlorilegeAvailability({registry,fetcher,now:()=>Date.parse('2026-10-20T21:14:00Z')});
let result=await adapter(row,q);
assert.equal(result.status,'available');assert.deepEqual(result.slots.map(s=>s.time),['18:00','18:15','18:30']);
assert.equal(calls.length,5);assert.ok(result.slots.every(s=>s.paymentRequirement==='prepayment'&&s.bookingUrl===v.page&&!s.confirmationVerified));
assert.equal(result.confirmationVerified,false);
for(const supplierStatus of ['failure','reservation_request','invalid','disabled']) {
 status=supplierStatus;result=await adapter(row,q);
 assert.equal(result.status,supplierStatus==='failure'?'unavailable':'error');assert.deepEqual(result.slots,[]);
}
status='success';
for(const patch of [{party:3},{date:'2026-02-30'},{time:'25:00'}]){
 calls=[];assert.equal((await adapter(row,{...q,...patch})).status,'unsupported');assert.equal(calls.length,0);
}
for(const patch of [{url:'https://evil.invalid'},{name:'Another venue'},{restaurantId:'unknown'},{liveAvailabilitySupported:false}]){
 calls=[];assert.equal((await adapter({...row,...patch},q)).status,'unsupported');assert.equal(calls.length,0);
}
html=html.replaceAll('prepay_required','none');assert.equal((await adapter(row,q)).status,'error');html=fixture.html;
const policies=florilegeSearchPolicy(html);
const wrongDate=structuredClone(menu);wrongDate.menu_items[0].online_time_steps[0][0]+=86400;
assert.throws(()=>florilegeMenuTimes(wrongDate,q,policies));
const empty=structuredClone(menu);empty.menu_items.forEach(m=>m.qty_remaining=0);
assert.deepEqual(florilegeMenuTimes(empty,q,policies),[]);
for(const raw of [{status:'success',data:[]},{status:'success',data:['unexpected']},{status:'reservation_request'},{status:'other_day'}])assert.notEqual(florilegeAvailabilityStatus(raw),'available');
const controller=new AbortController();controller.abort();calls=[];
assert.equal((await adapter(row,{...q,signal:controller.signal})).status,'error');assert.equal(calls.length,0);
registry[v.id].liveAvailabilitySupported=false;calls=[];
assert.equal((await adapter(row,q)).status,'unsupported');assert.equal(calls.length,0);
console.log('PASS Florilege: observed source binding, exact GET-only search, date/menu/time scope, prepayment disclosure, request-only/unknown distinction, disabled gates and abort. No live requests.');
