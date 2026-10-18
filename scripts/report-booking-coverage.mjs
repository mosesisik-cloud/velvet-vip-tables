import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const work=path.dirname(root);
const output=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(root,'../../outputs/booking-coverage-audit.json');
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const catalogue=await read(path.join(root,'data/restaurants.json'));
const registry=await read(path.join(root,'data/booking-providers.json'));
const bokabord=await read(path.join(root,'api/bokabord-restaurants.json'));
const migration=await read(path.join(root,'work/catalog-duplicate-audit.json'));
const rows=Object.entries(catalogue.destinations).flatMap(([cityCode,d])=>d.restaurants.map(r=>({...r,cityCode,city:d.destination})));
assert.equal(rows.length,827);const byId=new Map(rows.map(r=>[r.placeId,r]));assert.equal(byId.size,827);
const normalize=s=>String(s||'').normalize('NFC').trim().toLowerCase();
const events=new Map();const sourceFiles=[];const missingWaves=[];const unmappedEvidence=[];
const discoveredWaves=(await fs.readdir(work)).map(name=>/^discovery-wave(\d+)-(?:decisions|results)\.json$/.exec(name)).filter(Boolean).map(match=>Number(match[1]));
for(let wave=2;wave<=Math.max(2,...discoveredWaves);wave++) {
 let file=path.join(work,`discovery-wave${wave}-decisions.json`),data;
 try{data=await read(file);}catch(error){if(error.code!=='ENOENT')throw error;file=path.join(work,`discovery-wave${wave}-results.json`);try{data=await read(file);}catch(error){if(error.code!=='ENOENT')throw error;missingWaves.push(wave);continue;}}
 sourceFiles.push({wave,file:path.basename(file),records:data.length});
 for(const evidence of data){const oldId=evidence.placeId||evidence.restaurantId;let id=byId.has(oldId)?oldId:null;
  if(!id){const candidates=migration.proposedRenames.filter(m=>m.oldId===oldId&&normalize(m.name)===normalize(evidence.name)&&(!evidence.cityCode||m.cityCode===evidence.cityCode));if(candidates.length===1&&byId.has(candidates[0].newId))id=candidates[0].newId;}
  if(!id){unmappedEvidence.push({wave,placeId:oldId,name:evidence.name,status:evidence.status,reason:'No unique current ID or exact migration name match'});continue;}
  const event={wave,sourceFile:path.basename(file),historicalId:oldId,status:evidence.status||'observed_unclassified',source:evidence.source||evidence.website||null,checkedAt:evidence.checkedAt||null,evidence:evidence.evidence||evidence.notes||null};
  if(!events.has(id))events.set(id,[]);events.get(id).push(event);
 }
}
const manual=new Set(['request_form','contact_request','email_phone_reservation_route','phone_only_confirmed','contact_booking','manual_confirmation_required','contact_only_observed','inquiry_form_only','email_reservation_observed','contact_only_successor_verified','manual_whatsapp','direct_telephone_only','inquiry_only_crossvenue_link_rejected','email_request_only_observed','duplicate_email_request_only_observed']);
const walkin=new Set(['walk_in_only']);
const categories=['integrated_native','integrated_external','integrated_bokabord','manual_request','walkin','closed','unresolved','unaudited'];
const conflicts=[];
const ledger=rows.map(r=>{const history=events.get(r.placeId)||[];const latest=history.at(-1);const provider=registry[r.placeId];const bb=bokabord[r.placeId];let category;
 if(r.operatingStatus==='permanently_closed'||r.operatingStatus==='seasonally_closed'||latest?.status==='permanently_closed'){category='closed';if(provider||bb)conflicts.push({id:r.placeId,reason:'Closed record still has registry mapping'});}
 else if(bb)category='integrated_bokabord';
 else if(provider?.integrationMode==='native_embed')category='integrated_native';
 else if(provider?.integrationMode==='external_link')category='integrated_external';
 else if(manual.has(latest?.status))category='manual_request';
 else if(walkin.has(latest?.status))category='walkin';
 else category=history.length?'unresolved':'unaudited';
 return {restaurantId:r.placeId,name:r.name,city:r.city,cityCode:r.cityCode,website:r.website||null,category,provider:bb?'Bokabord':provider?.provider||null,bookingUrl:bb?.url||provider?.url||null,latestStatus:latest?.status||null,evidence:history};});
for(const id of [...Object.keys(registry),...Object.keys(bokabord)])assert.ok(byId.has(id),'Orphaned registry '+id);
const counts=Object.fromEntries(categories.map(c=>[c,ledger.filter(r=>r.category===c).length]));assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),827);
const overlap=Object.keys(registry).filter(id=>bokabord[id]);
const candidates=new Map();
function group(key,reason,row){if(!key)return;if(!candidates.has(key))candidates.set(key,{reason,rows:[]});candidates.get(key).rows.push({id:row.restaurantId,name:row.name,city:row.city});}
for(const r of ledger){group('name:'+r.cityCode+':'+normalize(r.name),'same normalized name within city',r);if(r.website){try{const u=new URL(r.website);u.hash='';u.search='';group('website:'+r.cityCode+':'+u.origin+u.pathname.replace(/\/$/,''),'same website within city; may be different branches',r);}catch{}}
 if(r.bookingUrl){const u=new URL(r.bookingUrl);u.hash='';group('provider:'+u.href,'same exact provider destination; requires venue-identity review',r);}}
const duplicateVenueCandidates=[...candidates.values()].filter(g=>g.rows.length>1);
const duplicateVenueEvidence=ledger.filter(r=>r.latestStatus==='duplicate_email_request_only_observed').map(r=>({id:r.restaurantId,name:r.name,city:r.city,evidence:r.evidence.at(-1)}));
let published={status:'unknown',source:'https://b2b.bakemyday.se/velvet/data/booking-providers.json',verifiedLiveCount:null,scope:'generic registry only; public Bokabord registry not independently checked',liveBokabordCount:null,liveTotalCount:null,preparedRows:[]};
try{const response=await fetch(published.source,{signal:AbortSignal.timeout(10000),cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);const live=await response.json();if(!live||Array.isArray(live)||typeof live!=='object'||!Object.values(live).every(r=>r&&typeof r.provider==='string'&&typeof r.url==='string'))throw Error('Unexpected public registry');published={...published,status:'generic_registry_verified',checkedAt:new Date().toISOString(),verifiedLiveCount:Object.keys(live).length,preparedRows:Object.entries(registry).filter(([id,row])=>!live[id]||JSON.stringify(row)!==JSON.stringify(live[id])).map(([id,row])=>({id,provider:row.provider,change:live[id]?'changed':'new'})),liveOnlyIds:Object.keys(live).filter(id=>!registry[id])};}catch(error){published.error=error.message;}
const report={generatedAt:new Date().toISOString(),reportScope:'WORKSPACE, not published deployment',published,totalRows:827,uniqueIds:827,counts,registryCounts:{generic:Object.keys(registry).length,bokabord:Object.keys(bokabord).length,overlap},integratedRows:counts.integrated_native+counts.integrated_external+counts.integrated_bokabord,notIntegratedRows:827-counts.integrated_native-counts.integrated_external-counts.integrated_bokabord,scope:'Catalog records, not deduplicated real-world venues. Integration means registry routing, not tested completed booking or payment.',sourceFiles,missingWaves,unmappedEvidence,conflicts,duplicateVenueCandidates,duplicateVenueEvidence,rows:ledger};
assert.equal(report.integratedRows+report.notIntegratedRows,827);
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts,integrated:report.integratedRows,notIntegrated:report.notIntegratedRows,missingWaves,unmappedEvidence:unmappedEvidence.length,duplicateVenueCandidates:duplicateVenueCandidates.length,output},null,2));
