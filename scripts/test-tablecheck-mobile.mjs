import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const css=await fs.readFile(new URL('../css/app.css',import.meta.url),'utf8');
const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('https://www.tablecheck.com/**',route=>route.fulfill({contentType:'text/html',body:'<style>body{margin:0}.hint{margin-left:24px;width:345px}input{max-width:90%}</style><label>Email<input type="email"></label><div class="hint">Make sure your email is correct! Your booking confirmation will be sent here.</div>'}));
 await page.setContent(`<style>${css}</style><body class="light-shell"><section class="restaurant-detail" style="margin:20px"><aside class="detail-panel restaurant-book-panel"><div class="booking-cancellation-notice">Read cancellation terms before booking.</div><div class="booking-provider-stage"><iframe class="booking-provider-frame" src="https://www.tablecheck.com/en/test/reserve"></iframe></div></aside></section></body>`);
 const iframe=page.locator('iframe');await page.frameLocator('iframe').getByRole('textbox').waitFor();
 for(const width of [390,430]){await page.setViewportSize({width,height:844});assert.ok(await iframe.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));assert.ok(await page.frameLocator('iframe').locator('html').evaluate(e=>e.scrollWidth<=innerWidth+1));assert.ok(await page.locator('.booking-cancellation-notice').isVisible());}
 console.log('PASS TableCheck mobile provider/email-hint width at390/430; outer page and cancellation notice preserved');
}finally{await browser.close();}
