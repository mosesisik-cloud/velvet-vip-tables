
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
export class AvailabilitySearch {
  constructor({registry, restaurants, fetcher = fetch, now = () => Date.now()}) {
    this.registry = registry; this.restaurants = restaurants; this.fetcher = fetcher; this.now = now;
    this.inflight = new Map(); this.active = 0;
  }
  async venue(id, row, q) {
    const base = {restaurantId:id, restaurant:row.name, city:row.city, provider:row.provider, slots:[], checkedAt:new Date(this.now()).toISOString()};
    try {
      const url = new URL(row.url);
      if (row.provider !== 'SevenRooms' || !['www.sevenrooms.com','sevenrooms.com','eu.sevenrooms.com'].includes(url.hostname) || url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || !/^[a-z0-9_-]+$/i.test(row.venueId)) return {...base,status:'unsupported'};
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[1] !== row.venueId || !((parts[0] === 'reservations' && parts.length === 2) || (parts[0] === 'explore' && parts.slice(2).join('/') === 'reservations/create/search'))) return {...base,status:'unsupported'};
      const endpoint = new URL('/api-yoa/availability/ng/widget/range',url);
      endpoint.search = new URLSearchParams({venue:row.venueId,party_size:String(q.party),halo_size_interval:'100',start_date:q.date,num_days:'1',channel:'SEVENROOMS_WIDGET',exclude_pdr:'true',intent:'user_search'});
      const response = await this.fetcher(endpoint,{headers:{Accept:'application/json',Referer:row.url},signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error('provider_error');
      const data = await response.json();
      if (data.status !== 200 || !data.data?.availability || typeof data.data.availability !== 'object') throw new Error('provider_format');
      const slots = new Map();
      for (const [day, shifts] of Object.entries(data.data.availability)) {
        if (day !== q.date || !Array.isArray(shifts)) continue;
        for (const shift of shifts) for (const slot of shift.times || []) {
          const time = String(slot.time_iso || '').slice(11,16) || String(slot.time || '');
          if (slot.type !== 'book' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || Math.abs(minutes(time)-minutes(q.time)) > 90) continue;
          // The provider rechecks the chosen date and party in its original form.
          const booking = new URL(row.url);
          if (booking.pathname.includes('/explore/')) { booking.searchParams.set('date',q.date); booking.searchParams.set('party_size',q.party); booking.searchParams.set('start_time',time); }
          else { booking.searchParams.set('default_date',q.date); booking.searchParams.set('default_party_size',q.party); booking.searchParams.set('default_time',time); }
          // Different experiences can share a time. Preserve any card requirement
          // instead of letting a later non-card experience erase it.
          slots.set(time,{time,bookingUrl:booking.href,requiresCard:slots.get(time)?.requiresCard === true || slot.require_credit_card === true});
        }
      }
      base.checkedAt = new Date(this.now()).toISOString();
      return {...base,status:slots.size?'available':'unavailable',slots:[...slots.values()].sort((a,b)=>a.time.localeCompare(b.time))};
    } catch { return {...base,status:'error'}; }
  }
  async search(input) {
    const q = validateSearch(input,new Date(this.now()));
    const cityKey = q.city.toLocaleLowerCase();
    const group = Object.entries(this.restaurants.destinations || {}).find(([code,g]) => [code,g.destination].some(v=>String(v).toLocaleLowerCase()===cityKey));
    if (!group) throw new Error('unknown_city');
    q.city = group[1].destination;
    const key = JSON.stringify(q);
    if (this.inflight.has(key)) return this.inflight.get(key);
    if (this.active >= 3) throw new Error('search_busy');
    this.active++;
    const run = async () => {
      const rows = group[1].restaurants || [];
      const results = new Array(rows.length); let cursor = 0;
      await Promise.all(Array.from({length:Math.min(4,rows.length)}, async()=>{
        while(cursor < rows.length) {
          const i = cursor++, r = rows[i], id = r.placeId || r.id, provider = this.registry[id];
          results[i] = provider ? await this.venue(id,provider,q) : {restaurantId:id,restaurant:r.name,city:q.city,provider:'',status:'unsupported',slots:[],checkedAt:null};
        }
      }));
      return {query:q,results,checkedAt:new Date(this.now()).toISOString(),windowMinutes:90};
    };
    const pending = run().finally(()=>{this.inflight.delete(key);this.active--;});
    this.inflight.set(key,pending); return pending;
  }
}
