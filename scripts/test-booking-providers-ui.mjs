import { chromium } from '../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json', import.meta.url)));
const browser = await chromium.launch();
try {
 const page = await browser.newPage({viewport:{width:390,height:844}});
 let loads = 0;
 await page.route('https://**sevenrooms.com/**', route => {
  loads++;
  return route.fulfill({contentType:'text/html',body:'<label>Name<input name="guest"></label><button onclick="document.querySelector(\'output\').textContent=\'Selected\'">Choose time</button><output></output>'});
 });
 await page.goto('http://127.0.0.1:4179/#/restaurant/curated-STO-brasserie-astoria');
 assert.equal(await page.locator('.booking-provider-frame').count(),0);
 await page.locator('#restaurant-provider-booking button').click();
 const frame = page.frameLocator('.booking-provider-frame');
 await frame.locator('input').fill('Simulation only');
 await frame.getByRole('button').click();
 assert.equal(await frame.locator('output').textContent(),'Selected');
 assert.equal(await frame.locator('input').inputValue(),'Simulation only');
 assert.equal(loads,1);
 assert.equal(await page.locator('#restaurant-provider-booking button').count(),0);
 await page.evaluate(()=>window.postMessage({status:'confirmed',bookingId:'FAKE'},'*'));
 assert.equal(await page.getByText('FAKE',{exact:true}).count(),0);
 assert.ok(await page.locator('.booking-provider-frame').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
 for(const [id,row] of Object.entries(registry)) {
  console.log('Checking',id);
  await page.goto('http://127.0.0.1:4179/#/restaurant/'+id);
  const panel=page.locator('#restaurant-provider-booking');
  await page.waitForFunction(url => document.querySelector('#restaurant-provider-booking a')?.getAttribute('href') === url, new URL(row.url).href);
  await panel.getByRole('button',{name:'Hitta ett bord',exact:true}).waitFor();
  assert.equal(await panel.locator('a').getAttribute('href'),row.url,id);
 }
 console.log(`PASS: mobile guest UI, retained provider state, no synthetic confirmation, ${Object.keys(registry).length} restaurant routes`);
} finally { await browser.close(); }
