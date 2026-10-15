import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const source=await fs.readFile(new URL('../js/bokabord-mirror.js',import.meta.url));
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/mirror.js'?'text/javascript':'text/html');res.end(req.url==='/mirror.js'?source:'<div id="mirror" style="width:420px"></div>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
try {
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
 const png=await page.screenshot({type:'png'});
 await page.evaluate(async image=>{
   const {mountBokabordMirror}=await import('/mirror.js');
   const bytes=Uint8Array.from(atob(image),c=>c.charCodeAt(0));
   const imageHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
   const fields=['firstname','lastname'].map((name,i)=>({name,value:'',rect:{x:0,y:i*45,width:200,height:35}}));
   let revision=0;window.calls=[];window.release=null;
   mountBokabordMirror(document.querySelector('#mirror'),async(path,opts)=>{
     const action=JSON.parse(opts?.body||'{}');
     if(action.type==='fill') {
       window.calls.push(action);
       await new Promise(resolve=>{window.release=resolve;});
       if(window.failNext){window.failNext=false;return {error:'connection'};}
       for(const [name,value] of Object.entries(action.fields)) fields.find(f=>f.name===name).value=value;
     }
     return {id:'test',restaurantId:'curated-STO-zink-italian-cuisine',revision:++revision,image:'data:image/png;base64,'+image,imageHash,fields:structuredClone(fields),width:1280,height:720,text:'Contact',contact:true,canSubmit:true,mode:'prepare'};
   });
 },png.toString('base64'));
 await page.locator('[data-start]').click();
 const first=page.locator('[data-provider-field="firstname"]'),last=page.locator('[data-provider-field="lastname"]');
 await first.fill('G');await page.waitForFunction(()=>window.calls.length===1);
 assert.equal(await first.isEnabled(),true);
 await first.fill('Gabriel');await last.fill('Test');
 assert.equal(await page.locator('[data-submit]').isDisabled(),true);
 await page.evaluate(()=>window.release());await page.waitForFunction(()=>window.calls.length===2);
 assert.equal(await last.inputValue(),'Test');assert.equal(await last.evaluate(e=>e===document.activeElement),true);
 assert.deepEqual(await page.evaluate(()=>window.calls[1].fields),{firstname:'Gabriel',lastname:'Test'});
 await page.evaluate(()=>window.release());await page.waitForFunction(()=>!document.querySelector('[data-submit]').disabled);
 assert.equal(await first.getAttribute('data-verified-value'),'Gabriel');assert.equal(await last.getAttribute('data-verified-value'),'Test');
 await first.fill('Retry');await page.waitForFunction(()=>window.calls.length===3);
 await page.evaluate(()=>{window.failNext=true;window.release();});
 await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('kunde inte'));
 assert.equal(await page.locator('[data-submit]').isDisabled(),true);
 assert.equal(await first.inputValue(),'Retry');
 console.log('PASS: typing stays enabled; latest edits and focus survive slow replies; unsynced or failed edits block submission.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
