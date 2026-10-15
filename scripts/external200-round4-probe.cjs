// Read-only original-page display probe. Never fills, clicks, searches or submits.
const fs = require('node:fs');
if (!process.argv.includes('--live')) { console.log('Use --live for guarded GET/HEAD page rendering; no controls are used.'); process.exit(0); }
fs.mkdirSync('work', {recursive:true});
const {chromium} = require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const results=[];
  for (const [name,url] of [['pummarola','https://www.pummarola.us/reservations'],['bonito','https://www.sevenrooms.com/reservations/bonitostbarth'],['eddys','https://eddysghetto.com/']]) {
    for (const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
      const blocked=[];
      const context=await browser.newContext({viewport,serviceWorkers:'block'});
      await context.route('**/*',route=>{
        const r=route.request();
        if(!['GET','HEAD'].includes(r.method())){
          const u=new URL(r.url()); blocked.push({method:r.method(),url:u.origin+u.pathname});
          return route.abort();
        }
        return route.continue();
      });
      const page=await context.newPage();
      try {
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
        await page.waitForTimeout(5000);
        const screenshot=`work/external200-round4-${name}-${device}.png`;
        await page.screenshot({path:screenshot,fullPage:true});
        results.push({name,device,viewport,requestedUrl:url,url:page.url(),title:await page.title(),text:await page.locator('body').innerText(),fields:await page.locator('input,select,textarea').evaluateAll(es=>es.map(e=>({tag:e.tagName,type:e.type,name:e.name,checked:e.checked,placeholder:e.placeholder,visible:!!(e.offsetWidth||e.offsetHeight)}))),iframes:page.frames().map(f=>{const u=new URL(f.url());return u.origin+u.pathname;}),blocked,screenshot});
      } catch(e) { results.push({name,device,error:e.message,blocked}); }
      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync('work/external200-round4-safeprobe.json',JSON.stringify({checkedAt:new Date().toISOString(),guard:'GET/HEAD only; service workers blocked; no interactions',results},null,2)+'\n');
  console.log(JSON.stringify(results.map(r=>({name:r.name,device:r.device,url:r.url,error:r.error,screenshot:r.screenshot,blocked:r.blocked.length}))));
})().catch(e=>{console.error(e);process.exitCode=1});
