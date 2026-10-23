import {COVERMANAGER_ANGULAR_BINDINGS as bindings,covermanagerAngularEvidence} from './covermanager-angular-evidence.mjs';
const root='https://www.covermanager.com';
const ensure=x=>{if(!x)throw Error('covermanager_contract_unverified');};
export function covermanagerAngularConfig(html,id) {
 const binding=bindings[id];ensure(binding);
 const scalar=key=>{
  const matches=[...html.matchAll(new RegExp('\\bvar\\s+'+key+'\\s*=\\s*("(?:\\\\.|[^"\\\\])*")\\s*;','g'))];
  ensure(matches.length===1);return JSON.parse(matches[0][1]);
 };
 ensure(scalar('restaurant')===binding.slug&&scalar('language')==='spanish');
 const raw=scalar('resumen_limit'),limits=JSON.parse(raw);
 ensure(limits.have_limit===true&&limits.only_this_people===false&&limits.min_people===false&&limits.max_people===binding.maxPeople
  &&limits.time_fix===false&&limits.start===0&&limits.end===0&&limits.only_lunch===0&&limits.only_dinner===0);
 for(const field of ['date','people','hour','channel'])ensure(scalar(field)==='');
 return raw;
}
export function createCovermanagerAngularAvailability({registry,fetcher=fetch,now=Date.now,timeoutMs=15000}={}) {
 return async(row,q)=>{
  const id=row?.restaurantId,binding=bindings[id];
  const base={restaurantId:id,restaurant:row?.name,city:row?.city,provider:'CoverManager',slots:[],checkedAt:null,
   paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown',confirmationVerified:false};
  const page=binding?`${root}/reserve/module_restaurant/${binding.slug}/spanish`:null;
  const bound=r=>binding&&r?.name===binding.name&&r.city===binding.city&&r.provider==='CoverManager'&&r.url===page
   &&r.liveAvailabilitySupported===true&&r.bookingMode!=='request_only';
  if(!bound(row)||!bound(registry?.[id]))return {...base,status:'unsupported'};
  if(q?.party!==2||!/^\d{4}-\d{2}-\d{2}$/.test(q?.date||'')||!Number.isFinite(Date.parse(q.date))||new Date(q.date).toISOString().slice(0,10)!==q.date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(q?.time||''))return {...base,status:'unsupported',reason:'outside_reviewed_scope'};
  try {
   const deadline=AbortSignal.timeout(Math.max(1,Math.min(20000,timeoutMs))),signal=q.signal?AbortSignal.any([q.signal,deadline]):deadline;
   const request=async(url,body)=>{
    signal.throwIfAborted();
    // Fixed endpoints only: page, initial configuration, calendar date change.
    ensure(url===page||url===`${root}/Config/get_init_module/${binding.slug}/spanish`||url===`${root}/Reserve/change_day/${binding.slug}/${q.date}/2/spanish`);
    const response=await fetcher(url,{method:body?'POST':'GET',redirect:'error',signal,
     headers:{Accept:body?'application/json':'text/html',...(body?{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'}:{})},
     ...(body?{body:JSON.stringify(body)}:{})});
    ensure(response.ok&&!response.redirected&&(!response.url||response.url===url));
    const text=await response.text();signal.throwIfAborted();ensure(text.length<=2000000);
    return body?JSON.parse(text):text;
   };
   const limits=covermanagerAngularConfig(await request(page),id);
   const init=await request(`${root}/Config/get_init_module/${binding.slug}/spanish`,{
    channel:false,date:false,people:'',resumen_limit:limits,hour:'',token:false,utm_emailmarketing:false});
   ensure(init?.restaurant?.restaurant===binding.slug&&init.restaurant.timezone==='Europe/Madrid');
   const calendar=await request(`${root}/Reserve/change_day/${binding.slug}/${q.date}/2/spanish`,{resumen_limit:limits});
   const result=covermanagerAngularEvidence({id,policy:init.restaurant,calendar,query:q,observedAt:new Date(now()).toISOString()});
   return bound(registry?.[id])?result:{...base,status:'unsupported'};
  }catch(error){return {...base,status:'error',reason:error.name==='TimeoutError'?'provider_timeout':error.name==='AbortError'?'search_aborted':'provider_contract_or_transport_error'};}
 };
}
