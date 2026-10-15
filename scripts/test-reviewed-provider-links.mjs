import assert from 'node:assert/strict';import fs from 'node:fs';
import {resolveEmbeddedBooking} from '../js/restaurant-booking-providers.js';
import {bookingLanguage} from '../js/booking-language.js';
import {AvailabilitySearch} from '../api/availability-search.mjs';
const registry=JSON.parse(fs.readFileSync(new URL('../data/booking-providers.json',import.meta.url)));
const ids=['osm-PAR-bigbang','curated-MCO-pavyllon-monte-carlo'];
for(const id of ids){
 const row=registry[id];const resolve=change=>resolveEmbeddedBooking({[id]:{...row,...change}},id);
 assert.equal(resolve({}).url,row.url);assert.equal(resolve({}).integrationMode,'external_link');
 const u=new URL(row.url);const changes=[{provider:'Other'},{source:row.source+'?redirect=evil'},{source:'https://evil.test/'},{venueKey:row.venueKey+'/other'},{integrationMode:'native_embed'},{verification:'embedded_form_loaded'},{liveAvailabilitySupported:true},{completionTracking:'supported'}];
 for(const url of [row.url+'&redirect=https://evil.test',row.url+'&lang=fr',row.url.split('?')[0],row.url.replace('https:','http:'),row.url.replace(u.hostname,u.hostname+'.evil.test'),row.url.replace('https://','https://user@'),row.url.replace(u.hostname,u.hostname+':443'),row.url+'#fragment',row.url.replace(u.pathname,u.pathname+'/'),row.url.replace(u.pathname,'/aaaaaaaaaaaaaaaaaaaaaaaa')])changes.push({url});
 for(const change of changes)assert.equal(resolve(change),null,`${id}: reject ${JSON.stringify(change)}`);
 assert.equal(resolveEmbeddedBooking({other:row},'other'),null,'copied venue cannot bind another restaurant');
 assert.equal(resolveEmbeddedBooking(Object.create({[id]:row}),id),null);
 for(const lang of ['sv','en','es','fr']){
  const localized=bookingLanguage({...resolve({}),restaurantId:id},lang);
  if(row.provider==='JoinOko'){assert.equal(localized.url,row.url);assert.equal(localized.notice,'languageUnknown');}
  else {const result=new URL(localized.url);assert.equal(result.searchParams.get('venues'),u.searchParams.get('venues'));assert.deepEqual(result.searchParams.getAll('lang'),[lang]);assert.equal(localized.notice,'languageVenueDependent');}
 }
 let calls=0;const search=new AvailabilitySearch({registry,restaurants:{},fetcher:async()=>{calls++;throw Error('forbidden')},adapters:{[row.provider]:async()=>{calls++;throw Error('forbidden')}}});
 assert.equal((await search.venue(id,row,{date:'2026-10-18',time:'19:00',party:2})).status,'unsupported');assert.equal(calls,0);
}
const id=ids[1],row=registry[id];for(const query of ['venues=legrill,pavyllonyannickalleno,bluebay,lelouisxvalainducasse','venues=pavyllonyannickalleno','venues=pavyllonyannickalleno,legrill,bluebay,lelouisxvalainducasse&venues=pavyllonyannickalleno','venues=pavyllonyannickalleno,legrill,bluebay,lelouisxvalainducasse&lang=en'])assert.equal(resolveEmbeddedBooking({[id]:{...row,url:row.url.split('?')[0]+'?'+query}},id),null);
assert.equal(resolveEmbeddedBooking({[id]:{...row,venueId:'legrill'}},id),null);
const join=registry[ids[0]];for(const query of ['lang=en','lang=','Lang=fr','lang=fr&lang=fr'])assert.equal(resolveEmbeddedBooking({[ids[0]]:{...join,url:join.url.split('?')[0]+'?'+query}},ids[0]),null);
const other=Object.entries(registry).find(([id,r])=>r.provider==='SevenRooms'&&r.integrationMode==='external_link'&&id!==ids[1]);assert.equal(resolveEmbeddedBooking({[other[0]]:{...other[1],url:other[1].url+'?venues=anything'}},other[0]),null);
assert.equal(Object.keys(registry).length,128);assert.equal(Object.values(registry).filter(r=>r.integrationMode==='native_embed').length,64);assert.equal(Object.values(registry).filter(r=>r.integrationMode==='external_link').length,64);
console.log('PASS exact reviewed JoinOko/Pavyllon links, hostile URLs/source/identity/query, language preservation and disabled upstream inventory;128 mappings.');
