import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {ZenchefPlaywright,ZENCHEF_BRASSERIE_ROSEAUX as venue,roseauxMetadata,roseauxPolicy,zenchefAvailabilityEvidence,zenchefSearchUrl,zenchefFormUrl,allowedZenchefPreparationRequest,approvedZenchefPayload,zenchefBookingResult} from '../api/providers/zenchef-playwright.mjs';
const source=JSON.parse(fs.readFileSync(new URL('./fixtures/roseaux-source.json',import.meta.url))),state=source.props.initialState.appStoreState;
const query={date:'2026-10-23',party:2},now=Date.parse('2026-10-22T18:30:00Z'),shift=state.dailyAvailabilities[query.date].shifts[0];
const evidence=d=>zenchefAvailabilityEvidence(d,query,now,venue);
const fields={firstname:'Fixture',lastname:'Guest',email:'fixture@example.invalid',phone:'+33100000000',civility:'mr',country:'fr'};
const approval={restaurantId:venue.restaurantId,shiftId:378092,...query,time:'12:00',...fields};
const payload=()=>({day:query.date,time:'12:00',nb_guests:2,lang:'fr',firstname:fields.firstname,lastname:fields.lastname,email:fields.email,phone_number:fields.phone,civility:'mr',country:'fr',comment:'',custom_field:{},custom_field_v2:[],offers:[],partner_id:'1001',type:'web',customersheet:{...fields,lang:'fr',optins:[]}});
test('Brasserie Roseaux binds own identity, exact query and seven automatic weekday lunch slots',()=>{
 assert.equal(state.city,'Lyon');assert.equal(state.address,'34 Cr Franklin Roosevelt');assert.equal(roseauxMetadata(state),true);assert.equal(roseauxPolicy(state,shift,2),true);
 assert.deepEqual(evidence(source).candidates.map(x=>x.time),venue.lunchTimes);
 assert.equal(zenchefSearchUrl(query,venue),'https://bookings.zenchef.com/results?rid=370036&pid=1001&day=2026-10-23&pax=2');
 assert.throws(()=>zenchefFormUrl({...query,time:'13:45'},venue));for(const party of [1,3])assert.throws(()=>zenchefSearchUrl({...query,party},venue));
 assert.deepEqual(shift.confirmation,{is_auto:true,is_auto_until:null});assert.equal(shift.bookable_to,'2026-10-23 13:30:00');assert(shift.shift_slots.every(x=>x.bookable_to==='2026-10-23 '+x.name+':00'));
 assert.equal(roseauxPolicy(state,state.dailyAvailabilities[query.date].shifts[1],2),false);
 for(const [k,v] of [['rid','357745'],['fullscreen','1'],['lang','fr'],['pid','999'],['sdk','1']]){const d=structuredClone(source);d.query[k]=v;assert.throws(()=>evidence(d));}
});
test('Brasserie Roseaux rejects gift, room, field, notice, card and timing policy drift',()=>{
 for(const change of [s=>s.restaurantSpecificCommentsByDay[query.date]={fr:'Special'},s=>s.voucherParam={},s=>s.partner_id='999',s=>s.customFields[0].required=true,s=>s.customFields[0].id=2196,s=>s.hasConnectedVouchers=false,s=>s.voucherCodes.bookingVoucherCodes=['gift'],s=>s.custom_field={'numero-de-bon-cadeau':''},s=>s.mandatoryFields.extra='required',s=>s.restaurantComment.fr+='changed',s=>s.rooms[0].name='Other',s=>s.wish.room_id=32657,s=>s.wish.offers=[{}],s=>s.offers=[{}]]){const d=structuredClone(source);change(d.props.initialState.appStoreState);assert.equal(evidence(d).candidates.length,0);}
 for(const change of [s=>s.confirmation.is_auto_until=1,s=>s.confirmation.is_auto_until=4,s=>s.charge_param={},s=>s.prepayment_param={},s=>s.is_offer_required=true,s=>s.cancelation_param.enduser_cancelable_before=7200,s=>s.capacity.turn_times['2_pax_slots']=9,s=>s.bookable_to='2026-10-23 15:00:00',s=>s.shift_slots[0].bookable_to='2026-10-23 11:00:00',s=>s.shift_slots[0].capacity.total_per_slot++,s=>s.shift_slots.pop(),s=>s.shift_slots[0].offers=[{}]]){const d=structuredClone(source);change(d.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0]);assert.equal(evidence(d).candidates.length,0);}
 const weekend=structuredClone(state);weekend.wish.day='2026-10-24';assert.equal(roseauxPolicy(weekend,shift,2),false);
});
test('Brasserie Roseaux outbound payload excludes gifts and cannot use another venue or shift',()=>{
 assert.ok(approvedZenchefPayload(payload(),approval));
 for(const change of [b=>b.custom_field={'numero-de-bon-cadeau':'gift'},b=>b.voucher_code='gift',b=>b.offers=[{offer_id:1,count:2}],b=>b.wish={booking_room_id:32657},b=>b.nb_guests=3,b=>b.lang='en',b=>b.partner_id=1001]){const b=payload();change(b);assert.equal(approvedZenchefPayload(b,approval),null);}
 assert.equal(approvedZenchefPayload(payload(),{...approval,shiftId:91677}),null);
 assert.deepEqual(zenchefBookingResult(200,{id:123,uuid:'synthetic',status:'confirmed'},approval),{status:'unknown'});
 const request=(url,method='GET',type='xhr')=>({url:()=>url,method:()=>method,resourceType:()=>type,redirectedFrom:()=>null});
 assert.equal(allowedZenchefPreparationRequest(request(zenchefFormUrl({...query,time:'12:00'},venue),'GET','document'),{...query,time:'12:00'},venue),true);
 for(const url of ['https://bookings-middleware.zenchef.com/getWidgetParams?restaurantId=357745','https://bookings-middleware.zenchef.com/getAvailabilitiesSummary?restaurantId=357745&date_begin=2026-10-01&date_end=2026-10-31'])assert.equal(allowedZenchefPreparationRequest(request(url),{...query,time:'12:00'},venue),false);
});
// Deliberately synthetic client/transport. Original-client empty-form evidence is separate.
function fixtureScript(){
 const d=JSON.parse(document.querySelector('#__NEXT_DATA__').textContent),s=d.props.initialState.appStoreState;
 window.changeSource=change=>{const d=JSON.parse(document.querySelector('#__NEXT_DATA__').textContent);change(d.props.initialState.appStoreState);document.querySelector('#__NEXT_DATA__').textContent=JSON.stringify(d);};
 if(d.page!=='/form')return;
 const root=document.querySelector('#root');root.innerHTML=['firstname','lastname','email'].map(k=>'<input data-testid="'+k+'-input">').join('')+'<div class="iti"><button class="iti__selected-country" title="Selected country" aria-label="Change country"><span class="iti__flag iti__fr"></span></button><input data-testid="phone-input"></div><label>Mr<input type="radio" name="civility" value="mr"></label><label>Votre code cadeau</label><input id="mybeezbox" type="text"><label data-testid="eula-checkbox"><input type="checkbox"><span>Native service terms</span><a href="/gtc?rid=370036&lang=fr">Terms</a></label><button data-testid="validate-btn">Book</button>';
 root.querySelector('[data-testid="validate-btn"]').onclick=async()=>{const val=k=>root.querySelector('[data-testid="'+k+'-input"]').value;const f={firstname:val('firstname'),lastname:val('lastname'),email:val('email'),civility:'mr',country:'fr'};await fetch('https://bookings-middleware.zenchef.com/booking?restaurantId=370036',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({day:s.wish.day,time:s.wish.slot,nb_guests:s.wish.pax,lang:'fr',...f,phone_number:val('phone'),comment:'',custom_field:{},custom_field_v2:[],offers:[],partner_id:'1001',type:'web',customersheet:{...f,phone:val('phone'),lang:'fr',optins:[]}})}).catch(()=>{});};
}
function syntheticDocument(url){const u=new URL(url),d=structuredClone(source);d.query=Object.fromEntries(u.searchParams);d.page=u.pathname;if(d.page==='/form')d.props.initialState.appStoreState.wish.slot='12:00';return '<html><head><meta charset="utf-8"></head><body><div id="root"></div><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(d)+'</script><script>('+fixtureScript.toString()+')()</script></body></html>';}
test('Brasserie Roseaux synthetic browser rejects drift and binds durable attempt to independent receipt',async()=>{
 const browser=await chromium.launch();try{for(const scenario of ['confirmed','gift-before-review','gift-before-send','policy-before-send','wrong-shift-grant','journal-denied','wrong-receipt','gift-receipt']){
 let page,posts=0,reads=0,grants=0;const adapter=new ZenchefPlaywright({mode:'prepare',enableSubmission:true,now:()=>now,reserveSubmission:async(a,s)=>{assert.equal(s.destination,'Lyon');grants++;return{sendAllowed:scenario!=='journal-denied',attempt:{...a,attemptId:'synthetic-roseaux',details:{...a.details,...(scenario==='wrong-shift-grant'?{shiftId:91677}:{})}}};},recordResult:async()=>{},browserFactory:async()=>({close:async()=>{},newContext:async opts=>{const ctx=await browser.newContext(opts);ctx.on('page',p=>page=p);const route=ctx.route.bind(ctx);ctx.route=(pattern,handler)=>route(pattern,original=>{const r=original.request(),u=new URL(r.url());let body;return handler({request:()=>r,abort:()=>original.abort(),fetch:async options=>{assert.equal(options.maxRedirects,0);if(r.method()==='POST'){posts++;assert.equal(u.pathname,'/booking');assert.deepEqual(JSON.parse(options.postData).custom_field,{});body={id:12345,uuid:'synthetic-roseaux',status:'confirmed'};}else if(u.pathname==='/bookings/synthetic-roseaux'){reads++;body={id:12345,status:'confirmed',day:query.date,time:'12:00',nb_guests:2,booking_offers:[]};if(scenario==='wrong-receipt')body.nb_guests=3;if(scenario==='gift-receipt')body.booking_offers=[{offer_id:1,count:2}];}else assert.ok(['/results','/form'].includes(u.pathname));return{status:()=>200,json:async()=>body};},fulfill:()=>original.fulfill({status:200,headers:{'access-control-allow-origin':'https://bookings.zenchef.com','access-control-allow-methods':'GET, OPTIONS'},contentType:body?'application/json':'text/html',body:body?JSON.stringify(body):syntheticDocument(r.url())})});});return ctx;}})});
 try{let s=await adapter.create('owner',venue.restaurantId);const act=async action=>s=await adapter.action(s.id,'owner',{...action,revision:s.revision});await act({type:'search',...query});assert.equal(s.availabilityEvidence.candidates.length,7);await act({type:'select',time:'12:00',shiftId:378092});assert.equal(s.state,'contact');await act({type:'fill',fields});
 if(scenario==='gift-before-review'){await page.locator('#mybeezbox').fill('gift');await assert.rejects(act({type:'review'}),/provider_fields_unverified/);assert.equal(posts,0);continue;}
 await act({type:'review'});assert.equal(s.canSubmit,true);assert.equal(s.details.shiftId,378092);
 if(scenario==='gift-before-send'||scenario==='policy-before-send'){if(scenario==='gift-before-send')await page.locator('#mybeezbox').fill('gift');else await page.evaluate(()=>window.changeSource(s=>s.dailyAvailabilities['2026-10-23'].shifts[0].confirmation.is_auto_until=1));await assert.rejects(act({type:'submit',confirm:true,terms:true,reviewToken:s.reviewToken,termsVersion:s.terms.version,idempotencyKey:'synthetic-roseaux-0001'}),/provider_fields_unverified|stale_review/);assert.equal(posts,0);assert.equal(grants,0);continue;}
 await act({type:'submit',confirm:true,terms:true,reviewToken:s.reviewToken,termsVersion:s.terms.version,idempotencyKey:'synthetic-roseaux-0001'});assert.equal(s.result.status,scenario==='confirmed'?'confirmed':'unknown',scenario);assert.equal(posts,['wrong-shift-grant','journal-denied'].includes(scenario)?0:1);assert.equal(reads,posts);await assert.rejects(act({type:'submit',confirm:true,terms:true}),/already_attempted/);
 }finally{await adapter.close();}
 }}finally{await browser.close();}
});

test('Roseaux own opening date and per-slot cutoffs remain pinned across DST',()=>{
 const d=structuredClone(source),next='2026-10-26';d.query.day=next;const st=d.props.initialState.appStoreState;st.wish.day=next;st.restaurantSpecificCommentsByDay={[next]:null};const old=st.dailyAvailabilities[query.date];st.dailyAvailabilities={[next]:{...old,date:next,shifts:old.shifts.map(row=>({...row,bookable_to:row.bookable_to.replace(query.date,next),shift_slots:row.shift_slots.map(slot=>({...slot,bookable_to:slot.bookable_to.replace(query.date,next)}))}))}};
 assert.equal(zenchefAvailabilityEvidence(d,{date:next,party:2},now,venue).candidates.length,7);
 assert.equal(zenchefAvailabilityEvidence(d,{date:next,party:2},Date.parse(next+'T12:30:00Z'),venue).candidates.length,0);
 assert.equal(zenchefAvailabilityEvidence(d,{date:next,party:2},Date.parse(next+'T11:00:00Z'),venue).candidates.length,6);
 const changedFrom=structuredClone(source);changedFrom.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0].bookable_from='2026-08-25 12:00:00';assert.equal(evidence(changedFrom).candidates.length,0);
 const original=structuredClone(source);original.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0].shift_slots[0].bookable_to=query.date+' 11:59:00';assert.equal(evidence(original).candidates.length,0);
});
