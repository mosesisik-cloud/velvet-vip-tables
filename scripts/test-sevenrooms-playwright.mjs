import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { SevenRoomsPlaywright, SEVENROOMS_PILOT, sevenRoomsReadAllowed, sevenRoomsSearchSelection, sevenRoomsHoldMatches } from '../api/providers/sevenrooms-playwright.mjs';

const origin = 'https://www.sevenrooms.com';
const range = origin + '/api-yoa/availability/ng/widget/range?venue=strandvagen1&party_size=2&start_date=2026-12-20&num_days=1';
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url), true);
assert.equal(sevenRoomsReadAllowed('GET', range, 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', range.replace('&start_date=2026-12-20', '') + '&actual_id=&analytics_session_id=fixture', 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', range + '&actual_id=existing-booking', 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/static2/reservations/sv-SE-fixture.json', 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/languagestrings/strandvagen1/all?widget_type=res_widget', 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/upgrades/widget?venue_id=' + SEVENROOMS_PILOT.internalVenueId, 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/upgrades/widget?venue_id=other', 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/upgrades/widget/status?venue_id=' + SEVENROOMS_PILOT.internalVenueId, 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('POST', origin + '/api-yoa/upgrades/widget?venue_id=' + SEVENROOMS_PILOT.internalVenueId, 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/tags/translated/' + SEVENROOMS_PILOT.internalVenueId + '/sv/', 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/tags/translated/other/sv/', 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/availability/dates?venue=strandvagen1&start_date=2026-10-19&num_days=225', 'fetch'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/availability/dates?venue=other&start_date=2026-10-19&num_days=225', 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/availability/dates?venue=strandvagen1&start_date=2026-10-19&num_days=999', 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/languagestrings/other/all?widget_type=reservations', 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/api-yoa/dining/widget_info?venue_url_key=strandvagen1', 'xhr'), true);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/static2/reservations/index-fixture.js', 'script'), true);
for (const url of [
  range.replace('strandvagen1', 'other'), range + '&venue=other', range + '&redirect=https://evil.invalid',
  range.replace('num_days=1', 'num_days=31'), range.replace('party_size=2', 'party_size=0'),
  origin + '/api-yoa/dining/hold/add', origin + '/api-yoa/actuals/manage/cancel?token=fixture',
  origin + '/booking/dining/widget/strandvagen1/book', origin + '/api-yoa/unknown',
  range.replace('www.sevenrooms.com', 'www.sevenrooms.com.evil.invalid'),
  range.replace('https:', 'http:'), range.replace('https://', 'https://user:secret@'), range + '#fragment',
  origin + '/api-yoa/%64ining/widget_info?venue_url_key=strandvagen1',
]) assert.equal(sevenRoomsReadAllowed('GET', url, 'fetch'), false, url);
for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) assert.equal(sevenRoomsReadAllowed(method, range, 'fetch'), false);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url.replace('strandvagen1', 'other')), false);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url + '?lang=sv'), true);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url + '?date=2026-12-21&party_size=2&start_time=19%3A00'), true);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url + '?date=2026-02-31'), false);
for (const selection of [{date:'2026-02-31',party:2},{date:'2026-12-21',party:'2'},{date:'2026-12-21',party:0},{date:'2026-12-21',party:2,time:'24:00'}]) assert.throws(()=>sevenRoomsSearchSelection(selection),/invalid_search/);
assert.equal(sevenRoomsReadAllowed('GET', SEVENROOMS_PILOT.url + '?lang=sv&lang=en'), false);
assert.equal(sevenRoomsReadAllowed('GET', origin + '/static2/not-a-script', 'script'), false);

// Entire provider document/API are local fixtures fulfilled in Chromium's route
// handler. No external network is allowed, no real slots or provider confirmation.
const html = `<!doctype html><html><body><h1>LOCAL FIXTURE — Strandvägen 1</h1>
<button id="search">Search fixture</button><button id="hold" hidden>Choose fixture slot</button>
<p id="state">Not real availability</p><script>
fetch('https://analytics.invalid/collect',{method:'POST',body:'fixture'}).catch(()=>{});
const desired=new URLSearchParams(location.search),fixtureRange=new URL(${JSON.stringify(range)});
if(desired.has('date')){fixtureRange.searchParams.set('start_date',desired.get('date'));fixtureRange.searchParams.set('party_size',desired.get('party_size'));}
search.onclick=async()=>{const r=await fetch(fixtureRange);const j=await r.json();state.textContent=j.label;hold.hidden=false;};
hold.onclick=async()=>{try{await fetch('/api-yoa/dining/hold/add',{method:'POST',body:'fixture-only'});state.textContent='UNSAFE';}catch{state.textContent='Hold blocked';}};
if(desired.has('date'))search.click();
</script></body></html>`;
const forwarded = [], blocked = [], contexts = [];
let clock = Date.now(), documentMode = 'fixture';
const mirror = new SevenRoomsPlaywright({ now: () => clock, browserFactory: async () => {
  const browser = await chromium.launch();
  const createContext = browser.newContext.bind(browser);
  browser.newContext = async options => {
    assert.equal(options.serviceWorkers, 'block');
    assert.equal(options.acceptDownloads, false);
    const context = await createContext(options);
    contexts.push(context);
    const route = context.route.bind(context);
    context.route = (pattern, handler) => route(pattern, actual => handler(new Proxy(actual, {
      get(target, property) {
        if (property === 'fetch') return async options => {
          assert.equal(options.maxRedirects, 0);
          const request = actual.request();
          forwarded.push({ method: request.method(), url: request.url() });
          const isDocument = request.resourceType() === 'document';
          const day = new URL(request.url()).searchParams.get('start_date') || '2026-12-20';
          return {
            status: () => documentMode === 'redirect' && isDocument ? 302 : 200,
            headers: () => ({ 'content-type': isDocument ? 'text/html' : 'application/json', ...(documentMode === 'redirect' ? { location: origin + '/api-yoa/dining/hold/add' } : {}) }),
            body: async () => Buffer.from(isDocument ? documentMode === 'captcha' ? '<h1>Verify you are human</h1>' : html : JSON.stringify({ label: 'Fixture slots only', status:200, data:{availability:{[day]:[{times:[{type:'book',time_iso:day+'T19:00:00',require_credit_card:true},{type:'request',time:'20:00'},{type:'book',time_iso:'1999-01-01T21:00:00'},{type:'book',time:'25:00'}]}]}} })),
          };
        };
        if (property === 'continue' || property === 'fallback') return () => { throw new Error('External network escape'); };
        if (property === 'abort') return (...args) => { blocked.push(actual.request().url()); return actual.abort(...args); };
        const value = target[property];
        return typeof value === 'function' ? value.bind(target) : value;
      },
    })));
    return context;
  };
  return browser;
} });

try {
  await assert.rejects(mirror.create('', SEVENROOMS_PILOT.restaurantId), /auth/);
  await assert.rejects(mirror.create('alice', 'other'), /pilot_only/);
  let shot = await mirror.create('alice', SEVENROOMS_PILOT.restaurantId, 390);
  assert.equal(shot.provider, 'SevenRooms'); assert.equal(shot.state, 'read_only');
  assert.equal(shot.mode, 'inspect'); assert.equal(shot.canSubmit, false); assert.equal(shot.result, null);
  assert.equal(shot.readiness, 'unverified');
  assert.ok(shot.blockedRoutes.every(route => !('url' in route) && !('body' in route)));
  assert.match(shot.text, /LOCAL FIXTURE/);
  assert.equal(shot.imageHash, crypto.createHash('sha256').update(Buffer.from(shot.image.split(',')[1], 'base64')).digest('hex'));
  await assert.rejects(mirror.create('alice', SEVENROOMS_PILOT.restaurantId), /session_exists/);
  await assert.rejects(mirror.current(shot.id, 'bob'), /session_expired/);
  await assert.rejects(mirror.action(shot.id, 'bob', { type: 'refresh', revision: shot.revision }), /session_expired/);
  await assert.rejects(mirror.remove(shot.id, 'bob'), /session_expired/);
  for (const type of ['submit', 'fill', 'navigate', 'evaluate']) await assert.rejects(mirror.action(shot.id, 'alice', { type, revision: shot.revision, confirm: true, terms: true }), /inspect_only/);
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'refresh', revision: 0 }), /stale_view/);
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'click', revision: shot.revision, x: NaN, y: 0 }), /coordinates/);
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'scroll', revision: shot.revision, delta: 9999 }), /scroll/);
  shot = await mirror.action(shot.id, 'alice', {type:'search',revision:shot.revision,date:'2026-12-21',party:2,time:'19:00'});
  assert.deepEqual(shot.selection,{date:'2026-12-21',party:2,time:'19:00'});
  assert.equal(shot.readiness,'availability_observed');
  assert.deepEqual(shot.availability.slots,[{time:'19:00',paymentRequirement:'card'}]);
  assert.equal(shot.canSubmit,false); assert.equal(shot.result,null);
  shot.availability.slots[0].time='FAKE';
  shot=await mirror.current(shot.id,'alice'); assert.equal(shot.availability.slots[0].time,'19:00');
  clock+=60_001; shot=await mirror.current(shot.id,'alice'); assert.equal(shot.readiness,'unverified');
  const page = contexts[0].pages()[0];
  const click = async selector => {
    const box = await page.locator(selector).boundingBox();
    shot = await mirror.action(shot.id, 'alice', { type: 'click', revision: shot.revision, x: box.x + box.width / 2, y: box.y + box.height / 2 });
  };
  await click('#search');
  await page.locator('#hold').waitFor({ state: 'visible' });
  shot = await mirror.current(shot.id, 'alice');
  assert.match(shot.text, /Fixture slots only/);
  await click('#hold');
  await page.waitForFunction(() => document.querySelector('#state').textContent === 'Hold blocked');
  shot = await mirror.current(shot.id, 'alice');
  assert.equal(shot.state, 'provider_write_required'); assert.equal(shot.canSubmit, false); assert.equal(shot.result, null);
  assert.ok(blocked.some(url => url.endsWith('/hold/add')));
  assert.ok(!forwarded.some(request => request.method !== 'GET' || /hold|\/book$/.test(request.url)));
  await assert.rejects(mirror.action(shot.id, 'alice', { type: 'click', revision: shot.revision, x: 1, y: 1 }), /provider_write_required/);
  // Untrusted page content must never synthesize provider-confirmed result.
  await page.evaluate(() => { document.body.innerHTML = '<h1>Booking confirmed FAKE-123</h1>'; });
  shot = await mirror.current(shot.id, 'alice'); assert.equal(shot.result, null);
  const concurrent = await Promise.allSettled([mirror.current(shot.id, 'alice'), mirror.current(shot.id, 'alice')]);
  assert.equal(concurrent.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(concurrent.find(x => x.status === 'rejected').reason.code, 'busy');
  for (const owner of ['b', 'c', 'd']) await mirror.create(owner, SEVENROOMS_PILOT.restaurantId);
  await assert.rejects(mirror.create('e', SEVENROOMS_PILOT.restaurantId), /capacity/);
  clock += 600_001;
  await assert.rejects(mirror.current(shot.id, 'alice'), /session_expired/);
  await mirror.expire();
  documentMode = 'captcha';
  const captcha = await mirror.create('new', SEVENROOMS_PILOT.restaurantId);
  assert.equal(captcha.state, 'access_blocked'); assert.equal(captcha.canSubmit, false);
  await mirror.remove(captcha.id, 'new');
  documentMode = 'redirect';
  await assert.rejects(mirror.create('redirect', SEVENROOMS_PILOT.restaurantId));
  assert.ok(!forwarded.some(request => request.url.endsWith('/hold/add')));
} finally { await mirror.close(); }
await assert.rejects(mirror.create('after-close', SEVENROOMS_PILOT.restaurantId), /closed/);
console.log('PASS SevenRooms local Chromium fixture: pinned venue/read routes, PNG hash, owner/revision/busy/capacity/TTL, no submit/fill, hold and redirect blocked, no forged confirmation, CAPTCHA stop. No live provider/network/booking test.');

// Extend the same browser suite across the new approval boundaries. Every fetch
// is fulfilled locally; even writeEnabled cannot reach a supplier in this harness.
const holdPayload={access_persistent_id:'fixture-access',shift_persistent_id:'fixture-shift',channel:'SEVENROOMS_WIDGET',venue:SEVENROOMS_PILOT.venueId,date:'2026-12-21',party_size:2,time:'19:00:00'};
assert.equal(sevenRoomsHoldMatches(holdPayload,{date:'2026-12-21',party:2,time:'19:00'}),true);
for(const delta of [{venue:'other'},{date:'2026-12-22'},{party_size:3},{extra:'unknown'},{time:'20:00:00'}]) assert.equal(sevenRoomsHoldMatches({...holdPayload,...delta},{date:'2026-12-21',party:2,time:'19:00'}),false);
const checkoutHtml=`<!doctype html><body><h1>LOCAL CHECKOUT FIXTURE ONLY</h1><button id="slot">19:00 Middag</button><div id="guest" hidden>
<input name="firstName"><input name="lastName"><input name="emailAddress" type="email"><input name="phoneNumber" type="tel">
<input type="checkbox" name="agreedToVenueSmsMarketingOptIn" checked><p>Fixture terms only</p><button data-test="checkout-button-complete">Skicka in</button></div><script>
if(location.search)fetch(${JSON.stringify(range.replace('2026-12-20','2026-12-21'))});
slot.onclick=async()=>{try{const r=await fetch('/api-yoa/dining/hold/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(${JSON.stringify(holdPayload)})});const j=await r.json();if(j.data.reservation_hold_id){guest.hidden=false;slot.hidden=true;}}catch{}};
document.querySelector('[data-test="checkout-button-complete"]').onclick=async()=>{try{await fetch('/booking/dining/widget/strandvagen1/book',{method:'POST',body:'LOCAL-SYNTHETIC-PAYLOAD'});}catch{}};
</script></body>`;
let grant=true, failHold=false, proofMode='unverified';
const events=[],writeFetches=[];
let flowPage;
const flow=new SevenRoomsPlaywright({prepare:true,writeEnabled:true,now:()=>clock,
 reserveAttempt:async intent=>{events.push('reserve:'+intent.phase);return {sendAllowed:grant,attempt:{id:'local-'+intent.phase}};},
 recordAttempt:async ({intent,result})=>{events.push('record:'+intent.phase+':'+result.status);},
 submissionPolicy:{matchesRequest:async ({request})=>request.postData()==='LOCAL-SYNTHETIC-PAYLOAD',verifyConfirmation:async ({intent})=>proofMode==='bound' ? {confirmed:true,reference:'LOCAL-ONLY',reviewFingerprint:intent.reviewFingerprint,restaurantId:intent.restaurantId,sessionId:intent.sessionId}: {confirmed:true,reference:'UNBOUND'}},
 browserFactory:async()=>{const b=await chromium.launch();const nc=b.newContext.bind(b);b.newContext=async options=>{
  const c=await nc(options), route=c.route.bind(c); c.route=(pattern,handler)=>route(pattern,actual=>handler(new Proxy(actual,{get(target,key){
   if(key==='continue'||key==='fallback')return ()=>{throw Error('network escape');};
   if(key==='fetch')return async()=>{
    const r=actual.request(),u=new URL(r.url());let data;
    if(r.method()==='POST'){
     writeFetches.push(u.pathname);events.push('fetch:'+u.pathname);
     assert.ok(events.at(-2)?.startsWith('reserve:'),'journal before each dispatch');
     if(failHold&&u.pathname.endsWith('/hold/add'))throw Error('simulated lost response');
     data=u.pathname.endsWith('/hold/add')?{status:200,data:{reservation_hold_id:'LOCAL-HOLD',hold_duration_sec:300}}:{id:'NOT-PROOF'};
    }else data={status:200,data:{availability:{'2026-12-21':[{times:[{type:'book',time:'19:00'}]}]}}};
    return {status:()=>200,headers:()=>({'content-type':r.resourceType()==='document'?'text/html':'application/json'}),body:async()=>Buffer.from(r.resourceType()==='document'?checkoutHtml:JSON.stringify(data))};
   };
   const v=target[key];return typeof v==='function'?v.bind(target):v;
  }})));const np=c.newPage.bind(c);c.newPage=async()=>{flowPage=await np();return flowPage;};return c;
 };return b;}});
const prepareHold=async owner=>{
 let s=await flow.create(owner,SEVENROOMS_PILOT.restaurantId);
 s=await flow.action(s.id,owner,{type:'search',revision:s.revision,date:'2026-12-21',party:2,time:'19:00'});
 const box=await flowPage.locator('#slot').boundingBox();
 s=await flow.action(s.id,owner,{type:'click',revision:s.revision,x:box.x+2,y:box.y+2});
 assert.equal(s.phase,'hold_review');assert.equal(s.canHold,true);assert.equal(s.canSubmit,false);
 return s;
};
try{
 let s=await prepareHold('denied');grant=false;
 const before=writeFetches.length;
 await assert.rejects(flow.action(s.id,'denied',{type:'hold',revision:s.revision,confirm:true,reviewFingerprint:s.holdReview.fingerprint}),/already_attempted/);
 assert.equal(writeFetches.length,before);await flow.remove(s.id,'denied');grant=true;
 s=await prepareHold('lost');failHold=true;
 s=await flow.action(s.id,'lost',{type:'hold',revision:s.revision,confirm:true,reviewFingerprint:s.holdReview.fingerprint});
 assert.deepEqual(s.result,{status:'unknown',phase:'hold'});
 await assert.rejects(flow.action(s.id,'lost',{type:'click',revision:s.revision,x:2,y:2}),/phase_locked/);
 await flow.remove(s.id,'lost');failHold=false;
 for(const mode of ['unverified','bound']){
  proofMode=mode;s=await prepareHold(mode);
  await assert.rejects(flow.action(s.id,mode,{type:'hold',revision:s.revision,confirm:true,reviewFingerprint:'wrong'}),/confirmation_required/);
  s=await flow.current(s.id,mode);
  s=await flow.action(s.id,mode,{type:'hold',revision:s.revision,confirm:true,reviewFingerprint:s.holdReview.fingerprint});
  await flowPage.locator('input[name="firstName"]').waitFor();s=await flow.current(s.id,mode);
  assert.equal(s.phase,'guest');assert.equal(s.fields.length,4);
  s=await flow.action(s.id,mode,{type:'fill',revision:s.revision,fields:{firstname:'Local',lastname:'Fixture',email:'fixture@example.invalid',phone:'0700000000'}});
  assert.equal(await flowPage.locator('input[type="checkbox"]').isChecked(),false);
  s=await flow.action(s.id,mode,{type:'review',revision:s.revision});assert.equal(s.phase,'booking_review');
  assert.equal(s.canSubmit,true);const fp=s.reviewFingerprint;
  await assert.rejects(flow.action(s.id,mode,{type:'submit',revision:s.revision,confirm:true,terms:false,reviewFingerprint:fp}),/confirmation_required/);
  s=await flow.current(s.id,mode);
  s=await flow.action(s.id,mode,{type:'submit',revision:s.revision,confirm:true,terms:true,reviewFingerprint:fp});
  assert.equal(s.result.status,mode==='bound'?'confirmed':'unknown');
  assert.equal(s.phase,'result');assert.equal(s.canSubmit,false);
  await assert.rejects(flow.action(s.id,mode,{type:'submit',revision:s.revision,confirm:true,terms:true,reviewFingerprint:fp}),/already_attempted/);
  assert.ok(!JSON.stringify(s).includes('LOCAL-HOLD'),'private hold token never exposed');
  await flow.remove(s.id,mode);
 }
}finally{await flow.close();}
console.log('PASS same Chromium suite: separate reviewed hold, denied journal means zero dispatch, lost response stays unknown/no replay, guest/marketing, explicit final review, bound synthetic proof only. All supplier writes locally simulated.');
