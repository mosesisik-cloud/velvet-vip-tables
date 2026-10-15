import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {external200Routes} from '../js/external200-routes-data.js?v=190';
import {external200BookingPanel, external200ContactHref} from '../js/external200-booking.js';
import {getBookingCopy} from '../js/booking-copy.js';
import {resolveEmbeddedBooking} from '../js/restaurant-booking-providers.js';
import {compileExternal200Routes} from './external200-build-routes.mjs';
import {resolveExternal200ReviewedLink, resolveExternal200ReviewedContact} from '../js/external200-reviewed-links.js';
const manifest=JSON.parse(fs.readFileSync('data/external200-manifest.json'));
const registry=JSON.parse(fs.readFileSync('data/booking-providers.json'));
execFileSync(process.execPath,['scripts/external200-build-routes.mjs','--check']);
assert.deepEqual(Object.keys(external200Routes).sort(),manifest.records.map(r=>r.restaurantId).sort());
for(const lang of ['sv','en','es','fr']) for(const [id,row] of Object.entries(external200Routes)) {
  const html=external200BookingPanel(id,null,lang);
  assert.ok(html.includes('role="status"'),id);
  assert.doesNotMatch(html,/<(?:form|input|select|button|iframe)\b/i,id);
  assert.doesNotMatch(html,/undefined|null|javascript:|data:|onerror=/i,id);
  if(['closed','closed_reported','walk_in','takeaway','unresolved_branch'].includes(row.status)) assert.ok(!html.includes('btn-gold'),id);
  const provider=resolveEmbeddedBooking(registry,id);
  if(provider) assert.equal(external200BookingPanel(id,provider,lang),null,id+' must retain provider and terms');
  // Even a future, newly reviewed provider must supersede the historical fallback.
  assert.equal(external200BookingPanel(id,{integrationMode:'external_link',bookingMode:'request_only'},lang),null);
}
assert.equal(external200BookingPanel('curated-STO-zink-italian-cuisine',null,'sv'),null);
assert.equal(external200BookingPanel('__proto__',null),null);
assert.equal(external200BookingPanel('constructor',null),null);
for(const value of ['test@example.com?subject=Injected','x@example.com\r\nBcc:y@example.com','javascript:alert(1)','<img src=x onerror=1>']) assert.equal(external200ContactHref({type:'email',value}),null);
for(const value of ['+1234','+123456789?text=x','123456789','+123456789;phone-context=evil']) assert.equal(external200ContactHref({type:'phone',value}),null);
assert.equal(external200ContactHref({type:'phone',value:'+905322578252'}),'tel:+905322578252');
assert.equal(external200ContactHref({type:'whatsapp',value:'+628113700916'}),'https://wa.me/628113700916');
assert.equal(external200ContactHref({type:'email',value:'reservations@example.com'}),'mailto:reservations@example.com');
const decisions=Array.from({length:10},(_,i)=>JSON.parse(fs.readFileSync(`data/external200-group${String(i+1).padStart(2,'0')}.json`)).records).flat();
const compiled=compileExternal200Routes(decisions,manifest);
for(const lang of ['sv','en','es','fr']) {
  const id='osm-MIA-pummarola-coral-gable';
  const saved=external200Routes[id];
  try {
    external200Routes[id]={...saved,bookingMode:'instant',selection:{branch:'Wrong branch'}};
    const html=external200BookingPanel(id,null,lang);
    assert.ok(html.includes('Coral Gables') && html.includes('Dine-In Reservation'));
    assert.doesNotMatch(html,/Wrong branch/);
    const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    assert.ok(html.includes(escape(getBookingCopy(lang).requestNotice)), 'Request-only notice must survive altered audit mode');
    assert.ok(html.indexOf('external200-branch-instruction') < html.indexOf('btn btn-gold'), 'Branch instruction precedes CTA');
    assert.equal(resolveExternal200ReviewedLink(id,saved.source,saved.externalUrl).bookingMode,'request_only');
  } finally {external200Routes[id]=saved;}
}
for(const [id,row] of Object.entries(compiled).filter(([,r])=>r.externalUrl)) {
  const index=decisions.findIndex(r=>r.restaurantId===id);
  const pinned=resolveExternal200ReviewedLink(id,row.source,row.externalUrl);
  assert.ok(pinned,id);
  const wrongUrls=['https://unreviewed.example/reserve',row.externalUrl.replace('https:','http:'),'javascript:alert(1)',row.externalUrl+(row.externalUrl.includes('?')?'&':'?')+'venue=unreviewed',row.externalUrl.replace(new URL(row.externalUrl).hostname,new URL(row.externalUrl).hostname+'.evil.example')];
  for(const url of wrongUrls) {
    const tampered=structuredClone(decisions);tampered[index].bookingUrl=url;
    assert.throws(()=>compileExternal200Routes(tampered,manifest),/Unreviewed source\/destination binding/,id+' compiler accepted altered bookingUrl');
    assert.equal(resolveExternal200ReviewedLink(id,row.source,url),null,id);
    const saved=external200Routes[id];
    try {
      external200Routes[id]={...saved,externalUrl:url};
      const html=external200BookingPanel(id,null,'en');
      assert.doesNotMatch(html,/data-booking-status="external"/,id+' runtime accepted altered destination');
      assert.ok(!html.includes(url),id+' runtime emitted altered destination');
    } finally {external200Routes[id]=saved;}
  }
  const tampered=structuredClone(decisions);
  tampered[index].sources=tampered[index].sources.map(s=>s.url===row.source?{...s,url:'https://unreviewed.example/source'}:s);
  assert.throws(()=>compileExternal200Routes(tampered,manifest),/Unreviewed source\/destination binding/,id+' accepted unrelated official source');
  assert.equal(resolveExternal200ReviewedLink(id,'https://unreviewed.example/source',row.externalUrl),null);
  const saved=external200Routes[id];
  try {
    external200Routes[id]={...saved,source:'https://unreviewed.example/source'};
    const html=external200BookingPanel(id,null,'en');
    assert.doesNotMatch(html,/unreviewed\.example|data-booking-status="external"/);
  } finally {external200Routes[id]=saved;}
  // Keep exact membership while moving a destination to the wrong restaurant.
  const switched=structuredClone(decisions);const other=switched.find(r=>r.restaurantId!==id&&!r.checks.officialExternalLink);
  [switched[index].restaurantId,other.restaurantId]=[other.restaurantId,switched[index].restaurantId];
  assert.throws(()=>compileExternal200Routes(switched,manifest),/Unreviewed source\/destination binding/);
  assert.equal(resolveExternal200ReviewedLink('not-in-manifest',row.source,row.externalUrl),null);
}
for(const [id,row] of Object.entries(compiled)) {
  const saved=external200Routes[id];
  try {
    // Removing the URL must not turn an arbitrary source into trusted information.
    external200Routes[id]={...saved,externalUrl:null,source:'https://unreviewed.example/source'};
    assert.doesNotMatch(external200BookingPanel(id,null),/unreviewed\.example/);
    // A rejected external URL must not escape through a forged LINE contact.
    external200Routes[id]={...saved,externalUrl:'https://unreviewed.example/reserve',contact:{type:'line',value:'@test',source:'https://unreviewed.example/reserve'}};
    assert.doesNotMatch(external200BookingPanel(id,null),/unreviewed\.example/);
  } finally {external200Routes[id]=saved;}
  if(!row.contact)continue;
  assert.ok(resolveExternal200ReviewedContact(id,row.contact));
  const index=decisions.findIndex(r=>r.restaurantId===id);
  for(const change of [{source:'https://unreviewed.example/source'},{value:'attacker@example.com'},{type:'line',value:'@attacker',source:'https://unreviewed.example/source'}]) {
    const altered={...row.contact,...change};
    assert.equal(resolveExternal200ReviewedContact(id,altered),null);
    const tampered=structuredClone(decisions);
    tampered[index].contact={...altered,bookingExplicit:true};
    tampered[index].sources.push({kind:'official',url:altered.source});
    assert.throws(()=>compileExternal200Routes(tampered,manifest),/Unreviewed contact binding/);
    try {
      external200Routes[id]={...saved,externalUrl:null,contact:altered};
      const html=external200BookingPanel(id,null);
      assert.doesNotMatch(html,/unreviewed\.example|attacker@example\.com|@attacker/);
    } finally {external200Routes[id]=saved;}
  }
}
console.log('PASS external200: exact 200, four languages, provider precedence, no synthetic booking forms, safe manual links.');
console.log(`PASS independent exact source/destination bindings: all ${Object.values(compiled).filter(r=>r.externalUrl).length} links reject changed URL, source, ID, query, host and protocol in compiler and runtime.`);
console.log(`PASS all 200 reject combined source/URL/LINE mutations; all ${Object.values(compiled).filter(r=>r.contact).length} manual contacts are independently pinned to ID, type, value and source.`);
