import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createZenchefAvailability} from '../api/providers/zenchef-availability.mjs';
import {AvailabilitySearch} from '../api/availability-search.mjs';
import {ZENCHEF_PIROUETTE as venue} from '../api/providers/zenchef-playwright.mjs';
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
