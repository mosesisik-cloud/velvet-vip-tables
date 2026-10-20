import assert from 'node:assert/strict';
import './test-zenchef-policy-evidence.mjs';
import fs from 'node:fs';
import {createZenchefAvailability} from '../api/providers/zenchef-availability.mjs';
import {AvailabilitySearch} from '../api/availability-search.mjs';
import {ZENCHEF_PIROUETTE as venue, ZENCHEF_DEKAS, ZENCHEF_FISHCORNER, ZENCHEF_PESQUIERE} from '../api/providers/zenchef-playwright.mjs';
import {availabilityTermsNotes} from '../js/availability-search.js';
import {availabilityCopy} from '../js/availability-copy.js';
const registry=JSON.parse(fs.readFileSync(new URL('../data/booking-providers.json',import.meta.url)));
const id=venue.restaurantId,row={...registry[id],restaurantId:id},q={date:'2026-10-23',party:2,time:'19:00'};
const now=()=>Date.parse('2026-10-20T20:00:00Z');
const slot=time=>({name:time,closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,possible_guests:[2],available_rooms:{2:[52521,65674]}});
function document(){return {page:'/results',query:{rid:venue.venueId,day:q.date,pax:'2'},props:{initialState:{appStoreState:{restaurantId:venue.venueId,initializedSSR:true,restaurantTimezone:venue.timezone,isDisabled:0,isRoomMandatory:true,rooms:venue.rooms,wish:{day:q.date,pax:2,waiting_list:false},dailyAvailabilities:{[q.date]:{date:q.date,shifts:[{id:venue.shiftId,closed:false,marked_as_full:false,bookable_from:null,bookable_to:null,shift_slots:[slot('19:00'),slot('22:00')]}]}}}}}};}
let data=document(),calls=0,fail=false;
const fetcher=async(url,options)=>{calls++;assert.equal(url,venue.url+'&day=2026-10-23&pax=2');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.body,undefined);if(fail)throw Error('network');return {ok:true,text:async()=>'<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(data)+'</script>'}};
const adapter=createZenchefAvailability({registry,fetcher,now});
let result=await adapter(row,q);assert.equal(result.status,'available');assert.equal(result.slots.length,1);assert.deepEqual(result.slots[0].rooms,venue.rooms);assert.equal(result.confirmationVerified,false);assert.equal(result.paymentRequirement,'not_specified');
for(const lang of ['sv','en','es','fr'])assert.ok(availabilityTermsNotes(result,availabilityCopy(lang).text).includes(availabilityCopy(lang).text('reviewedScopeNote')));
assert.equal(result.slots[0].confirmationMode,'unknown');
assert.equal(result.slots[0].cardGuaranteeApplies,null);
for(const confirmation of [{is_auto:false,is_auto_until:null},{is_auto:true,is_auto_until:null}]) {
 data=document();Object.assign(data.props.initialState.appStoreState.dailyAvailabilities[q.date].shifts[0],{
  confirmation,charge_param:{is_web_booking_askable:true,min_guests:2},prepayment_param:null});
 const evidence=await adapter(row,q);
 assert.equal(evidence.slots[0].confirmationMode,confirmation.is_auto?'automatic':'manual');
 assert.equal(evidence.slots[0].cardGuaranteeApplies,true);
 assert.equal(evidence.slots[0].prepaymentApplies,null);
 assert.equal(evidence.slots[0].bookingConfirmed,false);
 assert.equal(evidence.slots[0].formInspected,false);
 assert.equal(evidence.confirmationVerified,false);
 for(const lang of ['sv','en','es','fr']) {
  const tr=availabilityCopy(lang).text,notes=availabilityTermsNotes(evidence,tr);
  assert.equal(notes.includes(tr('manualConfirmationNote')),!confirmation.is_auto);
  assert.ok(notes.includes(tr('cardNote')));
 }
}
for(const mutate of [d=>d.query.rid='wrong',d=>d.query.day='2026-10-24',d=>d.props.initialState.appStoreState.wish.pax=3,d=>d.props.initialState.appStoreState.restaurantTimezone='UTC',d=>d.props.initialState.appStoreState.wish.waiting_list=true]){data=document();mutate(data);assert.equal((await adapter(row,q)).status,'error');}
data=document();data.props.initialState.appStoreState.dailyAvailabilities[q.date].shifts[0].shift_slots=[];assert.equal((await adapter(row,q)).status,'unavailable');
let before=calls;
for(const changed of [{...row,url:'https://evil.invalid/'},{...row,restaurantId:'unknown'},{...row,liveAvailabilitySupported:false},{...row,bookingMode:'request_only'}])assert.equal((await adapter(changed,q)).status,'unsupported');
assert.equal((await adapter(row,{...q,party:3})).status,'unsupported');assert.equal((await adapter(row,{...q,date:'2026-02-30'})).status,'unsupported');assert.equal(calls,before);
const controller=new AbortController();controller.abort();assert.equal((await adapter(row,{...q,signal:controller.signal})).status,'error');assert.equal(calls,before);
fail=true;assert.equal((await adapter(row,q)).status,'error');fail=false;data=document();
const service=new AvailabilitySearch({registry,restaurants:{destinations:{NCE:{destination:'Nice',restaurants:[{placeId:id,name:row.name}]}}},now,adapters:{Zenchef:adapter}});
const search=await service.search({...q,city:'Nice'});assert.equal(search.results[0].status,'available');
registry[id].liveAvailabilitySupported=false;before=calls;assert.equal((await service.venue(id,registry[id],q)).status,'unsupported');assert.equal(calls,before);
console.log('PASS Zenchef catalogue adapter: identity/date/party/timezone, rooms, window, gates, errors, abort, four-language scope, actual search integration; mocked GET only.');

// Exercise each reviewed identity, including the menu-only De Kas contract.
registry[id].liveAvailabilitySupported=true;
for(const v of [ZENCHEF_FISHCORNER,ZENCHEF_PESQUIERE,ZENCHEF_DEKAS]) {
 const d=document(),state=d.props.initialState.appStoreState;
 d.query.rid=v.venueId;state.restaurantId=v.venueId;state.restaurantTimezone=v.timezone;
 const shift=state.dailyAvailabilities[q.date].shifts[0];shift.id=v.shiftId;
 if(v.rooms){state.rooms=v.rooms;shift.shift_slots.forEach(s=>s.available_rooms={2:v.rooms.map(r=>r.id)});}
 if(v===ZENCHEF_DEKAS){
  const offer={id:118785,name_translations:{en:'Lunch'},description:{en:'Menu terms'},has_prepayment:false,payment_type:'none',charge_per_guests:null,has_duration:false,config:{is_same_for_all:true,is_limited_to_pax:true,min_pax_available:1,max_pax_available:null},stock:6,possible_guests:[2],available_rooms:{2:[138396]},bookable_from:null,bookable_to:null};
  Object.assign(state,{currency:'EUR',language:'en',isRoomMandatory:false,offers:[{id:118785,is_active:true,is_private:false,has_prepayment:false,has_duration:false}]});state.wish.room_id=null;
  Object.assign(shift,{name:'Lunch',charge_param:null,confirmation:{is_auto:true,is_auto_until:null},is_offer_required:true,offer_required_from_pax:null,prepayment_param:{is_web_booking_askable:true,min_guests:7,charge_per_guests:5000,deposit_type:'fixed'},offers:[offer]});
  shift.shift_slots.forEach(s=>s.offers=[offer]);
 }
 let count=0;
 const check=createZenchefAvailability({registry,now,fetcher:async(url,opt)=>{count++;assert.equal(url,v.url+'&day='+q.date+'&pax=2');assert.equal(opt.method,'GET');return {ok:true,text:async()=>'<script id="__NEXT_DATA__">'+JSON.stringify(d)+'</script>'}}});
 const r=await check({...registry[v.restaurantId],restaurantId:v.restaurantId},q);
 assert.equal(r.status,'available',v.restaurantId);assert.equal(count,1);
 if(v===ZENCHEF_DEKAS){assert.equal(r.slots[0].offers[0].offerId,118785);assert.equal(r.slots[0].offers[0].mealPrice,null);assert.equal(r.slots[0].offers[0].submissionSupported,undefined);assert.equal(r.slots[0].offers[0].version,undefined);}
 else if(v.rooms)assert.deepEqual(r.slots[0].rooms,v.rooms);
}
console.log('PASS all four venue bindings and De Kas menu projection; no internal submission capability exposed.');
