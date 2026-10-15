import { chromium } from 'playwright';
import fs from 'node:fs';
const official = 'https://www.disfrutarbarcelona.com/bookings';
const provider = 'https://www.covermanager.com/reservation/module_restaurant/resaurante-disfrutar/english';
// Opt-in initial-page inspection only. No interactions or inventory requests.
// Unknown navigations, all fetch/XHR, non-GET traffic and sockets fail closed.
fs.mkdirSync('work', {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const results=[];
try {
  for(const viewport of [{width:1365,height:900},{width:390,height:844}]) {
    const context=await browser.newContext({viewport,serviceWorkers:'block'});
    const blocked=[];
    await context.route('**/*',route=>{
      const r=route.request(),u=new URL(r.url());
      const document=['document'].includes(r.resourceType()) && [official,provider].includes(r.url());
      const asset=['script','stylesheet','image','font'].includes(r.resourceType()) && /\.(?:js|css|png|jpg|jpeg|webp|gif|svg|woff2?|ttf|ico)$/i.test(u.pathname) && ['www.disfrutarbarcelona.com','www.covermanager.com','ajax.googleapis.com','cdnjs.cloudflare.com','code.jquery.com','maxcdn.bootstrapcdn.com'].includes(u.hostname);
      if(r.method()==='GET' && (document||asset)) return route.continue();
      blocked.push({method:r.method(),type:r.resourceType(),host:u.hostname,path:u.pathname});
      return route.abort();
    });
    await context.routeWebSocket('**/*',ws=>ws.close());
    const page=await context.newPage();
    await page.goto(official,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(3000);
    const frames=[];
    for(const frame of page.frames()) frames.push({url:frame.url(),text:(await frame.locator('body').innerText()).slice(0,10000)});
    await page.screenshot({path:`work/disfrutar-${viewport.width}.png`,fullPage:true});
    results.push({viewport,frames,blocked});
    await context.close();
  }
}finally{await browser.close();}
fs.writeFileSync('work/disfrutar-browser-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
