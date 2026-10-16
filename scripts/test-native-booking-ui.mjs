import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const source=await fs.readFile(new URL('../js/bokabord-mirror.js',import.meta.url));
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/module.js'?'text/javascript':'text/html');res.end(req.url==='/module.js'?source:'<html><meta name="viewport" content="width=device-width"><body><div id="booking"></div></body></html>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try {
  browser=await chromium.launch({headless:true});
  for(const width of [390,1366]) {
    const page=await browser.newPage({viewport:{width,height:768}});
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(async()=>{
      const {mountBokabordMirror}=await import('/module.js');
      const canvas=document.createElement('canvas');canvas.width=420;canvas.height=760;
      const image=canvas.toDataURL('image/png'),bytes=Uint8Array.from(atob(image.split(',')[1]),c=>c.charCodeAt(0));
      const imageHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
      const snapshot={id:'fixture-id',revision:1,width:420,height:760,image,imageHash,review:true,canSubmit:true,mode:'prepare',fields:[],text:'OFFLINE TEST'};
      window.calls=[];
      mountBokabordMirror(document.querySelector('#booking'),async(path,options)=>{
        const body=JSON.parse(options.body||'{}');window.calls.push({path,type:body.type});
        if(body.type==='submit')throw new Error('lost_reply');
        if(path.endsWith('/current'))return {...snapshot,canSubmit:false,result:{status:'unknown'}};
        return snapshot;
      });
    });
    await page.locator('[data-start]').click();await page.locator('[data-terms]').check();
    await page.locator('[data-submit]').click();
    assert.equal(await page.locator('[data-submit]').isHidden(),true);
    assert.equal(await page.locator('[data-close]').isDisabled(),true);
    await page.locator('[data-refresh]').click();
    await page.waitForFunction(()=>document.querySelector('[data-status]').dataset.bookingStatus==='unknown');
    assert.equal(await page.locator('[data-submit]').isHidden(),true);
    assert.equal((await page.evaluate(()=>window.calls)).filter(c=>c.type==='submit').length,1);
    const bounds=await page.locator('#booking').boundingBox();assert(bounds.width<=420);
    const nav=await page.locator('.booking-navigation').boundingBox();assert(nav.y+nav.height<768);
    await page.close();
    console.log(`PASS native mirror ${width}px: timeout locks submit; current-only recovery; compact viewport`);
  }
} finally {await browser?.close();await new Promise(r=>server.close(r));}
