import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveEmbeddedBooking} from '../js/restaurant-booking-providers.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8').replace(/^\uFEFF/,''));
const manifest=read('data/external200-manifest.json');
assert.equal(manifest.records.length,200);assert.equal(new Set(manifest.records.map(r=>r.restaurantId)).size,200);
const statuses=new Set(['official_external_link','manual_phone','manual_email','manual_whatsapp','manual_message','walk_in','takeaway','closed','closed_reported','unresolved','unresolved_branch']);
let all=[];
for(let batch=1;batch<=10;batch++) {
 const suffix=String(batch).padStart(2,'0');const group=read(`data/external200-group${suffix}.json`);
 assert.equal(group.batch,batch);assert.equal(group.records.length,20);
 assert.deepEqual(group.records.map(r=>r.restaurantId).sort(),manifest.records.filter(r=>r.batch===batch).map(r=>r.restaurantId).sort());
 for(const row of group.records) {
  assert.ok(statuses.has(row.status),row.restaurantId+': unknown status '+row.status);
  assert.ok(['verified','unresolved'].includes(row.identity.status));
  assert.equal(row.checks.confirmedReservation,false,'No reservation was authorized');
  assert.equal(row.checks.simulatedValidation,false,'Offline registry tests are not a simulated guest booking');
  assert.ok(row.checks.desktop);assert.ok(row.checks.mobile);
  for(const key of ['officialExternalLink','embeddedOriginalForm','liveAvailability'])assert.equal(typeof row.checks[key],'boolean');
  assert.ok(Array.isArray(row.sources));assert.ok(Array.isArray(row.limitations));
  if(row.checks.officialExternalLink) {assert.equal(row.identity.status,'verified');assert.ok(row.bookingUrl?.startsWith('https://'));assert.ok(row.sources.some(s=>s.kind==='official'));}
  if(row.registryAddition) {assert.equal(row.identity.status,'verified');assert.ok(row.checks.officialExternalLink);assert.equal(row.registryAddition.integrationMode,'external_link'); assert.ok(resolveEmbeddedBooking({[row.restaurantId]:row.registryAddition},row.restaurantId),row.restaurantId+': existing resolver rejects addition');}
  if(['unresolved','unresolved_branch','closed','closed_reported','takeaway','walk_in'].includes(row.status))assert.equal(row.registryAddition,null);
 }
 const expected=Object.fromEntries(group.records.filter(r=>r.registryAddition).map(r=>[r.restaurantId,r.registryAddition]));
 assert.deepEqual(read(`data/external200-registry-group${suffix}.json`),expected);
 all.push(...group.records);
}
const registry=read('data/external200-registry-additions.json');
assert.deepEqual(registry,Object.fromEntries(all.filter(r=>r.registryAddition).map(r=>[r.restaurantId,r.registryAddition])));
for(const [id,row] of Object.entries(registry)) {
 for(const url of ['javascript:alert(1)',row.url.replace('https:','http:'),row.url.replace(new URL(row.url).hostname,new URL(row.url).hostname+'.evil.example'),row.url.replace(new URL(row.url).pathname,'/wrong-venue')])assert.equal(resolveEmbeddedBooking({[id]:{...row,url}},id),null,id+': reject unsafe/mismatched destination');
 assert.equal(resolveEmbeddedBooking(registry,'__proto__'),null);
 assert.equal(resolveEmbeddedBooking({[id]:{...row,integrationMode:'native_embed'}},id),null,id+': do not promote link to embedded form');
}
assert.equal(new Set(all.map(r=>r.restaurantId)).size,200);
console.log(`external200:10 groups /200 exact IDs /${Object.keys(registry).length} compatible external-link additions; scope, claims and destination safety passed`);
