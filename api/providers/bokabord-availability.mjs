import fs from 'node:fs';
import { BookingAssetCache } from '../booking-asset-cache.mjs';
import { allowedRequest, providerReady } from '../bokabord-mirror.mjs';
const registryDefault=JSON.parse(fs.readFileSync(new URL('../bokabord-restaurants.json',import.meta.url),'utf8'));
const validTime=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
export function selectBookableTimes(rows,targetTime){
 return [...new Set(rows.filter(r=>r.bookable===true&&validTime(r.time)&&Math.abs(minutes(r.time)-minutes(targetTime))<=90).map(r=>r.time))].sort();
}
export function safeBokabordRegistry(row){try{const u=new URL(row.url);return u.origin==='https://app.bokabord.se'&&!u.username&&!u.password&&!u.hash&&u.pathname==='/reservation/'&&/^[a-f0-9]{20,64}$/.test(row.hash)&&u.searchParams.get('hash')===row.hash;}catch{return false;}}
/** Public UI only. Never clicks a time, creates a hold, enters contact or submits. */
export function allowedAvailabilityRequest(method,address){
 if(!allowedRequest(method,address))return false;
 const url=new URL(address);
 if(url.pathname.includes('/api/'))return ['GET','HEAD','POST'].includes(method)&&/^\/(booking-widget|reservation)\/api\/(?:booking\/)?(?:getTimes|getProducts|getCalendar|getDates|getOffDays|getMeals|getSettings|getAvailability)$/.test(url.pathname);
 return ['GET','HEAD'].includes(method);
}
export class BokabordAvailability {
 constructor({registry=registryDefault,browserFactory,maxConcurrent=2,maxQueued=8,timeoutMs=20000,queueTimeoutMs=Math.min(15000,timeoutMs),assetCache}={}){this.registry=registry;this.assets=assetCache||new BookingAssetCache();this.queueTimeoutMs=Math.max(1000,Math.min(15000,queueTimeoutMs));this.browserFactory=browserFactory||(()=>import('playwright').then(({chromium})=>chromium.launch({headless:true})));this.browserPromise=null;this.active=0;this.queue=[];this.maxConcurrent=Math.max(1,Math.min(2,maxConcurrent));this.maxQueued=Math.max(0,Math.min(24,maxQueued));this.timeoutMs=Math.max(1000,Math.min(28000,timeoutMs));}
 async browser(){return this.browserPromise ||= this.browserFactory().catch(e=>{this.browserPromise=null;throw e;});}
 async acquire(deadline,signal){
  if(signal?.aborted)throw Error('aborted');
  if(this.active<this.maxConcurrent){this.active++;return;}
  if(this.queue.length>=this.maxQueued)throw Error('busy');
  await new Promise((resolve,reject)=>{
   let timer;const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
   const remove=()=>{const i=this.queue.indexOf(entry);if(i>=0)this.queue.splice(i,1);};
   const abort=()=>{remove();cleanup();reject(Error('aborted'));};
   const entry={resolve:()=>{cleanup();resolve();}};
   timer=setTimeout(()=>{remove();cleanup();reject(Error('deadline'));},Math.max(1,deadline-Date.now()));
   this.queue.push(entry);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  });
 }
 release(){const next=this.queue.shift();if(next)next.resolve();else this.active--;}
 async searchVenue(row,q){
  const id=row.restaurantId||row.placeId||row.id||Object.keys(this.registry).find(id=>this.registry[id].hash===row.hash || this.registry[id].url===row.url);
  const venue=this.registry[id];const base={restaurantId:id,restaurant:venue?.name||row.name,city:'Stockholm',provider:'BokaBord',slots:[],checkedAt:null};
  if(!venue||!safeBokabordRegistry(venue))return {...base,status:'unsupported'};
  const parsed=new Date(String(q.date)+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(q.date)||!Number.isFinite(+parsed)||parsed.toISOString().slice(0,10)!==q.date||!validTime(q.time)||!Number.isInteger(Number(q.party))||Number(q.party)<1||Number(q.party)>20)return {...base,status:'error'};
  let deadline=Date.now()+this.queueTimeoutMs;let context,acquired=false,timer,ended=false,abortListener;const times=new Set();let checkedMeals=0,totalMeals=0,blockedMutation=false;
  try{await this.acquire(deadline,q.signal);acquired=true;if(q.signal?.aborted)throw Error('aborted');if(Date.now()>=deadline)throw Error('deadline');deadline=Date.now()+this.timeoutMs;
   const inspect=async()=>{
    const browser=await this.browser();if(ended||q.signal?.aborted)throw Error('deadline');context=await browser.newContext({viewport:{width:420,height:900},locale:'sv-SE',timezoneId:'Europe/Stockholm',serviceWorkers:'block',acceptDownloads:false});if(ended||q.signal?.aborted){await context.close();throw Error('deadline');}
    await context.route('**/*',r=>{const request=r.request();if(!allowedAvailabilityRequest(request.method(),request.url())){if(/saveBooking|payment|checkout|confirm|temp.*booking/i.test(new URL(request.url()).pathname))blockedMutation=true;return r.abort();}return this.assets.handle(r);});
    const page=await context.newPage();page.on?.('response',response=>{this.assets.capture(response).catch(()=>{});});page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(10000);
    await page.goto(venue.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(providerReady,null,{timeout:6000});
    const meals=await page.locator('.meal-attrs h3:visible').allTextContents();if(!meals.length||meals.length>40)throw Error('unsupported_meals');totalMeals=meals.length;const prefer=Number(q.time.slice(0,2))>=16?/middag|dinner|set menu/i:/lunch|brunch/i;meals.sort((a,b)=>Number(prefer.test(b))-Number(prefer.test(a)));
    for(let index=0;index<meals.length;index++){try{
     if(index){
      // The public back control preserves the original page and its loaded assets.
      // Never synthesize provider scope changes or navigate a guessed endpoint.
      for(let back=0;back<4&&!await page.locator('.meal-attrs h3:visible').count();back++){
       const control=page.locator('a.go-back-btn:visible');if(!await control.count())break;
       await control.first().click();await page.waitForFunction(providerReady,null,{timeout:6000});
       await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      }
      if(!await page.locator('.meal-attrs h3:visible').count()){await page.goto(venue.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(providerReady,null,{timeout:6000});}
     }
     await page.locator('.meal-attrs').getByRole('heading',{name:meals[index].trim(),exact:true}).click();
     const amount=page.locator('li[ng-click="selectAmount(amount)"]').filter({hasText:new RegExp('^\\s*'+Number(q.party)+'\\s')});
     await amount.first().waitFor();await amount.first().click();await page.waitForFunction(providerReady,null,{timeout:6000});
     const month=new Intl.DateTimeFormat('sv-SE',{month:'long',year:'numeric',timeZone:'UTC'}).format(parsed);
     const calendar=page.locator('.ConsumerCalendar-month').filter({has:page.locator('.ConsumerCalendar-monthHeading').filter({hasText:month})});
     if(!await calendar.count())throw Error('calendar_outside_loaded_range');
     const day=calendar.first().locator('.ConsumerCalendar-day:not(.is-out-of-month)').filter({hasText:new RegExp('^\\s*'+Number(q.date.slice(-2))+'\\s*$')});
     if(!await day.count())throw Error('day_missing');
     if(await day.first().evaluate(e=>e.classList.contains('is-disabled'))){checkedMeals++;continue;}
     await day.first().click();await page.waitForFunction(providerReady,null,{timeout:6000});
     await page.locator('.TimesList').first().waitFor();
     const rows=await page.locator('.TimesList-item').evaluateAll(elements=>elements.map(e=>({time:e.querySelector('.TimesList-itemTime')?.textContent.trim(),bookable:!e.classList.contains('not-available')&&[...e.querySelectorAll('a.book')].some(a=>a.getClientRects().length&&/^Boka$/i.test(a.textContent.trim()))})));
     for(const time of selectBookableTimes(rows,q.time))times.add(time);checkedMeals++;
     // Search needs a real bookable option, not an exhaustive meal catalogue.
     // Stop once found and disclose partial coverage of remaining meals.
     if(times.size)return;
    }catch(error){if(ended||q.signal?.aborted||blockedMutation||Date.now()>=deadline)throw error;}}
   };
   const cancelled=new Promise((_,reject)=>{abortListener=()=>{ended=true;context?.close().catch(()=>{});reject(Error('aborted'));};q.signal?.addEventListener('abort',abortListener,{once:true});if(q.signal?.aborted)abortListener();});
   await Promise.race([cancelled,inspect(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('deadline')),Math.max(1,deadline-Date.now()));})]);
   if(blockedMutation)throw Error('mutation_required');
   return {...base,status:times.size?'available':checkedMeals===totalMeals?'unavailable':'error',partial:checkedMeals<totalMeals,slots:[...times].sort().map(time=>({time,bookingUrl:venue.url})),checkedAt:new Date().toISOString()};
  }catch(error){return {...base,status:times.size&&!blockedMutation?'available':error.message==='unsupported_meals'?'unsupported':'error',slots:blockedMutation?[]:[...times].sort().map(time=>({time,bookingUrl:venue.url})),partial:checkedMeals<totalMeals,checkedAt:new Date().toISOString()};}
  finally{ended=true;q.signal?.removeEventListener('abort',abortListener);clearTimeout(timer);await context?.close().catch(()=>{});if(acquired)this.release();}
 }
 async close(){const browser=await this.browserPromise?.catch(()=>null);await browser?.close();this.browserPromise=null;}
}
