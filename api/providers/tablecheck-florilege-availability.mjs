// Exact legacy TableCheck search contract. Never creates carts or reservations.
export const FLORILEGE_SEARCH = Object.freeze({
  id:'curated-TYO-florilege', name:'Florilège', city:'Tokyo', provider:'TableCheck',
  registryUrl:'https://www.tablecheck.com/shops/florilege/reserve',
  page:'https://www.tablecheck.com/ja/shops/florilege/reserve',
  menus:['683d0e24391342730c337f13','69de27e11f87c5f89c384a7c','69de281e8f8b857354384826'],
});
const root='https://www.tablecheck.com/ja/shops/florilege';
const minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3,5));
const ensure=(condition)=>{if(!condition)throw Error('provider_contract_unverified');};
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)].map(m=>[m[1],m[3]]));
}
export function florilegeSearchPolicy(html) {
  ensure(/<form\b[^>]*action="\/ja\/shops\/florilege\/reserve\/create"/.test(html));
  ensure(/OnlineAvailability\.autoAccept\s*=\s*true\s*;/.test(html));
  ensure(/ReservationCourses\.isRequired\s*=\s*true\s*;/.test(html));
  ensure(/ReservationCourses\.maxOrders\s*=\s*1\s*;/.test(html));
  ensure(/ReserveForm\.max_num_people\s*=\s*4\s*;/.test(html));
  const tags=[...html.matchAll(/<[a-z]+\b[^>]*>/gi)].map(m=>attributes(m[0]));
  ensure(tags.some(t=>t.id==='shop-data'&&t['data-shop']==='florilege'&&t['data-utc-offset']==='32400'));
  return FLORILEGE_SEARCH.menus.map(id=>{
    const matches=tags.filter(t=>t['data-id']===id&&t.class?.split(/\s+/).includes('menu-item-data'));
    ensure(matches.length===1);
    const m=matches[0];
    ensure(m['data-is-group-order']==='true'&&m['data-menu-type']==='main'&&m['data-payment-type']==='prepay_required');
    return {id,name:m['data-name']||id,paymentRequirement:'prepayment'};
  });
}
export function florilegeMenuTimes(data,q,menus) {
  ensure(Array.isArray(data?.menu_items));
  const rows=[],seen=new Set();
  for(const m of data.menu_items) {
    const policy=menus.find(p=>p.id===m.id);if(!policy)continue;
    ensure(!seen.has(m.id));seen.add(m.id);
    ensure(Array.isArray(m.online_time_steps));
    ensure(m.qty_remaining===null||Number.isInteger(m.qty_remaining)&&m.qty_remaining>=0);
    if(m.qty_remaining===0)continue;
    for(const step of m.online_time_steps) {
      ensure(Array.isArray(step)&&step.length===2&&step.every(Number.isInteger));
      const [epoch,seconds]=step,local=new Date((epoch+32400)*1000).toISOString();
      ensure(local.slice(0,10)===q.date&&local.slice(17)==='00.000Z'&&seconds===minutes(local.slice(11,16))*60);
      const time=local.slice(11,16);
      if(Math.abs(minutes(time)-minutes(q.time))<=90&&!rows.some(r=>r.epoch===epoch&&r.menuId===m.id))rows.push({epoch,time,menuId:m.id,menuName:policy.name});
    }
  }
  ensure(rows.length<=9);return rows;
}
export function florilegeAvailabilityStatus(raw) {
  if(raw?.status==='success'&&Array.isArray(raw.data)&&raw.data.length>0&&raw.data.every(id=>typeof id==='string'&&/^[a-f0-9]{24}$/.test(id)))return 'available';
  if(raw?.status==='failure')return 'unavailable';
  if(raw?.status==='reservation_request')return 'request_only';
  return 'unknown';
}
function bound(row) {
  return row?.provider==='TableCheck'&&row.name===FLORILEGE_SEARCH.name&&row.city==='Tokyo'
    &&row.url===FLORILEGE_SEARCH.registryUrl&&row.venueKey==='www.tablecheck.com/shops/florilege/reserve'
    &&row.liveAvailabilitySupported===true&&row.bookingMode!=='request_only';
}
export function createFlorilegeAvailability({registry,fetcher=fetch,now=Date.now,timeoutMs=15000}={}) {
  return async(row,q)=>{
    const base={restaurantId:FLORILEGE_SEARCH.id,restaurant:FLORILEGE_SEARCH.name,city:'Tokyo',provider:'TableCheck',
      slots:[],checkedAt:null,paymentRequirement:'prepayment',cancellationPolicyStatus:'unknown',
      availabilityScope:'reviewed_shift',confirmationVerified:false};
    if(row?.restaurantId!==FLORILEGE_SEARCH.id||!bound(row)||!bound(registry?.[FLORILEGE_SEARCH.id]))return {...base,status:'unsupported'};
    if(q?.party!==2||!/^\d{4}-\d{2}-\d{2}$/.test(q?.date||'')||!Number.isFinite(Date.parse(q.date))||new Date(q.date).toISOString().slice(0,10)!==q.date||!/^([01]\d|2[0-3]):[0-5]\d$/.test(q?.time||''))return {...base,status:'unsupported',reason:'outside_reviewed_scope'};
    try {
      const deadline=AbortSignal.timeout(Math.max(1,Math.min(timeoutMs,20000)));
      const signal=q.signal?AbortSignal.any([q.signal,deadline]):deadline;
      const read=async(url,json=true)=>{
        signal.throwIfAborted();
        const response=await fetcher(url,{method:'GET',redirect:'error',headers:{Accept:json?'application/json':'text/html'},signal});
        ensure(response.ok&&!response.redirected&&(!response.url||response.url===url));
        const text=await response.text();signal.throwIfAborted();ensure(text.length<=2000000);
        return json?JSON.parse(text):text;
      };
      const menus=florilegeSearchPolicy(await read(FLORILEGE_SEARCH.page,false));
      const menuQuery=new URLSearchParams({num_people:'2',date:q.date,duration:'',service_category_id:''});
      const times=florilegeMenuTimes(await read(root+'/menu_items?'+menuQuery),q,menus);
      const slots=[];let uncertain=false;
      const check=async(time)=>{
        const params=new URLSearchParams({'reservation[start_at_epoch]':String(time.epoch),'reservation[num_people_adult]':'2',
          'reservation[orders_attributes][0][menu_item_id]':time.menuId,'reservation[orders_attributes][0][is_group_order]':'true'});
        const status=florilegeAvailabilityStatus(await read(root+'/available?'+params));
        if(status==='available')slots.push({time:time.time,menuId:time.menuId,menuName:time.menuName,
          bookingUrl:FLORILEGE_SEARCH.page,paymentRequirement:'prepayment',confirmationMode:'automatic',confirmationVerified:false});
        else if(status!=='unavailable')uncertain=true;
      };
      // Independent read-only menu/time checks; at most three in flight.
      for(let start=0;start<times.length;start+=3) {
        await Promise.all(times.slice(start,start+3).map(check));
      }
      slots.sort((a,b)=>a.time.localeCompare(b.time)||a.menuId.localeCompare(b.menuId));
      if(!bound(registry?.[FLORILEGE_SEARCH.id]))return {...base,status:'unsupported'};
      return {...base,status:slots.length?'available':uncertain?'error':'unavailable',slots,partial:uncertain,
        checkedAt:new Date(now()).toISOString(),evidenceSource:'provider_menu_scoped_availability'};
    }catch(error){return {...base,status:'error',reason:error?.name==='TimeoutError'?'provider_timeout':error?.name==='AbortError'?'search_aborted':'provider_contract_or_transport_error'};}
  };
}
