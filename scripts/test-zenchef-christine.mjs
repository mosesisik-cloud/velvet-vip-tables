import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ZENCHEF_CHEZ_FERNAND_CHRISTINE as venue,zenchefAvailabilityEvidence,zenchefSearchUrl,allowedZenchefPreparationRequest,approvedZenchefPayload,zenchefBookingResult} from '../api/providers/zenchef-playwright.mjs';
const source=JSON.parse(fs.readFileSync(new URL('./fixtures/chez-fernand-christine-source.json',import.meta.url))).data;
const query={date:'2026-10-23',party:2},now=Date.parse('2026-10-20T21:00:00Z');
const evidence=data=>zenchefAvailabilityEvidence(data,query,now,venue);
const choice=evidence(source).candidates[0]?.offers[0];
const approval={restaurantId:venue.restaurantId,shiftId:121338,date:query.date,time:'12:00',party:2,offer:choice,firstname:'Fixture',lastname:'Guest',email:'fixture@example.invalid',phone:'+33100000000',civility:'mr',country:'fr'};
const payload=()=>({day:query.date,time:'12:00',nb_guests:2,lang:'fr',firstname:'Fixture',lastname:'Guest',email:'fixture@example.invalid',phone_number:'+33100000000',civility:'mr',country:'fr',comment:'',custom_field:{},custom_field_v2:[],offers:[{offer_id:60971,count:2}],partner_id:'1001',type:'web',customersheet:{firstname:'Fixture',lastname:'Guest',email:'fixture@example.invalid',phone:'+33100000000',civility:'mr',country:'fr',lang:'fr',optins:[{type:'review_mail',value:true}]}});
test('Christine own original yields five lunch choices with explicit unpriced menu for two',()=>{
 assert.deepEqual(evidence(source).candidates.map(x=>x.time),['12:00','12:30','13:00','13:30','14:00']);assert.equal(choice.offerId,60971);assert.equal(choice.count,2);assert.equal(choice.description,'');assert.equal(choice.mealPrice,null);assert.equal(choice.depositApplies,false);assert.equal(choice.depositMinGuests,4);assert.match(choice.version,/^[a-f0-9]{64}$/);
 assert.equal(zenchefSearchUrl(query,venue),'https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1&day=2026-10-23&pax=2');
 for(const party of [1,3,4])assert.throws(()=>zenchefSearchUrl({...query,party},venue));
});
test('Christine rejects changes to metadata, menu, card, cancellation, capacity and slot windows',()=>{
 const mutations=[s=>s.phone='wrong',s=>s.partner_id='1001',s=>s.voucherParam={},s=>s.customFields.push({id:1}),s=>s.restaurantComment.fr+=' changed',s=>s.offers[0].charge_per_guests=1,s=>s.selectedHighlightedOffer=47494,s=>s.mandatoryFields.extra='required'];
 for(const mutate of mutations){const d=structuredClone(source);mutate(d.props.initialState.appStoreState);assert.equal(evidence(d).candidates.length,0);}
 const shiftMutations=[s=>s.confirmation.is_auto_until=1,s=>s.charge_param.min_guests=2,s=>s.prepayment_param={},s=>s.cancelation_param={seconds:0},s=>s.comment.fr='Changed',s=>s.capacity.total_per_slot=1,s=>s.is_offer_required=false,s=>s.offers[0].config.is_same_for_all=true,s=>s.bookable_to='2026-10-23 15:00:00'];
 for(const mutate of shiftMutations){const d=structuredClone(source);mutate(d.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0]);assert.equal(evidence(d).candidates.length,0);}
 for(const mutate of [s=>s.bookable_to='2026-10-23 12:01:00',s=>s.offers[0].stock=999,s=>s.offers[1].config.is_same_for_all=true,s=>s.capacity.show_turn_times=true]){const d=structuredClone(source);mutate(d.props.initialState.appStoreState.dailyAvailabilities[query.date].shifts[0].shift_slots[0]);assert.ok(!evidence(d).candidates.some(x=>x.time==='12:00'));}
 for(const mutate of [d=>d.query.pid='1001',d=>d.buildId='changed',d=>d.query.sdk='0']){const d=structuredClone(source);mutate(d);assert.throws(()=>evidence(d));}
});
test('Christine payload requires both correct shift and exact one-entry count2 offer',()=>{
 assert.deepEqual(approvedZenchefPayload(payload(),approval).customersheet.optins,[]);
 for(const offers of [[],[{offer_id:60971,count:1}],[{offer_id:60971,count:3}],[{offer_id:23228,count:2}],[{offer_id:60971,count:1},{offer_id:23228,count:1}],[{offer_id:60971,count:2,extra:true}],[{offer_id:60971,count:2},{offer_id:60971,count:2}]])assert.equal(approvedZenchefPayload({...payload(),offers},approval),null);
 for(const change of [{shiftId:undefined},{shiftId:429732},{party:3},{offer:{...choice,version:'wrong'}}])assert.equal(approvedZenchefPayload(payload(),{...approval,...change}),null);
 assert.equal(approvedZenchefPayload({...payload(),wish:{booking_room_id:1}},approval),null);
 assert.deepEqual(zenchefBookingResult(200,{id:123,uuid:'synthetic-only',status:'confirmed'},approval),{status:'unknown'});
});
test('Christine preparation never allows foreign recommendations, mutation, or arbitrary navigation',()=>{
 const selection={...query,time:'12:00',shiftId:121338};const request=(url,method='GET',type='xhr')=>({url:()=>url,method:()=>method,resourceType:()=>type,redirectedFrom:()=>null});
 for(const url of ['https://bookings-middleware.zenchef.com/getWidgetParams?restaurantId=377647','https://bookings-middleware.zenchef.com/getAvailabilities?restaurantId=377647&date_begin=2026-10-23&date_end=2026-10-23','https://bookings-middleware.zenchef.com/quotation-preview?restaurantId=361894'])assert.equal(allowedZenchefPreparationRequest(request(url),selection,venue),false);
 assert.equal(allowedZenchefPreparationRequest(request('https://bookings-middleware.zenchef.com/booking?restaurantId=361894','POST'),selection,venue),false);
 assert.equal(allowedZenchefPreparationRequest(request('https://bookings.zenchef.com/offers?sdk=1&withCloseButton=1&rid=361894&showCollapsed=1&day=2026-10-23&pax=2&slot=12%3A00','GET','document'),selection,venue),true);
 assert.equal(allowedZenchefPreparationRequest(request(venue.url+'&day=2026-10-23&pax=2&offer=60971','GET','document'),selection,venue),false);
});

// Synthetic transport tests below exercise the adapter and durable send boundary.
// They are not supplier bookings. Actual original-client replay is separate.
import {chromium} from 'playwright';
import {ZenchefPlaywright} from '../api/providers/zenchef-playwright.mjs';
function nativeFixtureScript() {
 const initial=JSON.parse(document.querySelector('#__NEXT_DATA__').textContent);
 const state=structuredClone(initial.props.initialState.appStoreState);state.type='web';
 const root=document.querySelector('#__next');root['__reactContainer$fixture']={stateNode:{current:{memoizedProps:{value:{appStore:{state}}}}}};
 window.fixtureState=state;
 const shell=()=>{root.innerHTML='<button data-testid="bookings-btn">Open</button>';root.firstChild.onclick=offers;};
 const offers=()=>{
  root.innerHTML='<div>À la carte</div><button data-testid="add-to-cart-btn">Formule Déjeuner</button><button data-testid="add-to-cart-btn">Add</button><button data-testid="disabled-continue-btn" disabled>Continue</button>';
  root.querySelectorAll('[data-testid="add-to-cart-btn"]')[1].onclick=()=>{state.wish.offers=[{offer_id:60971,count:1}];root.innerHTML='<div>À la carte</div><button data-testid="increment-offer-card-offer-60971-btn">Add</button><button data-testid="go-to-form-btn" disabled>Continue</button>';root.firstElementChild.nextElementSibling.onclick=()=>{state.wish.offers[0].count++;root.querySelector('[data-testid="go-to-form-btn"]').disabled=state.wish.offers[0].count<2;};root.querySelector('[data-testid="go-to-form-btn"]').onclick=form;};
 };
 const form=()=>{
  history.pushState({},'',location.href.replace('/offers?','/form?'));
  root.innerHTML='<div>Vous disposez de votre table pour une durée de 1h30.</div>'+['firstname','lastname','email'].map(k=>'<input data-testid="'+k+'-input">').join('')+'<div class="iti"><button class="iti__selected-country" title="Selected country" aria-label="Change country"><span class="iti__flag iti__fr"></span></button><input data-testid="phone-input"></div><label>Mr<input type="radio" name="civility" value="mr"></label><label data-testid="eula-checkbox"><input type="checkbox"><span>Native service terms</span><a href="/gtc?rid=361894&lang=fr">Terms</a></label><button data-testid="validate-btn">Book</button>';
  root.querySelector('[data-testid="validate-btn"]').onclick=async()=>{
   const val=k=>root.querySelector('[data-testid="'+k+'-input"]').value;
   const fields={firstname:val('firstname'),lastname:val('lastname'),email:val('email'),civility:root.querySelector('[name="civility"]:checked').value,country:'fr'};
   await fetch('https://bookings-middleware.zenchef.com/booking?restaurantId=361894',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({day:state.wish.day,time:state.wish.slot,nb_guests:state.wish.pax,lang:'fr',...fields,phone_number:val('phone'),comment:'',custom_field:{},custom_field_v2:[],offers:state.wish.offers,partner_id:'1001',type:'web',customersheet:{...fields,phone:val('phone'),lang:'fr',optins:[]}})}).catch(()=>{});
  };
 };
 if(initial.page==='/offers')shell();
}
function syntheticDocument(url) {
 const u=new URL(url),d=structuredClone(source);d.query=Object.fromEntries(u.searchParams);d.page=u.pathname;
 if(d.page==='/offers')d.props.initialState.appStoreState.wish.slot='12:00';
 return '<html><head><meta charset="utf-8"></head><body><div id="__next"></div><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(d)+'</script><script>('+nativeFixtureScript.toString()+')()</script></body></html>';
}
test('Christine synthetic send boundary binds shift and offer, rejects drift and never retries unknown receipts',async()=>{
 const browser=await chromium.launch();
 try {for(const scenario of ['confirmed','mixed-before-review','count-before-grant','wrong-offer-receipt','missing-offer-receipt','wrong-shift-grant','journal-denied']){
  let page,posts=0,reads=0,grants=0;const recorded=[];
  const adapter=new ZenchefPlaywright({mode:'prepare',enableSubmission:true,now:()=>now,
   reserveSubmission:async(a,s)=>{grants++;return{sendAllowed:scenario!=='journal-denied',attempt:{...a,attemptId:'synthetic-attempt',details:{...a.details,...(scenario==='wrong-shift-grant'?{shiftId:429732}:{})}}};},recordResult:async s=>recorded.push(s.result.status),
   browserFactory:async()=>({close:async()=>{},newContext:async opts=>{
    const ctx=await browser.newContext(opts);ctx.on('page',p=>{page=p;});const route=ctx.route.bind(ctx);
    ctx.route=(pattern,handler)=>route(pattern,original=>{const r=original.request(),u=new URL(r.url());let data,status=200;
     return handler({request:()=>r,abort:()=>original.abort(),fetch:async options=>{
      assert.equal(options.maxRedirects,0);
      if(r.method()==='POST'){posts++;assert.equal(u.pathname,'/booking');assert.equal(JSON.parse(options.postData).offers[0].count,2);data={id:12345,uuid:'synthetic-christine',status:'confirmed'};}
      else if(u.pathname==='/bookings/synthetic-christine'){reads++;data={id:12345,status:'confirmed',day:query.date,time:'12:00',nb_guests:2,booking_offers:[{offer_id:60971,count:2}]};if(scenario==='wrong-offer-receipt')data.booking_offers[0].offer_id=23228;if(scenario==='missing-offer-receipt')delete data.booking_offers;}
      else assert.ok(['/results','/offers'].includes(u.pathname),'unexpected synthetic request '+r.url());
      return{status:()=>status,json:async()=>data};},fulfill:()=>original.fulfill({status,headers:{'access-control-allow-origin':'https://bookings.zenchef.com','access-control-allow-methods':'GET, OPTIONS'},contentType:data?'application/json':'text/html',body:data?JSON.stringify(data):syntheticDocument(r.url())})});});return ctx;
   }})});
  try {
   let s=await adapter.create('owner',venue.restaurantId);const act=async action=>{s=await adapter.action(s.id,'owner',{...action,revision:s.revision});return s;};
   await act({type:'search',...query});assert.equal(s.availabilityEvidence.candidates.length,5,JSON.stringify(s.availabilityEvidence));await act({type:'select',time:'12:00',shiftId:121338});const c=s.offerChoices[0];
   await assert.rejects(act({type:'select_offer',offerId:60971,count:1,offerVersion:c.version}),/explicit_offer_required/);s=adapter.current('owner');
   await act({type:'select_offer',offerId:60971,count:2,offerVersion:c.version});assert.equal(s.state,'contact');
   await act({type:'fill',fields:{firstname:'Fixture',lastname:'Guest',email:'fixture@example.invalid',phone:'+33100000000',civility:'mr'}});
   if(scenario==='mixed-before-review'){
    await page.evaluate(()=>{window.fixtureState.wish.offers=[{offer_id:60971,count:1},{offer_id:23228,count:1}];});
    await assert.rejects(act({type:'review'}),/offer_changed/);assert.equal(posts,0);assert.equal(grants,0);continue;
   }
   await act({type:'review'});assert.equal(s.canSubmit,true);assert.equal(s.details.shiftId,121338);assert.equal(s.details.offer.count,2);
   if(scenario==='count-before-grant'){
    await page.evaluate(()=>{window.fixtureState.wish.offers[0].count=3;});
    await assert.rejects(act({type:'submit',confirm:true,terms:true,reviewToken:s.reviewToken,termsVersion:s.terms.version,idempotencyKey:'synthetic-christine-0001'}),/offer_changed/);assert.equal(posts,0);assert.equal(grants,0);continue;
   }
   await act({type:'submit',confirm:true,terms:true,reviewToken:s.reviewToken,termsVersion:s.terms.version,idempotencyKey:'synthetic-christine-0001'});
   assert.equal(s.result.status,scenario==='confirmed'?'confirmed':'unknown',scenario);assert.equal(posts,['wrong-shift-grant','journal-denied'].includes(scenario)?0:1);assert.equal(grants,1);
   if(posts){assert.equal(reads,1);assert.equal(recorded.length,1);}else assert.equal(reads,0);
   await assert.rejects(act({type:'submit',confirm:true,terms:true}),/already_attempted/);
  }finally{await adapter.close();}
 }}finally{await browser.close();}
});
