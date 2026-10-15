import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {getBookingCopy,formatBookingCopy,requestBookingNotes} from '../js/booking-copy.js';
const base={bookingMode:'request_only',paymentRequirement:'not_specified',cancellationPolicyStatus:'unknown'};
for(const lang of ['sv','en','es','fr']){
 const copy=getBookingCopy(lang);const notes=hours=>requestBookingNotes({...base,responseTimeHours:hours},lang);
 assert.deepEqual(notes({max:24}),[copy.requestNotice,formatBookingCopy(copy.requestWindowMax,{max:24}),copy.manualPaymentUnknown,copy.requestUnknownPolicy]);
 for(const hours of [{min:24,max:72},{min:0,max:24},{min:24,max:24}])assert.ok(notes(hours).includes(formatBookingCopy(copy.requestWindow,hours)));
 for(const hours of [undefined,null,{}, {max:0},{min:0,max:0},{max:-1},{max:Infinity},{max:NaN},{max:1.5},{max:'24'},{max:Number.MAX_SAFE_INTEGER+1},{min:-1,max:24},{min:72,max:24},{min:null,max:24},{min:undefined,max:24},{min:0.5,max:24},{min:'0',max:24}])assert.deepEqual(notes(hours),[copy.requestNotice,copy.manualPaymentUnknown,copy.requestUnknownPolicy]);
 const card=requestBookingNotes({...base,responseTimeHours:{max:24},paymentRequirement:'card_guarantee'},lang);assert.ok(card.includes(copy.requestCard));assert.ok(!card.includes(copy.manualPaymentUnknown));
}
const browser=await chromium.launch();
try{for(const lang of ['sv','en','es','fr']){
 const page=await browser.newPage();
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!=='http://contract.test'||route.request().method()!=='GET')return route.abort();if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<main></main>'});if(!/^\/js\/[a-z-]+\.js$/.test(u.pathname))return route.abort();return route.fulfill({contentType:'application/javascript',body:await readFile(new URL('..'+u.pathname,import.meta.url),'utf8')});});
 await page.goto('http://contract.test/');
 await page.evaluate(async({lang,base})=>{const{mountEmbeddedBooking}=await import('/js/restaurant-booking-providers.js');mountEmbeddedBooking(document.querySelector('main'),{...base,provider:'Restaurant website',name:'Mock request',url:'https://example.invalid/request',integrationMode:'external_link',responseTimeHours:{max:24}},lang);},{lang,base});
 const copy=getBookingCopy(lang);const text=await page.locator('.booking-request-notice').innerText();
 for(const expected of [copy.requestNotice,formatBookingCopy(copy.requestWindowMax,{max:24}),copy.manualPaymentUnknown,copy.requestUnknownPolicy])assert.ok(text.includes(expected));
 assert.doesNotMatch(text,/0–24|24–24|24–72/);assert.equal(await page.locator('iframe,form,input').count(),0);assert.equal(await page.locator('a.btn').textContent(),copy.requestOpen+' ↗');await page.close();
}console.log('PASS max-only request window:4 languages rendered, min/max preserved, invalid/zero maxima omitted, unknown payment/cancellation explicit; no external network.');}finally{await browser.close();}
