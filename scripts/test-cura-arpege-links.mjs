import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolveEmbeddedBooking,mountEmbeddedBooking} from '../js/restaurant-booking-providers.js';
const registry=JSON.parse(await fs.readFile(new URL('../data/booking-providers.json',import.meta.url)));
const curaId='curated-LIS-cura', arpegeId='curated-PAR-arpege';
const cura=registry[curaId], arpege=registry[arpegeId];
const resolve=(id,row)=>resolveEmbeddedBooking({[id]:row},id);
for(const id of [curaId,arpegeId]) {
  const row=registry[id];
  assert.equal(resolveEmbeddedBooking(registry,id)?.url,row.url);
  assert.equal(row.integrationMode,'external_link');
  assert.equal(row.liveAvailabilitySupported,false);
  assert.equal(row.completionTracking,'unsupported');
  assert.equal(row.paymentRequirement,undefined);
  assert.equal(resolve(id,{...row,integrationMode:'native_embed'}),null);
}
for(const patch of [
  {url:cura.url+'?rid=355611'}, {url:cura.url+'#reservation'},
  {url:cura.url.replace('fourseasons.com','fourseasons.com.evil.test')},
  {url:cura.url.replace('/cura/','/varanda/')},
  {url:cura.url.replace('/lisbon/','/paris/')},
  {url:cura.url.slice(0,-1)},
  {source:'https://www.fourseasons.com/'},
  {venueKey:'www.fourseasons.com/lisbon/dining/restaurants/varanda/'},
  {provider:'OpenTable'}, {verification:'provider_page_loaded'},
  {liveAvailabilitySupported:true}, {completionTracking:'supported'},
]) assert.equal(resolve(curaId,{...cura,...patch}),null,JSON.stringify(patch));
assert.equal(resolve('curated-LIS-other',cura),null);
for(const patch of [
  {url:arpege.url.replace('354036','999')},
  {url:arpege.url.replace('zenchef.com','zenchef.com.evil.test')},
  {url:arpege.url.replace('/results','/other')},
  {source:'http://www.alain-passard.com/'},
]) assert.equal(resolve(arpegeId,{...arpege,...patch}),null);
assert.equal(arpege.cancellationPolicy.source,arpege.url);
assert.equal(arpege.cancellationPolicy.checkedAt,'2026-10-16');
assert.match(arpege.cancellationPolicy.summary,/48 timmar/);
assert.match(arpege.cancellationPolicy.summary,/inte verifierats/);
assert.equal(cura.cancellationPolicyStatus,'unknown');
assert.equal(cura.cancellationPolicy,undefined);
const before=globalThis.document;
globalThis.document={createElement(tag){return {tag};}};
try {
  for(const row of [cura,arpege]) {
    const container={replaceChildren(...children){this.children=children;}};
    mountEmbeddedBooking(container,row,'sv');
    assert.ok(!container.children.some(e=>e.tag==='iframe'));
    const link=container.children.find(e=>e.tag==='a');
    assert.equal(link.href,row.url);
    assert.match(link.textContent,/Kontrollera tider/);
    assert.doesNotMatch(container.children.map(e=>e.textContent).join(' '),/bokningen är bekräftad/i);
  }
} finally {globalThis.document=before;}
assert.ok(Object.keys(registry).length>=134);
console.log('PASS: CURA exact wrapper guards, Arpege identity/policy and external-only shells; no network');
