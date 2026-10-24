import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchHussar, searchDineplan, qualifiedDineplanVenues } from './lib/dineplan-hussar-search.mjs';
const html = 'The Hussar Grill Rondebosch <input id="restaurant_id" value="1068"><input id="booking_reference" value=""> const csrf_hash = "test-token";';
test('each qualified venue binds its own supplier id and form key',async()=>{
 for(const [restaurantId,venue] of Object.entries(qualifiedDineplanVenues)){
  const f=fixture(html.replace('The Hussar Grill Rondebosch',venue.title).replace('1068',venue.supplierId));
  const r=await searchDineplan({restaurantId,date:'2026-10-26',fetchImpl:f.fetchImpl});
  assert.equal(r.restaurantId,restaurantId);assert.equal(r.status,'options_observed');
  assert.ok(f.calls[0].url.endsWith('/frame/'+venue.key));
  assert.equal(f.calls[2].body.get('restaurant_id'),venue.supplierId);
 }
});
test('another qualified restaurant form cannot satisfy requested identity',async()=>{
 const f=fixture();
 assert.equal((await searchDineplan({restaurantId:'curated-CPT-fyn',date:'2026-10-26',fetchImpl:f.fetchImpl})).status,'unknown');
 assert.equal(f.calls.length,1);
});
function fixture(first=html, covers={'2':{closed:false}}, times={'12:00':{closed:false}}) {
  const calls=[];
  return {calls,fetchImpl:async (url,opts)=>{
    calls.push({url,...opts});
    const body=[first,JSON.stringify(covers),JSON.stringify(times)][calls.length-1];
    assert.ok(body!==undefined,'Unexpected fourth request');
    return new Response(body,{status:200,headers:calls.length===1?{'Set-Cookie':'session=fixture; Path=/; HttpOnly'}:{}});
  }};
}
test('three exact requests with fresh session, query binding and no booking action',async()=>{
  const f=fixture();const r=await searchHussar({date:'2026-10-26',fetchImpl:f.fetchImpl});
  assert.equal(r.status,'options_observed');assert.equal(r.finalBookabilityVerified,false);
  assert.deepEqual(f.calls.map(c=>[c.url.split('/').pop(),c.method]),[['1nWHwN9S','GET'],['ajax_covers','POST'],['ajax_times','POST']]);
  assert.ok(f.calls.every(c=>c.redirect==='error'));
  assert.equal(f.calls[2].headers.Cookie,'session=fixture');
  assert.deepEqual(Object.fromEntries(f.calls[2].body),{date:'2026-10-26',restaurant_id:'1068',csrf_token_name:'test-token',covers:'2',booking_reference:''});
  assert.ok(!JSON.stringify(r).includes('test-token'));
});
test('wrong identity and existing booking stop after page GET',async()=>{
  for(const source of [html.replace('1068','1069'),html.replace('value="">','value="existing">')]){
    const f=fixture(source);assert.equal((await searchHussar({date:'2026-10-26',fetchImpl:f.fetchImpl})).status,'unknown');assert.equal(f.calls.length,1);
  }
});
test('unqualified guest result never advances to times',async()=>{
  for(const covers of [null,{},[],{'2':{closed:true}},{'2':{closed:0}}]){
    const f=fixture(html,covers);assert.equal((await searchHussar({date:'2026-10-26',fetchImpl:f.fetchImpl})).status,'unknown');assert.equal(f.calls.length,2);
  }
});
test('invalid dates and guest counts never fetch',async()=>{
  for(const q of [{date:'2026-02-30'},{date:'bad'},{date:'2026-10-26',partySize:3}]){
    await assert.rejects(searchHussar({...q,fetchImpl:()=>assert.fail('Unexpected request')}),TypeError);
  }
});
test('access failures and cancellation cannot become empty availability',async()=>{
  const r=await searchHussar({date:'2026-10-26',fetchImpl:async()=>new Response('Forbidden',{status:403})});
  assert.equal(r.status,'unknown');assert.deepEqual(r.options,[]);
  const c=new AbortController();c.abort();
  const a=await searchHussar({date:'2026-10-26',signal:c.signal,fetchImpl:()=>assert.fail('Unexpected request')});
  assert.equal(a.reason,'aborted_or_timeout');
});

test('redirect markers and unexpected response URLs stop immediately',async()=>{
  for (const marker of [{redirected:true},{url:'https://example.invalid/other'}]) {
    let calls=0;
    const result=await searchHussar({date:'2026-10-26',fetchImpl:async()=>{
      calls++;const response=new Response(html);
      for(const [key,value] of Object.entries(marker)) Object.defineProperty(response,key,{value});
      return response;
    }});
    assert.equal(result.status,'unknown');assert.equal(calls,1);
  }
});
test('cancellation during the time request discards late positive results',async()=>{
  const controller=new AbortController();const f=fixture();
  const result=await searchHussar({date:'2026-10-26',signal:controller.signal,fetchImpl:async(...args)=>{
    const response=await f.fetchImpl(...args);
    if(f.calls.length===3) controller.abort();
    return response;
  }});
  assert.equal(result.reason,'aborted_or_timeout');assert.deepEqual(result.options,[]);
});
test('separate searches start without any previous session cookie',async()=>{
  for(let i=0;i<2;i++){
    const f=fixture();await searchHussar({date:'2026-10-26',fetchImpl:f.fetchImpl});
    assert.equal(f.calls[0].headers.Cookie,undefined);
    assert.equal(f.calls[1].headers.Cookie,'session=fixture');
  }
});
test('malformed time JSON fails closed without a booking request',async()=>{
  const f=fixture();
  const r=await searchHussar({date:'2026-10-26',fetchImpl:async(...args)=>{
    const response=await f.fetchImpl(...args);
    return f.calls.length===3 ? new Response('<html>Access denied</html>') : response;
  }});
  assert.equal(r.reason,'supplier_error');assert.deepEqual(r.options,[]);assert.equal(f.calls.length,3);
});
