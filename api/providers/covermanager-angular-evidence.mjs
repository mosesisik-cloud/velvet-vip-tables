// Pure projection of the native calendar response, never a booking action.
const assert=value=>{if(!value)throw Error('covermanager_calendar_unverified');};
const minute=time=>Number(time.slice(0,2))*60+Number(time.slice(3,5));
export const COVERMANAGER_ANGULAR_BINDINGS=Object.freeze({
 'osm-IBZ-can-caus':{slug:'restaurante-cancaus',name:'Can Caus',city:'Ibiza',maxPeople:'20'},
 'osm-IBZ-ama-lur':{slug:'restaurante-amaluribiza',name:'Ama Lur',city:'Ibiza',maxPeople:'9'},
});
export function covermanagerAngularEvidence({id,policy,calendar,query,observedAt}) {
 const binding=COVERMANAGER_ANGULAR_BINDINGS[id];assert(binding);
 assert(query?.party===2&&/^\d{4}-\d{2}-\d{2}$/.test(query.date)&&Number.isFinite(Date.parse(query.date))&&new Date(query.date).toISOString().slice(0,10)===query.date);
 assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(query.time));
 assert(policy?.restaurant===binding.slug&&policy.timezone==='Europe/Madrid');
 assert([0,1].includes(policy.only_lunch)&&[0,1].includes(policy.only_dinner)&&!(policy.only_lunch&&policy.only_dinner));
 assert(!calendar?.error&&String(calendar.people_select)==='2'&&calendar.hours&&typeof calendar.hours==='object'&&!Array.isArray(calendar.hours));
 const slots=[];let partial=false;
 for(const shift of Object.values(calendar.hours)) {
  assert(shift&&[1,2].includes(shift.luner));
  if(shift.luner===1&&policy.only_dinner===1||shift.luner===2&&policy.only_lunch===1)continue;
  // Native dinner data omits close; the template treats absence as false.
  assert(typeof shift.complete==='boolean'&&[false,true,null,undefined].includes(shift.close));
  if(shift.complete||shift.close===true)continue;
  // Native view reads hours[people_select][zone_select], initially zone=all.
  // not_avaible is only display copy. Never parse it as a status.
  const times=shift.hours?.['2']?.all;
  if(times===undefined){partial=true;continue;}
  assert(Array.isArray(times));
  for(const time of times) {
   assert(time&&/^([01]\d|2[0-3]):[0-5]\d$/.test(time.value)&&Array.isArray(time.zone)&&time.zone.every(z=>typeof z==='string'));
   if(Math.abs(minute(time.value)-minute(query.time))>90)continue;
   if(!slots.some(s=>s.time===time.value&&JSON.stringify(s.zones)===JSON.stringify(time.zone)))slots.push({time:time.value,zones:[...time.zone],
    bookingUrl:`https://www.covermanager.com/reserve/module_restaurant/${binding.slug}/spanish`,
    paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown',confirmationMode:'unknown'});
  }
 }
 assert(Number.isFinite(Date.parse(observedAt)));
 return {restaurantId:id,restaurant:binding.name,city:binding.city,provider:'CoverManager',
  status:slots.length?'available':partial?'error':'unavailable',slots:slots.sort((a,b)=>a.time.localeCompare(b.time)),partial,
  checkedAt:observedAt,paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown',confirmationVerified:false,
  evidenceSource:'provider_calendar',timezone:'Europe/Madrid'};
}
