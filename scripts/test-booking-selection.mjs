import assert from 'node:assert/strict';
import {parseBookingSelection,withBookingSelection} from '../js/booking-selection.js';
const q=parseBookingSelection('date=2026-10-19&time=17%3A00&party=4&url=https://evil.example');assert.deepEqual(q,{date:'2026-10-19',time:'17:00',party:4});
for(const invalid of ['date=2026-02-30&time=17:00&party=4','date=2026-10-19&time=25:00&party=4','date=2026-10-19&time=17:00&party=0'])assert.equal(parseBookingSelection(invalid),null);
const b={provider:'SevenRooms',url:'https://www.sevenrooms.com/explore/example/reservations/create/search'};
const result=withBookingSelection(b,q);assert.equal(new URL(result.url).hostname,'www.sevenrooms.com');assert.equal(new URL(result.url).searchParams.get('start_time'),'17:00');assert.equal(new URL(result.url).searchParams.get('date'),'2026-10-19');assert.equal(b.url.includes('?'),false);
assert.equal(withBookingSelection(null,q),null);assert.equal(withBookingSelection({provider:'SevenRooms',url:'https://evil.example'},q).url,'https://evil.example');
console.log('PASS selection validates values, keeps provider destination, preserves immutable source and handles absent mappings.');
