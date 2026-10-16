import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

// Transport doubles only. No requests to providers and no real holds/bookings.
const source = await fs.readFile(new URL('../js/provider-playwright-booking.js', import.meta.url));
const server = http.createServer((req,res) => {
  res.setHeader('Content-Type', req.url === '/module.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/module.js' ? source : '<meta name="viewport" content="width=device-width"><div id="booking"></div>');
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
async function setup(page, scenario = 'journey') {
  await page.goto(origin);
  await page.evaluate(async scenario => {
    const { mountProviderPlaywrightBooking } = await import('/module.js');
    const canvas = document.createElement('canvas'); canvas.width=420; canvas.height=760;
    const image=canvas.toDataURL('image/png');
    const bytes=Uint8Array.from(atob(image.split(',')[1]),c=>c.charCodeAt(0));
    const imageHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
    const review={restaurantId:'venue-1',fingerprint:'review-bound',date:'2026-12-20',time:'19:00',party:2,expiresAt:Date.now()+60000};
    const bookingReview={details:{restaurantId:'venue-1',date:review.date,time:review.time,party:review.party,guest:{firstname:'Test'},termsText:'Leverantörsvillkor'},reviewFingerprint:'review-bound'};
    window.calls=[];
    let snapshot={id:'session-1',provider:'SevenRooms',restaurantId:'venue-1',revision:1,width:420,height:760,image,imageHash,mode:'prepare',phase:'selection',text:'SIMULATED PROVIDER',fields:[]};
    if(scenario==='hash') snapshot.imageHash='bad';
    if(scenario==='venue') snapshot.restaurantId='other';
    if(scenario==='fixture') snapshot.mode='fixture';
    if(['timeout','proof','expired','pending'].includes(scenario)) snapshot={...snapshot,phase:'booking_review',canSubmit:true,bookingReview:{...bookingReview,...(scenario==='expired'?{expiresAt:1}:{})},reviewFingerprint:'review-bound'};
    window.transport=async(path,options)=>{
      const body=JSON.parse(options.body||'{}');window.calls.push({path,method:options.method,body});
      if(body.type==='search'||body.type==='click') snapshot={...snapshot,phase:'hold_review',canHold:true,holdReview:review};
      if(body.type==='hold') {
        if(scenario==='hold-timeout') throw new Error('lost_hold_reply');
        snapshot={...snapshot,phase:'guest',canHold:false,result:{status:'held',phase:'hold'},fields:[{name:'firstname',value:''},{name:'email',value:''},{name:'marketingConsent',value:'true'}]};
      }
      if(body.type==='fill') snapshot={...snapshot,fields:Object.entries(body.fields).map(([name,value])=>({name,value}))};
      if(body.type==='review') snapshot={...snapshot,phase:'booking_review',canSubmit:true,bookingReview,reviewFingerprint:'review-bound'};
      if(body.type==='submit') {
        if(scenario==='timeout') throw new Error('lost_reply');
        if(scenario==='pending') return new Promise(()=>{});
        snapshot={...snapshot,phase:'result',canSubmit:false,result:{status:'confirmed',reference:'REF-1',verification:{verified:true,source:scenario==='proof'?'fixture':'provider',restaurantId:'venue-1',sessionId:'session-1',attemptId:'attempt-1'}}};
      }
      return {...snapshot,revision:++snapshot.revision};
    };
    window.mount=()=>mountProviderPlaywrightBooking(document.querySelector('#booking'),window.transport,{provider:'SevenRooms',restaurantId:'venue-1',restaurantName:'Testrestaurang',requestTimeoutMs:500});
    window.ui=window.mount(); await window.ui.ready;
  },scenario);
}
async function idle(page) { await page.waitForFunction(()=>!document.querySelector('[data-refresh]').disabled); }
try {
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  await context.routeWebSocket(/.*/,socket=>socket.close());
  for(const width of [390,1366]) {
    const page=await context.newPage(); await page.setViewportSize({width,height:844}); await setup(page);
    await page.locator('[data-start]').click();await idle(page);
    await page.locator('[data-down]').click();await idle(page);
    if(width===390) {
      await page.locator('[name="date"]').fill('2026-12-20');await page.locator('[name="party"]').fill('2');await page.locator('[data-search] button').click();
    } else await page.locator('[data-image]').click({position:{x:30,y:30}});
    await idle(page);
    assert.equal(await page.locator('[data-hold-button]').isDisabled(),true);
    assert.match(await page.locator('[data-hold-details]').innerText(),/2026-12-20.*19:00.*2 gäster/);
    await page.locator('[data-hold-consent]').check();await page.locator('[data-hold-button]').click();await idle(page);
    assert.equal(await page.locator('[data-field="marketingConsent"]').count(),0);
    await page.locator('[data-field="firstname"]').fill('Test');await page.locator('[data-field="email"]').fill('test@example.invalid');
    assert.equal(await page.locator('[data-review]').isDisabled(),true);
    await page.locator('[data-save]').click();await idle(page);
    await page.locator('[data-review]').click();await idle(page);
    assert.equal(await page.locator('[data-submit]').isDisabled(),true);
    await page.locator('[data-terms]').check();await page.locator('[data-submit]').click();await idle(page);
    assert.equal(await page.locator('[data-status]').getAttribute('data-booking-status'),'confirmed');
    const calls=await page.evaluate(()=>window.calls);
    assert.equal(calls.filter(c=>c.body.type==='hold').length,1);assert.equal(calls.filter(c=>c.body.type==='submit').length,1);
    assert.equal(calls.find(c=>c.body.type==='hold').body.reviewFingerprint,'review-bound');
    assert.equal(calls.find(c=>c.body.type==='submit').body.terms,true);
    assert.equal(calls.find(c=>c.body.type==='scroll').body.delta,500);
    const saved=await page.evaluate(()=>JSON.stringify({...sessionStorage}));assert(!saved.includes('example.invalid'));assert(!saved.includes('review-bound'));
    const panel=await page.locator('#booking').boundingBox();assert(panel.width<=560);
    const footer=await page.locator('footer').boundingBox();assert(footer.y+footer.height<=844);
    await page.close();console.log(`PASS native journey ${width}: hold, guest save, review, verified proof, compact layout`);
  }
  {
    const page=await context.newPage();await setup(page,'hold-timeout');await page.locator('[data-start]').click();await idle(page);
    await page.locator('[data-image]').click({position:{x:30,y:30}});await idle(page);
    await page.locator('[data-hold-consent]').check();await page.locator('[data-hold-button]').click();await idle(page);
    await page.evaluate(async()=>{window.ui.destroy();window.ui=window.mount();await window.ui.ready;});await idle(page);
    assert.equal(await page.locator('[data-hold-button]').isDisabled(),true);
    assert.equal((await page.evaluate(()=>window.calls)).filter(c=>c.body.type==='hold').length,1);
    await page.close();console.log('PASS hold timeout persists across remount; no repeat hold');
  }
  for(const scenario of ['hash','venue','fixture']) {
    const page=await context.newPage();await setup(page,scenario);await page.locator('[data-start]').click();await idle(page);
    assert.equal(await page.locator('[data-screen]').isHidden(),true);
    assert.match(await page.locator('[data-status]').innerText(),/kunde inte verifieras/);
    await page.close();console.log(`PASS reject ${scenario}`);
  }
  for(const scenario of ['timeout','proof','expired','pending']) {
    const page=await context.newPage();await setup(page,scenario);await page.locator('[data-start]').click();await idle(page);
    if(scenario==='expired') {assert.equal(await page.locator('[data-final]').isHidden(),true);await page.close();console.log('PASS expired review blocked');continue;}
    await page.locator('[data-terms]').check();await page.locator('[data-submit]').click();
    if(scenario==='pending') {
      await page.locator('[data-dismiss]').click();
      assert.equal(await page.locator('#booking').isHidden(),true);
      assert.equal((await page.evaluate(()=>window.calls)).filter(c=>c.method==='DELETE').length,0);
    } else {
      await idle(page);
      if(scenario==='proof') assert.equal(await page.locator('[data-status]').getAttribute('data-booking-status'),'unknown');
      else {
        assert.equal(await page.locator('[data-submit]').isDisabled(),true);
        await page.evaluate(async()=>{window.ui.destroy();window.ui=window.mount();await window.ui.ready;});await idle(page);
        assert.equal(await page.locator('[data-submit]').isDisabled(),true);
        const calls=await page.evaluate(()=>window.calls);assert(calls.some(c=>c.path.endsWith('/session-1/current')));assert.equal(calls.filter(c=>c.body.type==='submit').length,1);
      }
    }
    await page.close();console.log(`PASS ${scenario}: no duplicate write or false confirmation`);
  }
  await context.close();
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
