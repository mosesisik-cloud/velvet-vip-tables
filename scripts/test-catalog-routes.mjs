import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const catalogue=JSON.parse(await fs.readFile(path.join(root,'data/restaurants.json'),'utf8'));
const registry=JSON.parse(await fs.readFile(path.join(root,'data/booking-providers.json'),'utf8'));
const rows=Object.values(catalogue.destinations).flatMap(d=>d.restaurants);
const migrated=rows.filter(r=>/^osm-[A-Z]{3}-u[0-9a-f]{12}$/.test(r.placeId));assert.equal(migrated.length,40);
for(const id of Object.keys(registry))assert.equal(rows.filter(r=>r.placeId===id).length,1,'provider identity '+id);
const server=http.createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));if(!file.startsWith(root+path.sep))throw Error('path');const data=await fs.readFile(file);res.writeHead(200,{'content-type':({'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch();const observed=[];
try{const context=await browser.newContext({serviceWorkers:'block'});await context.addInitScript(()=>localStorage.setItem('velvet_lang','sv'));
await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());if(!['GET','HEAD'].includes(request.method())||url.origin!==new URL(base).origin)return route.abort();

 return route.continue();});const page=await context.newPage();
let navigation=0;
async function heading(id){await page.goto(base+'?routeTest='+(++navigation)+'#/restaurant/'+id,{waitUntil:'domcontentloaded'});await page.locator('#view h1').first().waitFor({timeout:15000});return (await page.locator('#view h1').first().textContent()).trim();}
for(const row of migrated){const actual=await heading(row.placeId);assert.equal(actual,row.name,`${row.placeId} routed to wrong name ${actual}`);observed.push({id:row.placeId,name:row.name,status:'rendered'});}
for(const old of new Set(migrated.map(r=>r.placeId.split('-').slice(0,2).join('-')+'-'))){assert.equal(await heading(old),'Restaurangen hittades inte','Ambiguous legacy link '+old);assert.equal(new URL(page.url()).hash,'#/restaurant/'+old);}
for(const id of ['curated-STO-brasserie-astoria','osm-BAL-sazon'])assert.equal(await heading(id),rows.find(r=>r.placeId===id).name,'Existing provider route '+id);
const summary={actualRoutes:observed,actualRendered:observed.filter(r=>r.status==='rendered').length,legacyAmbiguousNotFound:6,providerRegistryUnique:Object.keys(registry).length,existingProviderRoutes:2};
console.log(JSON.stringify(summary,null,2));
console.log('PASS all40 actual catalog routes resolve exact names; six old IDs fail closed; existing provider routes intact; no catalog/provider fixtures');
}finally{await browser.close();await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}
