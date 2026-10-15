import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep))throw Error();const body=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(4197,'127.0.0.1',r));
const browser=await chromium.launch();
try {
 for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 const calls=[];
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin==='http://127.0.0.1:4197')return route.continue();if(u.pathname.includes('/velvet-api/')){calls.push(u.pathname);return route.fulfill({status:u.pathname.endsWith('/auth/session')?401:200,contentType:'application/json',body:JSON.stringify({error:'auth',oauth:{},tables:[],promoters:[]})});}return route.abort();});
 await context.addInitScript(()=>localStorage.setItem('velvet_lang','sv'));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const hash of ['#/','#/destinations','#/destination/STO','#/restaurants','#/restaurant/curated-STO-brasserie-astoria','#/venues','#/venue/IBZ-001','#/availability','#/favorites','#/account']){
 await page.goto('http://127.0.0.1:4197/'+hash,{waitUntil:'domcontentloaded'});await page.locator('#view h1').first().waitFor();
 assert.equal(await page.locator('#onboarding-root [role=dialog]').count(),0,hash);
 assert.equal(await page.locator('[data-auth-passkey],[data-auth-provider]').count(),0,hash);
 }
 await page.getByRole('link',{name:'Fortsätt utforska utan konto',exact:true}).click();await page.getByRole('link',{name:'Utforska utan konto',exact:true}).waitFor();
 await page.goto('http://127.0.0.1:4197/#/venue/IBZ-001');await page.locator('details').filter({has:page.locator('#d-book')}).locator('summary').click();await page.locator('#d-book').click();await page.locator('#m-date').waitFor();assert.equal(await page.locator('#onboarding-root [role=dialog]').count(),0);
 assert.equal(calls.filter(p=>p.includes('/auth/')&&!p.endsWith('/session')).length,0);
 assert.deepEqual(errors,[]);console.log('PASS guest discovery and booking options at',width);await context.close();
 }
}finally{await browser.close();server.closeAllConnections();server.close();}
