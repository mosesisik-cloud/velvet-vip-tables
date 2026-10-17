import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const source=await fs.readFile(new URL('../js/provider-preparation.js',import.meta.url));
const server=http.createServer((req,res)=>{
  res.setHeader('Content-Type',req.url==='/module.js'?'text/javascript':'text/html');
  res.end(req.url==='/module.js'?source:'<meta name="viewport" content="width=device-width"><div id="view"></div>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
try{
  for(const width of [390,1366]){
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    await page.goto(origin);
    await page.evaluate(async()=>{
      const {mountProviderPreparation}=await import('/module.js');window.calls=[];window.forge=false;
      const state={id:'local-ui-session',provider:'TableCheck',restaurantId:'osm-BAL-sazon',revision:0,
        mode:'prepare',preparation:true,operatorOnly:true,liveBooking:false,canHold:false,canSubmit:false,result:null,image:null,state:'search',
        terms:{menu:{name:'Dinner',description:'<img src=x onerror="window.injected=true">',count:1,price:null},terms:{notice:'Provider text'},guestRequirements:{phone:'required'}}};
      window.component=mountProviderPreparation(document.querySelector('#view'),async(path,options)=>{
        const body=JSON.parse(options.body||'{}');window.calls.push({path,method:options.method,body});
        if(options.method==='DELETE')return {ok:true};
        if(body.type==='search'){state.state='availability_observed';state.availabilityEvidence={status:'invalid_menu_items',slots:[]};}
        return {...state,revision:++state.revision,...(window.forge?{liveBooking:true,canSubmit:true}: {})};
      },{provider:'TableCheck',restaurantId:'osm-BAL-sazon'});
    });
    await page.locator('[data-prep-start]').click();
    await page.locator('[data-prep-search]').waitFor({state:'visible'});
    assert((await page.locator('[data-prep-policy]').innerText()).includes('Pris anges inte'));
    assert.equal(await page.locator('[data-prep-policy] img').count(),0);
    assert.equal(await page.evaluate(()=>window.injected),undefined);
    assert.equal(await page.locator('input[name=email],input[name=phone],[data-submit],[data-hold]').count(),0);
    await page.locator('input[name=date]').fill('2030-01-15');
    await page.locator('[data-prep-search] button').click();
    await page.waitForFunction(()=>document.querySelector('[data-prep-status]').textContent.includes('accepterade inte'));
    assert.equal(await page.locator('[data-prep-slot]').count(),0);
    assert.equal(await page.locator('[data-prep-review]').isVisible(),false);
    assert.deepEqual(await page.evaluate(()=>window.calls[1].body),{type:'search',date:'2030-01-15',party:2,revision:1});
    await page.evaluate(()=>window.forge=true);await page.locator('[data-prep-refresh]').click();
    await page.waitForFunction(()=>document.querySelector('[data-prep-status]').textContent.includes('kunde inte verifieras'));
    assert.equal(await page.locator('[data-prep-slot]').count(),0);
    await page.locator('[data-prep-end]').click();await page.locator('[data-prep-start]').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>window.calls.some(c=>['cart','submit','hold','checkout'].includes(c.body.type))),false);
    await page.evaluate(()=>window.component.destroy());await page.close();
    console.log(`PASS operator preparation UI ${width}: negative search, no mutations, text-only policy, forged capability rejected`);
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
