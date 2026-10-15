import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {external200Routes} from '../js/external200-routes-data.js';
import {external200BookingPanel, external200ContactHref} from '../js/external200-booking.js';
import {resolveEmbeddedBooking} from '../js/restaurant-booking-providers.js';
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
console.log('PASS external200: exact 200, four languages, provider precedence, no synthetic booking forms, safe manual links.');
