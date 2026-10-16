import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolveEmbeddedBooking, mountEmbeddedBooking} from '../js/restaurant-booking-providers.js';
import {bookingLanguage} from '../js/booking-language.js';

const id='curated-HVA-black-pepper-hvar';
const registry=JSON.parse(await fs.readFile(new URL('../data/booking-providers.json',import.meta.url)));
const row=registry[id];
const expectedUrl='https://www.i-host.gr/Reservations/New?restaurant=1767&channel=website&lang=eng';
assert.equal(row.url,expectedUrl);
assert.equal(row.source,'https://blackpepperhvar.com/');
const booking=resolveEmbeddedBooking(registry,id);
assert.ok(booking);
assert.equal(booking.integrationMode,'external_link');
assert.equal(booking.liveAvailabilitySupported,false);
assert.equal(booking.completionTracking,'unsupported');
const rejected=patch=>assert.equal(resolveEmbeddedBooking({[id]:{...row,...patch}},id),null,JSON.stringify(patch));
for(const url of [
 expectedUrl.replace('1767','1779'),
 expectedUrl.replace('restaurant=1767&',''),
 expectedUrl+'&restaurant=1779',
 expectedUrl+'&restaurant=1767',
 expectedUrl.replace('restaurant=1767','restaurant=%31%37%36%37'),
 expectedUrl.replace('&channel=website',''),
 expectedUrl.replace('&lang=eng',''),
 expectedUrl.replace('lang=eng','lang=sv'),
 expectedUrl.replace('channel=website','channel=other'),
 'https://www.i-host.gr/Reservations/New?channel=website&lang=eng&restaurant=1767',
 expectedUrl+'&date=2026-10-16',
 expectedUrl.replace('www.i-host.gr','www.i-host.gr.evil.example'),
 expectedUrl.replace('www.i-host.gr','i-host.gr'),
 expectedUrl.replace('/New?','/New/?'),
 expectedUrl.replace('/New?','/Cancel?'),
 expectedUrl.replace('https:','http:'),
 expectedUrl.replace('https://','https://user:password@'),
 expectedUrl.replace('.gr/','.gr:443/'),
 expectedUrl+'#confirmation'
]) rejected({url});
for(const source of ['https://example.invalid/','https://blackpepperhvar.com/?other=1','https://blackpepperhvar.com/#other','http://blackpepperhvar.com/'])rejected({source});
for(const patch of [
 {provider:'SevenRooms'},{provider:'Restaurant website'},{venueId:'1779'},
 {venueKey:'www.i-host.gr/Reservations/New?restaurant=1779'},
 {integrationMode:'native_embed'},{verification:'embedded_form_loaded'},
 {verification:'provider_page_loaded'},{liveAvailabilitySupported:true},
 {liveAvailabilitySupported:undefined},{completionTracking:'supported'},
 {completionTracking:undefined}
])rejected(patch);
for(const otherId of ['osm-HVA-black-pepper','curated-HVA-gariful','unknown']){
 assert.equal(resolveEmbeddedBooking({[otherId]:row},otherId),null);
}
for(const field of ['provider','source','url','venueId','venueKey','integrationMode','verification']){
 const missing={...row};delete missing[field];
 assert.equal(resolveEmbeddedBooking({[id]:missing},id),null,field);
}
// Minimal DOM boundary exercises the real existing renderer without browser/network.
const previousDocument=globalThis.document;
try {
 globalThis.document={createElement:tag=>({tag,textContent:'',className:''})};
 for(const language of ['sv','en','es','fr']){
  assert.equal(bookingLanguage(booking,language).url,expectedUrl);
  const container={replaceChildren(...children){this.children=children;}};
  mountEmbeddedBooking(container,booking,language);
  const links=container.children.filter(x=>x.tag==='a');
  assert.equal(links.length,1);
  assert.equal(links[0].href,expectedUrl);
  assert.equal(links[0].target,'_blank');
  assert.equal(links[0].rel,'noopener noreferrer');
  assert.equal(container.children.some(x=>['iframe','input','select','button'].includes(x.tag)),false);
 }
} finally {
 if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
}
console.log('PASS: Black Pepper exact venue/source/URL guards; external-only flags; duplicate/unknown IDs; four-language external renderer (mock DOM, no browser/provider calls)');

