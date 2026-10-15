import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';import {fileURLToPath} from 'node:url';import {chromium} from 'playwright';
import {resolveReviewedRestaurantContact,restaurantContactPanel} from '../js/restaurant-contact.js';import {getBookingCopy} from '../js/booking-copy.js';
const id='curated-CRV-le-1947-a-cheval-blanc';const contact=resolveReviewedRestaurantContact(id);assert.ok(contact);assert.ok(Object.isFrozen(contact));
for(const bad of ['unknown','__proto__','curated-CRV-le-1947'])assert.equal(resolveReviewedRestaurantContact(bad),null);
for(const candidate of [{...contact,value:'other@chevalblanc.com'},{...contact,source:contact.source+'/other'},{...contact,value:contact.value+'?bcc=other@example.com'},{...contact,value:contact.value+'\r\nBcc: other@example.com'},{...contact,type:'phone'},{...contact,subject:'test'},{...contact,source:'javascript:alert(1)'}])assert.equal(resolveReviewedRestaurantContact(id,candidate),null);
assert.equal(restaurantContactPanel('unknown'),null);
const root=fileURLToPath(new URL('../',import.meta.url));
const server=http.createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://local').pathname);const file=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));if(!file.startsWith(root))throw Error('path');const bytes=await fs.readFile(file);res.writeHead(200,{'content-type':({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/`;const browser=await chromium.launch();
try{for(const lang of ['sv','en','es','fr'])for(const width of [390,1365]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});await context.addInitScript(lang=>localStorage.setItem('velvet_lang',lang),lang);
 await context.route('**/*',r=>{const req=r.request(),u=new URL(req.url());return u.origin===new URL(base).origin&&['GET','HEAD'].includes(req.method())?r.continue():r.abort();});
 const page=await context.newPage();await page.goto(base+'#/restaurant/'+id+'?date=2026-12-20&time=19%3A30&party=2',{waitUntil:'domcontentloaded'});
 const panel=page.locator('.restaurant-contact-status');await panel.waitFor({timeout:15000});const text=await panel.innerText(),copy=getBookingCopy(lang);
 for(const message of [copy.requestNotice,copy.requestUnknownPolicy,copy.manualPaymentUnknown,copy.manualEmail])assert.ok(text.includes(message),lang+': '+message);
 assert.equal(await page.locator('#restaurant-booking-heading').innerText(),copy.requestHeading);
 assert.equal(await panel.locator('a[href^="mailto:"]').getAttribute('href'),'mailto:'+contact.value);
 assert.equal(await panel.locator('a[target="_blank"]').getAttribute('href'),contact.source);
 assert.equal(await page.locator('#restaurant-book-form,#restaurant-provider-booking,iframe,#restaurant-webbridge-search,.booking-selection-summary').count(),0);
 assert.equal(await panel.locator('input,select,form,button').count(),0);
 assert.doesNotMatch(text,/24.?72/);assert.ok(!new URL(await panel.locator('a[href^="mailto:"]').getAttribute('href')).search);
 await page.evaluate(()=>{document.querySelector('a[href^="mailto:"]').addEventListener('click',event=>{event.preventDefault();window.preventedEmailClick=true;});});
 await panel.locator('a[href^="mailto:"]').click();assert.equal(await page.evaluate(()=>window.preventedEmailClick),true);assert.equal(await page.locator('.restaurant-contact-status').count(),1);
 await context.close();
}console.log('PASS Le1947 exact manual contact guards and actual app route in4 languages × desktop/mobile. No guest form, slot selector, iframe, confirmation or external email/network action.');}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
