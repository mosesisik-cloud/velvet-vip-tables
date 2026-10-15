import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';
import {external200Routes} from '../js/external200-routes-data.js';
import {resolveEmbeddedBooking} from '../js/restaurant-booking-providers.js';
const root=path.resolve('.');
const registry=JSON.parse(await fs.readFile('data/booking-providers.json'));
const server=http.createServer(async(req,res)=>{
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const body=await fs.readFile(file);res.setHeader('content-type',({'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
const results=[];
try {
 for(const [mode,width,height] of [['desktop',1365,900],['mobile',390,844]]) {
  const context=await browser.newContext({viewport:{width,height},isMobile:mode==='mobile',hasTouch:mode==='mobile',serviceWorkers:'block'});
  let writes=0;
  await context.route('**/*',route=>{const r=route.request();if(!['GET','HEAD'].includes(r.method()))writes++;return new URL(r.url()).origin===base&&r.method()==='GET'?route.continue():route.abort();});
  await context.addInitScript(()=>{if(!localStorage.getItem('velvet_lang'))localStorage.setItem('velvet_lang','sv');});
  const page=await context.newPage();
  // Exercise the real application route for every ID as an unsigned guest.
  for(const id of Object.keys(external200Routes)) {
   await page.goto(base+'/#/restaurant/'+id,{waitUntil:'domcontentloaded'});
   const panel=page.locator(`#restaurant-booking-panel[data-restaurant-id="${id}"]`);await panel.waitFor({timeout:15000});
   assert.equal(await panel.locator('#restaurant-book-form').count(),0,id+' synthetic request form');
   if(resolveEmbeddedBooking(registry,id)){
    assert.equal(await panel.locator('.external200-booking-status').count(),0,id+' provider replaced');
    assert.equal(await panel.locator('#restaurant-provider-booking').count(),1,id+' missing provider');
   }else if(id==='osm-SBH-shellona'){
    assert.equal(await panel.locator('.restaurant-closed-notice').count(),1);
    assert.equal(await page.locator('#restaurant-book-jump').count(),0);
   }else{
    assert.equal(await panel.locator('.external200-booking-status').count(),1,id);
    assert.equal(await panel.locator('form,iframe').count(),0,id);
   }
   results.push({restaurantId:id,mode,guestShell:'passed',providerPageTested:false});
  }
  // Locale changes use the application's existing language state.
  for(const [lang,word] of [['en','verified booking route'],['es','vía de reserva'],['fr','réservation vérifié']]){
   await page.evaluate(l=>localStorage.setItem('velvet_lang',l),lang);
   await page.goto(base+'/?external200locale='+lang+'#/restaurant/osm-SBH-laventura');
   await page.locator('.external200-booking-status').waitFor();
   assert.ok((await page.locator('.external200-booking-status').innerText()).includes(word));
  }
  assert.equal(writes,0,'Guest rendering attempted a network write');
  await context.close();
 }
 await fs.writeFile('data/external200-guest-shell-tests.json',JSON.stringify({checkedAt:new Date().toISOString(),meaning:'Local guest shell only; all external requests blocked. No provider inventory or confirmation claim.',results},null,2)+'\n');
 console.log(`PASS ${results.length} actual guest routes: 200 IDs desktop/mobile, provider priority, no synthetic submission, locale checks, no network writes.`);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
