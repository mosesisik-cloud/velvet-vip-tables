import assert from 'node:assert/strict';
import {tableCheckBookingLanguage as resolve} from '../js/booking-language-tablecheck.js';
const base='https://www.tablecheck.com/en/regent-bali-canggu-sazon/reserve/experiences?menu_lists=abc&utm_source=website#selection';
for(const language of ['en','es','fr']) {
 const result=resolve(base,language);assert.equal(result.language,language);assert.equal(result.fallback,false);
 const url=new URL(result.url);assert.equal(url.pathname,`/${language}/regent-bali-canggu-sazon/reserve/experiences`);
 assert.equal(url.search,'?menu_lists=abc&utm_source=website');assert.equal(url.hash,'#selection');
}
assert.equal(resolve(base,'sv').language,'en');assert.equal(resolve(base,'sv').fallback,true);
for(const url of ['https://www.tablecheck.com/shops/florilege/reserve','https://evil.example/en/venue/reserve','https://www.tablecheck.com.evil.example/en/venue/reserve','http://www.tablecheck.com/en/venue/reserve','https://secret@www.tablecheck.com/en/venue/reserve','https://www.tablecheck.com:444/en/venue/reserve','https://www.tablecheck.com/en/venue/checkout','invalid'])assert.equal(resolve(url,'fr'),null,url);
console.log('PASS TableCheck verified locale paths, explicit Swedish fallback, identity/query preservation and unsafe/unknown routes rejected');
