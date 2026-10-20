import fs from 'node:fs';
import { ZENCHEF_DEKAS, ZENCHEF_PIROUETTE, ZENCHEF_FISHCORNER, ZENCHEF_PESQUIERE,
  zenchefSearchUrl, zenchefAvailabilityEvidence } from './zenchef-playwright.mjs';
const bindings=JSON.parse(fs.readFileSync(new URL('./zenchef-search-bindings.json',import.meta.url),'utf8'));
const venues=new Map([ZENCHEF_DEKAS,ZENCHEF_PIROUETTE,ZENCHEF_FISHCORNER,ZENCHEF_PESQUIERE].map(v=>[v.restaurantId,v]));
const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
function bound(row,id) {
  const expected=bindings[id];
  return expected && row?.provider==='Zenchef' && row.liveAvailabilitySupported===true
    && row.bookingMode!=='request_only' && Object.entries(expected).every(([k,v])=>row[k]===v);
}
export function createZenchefAvailability({registry,fetcher=fetch,now=Date.now,timeoutMs=10000}={}) {
  return async (row,q)=>{
    const id=row?.restaurantId,venue=venues.get(id);
    const base={restaurantId:id,restaurant:row?.name,city:row?.city,provider:'Zenchef',slots:[],checkedAt:null,
      paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown',availabilityScope:'reviewed_shift',confirmationVerified:false};
    if(!venue || !bound(row,id) || !bound(registry?.[id],id))return {...base,status:'unsupported'};
    // The reviewed guest contracts cover two people. Other sizes are unknown,
    // not sold out. All URLs come from reviewed constants, never request data.
    if(q?.party!==2 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(q?.time || ''))return {...base,status:'unsupported',reason:'outside_reviewed_scope'};
    let url;
    try {url=zenchefSearchUrl(q,venue);}catch{return {...base,status:'unsupported',reason:'invalid_query'};}
    try {
      const deadline=AbortSignal.timeout(Math.max(1,Math.min(15000,timeoutMs)));
      const signal=q.signal?AbortSignal.any([q.signal,deadline]):deadline;
      signal.throwIfAborted();
      const response=await fetcher(url,{method:'GET',redirect:'error',headers:{Accept:'text/html'},signal});
      if(!response.ok || response.redirected)throw Error('provider_response');
      const html=await response.text();signal.throwIfAborted();
      if(html.length>5000000)throw Error('provider_response_size');
      const matches=[...html.matchAll(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/g)];
      if(matches.length!==1)throw Error('provider_state_missing');
      const evidence=zenchefAvailabilityEvidence(JSON.parse(matches[0][1]),q,now(),venue);
      // Keep room/menu options as evidence, never make those choices for guests.
      const slots=evidence.candidates.filter(s=>Math.abs(minutes(s.time)-minutes(q.time))<=90)
        .map(s=>({...s,bookingUrl:url,paymentRequirement:'not_specified'}));
      if(!bound(registry?.[id],id))return {...base,status:'unsupported'};
      return {...base,status:slots.length?'available':'unavailable',slots,checkedAt:evidence.observedAt,
        evidenceSource:evidence.source};
    }catch{return {...base,status:'error'};}
  };
}
