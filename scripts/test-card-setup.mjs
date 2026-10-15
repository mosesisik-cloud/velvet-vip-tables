import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { loginReturnTo } from '../js/ux-booking.js';

const source = await fs.readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const renderSource = source.slice(source.indexOf('async function renderCard() {'), source.indexOf('async function renderAccount() {'));
function fixture({ config = {stripe:false}, setup = null, verified = true, saved = '#/book-site/test?date=2030-10-20&go=1' } = {}) {
  const view = {innerHTML:''}, controls = new Map(), calls = [], storage = new Map([['velvet_after_idv',saved]]);
  const context = {
    URLSearchParams,
    location:{hash:'#/card',href:''}, loadUser:()=>({id:'test'}), setTitle:()=>{},
    view:()=>view, esc:String, t:key=>key, uxT:key=>key, cardLabel:()=> 'Visa ••1234',
    loginReturnTo, refreshIdv:async()=>{}, isIdvOk:()=>verified,
    rememberAfterIdv:value=>storage.set('velvet_after_idv',value),
    sessionStorage:{getItem:key=>storage.get(key)}, openOnboarding:()=>{},
    apiJSON:async(path, options)=>{calls.push({path,options});return path==='/pay/config' ? await config : setup},
    $:selector=>{
      const id=selector.slice(1);
      if(!view.innerHTML.includes(`id="${id}"`)) return null;
      if(!controls.has(id)) controls.set(id,{disabled:false,textContent:'',classList:{add(){},remove(){}},handlers:{},addEventListener(type,handler){this.handlers[type]=handler}});
      return controls.get(id);
    },
  };
  vm.createContext(context);
  vm.runInContext(renderSource,context);
  return {context,view,controls,calls,storage};
}

for(const config of [{stripe:false},null,{}, {stripe:'true'}, {stripe:false,revolutMerchant:true}]) {
  const f=fixture({config});await f.context.renderCard();
  assert.doesNotMatch(f.view.innerHTML, /<input|<form|cc-number|cc-csc/);
  assert.ok(!f.controls.has('card-stripe'));
  assert.ok(f.controls.has('card-retry'));
  assert.match(f.view.innerHTML,/cardStoredDetails/);
  assert.doesNotMatch(f.view.innerHTML,/payingCustomer|idv-badge ok/);
  assert.ok(f.view.innerHTML.includes('#/book-site/test?date=2030-10-20'));
  assert.ok(!f.view.innerHTML.includes('&go=1'),'back must not replay the card gate');
}
const active=fixture({config:{stripe:true},setup:{url:'https://checkout.stripe.com/test'}});
await active.context.renderCard();
assert.doesNotMatch(active.view.innerHTML,/<input|<form/);
await active.controls.get('card-stripe').handlers.click();
assert.equal(active.context.location.href,'https://checkout.stripe.com/test');
assert.equal(active.calls.at(-1).path,'/card/setup');
assert.deepEqual(JSON.parse(active.calls.at(-1).options.body),{user:{id:'test'}});
assert.ok(!active.calls.some(call=>call.path==='/card'),'manual metadata registration must never run');

const failed=fixture({config:{stripe:true},setup:{error:'no_processor'}});
await failed.context.renderCard();await failed.controls.get('card-stripe').handlers.click();
assert.equal(failed.controls.get('card-stripe').disabled,false);
assert.equal(failed.controls.get('card-err').textContent,'cardSetupUnavailable');

const gated=fixture({verified:false});await gated.context.renderCard();
assert.equal(gated.context.location.hash,'#/verify');
assert.equal(gated.storage.get('velvet_after_idv'),'#/book-site/test?date=2030-10-20&go=1','verification preserves the original booking context');
assert.equal(gated.calls.length,0);

let resolveConfig;
const late=fixture({config:new Promise(resolve=>{resolveConfig=resolve})});
const rendering=late.context.renderCard();
await Promise.resolve();await Promise.resolve();
late.context.location.hash='#/restaurants';late.view.innerHTML='new route';
resolveConfig({stripe:true});await rendering;
assert.equal(late.view.innerHTML,'new route','late config must not overwrite a newer route');
console.log('PASS card setup: no PAN/CVC collection, processor-only setup, truthful metadata, unavailable/retry states, preserved return context and stale response guard.');
