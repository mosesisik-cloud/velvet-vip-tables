import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { BokabordMirror } from '../api/bokabord-mirror.mjs';
const browser=await chromium.launch(), mirror=new BokabordMirror();
try {
 const page=await browser.newPage();
 await page.setContent('<body><div id="ajaxloader" style="display:none">Loading...</div></body>');
 await page.evaluate(()=>{
   window.ajax=false;window.started=false;
   const scope={isAjaxRequest(){
     if(!window.started){window.started=true;requestAnimationFrame(()=>{
       window.ajax=true;document.querySelector('#ajaxloader').style.display='block';
       setTimeout(()=>{window.ajax=false;document.querySelector('#ajaxloader').style.display='none';window.completed=true;},150);
     });}
     return window.ajax;
   }};
   window.angular={element:()=>({scope:()=>scope,injector:()=>({get:name=>name==='$http'?{pendingRequests:[]} : {$$phase:false}})})};
 });
 await mirror.settle({page});
 assert.equal(await page.evaluate(()=>window.completed===true),true);
 assert.equal(await page.locator('#ajaxloader').isVisible(),false);
 await page.evaluate(()=>{
   document.body.insertAdjacentHTML('beforeend','<input class="phoneField" type="tel">');
   setTimeout(()=>{
     const input=document.querySelector('.phoneField'),wrapper=document.createElement('div');
     wrapper.className='intl-tel-input';input.before(wrapper);wrapper.append(input);
   },150);
 });
 await mirror.settle({page});
 assert.equal(await page.locator('.intl-tel-input input.phoneField').count(),1);
 console.log('PASS: contact waits for delayed phone initialization.');
 console.log('PASS: delayed provider AJAX outside Angular is complete before snapshot.');
}finally{await browser.close();await mirror.close();}
