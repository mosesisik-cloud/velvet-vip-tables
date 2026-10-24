import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { availabilityTermsNotes } from '../js/availability-search.js';
import { availabilityCopy } from '../js/availability-copy.js';
const cases = [
  { restaurantId:'reviewed-shift', availabilityScope:'reviewed_shift', paymentRequirement:'not_specified', cancellationPolicyStatus:'unknown', slots:[{time:'19:00'}], keys:['reviewedScopeNote','paymentUnknownNote','cancellationUnknownNote','finalTermsNote'] },
  { restaurantId:'row-unknown', paymentRequirement:'not_specified', cancellationPolicyStatus:'unknown', slots:[{time:'19:00'}], keys:['paymentUnknownNote','cancellationUnknownNote','finalTermsNote'] },
  { restaurantId:'slot-unknown', slots:[{time:'19:00',paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown'}], keys:['paymentUnknownNote','cancellationUnknownNote','finalTermsNote'] },
  { restaurantId:'card-and-unknown', slots:[{time:'19:00',requiresCard:true,paymentRequirement:'card'},{time:'19:30',paymentRequirement:'not_specified'}], keys:['cardNote','paymentUnknownNote','finalTermsNote'] },
  { restaurantId:'prepaid', slots:[{time:'19:00',requiresPrepayment:true,paymentRequirement:'prepayment',cancellationPolicyStatus:'unknown'}], keys:['prepaymentNote','cancellationUnknownNote','finalTermsNote'] },
  { restaurantId:'known', paymentRequirement:'card', cancellationPolicyStatus:'known', slots:[{time:'19:00'}], keys:['cardNote'] },
  { restaurantId:'mixed', slots:[{time:'19:00',requiresCard:true,paymentRequirement:'mixed'}], keys:['cardNote','mixedNote'] },
  { restaurantId:'legacy', slots:[{time:'19:00'}], keys:[] },
];
for (const lang of ['sv','en','es','fr']) {
  const {text:tr}=availabilityCopy(lang);
  for(const row of cases) assert.deepEqual(availabilityTermsNotes(row,tr),row.keys.map(key=>tr(key)),`${lang}: ${row.restaurantId}`);
}
const server=createServer(async(req,res)=>{try {
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/') return res.setHeader('Content-Type','text/html').end('<main></main>');
  if(!/^\/js\/[a-z-]+\.js$/.test(path)) return res.writeHead(404).end();
  res.setHeader('Content-Type','application/javascript');res.end(await readFile(new URL('..'+path,import.meta.url)));
}catch {res.writeHead(500).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();
try {
  for(const lang of ['sv','en','es','fr']) {
    const page=await browser.newPage();
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/availability') return route.fulfill({json:{complete:true,results:cases.map(({keys,...row})=>({...row,restaurant:row.restaurantId,city:'Stockholm',status:'available'}))}});
      return url.hostname==='127.0.0.1' && route.request().method()==='GET' ? route.continue() : route.abort();
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(async lang=>{const {mountAvailabilitySearch}=await import('/js/availability-search.js');window.ui=mountAvailabilitySearch(document.querySelector('main'),{restaurants:[{city:'Stockholm'}],initialCity:'Stockholm',lang});},lang);
    await page.locator('button[type=submit]').click();
    await page.locator('.availability-card').last().waitFor();
    const {text:tr}=availabilityCopy(lang);
    for(const row of cases) {
      const note=await page.locator(`[data-result-key="${row.restaurantId}"] .availability-card-note`).innerText();
      for(const key of row.keys) assert.ok(note.includes(tr(key)),`${lang}: ${row.restaurantId}: ${key}`);
      for(const key of ['paymentUnknownNote','cancellationUnknownNote','finalTermsNote']) if(!row.keys.includes(key)) assert.ok(!note.includes(tr(key)),`${lang}: no incorrect ${key}`);
    }
    await page.close();
  }
  console.log('PASS: 32 localized mocked result renders; row/slot unknowns, mixed card and unknown, prepayment retained, no invented unknown/free terms. No external requests.');
} finally {await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
