import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {AvailabilitySearch} from '../api/availability-search.mjs';
import {getBookingCopy,formatBookingCopy} from '../js/booking-copy.js';
const allRegistry=JSON.parse(await readFile(new URL('../data/booking-providers.json',import.meta.url),'utf8'));
const registry=Object.fromEntries(Object.entries(allRegistry).filter(([,row])=>row.bookingMode==='request_only'));
assert.ok(Object.keys(registry).length>=2,'Use real request-only registry entries');
const first=Object.values(registry)[0];
const restaurants={destinations:{TEST:{destination:first.city,restaurants:Object.entries(registry).map(([placeId,row])=>({placeId,name:row.name}))}}};
let providerRequests=0;
const forbidden=async()=>{providerRequests++;throw new Error('Request-only must never contact provider');};
const service=new AvailabilitySearch({registry,restaurants,fetcher:forbidden,adapters:{SevenRooms:forbidden}});
const date=new Date(Date.now()+86400000).toISOString().slice(0,10);
const query={city:first.city,date,time:'19:00',party:2};
const initial=structuredClone(service.start(query));
assert.equal(initial.complete,false);
let completed;
for(let i=0;i<100;i++){await new Promise(resolve=>setImmediate(resolve));completed=service.status(initial.searchId);if(completed.complete)break;}
assert.equal(completed.complete,true,'Real service finishes request-only job');
assert.equal(providerRequests,0);
// Never overlay registry metadata onto results. These are exact service payloads.
for(const [phase,data] of Object.entries({initial,completed}))for(const row of data.results){
 const expected=registry[row.restaurantId];
 assert.equal(row.status,'request_only');assert.deepEqual(row.slots,[]);
 for(const key of ['bookingMode','responseTimeHours','paymentRequirement','cancellationPolicyStatus'])assert.deepEqual(row[key],expected[key],`${phase}: ${row.restaurantId} preserves ${key}`);
}
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://local').pathname;if(path==='/')return res.setHeader('Content-Type','text/html').end('<main></main>');if(!/^\/js\/[a-z-]+\.js$/.test(path))return res.writeHead(404).end();res.setHeader('Content-Type','application/javascript');res.end(await readFile(new URL('..'+path,import.meta.url)));}catch{res.writeHead(500).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch();
try{for(const lang of ['sv','en','es','fr'])for(const [phase,data] of Object.entries({initial,completed})){
 const page=await browser.newPage();
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/availability')return route.fulfill({json:data});if(u.pathname.startsWith('/availability/jobs/'))return route.fulfill({json:data});return u.hostname==='127.0.0.1'&&route.request().method()==='GET'?route.continue():route.abort();});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.evaluate(async({lang,city,date})=>{location.hash='#/availability?'+new URLSearchParams({city,date,time:'19:00',party:'2'});const {mountAvailabilitySearch}=await import('/js/availability-search.js');window.ui=mountAvailabilitySearch(document.querySelector('main'),{restaurants:[{city}],initialCity:city,lang});},{lang,city:first.city,date});
 await page.locator('button[type=submit]').click();await page.locator('.availability-other li').first().waitFor();
 const copy=getBookingCopy(lang);
 for(const [id,expected] of Object.entries(registry)){
 const item=page.locator('.availability-other li').filter({has:page.locator(`a[href="#/restaurant/${encodeURIComponent(id)}"]`)});const text=await item.innerText();
 for(const required of [copy.requestNotice,copy.requestCard,copy.requestUnknownPolicy,formatBookingCopy(copy.requestWindow,expected.responseTimeHours)])assert.ok(text.includes(required),`${phase}/${lang}/${id}: missing ${required}`);
 assert.match(text,/24–72/);
 }
 assert.equal(await page.locator('.availability-slot').count(),0);assert.equal(await page.locator('.availability-card').count(),0);
 await page.evaluate(()=>window.ui.destroy());await page.close();
}assert.equal(providerRequests,0);console.log(`PASS real service-to-UI request contract: ${Object.keys(registry).length} registry venues, initial + complete snapshots, 4 languages, no instant slots or provider calls.`);}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
