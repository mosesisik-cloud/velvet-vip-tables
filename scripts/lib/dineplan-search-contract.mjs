import { searchHussar } from './dineplan-hussar-search.mjs';
const id = 'osm-CPT-the-hussar-grill';
const url = 'https://account.dineplan.com/widget/v3/frame/1nWHwN9S';
const minutes = time => Number(time.slice(0,2))*60+Number(time.slice(3));
const validTime = time => typeof time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);

// Integrator candidate only; neither imported by the server nor registry-enabled.
export function createDineplanSearchContract({ search = searchHussar, now = () => new Date() } = {}) {
  return async (row, query) => {
    const base = {restaurantId:row.restaurantId,restaurant:row.name,city:row.city,provider:'Dineplan',slots:[],checkedAt:null};
    if(row.restaurantId!==id || row.provider!=='Dineplan' || row.url!==url || row.liveAvailabilitySupported!==true || row.bookingMode==='request_only')
      return {...base,status:'unsupported',reason:'unqualified_registry_entry'};
    if(query.party!==2 || !validTime(query.time)) return {...base,status:'unsupported',reason:'unqualified_query'};
    try {
      const result = await search({date:query.date,partySize:query.party,signal:query.signal});
      if(query.signal?.aborted || result.status!=='options_observed' || result.restaurantId!==id || result.date!==query.date || result.partySize!==query.party || !Array.isArray(result.options))
        return {...base,status:'error',reason:'unverified_search_result'};
      if(result.options.some(o=>!o || !validTime(o.time) || typeof o.enabled!=='boolean')) return {...base,status:'error',reason:'invalid_options'};
      const slots = result.options.filter(o=>o.enabled && Math.abs(minutes(o.time)-minutes(query.time))<=90).map(o=>({
        time:o.time,bookingUrl:url,paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown',
        confirmationMode:'unknown',confirmationVerified:false,finalBookabilityVerified:false
      }));
      // No positive options does not yet establish provider-wide unavailability.
      return {...base,status:slots.length?'available':'error',...(slots.length?{}:{reason:'no_qualified_options'}),slots,checkedAt:now().toISOString()};
    } catch { return {...base,status:'error',reason:'provider_error'}; }
  };
}
