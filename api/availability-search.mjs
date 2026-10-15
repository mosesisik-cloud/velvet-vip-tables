import { randomUUID } from 'node:crypto';

export function validateSearch(input, now = new Date()) {
  const city = String(input.city || '').trim();
  const date = String(input.date || '');
  const time = String(input.time || '');
  const party = Number(input.party);
  const parsed = new Date(date + 'T12:00:00Z');
  if (!city || city.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed) || parsed.toISOString().slice(0,10) !== date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !Number.isInteger(party) || party < 1 || party > 20) throw new Error('invalid_search');
  const delta = +parsed - +now;
  if (delta < -36*3600000 || delta > 366*86400000) throw new Error('invalid_date');
  return {city,date,time,party};
}
const minutes = t => Number(t.slice(0,2))*60 + Number(t.slice(3,5));
// Explicit policy beats adapter/provider support. Undefined remains compatible
// with reviewed legacy SevenRooms rows; external_link alone is not a live gate.
function availabilityGate(row) {
  if(row?.bookingMode==='request_only') {
    // Project only reviewed UI metadata; never spread registry contents into
    // public results. Fresh nested objects isolate every snapshot from registry.
    const gate={status:'request_only',reason:'request_only',bookingMode:'request_only'};
    const hours=row.responseTimeHours;
    if(hours&&Number.isSafeInteger(hours.min)&&Number.isSafeInteger(hours.max)&&hours.min>=0&&hours.max>=hours.min)gate.responseTimeHours={min:hours.min,max:hours.max};
    if(row.paymentRequirement==='card_guarantee')gate.paymentRequirement='card_guarantee';
    if(row.cancellationPolicyStatus==='unknown')gate.cancellationPolicyStatus='unknown';
    return gate;
  }
  if(row?.liveAvailabilitySupported===false)return {status:'unsupported',reason:'live_availability_disabled'};
  return null;
}
export class AvailabilitySearch {
  constructor({registry, restaurants, fetcher = fetch, now = () => Date.now(), adapters = {}, searchTimeoutMs = 150000}) {
    this.registry = registry; this.restaurants = restaurants; this.fetcher = fetcher; this.now = now;
    this.inflight = new Map(); this.listeners = new Map(); this.active = 0; this.adapters=adapters; this.jobs=new Map(); this.searchTimeoutMs=Math.max(10,Math.min(180000,searchTimeoutMs));
  }
  async venue(id, row, q, signal) {
    const base = {restaurantId:id, restaurant:row.name, city:row.city, provider:row.provider, slots:[], checkedAt:new Date(this.now()).toISOString()};
    const gate=availabilityGate(this.registry[id])||availabilityGate(row);
    if(gate)return {...base,...gate,checkedAt:null};
    try {
      if (this.adapters[row.provider]) return this.applyGate(await this.adapters[row.provider]({...row,restaurantId:id},{...q,signal}));
      const url = new URL(row.url);
      if (row.provider !== 'SevenRooms' || !['www.sevenrooms.com','sevenrooms.com','eu.sevenrooms.com'].includes(url.hostname) || url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || !/^[a-z0-9_-]+$/i.test(row.venueId)) return {...base,status:'unsupported'};
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[1] !== row.venueId || !((parts[0] === 'reservations' && parts.length === 2) || (parts[0] === 'explore' && parts.slice(2).join('/') === 'reservations/create/search'))) return {...base,status:'unsupported'};
      const endpoint = new URL('/api-yoa/availability/ng/widget/range',url);
      endpoint.search = new URLSearchParams({venue:row.venueId,party_size:String(q.party),halo_size_interval:'100',start_date:q.date,num_days:'1',channel:'SEVENROOMS_WIDGET',exclude_pdr:'true',intent:'user_search'});
      const response = await this.fetcher(endpoint,{headers:{Accept:'application/json',Referer:row.url},signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error('provider_error');
      const data = await response.json();
      if (data.status !== 200 || !data.data?.availability || typeof data.data.availability !== 'object') throw new Error('provider_format');
      const slots = new Map();
      for (const [day, shifts] of Object.entries(data.data.availability)) {
        if (day !== q.date || !Array.isArray(shifts)) continue;
        for (const shift of shifts) for (const slot of shift.times || []) {
          // The date bucket can contain another day's experience. Compare the
          // provider's local date literally; timezone conversion would change it.
          const iso = String(slot.time_iso || '');
          if (iso && (!/^\d{4}-\d{2}-\d{2}[T ]([01]\d|2[0-3]):[0-5]\d/.test(iso) || iso.slice(0,10) !== q.date)) continue;
          const time = iso ? iso.slice(11,16) : String(slot.time || '');
          if (slot.type !== 'book' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || Math.abs(minutes(time)-minutes(q.time)) > 90) continue;
          // The provider rechecks the chosen date and party in its original form.
          const booking = new URL(row.url);
          if (booking.pathname.includes('/explore/')) { booking.searchParams.set('date',q.date); booking.searchParams.set('party_size',q.party); booking.searchParams.set('start_time',time); }
          else { booking.searchParams.set('default_date',q.date); booking.searchParams.set('default_party_size',q.party); booking.searchParams.set('default_time',time); }
          // These flags mean ANY option at this time, not every experience.
          // An absent card flag never establishes that booking is fee-free.
          const requiresPrepayment = slot.cc_payment_rule === 'advanced_payment';
          const requiresCard = requiresPrepayment || slot.require_credit_card === true;
          const requirement = requiresPrepayment ? 'prepayment' : requiresCard ? 'card' : 'not_specified';
          const previous = slots.get(time);
          slots.set(time,{
            time,bookingUrl:booking.href,
            requiresCard:previous?.requiresCard === true || requiresCard,
            requiresPrepayment:previous?.requiresPrepayment === true || requiresPrepayment,
            paymentRequirement:previous && previous.paymentRequirement !== requirement ? 'mixed' : requirement
          });
        }
      }
      base.checkedAt = new Date(this.now()).toISOString();
      return this.applyGate({...base,status:slots.size?'available':'unavailable',slots:[...slots.values()].sort((a,b)=>a.time.localeCompare(b.time))});
    } catch { return this.applyGate({...base,status:'error'}); }
  }
  applyGate(result) {
    const gate=availabilityGate(this.registry[result.restaurantId]);
    if(gate?.status==='request_only') {
      // A stored job may have older terms. Replace, rather than merge, those
      // fields so invalid/removed registry metadata cannot survive in cache.
      const {bookingMode,responseTimeHours,paymentRequirement,cancellationPolicyStatus,...rest}=result;
      return {...rest,...gate,slots:[],checkedAt:null};
    }
    return gate?{...result,...gate,slots:[],checkedAt:null}:result;
  }
  async search(input, onResult = () => {}) {
    const q = validateSearch(input,new Date(this.now()));
    const cityKey = q.city.toLocaleLowerCase();
    const group = Object.entries(this.restaurants.destinations || {}).find(([code,g]) => [code,g.destination].some(v=>String(v).toLocaleLowerCase()===cityKey));
    if (!group) throw new Error('unknown_city');
    q.city = group[1].destination;
    const key = JSON.stringify(q);
    if (this.inflight.has(key)) { this.listeners.get(key)?.add(onResult); return this.inflight.get(key).then(result=>({...result,results:result.results.map(r=>this.applyGate(r))})); }
    if (this.active >= 3) throw new Error('search_busy');
    this.active++; this.listeners.set(key,new Set([onResult]));
    const controller=new AbortController(); let deadline;
    const run = async () => {
      const rank = row => { const entry=this.registry[row.placeId || row.id]; if(availabilityGate(entry))return 2; const p=entry?.provider; return p === 'SevenRooms' ? 0 : this.adapters[p] ? 1 : 2; };
      const rows = [...(group[1].restaurants || [])].sort((a,b)=>rank(a)-rank(b));
      const results = new Array(rows.length);
      const pool = async (indices, limit) => {
        let cursor=0;
        await Promise.all(Array.from({length:Math.min(limit,indices.length)},async()=>{
          while(cursor<indices.length&&!controller.signal.aborted) {
            const i=indices[cursor++],r=rows[i],id=r.placeId||r.id,provider=this.registry[id];
            results[i]=provider?await this.venue(id,provider,q,controller.signal):{restaurantId:id,restaurant:r.name,city:q.city,provider:'',status:'unsupported',slots:[],checkedAt:null};
            if(!controller.signal.aborted)for(const listener of this.listeners.get(key)||[])listener(results[i]);
          }
        }));
      };
      const browserRows=rows.flatMap((r,i)=>rank(r)===1?[i]:[]);
      const directRows=rows.flatMap((r,i)=>rank(r)!==1?[i]:[]);
      await Promise.all([pool(directRows,4),pool(browserRows,2)]);
      return {query:q,results:results.map(r=>this.applyGate(r)),checkedAt:new Date(this.now()).toISOString(),windowMinutes:90};
    };
    const timeout = new Promise((_,reject)=>{deadline=setTimeout(()=>{controller.abort();reject(new Error('search_timeout'));},this.searchTimeoutMs);});
    const pending = Promise.race([run(),timeout]).finally(()=>{clearTimeout(deadline);this.inflight.delete(key);this.listeners.delete(key);this.active--;});
    this.inflight.set(key,pending); return pending;
  }
  start(input) {
    const q=validateSearch(input,new Date(this.now()));
    const group=Object.entries(this.restaurants.destinations || {}).find(([code,g])=>[code,g.destination].some(v=>String(v).toLowerCase()===q.city.toLowerCase()));
    if(!group)throw new Error('unknown_city');q.city=group[1].destination;
    const key=JSON.stringify(q),now=this.now();
    for(const [id,job] of this.jobs)if(now-job.created>240000)this.jobs.delete(id);
    for(const job of this.jobs.values())if(job.key===key&&!job.complete)return this.snapshot(job);
    if(this.active>=3)throw new Error('search_busy');
    while(this.jobs.size>=50){const old=[...this.jobs.values()].find(j=>j.complete);if(!old)throw new Error('search_busy');this.jobs.delete(old.searchId);}
    const job={searchId:randomUUID(),key,created:now,complete:false,query:q,checkedAt:null,results:(group[1].restaurants||[]).map(r=>{
      const id=r.placeId||r.id,row=this.registry[id];
      return {restaurantId:id,restaurant:r.name,city:q.city,provider:row?.provider||'',...(availabilityGate(row)||{status:row&&(row.provider==='SevenRooms'||this.adapters[row.provider])?'pending':'unsupported'}),slots:[],checkedAt:null};
    })};
    this.jobs.set(job.searchId,job);
    this.search(q,result=>{const i=job.results.findIndex(r=>r.restaurantId===result.restaurantId);if(i>=0)job.results[i]=result;job.checkedAt=new Date(this.now()).toISOString();})
      .then(result=>{job.results=result.results;job.checkedAt=result.checkedAt;job.complete=true;})
      .catch(()=>{job.results=job.results.map(r=>r.status==='pending'?{...r,status:'error'}:r);job.complete=true;job.error='search_failed';});
    return this.snapshot(job);
  }
  snapshot(job){return {searchId:job.searchId,complete:job.complete,results:job.results.map(r=>({...this.applyGate(r)})),query:job.query,checkedAt:job.checkedAt,windowMinutes:90,...(job.error?{error:job.error}:{})};}
  status(id){const job=this.jobs.get(id);if(!job||this.now()-job.created>240000)return null;return this.snapshot(job);}

}
