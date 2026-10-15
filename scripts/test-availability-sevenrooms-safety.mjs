import assert from 'node:assert/strict';
import { AvailabilitySearch } from '../api/availability-search.mjs';

const date = '2026-10-17';
const row = {name:'Fixture venue',city:'Test',provider:'SevenRooms',venueId:'fixture',url:'https://www.sevenrooms.com/reservations/fixture'};
const q = {city:'Test',date,time:'19:00',party:3};
async function parse(times, otherDays = {}) {
  const service = new AvailabilitySearch({registry:{},restaurants:{},fetcher:async url => {
    assert.equal(url.searchParams.get('start_date'),date);
    assert.equal(url.searchParams.get('party_size'),'3');
    return {ok:true,json:async()=>({status:200,data:{availability:{[date]:[{times}],...otherDays}}})};
  }});
  return service.venue('fixture',row,q);
}
const book = (time, extra={}) => ({type:'book',time_iso:`${date}T${time}:00-05:00`,...extra});
const result = await parse([
  book('18:30'),
  book('19:00',{time_iso:'2026-11-26T19:00:00-05:00'}),
  book('19:15',{time_iso:'2026-10-18 19:15:00',time:'19:15'}),
  book('19:30',{time_iso:'malformed timestamp',time:'19:30'}),
  book('19:45',{type:'request'}),
  {type:'book',time:'20:00'},
  book('18:45',{time_iso:`${date} 18:45:00`})
],{'2026-10-18':[{times:[book('20:15')]}]});
assert.equal(result.status,'available');
assert.deepEqual(result.slots.map(s=>s.time),['18:30','18:45','20:00']);
assert.equal(result.slots[0].paymentRequirement,'not_specified','missing metadata is not proof of no fees');
assert.equal(new URL(result.slots[0].bookingUrl).searchParams.get('default_date'),date);

const prepaid = book('19:00',{cc_payment_rule:'advanced_payment',require_credit_card:false});
const unspecified = book('19:00',{require_credit_card:false,cc_payment_rule:null});
const card = book('19:00',{require_credit_card:true});
for(const times of [[prepaid,unspecified],[unspecified,prepaid],[prepaid,unspecified,prepaid]]) {
  const {slots} = await parse(times);
  assert.equal(slots.length,1);
  assert.equal(slots[0].requiresCard,true,'prepayment survives a false/missing card flag');
  assert.equal(slots[0].requiresPrepayment,true);
  assert.equal(slots[0].paymentRequirement,'mixed','mixed experiences stay explicit regardless of order');
}
for(const [times,classification,prepayment] of [
  [[prepaid,prepaid],'prepayment',true],[[card,card],'card',false],[[card,unspecified],'mixed',false]
]) {
  const {slots} = await parse(times);
  assert.equal(slots[0].paymentRequirement,classification);
  assert.equal(slots[0].requiresCard,true);
  assert.equal(slots[0].requiresPrepayment,prepayment);
}
assert.equal((await parse([book('19:00',{time_iso:'2026-10-18T19:00:00'})])).status,'unavailable');
console.log('SevenRooms safety passed: embedded dates, request exclusion, explicit unknown terms, prepayment and order-independent mixed requirements. No live requests.');
