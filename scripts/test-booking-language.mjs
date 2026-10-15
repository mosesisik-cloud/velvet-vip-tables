import assert from 'node:assert/strict';
import {bookingLanguage} from '../js/booking-language.js';
const sr=bookingLanguage({provider:'SevenRooms',url:'https://www.sevenrooms.com/reservations/nobu?date=2026-10-20'},'sv');
assert.equal(new URL(sr.url).searchParams.get('lang'),'sv');assert.equal(new URL(sr.url).searchParams.get('date'),'2026-10-20');assert.equal(sr.language,null);
for(const lang of ['sv','en','es','fr']) {
 const m=bookingLanguage({provider:'Meitre',url:'https://oro.meitre.com/'},lang);assert.equal(new URL(m.url).searchParams.get('mt_lang'),lang==='sv'?'en':lang);
 const tc=bookingLanguage({provider:'TableCheck',url:'https://www.tablecheck.com/en/regent-bali-canggu-sazon/reserve'},lang);assert.equal(new URL(tc.url).pathname.split('/')[1],lang==='sv'?'en':lang);
}
const unknown=bookingLanguage({provider:'Tock',url:'https://www.exploretock.com/test'},'fr');assert.equal(unknown.url,'https://www.exploretock.com/test');assert.equal(unknown.language,null);
console.log('PASS provider locale routing, venue identity/date preserved, explicit unsupported/unknown states');
