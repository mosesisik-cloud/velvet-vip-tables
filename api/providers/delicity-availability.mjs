// Delicity's public initial-form GET contract, verified for this venue only.
const ID = 'osm-MCO-sushi-arson';
const BOOKING = 'https://booking.delicity.com/sushi-arson';
const API = 'https://gateway.delicity.io/v1/booking/client/establishments/';
const ZONE = '495b2d0e-e62a-4897-8db3-21506f59413b';
const minutes = t => Number(t.slice(0,2))*60+Number(t.slice(3,5));
const validTime = t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const bound = row => row?.provider === 'Delicity' && row.url === BOOKING && row.name === 'Sushi Arson' && row.city === 'Nice';

export function createDelicityAvailability({registry,fetcher=fetch,now=()=>Date.now(),timeoutMs=10000}={}) {
  // Capture only reviewed identity, never accept arbitrary row-provided hosts/IDs.
  const reviewed = Object.hasOwn(registry || {},ID) && bound(registry[ID]);
  return async function delicityAvailability(row,q) {
    const base={restaurantId:row?.restaurantId,restaurant:'Sushi Arson',city:'Nice',provider:'Delicity',slots:[],checkedAt:null,
      paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown'};
    if(!reviewed || row?.restaurantId !== ID || !bound(row)) return {...base,status:'unsupported'};
    try {
      const parsed=new Date(q.date+'T12:00:00Z');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(q.date)||!Number.isFinite(+parsed)||parsed.toISOString().slice(0,10)!==q.date||!validTime(q.time)||!Number.isInteger(q.party)||q.party<1) throw Error('invalid_query');
      // A single deadline spans metadata and availability, including caller abort.
      const deadline=AbortSignal.timeout(Math.max(1,Math.min(15000,timeoutMs)));
      const signal=q.signal?AbortSignal.any([q.signal,deadline]):deadline;
      async function get(url) {
        signal.throwIfAborted();
        const response=await fetcher(url,{method:'GET',redirect:'error',headers:{Accept:'application/json'},signal});
        if(!response.ok)throw Error('provider_error');
        const data=await response.json();signal.throwIfAborted();return data;
      }
      const metadata=await get(API+'sushi-arson');
      if(metadata.establishment?.establishmentId!==337||metadata.establishment.slug!=='sushi-arson'||metadata.merchant?.address?.city!=='Nice'||metadata.merchant?.slug!=='sushi-arson')throw Error('identity_changed');
      const settings=metadata.settings;
      if(settings?.enabled!==true||settings.onlineEnabled!==true||!Array.isArray(metadata.zones)||!metadata.zones.some(z=>z.id===ZONE&&z.establishmentId===337&&!z.archivedAt))return {...base,status:'unsupported'};
      // Outside known guest limits is unsupported, not falsely fully booked.
      if(q.party<settings.minGuests||q.party>settings.maxGuests||q.party>4||!Number.isInteger(settings.minGuests)||!Number.isInteger(settings.maxGuests))return {...base,status:'unsupported'};
      const url=new URL(API+'337/availability');
      url.search=new URLSearchParams({date:q.date,guests:String(q.party),zoneId:ZONE});
      const result=await get(url);
      if(!Array.isArray(result.slots))throw Error('provider_format');
      // The observed API does not echo party/date; they are bound by this exact
      // request. If an echo is added, reject contradictory scope.
      if((result.date!==undefined&&result.date!==q.date)||(result.guests!==undefined&&result.guests!==q.party))throw Error('scope_mismatch');
      const slots=new Map();
      for(const slot of result.slots) {
        if(slot?.available!==true||typeof slot.startIso!=='string'||slot.startIso.slice(0,10)!==q.date||!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:/.test(slot.startIso))continue;
        const time=slot.startIso.slice(11,16);
        if(!validTime(slot.hour)||slot.hour!==time||Math.abs(minutes(time)-minutes(q.time))>90)continue;
        const booking=new URL(BOOKING);booking.search=new URLSearchParams({seats:String(q.party),when:`${q.date}T${time}:00`});
        slots.set(time,{time,bookingUrl:booking.href,requiresCard:null,requiresPrepayment:null,paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown'});
      }
      return {...base,status:slots.size?'available':'unavailable',slots:[...slots.values()].sort((a,b)=>a.time.localeCompare(b.time)),checkedAt:new Date(now()).toISOString()};
    } catch {return {...base,status:'error'};}
  };
}
