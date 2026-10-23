import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCovermanagerAngularAvailability,covermanagerAngularConfig} from '../api/providers/covermanager-angular-availability.mjs';
import {covermanagerAngularEvidence,COVERMANAGER_ANGULAR_BINDINGS as bindings} from '../api/providers/covermanager-angular-evidence.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/covermanager-angular-search.json',import.meta.url)));
const q={date:'2026-10-23',time:'20:00',party:2};
for(const fixture of fixtures) {
 const {id,policy,calendar,observedAt}=fixture,b=bindings[id];
 const project=(c=calendar,p=policy)=>covermanagerAngularEvidence({id,policy:p,calendar:c,query:q,observedAt});
 const evidence=project();assert.equal(evidence.status,'available');assert.equal(evidence.confirmationVerified,false);
 assert.equal(evidence.slots.length,id.includes('can-caus')?5:9);
 assert.ok(evidence.slots.every(s=>s.confirmationMode==='unknown'&&s.paymentRequirement==='not_specified'));
 const label=structuredClone(calendar);label.not_avaible='Full';assert.deepEqual(project(label),evidence);
 const closed=structuredClone(calendar);Object.values(closed.hours).forEach(s=>s.close=true);assert.equal(project(closed).status,'unavailable');
 const full=structuredClone(calendar);Object.values(full.hours).forEach(s=>s.complete=true);assert.equal(project(full).status,'unavailable');
 const wrongParty=structuredClone(calendar);wrongParty.people_select='3';assert.throws(()=>project(wrongParty));
 const absent=structuredClone(calendar);Object.values(absent.hours).forEach(s=>delete s.hours['2']);assert.equal(project(absent).status,'error');
 assert.equal(project(calendar,{...policy,only_lunch:1}).status,'unavailable');
 assert.throws(()=>project(calendar,{...policy,restaurant:'other'}));
 const unknownClosed=structuredClone(calendar);Object.values(unknownClosed.hours)[0].close='0';assert.throws(()=>project(unknownClosed));
 const malformed=structuredClone(calendar);Object.values(malformed.hours)[0].hours['2'].all[0].value='25:00';assert.throws(()=>project(malformed));
 assert.throws(()=>covermanagerAngularConfig(fixture.html.replace('var restaurant','var wrong'),id));
 const row={restaurantId:id,name:b.name,city:b.city,provider:'CoverManager',url:fixture.sourcePage,liveAvailabilitySupported:true};
 const registry={[id]:{...row}};let calls=[];
 const adapter=createCovermanagerAngularAvailability({registry,now:()=>Date.parse(observedAt),fetcher:async(url,options)=>{
  calls.push(url);assert.equal(options.redirect,'error');let raw;
  if(url===fixture.sourcePage){assert.equal(options.method,'GET');assert.equal(options.body,undefined);raw=fixture.html;}
  else {
   assert.equal(options.method,'POST');const body=JSON.parse(options.body);
   if(url.endsWith('/Config/get_init_module/'+b.slug+'/spanish')){
    assert.equal(body.token,false);assert.equal(body.date,false);assert.equal(body.utm_emailmarketing,false);
    assert.deepEqual(Object.keys(body).sort(),['channel','date','hour','people','resumen_limit','token','utm_emailmarketing']);raw=JSON.stringify({restaurant:policy});
   }else{assert.ok(url.endsWith('/Reserve/change_day/'+b.slug+'/2026-10-23/2/spanish'));assert.deepEqual(Object.keys(body),['resumen_limit']);raw=JSON.stringify(calendar);}
  }
  return {ok:true,url,text:async()=>raw};
 }});
 assert.equal((await adapter(row,q)).status,'available');assert.equal(calls.length,3);
 for(const query of [{...q,party:3},{...q,date:'2026-02-30'},{...q,time:'24:00'}]){
  calls=[];assert.equal((await adapter(row,query)).status,'unsupported');assert.equal(calls.length,0);
 }
 const controller=new AbortController();controller.abort();calls=[];
 assert.equal((await adapter(row,{...q,signal:controller.signal})).status,'error');assert.equal(calls.length,0);
 registry[id].liveAvailabilitySupported=false;assert.equal((await adapter(row,q)).status,'unsupported');assert.equal(calls.length,0);
}
console.log('PASS both CoverManager bindings: exact read-only requests, requested-party slots, service gates, display-copy independence, unknown policy, invalid query and cancellation.');
