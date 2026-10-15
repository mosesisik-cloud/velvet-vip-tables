import { chromium } from '../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { resolveEmbeddedBooking } from '../js/restaurant-booking-providers.js';

const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json', import.meta.url)));
const base = process.env.VELVET_UI_TEST_URL || 'http://127.0.0.1:4179/';
const origin = new URL(base).origin;
const providerUrls = new Set(Object.keys(registry).map(id => resolveEmbeddedBooking(registry,id).url));
const browser = await chromium.launch();
try {
 const context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 let loads = 0;
 const blockedMutations = [];
 await context.route('**/*', route => {
  const request=route.request();
  if (!['GET','HEAD'].includes(request.method())) {
   blockedMutations.push({method:request.method(),url:new URL(request.url()).pathname});
   return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});
  }
  if (providerUrls.has(request.url())) {
   loads++;
   return route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width"><label>Name<input name="guest"></label><button onclick="document.querySelector(\'output\').textContent=\'Selected\'">Choose time</button><output></output>'});
  }
  if (new URL(request.url()).origin !== origin) return route.abort();
  return route.continue();
 });
 const page=await context.newPage();
 await page.goto(base+'#/restaurant/curated-STO-brasserie-astoria');
 const firstPanel=page.locator('#restaurant-provider-booking');
 await firstPanel.getByRole('button',{name:'Hitta ett bord',exact:true}).waitFor();
 assert.equal(await firstPanel.locator('iframe').count(),0);
 await firstPanel.getByRole('button',{name:'Hitta ett bord',exact:true}).click();
 const frame = page.frameLocator('.booking-provider-frame');
 await frame.locator('input').fill('Simulation only');
 await frame.getByRole('button').click();
 assert.equal(await frame.locator('output').textContent(),'Selected');
 assert.equal(await frame.locator('input').inputValue(),'Simulation only');
 assert.equal(loads,1);
 assert.equal(await firstPanel.getByRole('button',{name:'Hitta ett bord',exact:true}).count(),0);
 await page.evaluate(()=>window.postMessage({status:'confirmed',bookingId:'FAKE'},'*'));
 assert.equal(await page.getByText('FAKE',{exact:true}).count(),0);
 assert.ok(await page.locator('.booking-provider-frame').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
 let embedded=0,external=0;
 for(const [id] of Object.entries(registry)) {
  const booking=resolveEmbeddedBooking(registry,id);
  await page.goto(base+'#/restaurant/'+id);
  const panel=page.locator('#restaurant-provider-booking');
  await page.waitForFunction(url => document.querySelector('#restaurant-provider-booking a')?.getAttribute('href') === url, booking.url);
  const policy=page.getByRole('region',{name:'Avbokningsvillkor'});
  await policy.waitFor();
  if (booking.cancellationPolicy) {
    assert.ok((await policy.textContent()).includes(booking.cancellationPolicy.summary));
    assert.equal(await policy.locator('a').getAttribute('href'), booking.cancellationPolicy.source);
  } else assert.match(await policy.textContent(), /ingen separat verifierad sammanfattning/);
  assert.match(await policy.textContent(), /lokal tidszon/);
  const link=panel.locator('a');
  assert.equal(await link.getAttribute('href'),booking.url,id);
  assert.equal(await link.getAttribute('rel'),'noopener noreferrer',id);
  assert.equal(await link.getAttribute('target'),'_blank',id);
  if (booking.integrationMode === 'external_link') {
   external++;
   assert.match(await link.textContent(),/Kontrollera tider hos/);
   assert.match(await panel.textContent(),/egen flik/);
   assert.equal(await panel.locator('iframe').count(),0,id);
   assert.equal(await panel.getByRole('button',{name:'Hitta ett bord',exact:true}).count(),0,id);
  } else {
   embedded++;
   const button=panel.getByRole('button',{name:'Hitta ett bord',exact:true});
   await button.waitFor();
   assert.equal(await panel.locator('iframe').count(),0,id);
   await button.click();
   await page.frameLocator('.booking-provider-frame').locator('input').waitFor();
   assert.equal(await panel.locator('iframe').getAttribute('src'),booking.url,id);
   assert.ok(await panel.locator('iframe').evaluate(e=>e.getBoundingClientRect().right<=innerWidth),id);
  }
 }
 console.log(`PASS: ${embedded} embedded + ${external} external mobile routes, preserved SevenRooms input, no synthetic confirmation. All provider content mocked; ${blockedMutations.length} write requests intercepted, none sent.`);
} finally { await browser.close(); }
