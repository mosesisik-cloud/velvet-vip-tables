import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolveEmbeddedBooking} from '../js/restaurant-booking-providers.js';
const registry = JSON.parse(await fs.readFile(new URL('../data/booking-providers.json',import.meta.url)));
const hartwoodId = 'curated-TUL-hartwood';
const scorpiosId = 'curated-MYK-scorpios-mykonos';
const row = registry[hartwoodId];
const resolve = (id,value) => resolveEmbeddedBooking({[id]:value},id);
for (const id of [hartwoodId,scorpiosId]) {
  assert.equal(resolveEmbeddedBooking(registry,id)?.url,registry[id].url);
  assert.equal(registry[id].integrationMode,'external_link');
  assert.equal(registry[id].verification,'official_link_only');
  assert.equal(registry[id].liveAvailabilitySupported,false);
  assert.equal(registry[id].completionTracking,'unsupported');
  assert.equal(registry[id].paymentRequirement,undefined);
}
assert.deepEqual(row.responseTimeHours,{max:24});
assert.equal(row.bookingMode,'request_only');
assert.equal(row.cancellationPolicyStatus,'unknown');
assert.equal(row.cancellationPolicy,undefined);
for (const patch of [
  {url:row.url+'?form=other'},
  {url:row.url+'#other'},
  {url:row.url.replace('hartwoodtulum.com','hartwoodtulum.com.evil.example')},
  {url:'https://form.typeform.com/to/f6JtAUPI'},
  {url:row.url+'/'},
  {source:'https://example.com/'},
  {source:row.source+'?source=other'},
  {venueId:'f6jtaupi'},
  {venueKey:'form.typeform.com/to/f6JtAUPI'},
  {provider:'Restaurant website'},
  {integrationMode:'native_embed',verification:'embedded_form_loaded'},
  {bookingMode:'instant'},
  {bookingMode:undefined},
  {responseTimeHours:{min:0,max:24}},
  {responseTimeHours:{max:72}},
  {responseTimeHours:undefined},
  {cancellationPolicyStatus:'verified'},
  {verification:'provider_page_loaded'},
  {liveAvailabilitySupported:true},
  {completionTracking:'supported'},
]) assert.equal(resolve(hartwoodId,{...row,...patch}),null,JSON.stringify(patch));
assert.equal(resolve('different-restaurant',row),null);
assert.equal(resolve('__proto__',row),null);
const scorpios=registry[scorpiosId];
for (const url of [scorpios.url+'?venues=other',scorpios.url.replace('restaurant','beach'),scorpios.url.replace('sevenrooms.com','sevenrooms.com.evil.example')]) {
  assert.equal(resolve(scorpiosId,{...scorpios,url}),null);
}
assert.ok(Object.keys(registry).length>=132);
console.log('PASS: Scorpios external route and Hartwood exact request-only wrapper, metadata/identity tamper guards (no network)');
