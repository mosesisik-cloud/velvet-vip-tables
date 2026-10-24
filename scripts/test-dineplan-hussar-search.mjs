import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchHussar } from './lib/dineplan-hussar-search.mjs';
const html = 'The Hussar Grill Rondebosch <input id="restaurant_id" value="1068"><input id="booking_reference" value=""> const csrf_hash = "test-token";';
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
