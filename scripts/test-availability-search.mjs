import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {availabilityCities} from '../js/availability-search.js';
assert.deepEqual(availabilityCities({destinations:{a:{destination:'Stockholm'},b:{destination:'Ibiza'}}}),['Ibiza','Stockholm']);
const server=createServer(async(req,res)=>{try {
 if(req.url==='/') {res.setHeader('Content-Type','text/html');res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/app.css"><link rel="stylesheet" href="/css/availability-search.css"><main></main><script type="module">import {mountAvailabilitySearch} from '/js/availability-search.js'; window.ui=mountAvailabilitySearch(document.querySelector('main'),{restaurants:[{city:'Stockholm'},{city:'Ibiza'}]});</script>`);return;}
 const path=req.url.split('?')[0];if(!['/js/availability-search.js','/css/availability-search.css','/css/app.css'].includes(path)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',path.endsWith('.js')?'application/javascript':'text/css');res.end(await readFile(new URL('..'+path,import.meta.url)));
 }catch{res.writeHead(500).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});let calls=[];let mode='mixed';
 await page.route('**/availability?**',async route=>{
  calls.push(new URL(route.request().url()));
  if(mode==='slow'){await new Promise(resolve=>setTimeout(resolve,600));}
  if(mode==='error')return route.fulfill({status:503,body:'Unavailable'});
  await route.fulfill({json:{checkedAt:new Date().toISOString(),results:[{restaurantId:'good',restaurant:'Test <script>bad()</script>',city:'Stockholm',provider:'SevenRooms',status:'available',slots:[{time:'19:00',bookingUrl:'https://www.sevenrooms.com/reservations/example'},{time:'19:30',bookingUrl:'javascript:alert(1)'}]},{restaurantId:'closed',restaurant:'No tables',status:'unavailable',slots:[{time:'20:00'}]},{restaurantId:'unknown',restaurant:'Unsupported restaurant',status:'unsupported',slots:[]},{restaurantId:'error',restaurant:'Error restaurant',status:'error',slots:[]}]}});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 assert.equal(calls.length,0);
 await page.getByLabel('Destination',{exact:true}).selectOption('Stockholm');
 await page.getByRole('button',{name:'Sök lediga bord'}).click();
 await page.getByText('1 restaurang har lediga tider',{exact:false}).waitFor();
 assert.equal(calls[0].searchParams.get('city'),'Stockholm');assert.equal(calls[0].searchParams.get('party'),'2');
 assert.equal(await page.locator('.availability-slot').count(),2);
 assert.equal(await page.locator('.availability-slot').nth(1).getAttribute('href'),'#/restaurant/good');
 assert.equal(await page.locator('.availability-results script').count(),0);
 assert.equal(await page.locator('.availability-card h2').textContent(),'Test <script>bad()</script>');
 await page.locator('summary').click();
 await page.getByText('Kan inte kontrolleras här ännu').waitFor();
 await page.getByText('Kunde inte hämta tider').waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 mode='slow';await page.getByRole('button',{name:'Sök lediga bord'}).click();await page.getByLabel('Destination',{exact:true}).selectOption('Ibiza');
 await page.waitForTimeout(750);assert.equal(await page.locator('.availability-slot').count(),0);
 await page.getByText('Sök för att visa tider för ditt nya val.').waitFor();
 mode='error';await page.getByRole('button',{name:'Sök lediga bord'}).click();await page.getByText('Det gick inte att hämta lediga tider just nu. Försök igen.').waitFor();
 mode='slow';await page.getByRole('button',{name:'Sök lediga bord'}).click();await page.evaluate(()=>window.ui.destroy());await page.waitForTimeout(750);assert.equal(await page.locator('.availability-slot').count(),0);
 console.log('PASS availability UI: guest search, truthful mixed statuses, safe links/text, mobile width, stale abort, errors, unmount');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
