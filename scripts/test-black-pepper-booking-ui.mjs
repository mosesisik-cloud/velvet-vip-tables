// Real Velvet route, local static files only; never opens the provider link.
// Reuses test-booking-providers-ui.mjs routing/DOM checks and inspect-den.cjs guards.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getBookingCopy,formatBookingCopy} from '../js/booking-copy.js';
const {chromium}=await import(process.env.VELVET_PLAYWRIGHT_MODULE || 'playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const id='curated-HVA-black-pepper-hvar';
const expected='https://www.i-host.gr/Reservations/New?restaurant=1767&channel=website&lang=eng';
const registry=JSON.parse(await fs.readFile(path.join(root,'data/booking-providers.json'),'utf8'));
assert.equal(registry[id]?.url,expected,'Requires reviewed Black Pepper runtime (PR148)');
assert.equal(registry[id].integrationMode,'external_link');
assert.equal(registry[id].liveAvailabilitySupported,false);
assert.equal(registry[id].completionTracking,'unsupported');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
let browser;
const results=[];
const served=[];
const server=http.createServer(async(req,res)=>{
  served.push({method:req.method,url:req.url});
  try {
    assert.equal(req.method,'GET');
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const relative=pathname==='/'?'index.html':pathname.slice(1);
    assert.ok(!relative.split('/').some(x=>x.startsWith('.')));
    assert.ok(!relative.startsWith('api/')&&!relative.startsWith('node_modules/'));
    const file=path.resolve(root,relative);
    assert.ok(file.startsWith(root));
    const body=await fs.readFile(file);
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(body);
  }catch {res.writeHead(404);res.end();}
});
try {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.VELVET_CHROME_EXECUTABLE?{executablePath:process.env.VELVET_CHROME_EXECUTABLE}:{})});
  for(const [mode,width,height] of [['desktop',1365,900],['mobile',390,844]])for(const language of ['sv','en','es','fr']){
    const context=await browser.newContext({viewport:{width,height},isMobile:mode==='mobile',hasTouch:mode==='mobile',serviceWorkers:'block',acceptDownloads:false});
    const blocked=[];
    const allowed=[];
    const sockets=[];
    await context.route('**/*',route=>{
      const request=route.request(),url=new URL(request.url());
      const entry={method:request.method(),origin:url.origin,path:url.pathname};
      if(request.method()!=='GET'||url.origin!==origin||url.pathname.includes('/velvet-api/')||url.pathname.startsWith('/api/')){
        blocked.push(entry);return route.abort('blockedbyclient');
      }
      allowed.push(entry);return route.continue();
    });
    await context.routeWebSocket('**/*',socket=>{sockets.push(new URL(socket.url()).origin);socket.close();});
    await context.addInitScript(lang=>localStorage.setItem('velvet_lang',lang),language);
    const page=await context.newPage();
    try {
      // Incoming selection context must not change the exact i-host URL.
      await page.goto(origin+'/#/restaurant/'+id+'?date=2027-06-15&time=19%3A00&party=2',{waitUntil:'domcontentloaded'});
      const panel=page.locator('#restaurant-provider-booking');
      const link=panel.locator('a');
      await link.waitFor({state:'visible',timeout:15000});
      assert.equal(await page.locator('#restaurant-booking-panel').getAttribute('data-restaurant-id'),id);
      assert.equal(await page.locator('#restaurant-booking-panel > .eyebrow').innerText(),'Black Pepper Hvar');
      assert.equal(await link.count(),1);
      assert.equal(await link.getAttribute('href'),expected);
      assert.equal(await link.getAttribute('target'),'_blank');
      assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
      const copy=getBookingCopy(language);
      assert.equal(await link.innerText(),formatBookingCopy(copy.externalLink,{provider:'i-host',name:registry[id].name}));
      assert.equal(await panel.locator('.booking-intro').innerText(),formatBookingCopy(copy.externalIntro,{provider:'i-host',name:registry[id].name}));
      assert.equal(await panel.locator('iframe,input,select,button').count(),0);
      assert.equal(await page.locator('iframe[src*="i-host"]').count(),0);
      await link.scrollIntoViewIfNeeded();
      assert.ok(await link.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;}),'Link fits viewport');
      assert.equal(context.pages().length,1,'Provider link was not followed');
      assert.equal(context.serviceWorkers().length,0);
      assert.ok(allowed.every(r=>r.origin===origin&&r.method==='GET'));
      assert.ok(!blocked.some(r=>r.origin==='https://www.i-host.gr'),'External link must not auto-load provider');
      results.push({mode,language,passed:true,allowedRequests:allowed.length,blockedRequests:blocked,blockedSockets:sockets});
    }finally {await context.close();}
  }
  assert.ok(served.every(r=>r.method==='GET'));
  console.log(JSON.stringify({status:'PASS',browser:browser.version(),scope:'8 real-browser local Velvet route scenarios; no provider requests allowed, link not clicked, no live availability/booking/publication claim',results},null,2));
}finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
