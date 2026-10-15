import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '../node_modules/playwright/index.mjs';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'velvet-search-'));
const api=spawn(process.execPath,['api/server.mjs'],{env:{...process.env,PORT:'18789',VELVET_DATA:path.join(dir,'store.json'),VELVET_IDV:path.join(dir,'idv'),VELVET_CRAWL:'0',VELVET_RATE:'0'},stdio:'ignore'});
const server=spawn('python',['-m','http.server','4181','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:18789/health')).ok)break;}catch{} await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4181/?api=http://127.0.0.1:18789#/availability');
  await page.getByLabel('Destination',{exact:true}).selectOption('Stockholm');await page.getByLabel('Datum',{exact:true}).fill('2026-10-19');await page.getByLabel('Tid',{exact:true}).fill('17:00');await page.getByRole('button',{name:'Sök lediga bord'}).click();
  await page.locator('.availability-card').first().waitFor({timeout:30000});assert.ok(await page.locator('.availability-slot').count()>0);
  await fs.mkdir('../../outputs',{recursive:true});await page.screenshot({path:'../../outputs/velvet-city-search-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'../../outputs/velvet-city-search-mobile.png',fullPage:true});
  // The local report is not a reservation and cannot set provider-confirmed status.
  const report=await context.request.post('http://127.0.0.1:18789/restaurant-bookings/report',{headers:{Origin:'http://127.0.0.1:4181'},data:{restaurantId:'curated-STO-brasserie-astoria',date:'2026-10-19',time:'17:00',party:2,reference:'LOCAL-TEST-ONLY',status:'provider_confirmed'}});
  assert.equal(report.status(),200);assert.equal((await report.json()).booking.status,'guest_reported');
  const history=await context.request.get('http://127.0.0.1:18789/restaurant-bookings');assert.equal((await history.json()).bookings.length,1);
  const stranger=await browser.newContext();assert.equal((await stranger.request.get('http://127.0.0.1:18789/restaurant-bookings')).status(),401);await stranger.close();
  assert.deepEqual(errors,[]);console.log('PASS integrated real availability search desktop/mobile; local-only guest report HTTP status/ownership. No reservation sent.');
}finally{await browser?.close();api.kill();server.kill();}
