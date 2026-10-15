import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {getBookingCopy,requestBookingNotes} from '../js/booking-copy.js';
const request={restaurantId:'request',name:'Request <script>bad()</script>',city:'Stockholm',provider:'SevenRooms',url:'https://www.sevenrooms.com/reservations/example',bookingMode:'request_only',responseTimeHours:{min:24,max:72},paymentRequirement:'card_guarantee',cancellationPolicyStatus:'unknown'};
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://local').pathname;if(path==='/')return res.setHeader('Content-Type','text/html').end('<meta name="viewport" content="width=device-width,initial-scale=1"><main></main>');if(!/^\/js\/[a-z-]+\.js$/.test(path))return res.writeHead(404).end();res.setHeader('Content-Type','application/javascript');res.end(await readFile(new URL('..'+path,import.meta.url)));}catch{res.writeHead(500).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
try{for(const lang of ['sv','en','es','fr']){
 const copy=getBookingCopy(lang);assert.equal(requestBookingNotes({...request,responseTimeHours:undefined},lang).length,3);assert.equal(requestBookingNotes({...request,responseTimeHours:{min:72,max:24}},lang).length,3);
 for(const mode of ['native_embed','external_link']){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1' && r.request().method()==='GET'?r.continue():r.abort());
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.evaluate(async({request,lang,mode})=>{const{mountEmbeddedBooking}=await import('/js/restaurant-booking-providers.js');mountEmbeddedBooking(document.querySelector('main'),{...request,integrationMode:mode},lang);},{request,lang,mode});
 const notice=page.locator('.booking-request-notice');for(const text of requestBookingNotes(request,lang))assert.ok((await notice.innerText()).includes(text));assert.match(await notice.innerText(),/24–72/);
 assert.equal(await page.locator('main script').count(),0);
 const order=await page.evaluate(()=>{const n=document.querySelector('.booking-request-notice'),cta=document.querySelector('.btn');return !!(n.compareDocumentPosition(cta)&Node.DOCUMENT_POSITION_FOLLOWING)});assert.ok(order,'Notice before action');
 if(mode==='native_embed'){
 await page.getByRole('button',{name:copy.requestOpen,exact:true}).click();
 await page.evaluate(()=>{document.querySelector('iframe').dispatchEvent(new Event('load'));window.postMessage({status:'confirmed',bookingId:'untrusted'},'*');});
 assert.equal(await page.locator('.booking-intro').innerText(),copy.requestHeading);assert.ok(await notice.isVisible());assert.equal(await page.locator('[role=status]').innerText(),'');
 }else{assert.equal(await page.locator('a.btn').textContent(),copy.requestOpen+' ↗');assert.equal(await page.locator('iframe').count(),0);}
 await page.close();
 }
 const page=await browser.newPage();await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname==='/availability')return r.fulfill({json:{complete:true,results:[{...request,restaurant:request.name,status:'request_only',slots:[{time:'19:00'}]},{restaurantId:'real',restaurant:'Real slot',status:'available',slots:[{time:'19:30'}]}]}});return u.hostname==='127.0.0.1'?r.continue():r.abort()});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.evaluate(async lang=>{const{mountAvailabilitySearch}=await import('/js/availability-search.js');mountAvailabilitySearch(document.querySelector('main'),{restaurants:[{city:'Stockholm'}],initialCity:'Stockholm',lang});},lang);await page.locator('button[type=submit]').click();await page.locator('.availability-slot').waitFor();assert.equal(await page.locator('.availability-slot').count(),1);await page.locator('summary').click();const rest=await page.locator('.availability-other').innerText();for(const text of requestBookingNotes(request,lang))assert.ok(rest.includes(text));assert.ok(rest.includes(copy.requestOpen));assert.equal(await page.locator('.availability-results script').count(),0);await page.close();
}console.log('PASS request-only: 8 native/external localized shells before and after load, 4 mixed availability results, no false slots/confirmation, malformed windows omitted; no external network allowed.');}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
