// Opt-in read-only original-provider rendering. No controls are clicked or filled.
import fs from 'node:fs';
import {external200Routes} from '../js/external200-routes-data.js';
if(!process.argv.includes('--live')) { console.log('Use --live for read-only provider page rendering. Offline checks: node scripts/external200-validate.mjs'); process.exit(0); }
const {chromium}=await import('playwright');
const registry=Object.fromEntries(Object.entries(external200Routes).filter(([,row])=>row.externalUrl).map(([id,row])=>[id,{url:row.externalUrl}]));
const browser=await chromium.launch({headless:true});const results=[];
try {
 for(const [restaurantId,row] of Object.entries(registry))for(const [mode,width,height] of [['desktop',1365,900],['mobile',390,844]]) {
  const context=await browser.newContext({viewport:{width,height},isMobile:mode==='mobile',hasTouch:mode==='mobile',serviceWorkers:'block'});
  const blockedWrites=[];
  await context.route('**/*',route=>{
   const request=route.request();
   if(['GET','HEAD'].includes(request.method()))return route.continue();
   const url=new URL(request.url());blockedWrites.push({method:request.method(),destination:url.origin+url.pathname});
   return route.abort();
  });
  try {const page=await context.newPage();const response=await page.goto(row.url,{waitUntil:'domcontentloaded',timeout:20000});await page.waitForTimeout(2500);
   results.push({restaurantId,mode,url:page.url(),httpStatus:response?.status(),title:await page.title(),bodyText:await page.locator('body').innerText(),blockedWrites,meaning:'Rendering only, with non-GET/HEAD requests blocked across context including popups; service workers disabled. Blocked requests may impair rendering. Not availability, embedded flow or reservation confirmation.'});
  }catch(e){results.push({restaurantId,mode,error:e.message,blockedWrites});}finally{await context.close();}
 }
}finally{await browser.close();}
fs.mkdirSync(new URL('../work/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../work/external200-browser-rerun.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2)+'\n');
console.log(`Recorded ${results.length} read-only renders in work/external200-browser-rerun.json. Review results manually; no automatic success claim.`);
