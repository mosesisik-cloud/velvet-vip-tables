import assert from 'node:assert/strict';
import {getBookingCopy, formatBookingCopy} from '../js/booking-copy.js';
const reference=getBookingCopy('en');
const keys=Object.keys(reference).sort();
const placeholders=s=>[...s.matchAll(/\{([a-zA-Z]+)\}/g)].map(m=>m[1]).sort();
for(const lang of ['sv','en','es','fr']) {
 const copy=getBookingCopy(lang); assert.deepEqual(Object.keys(copy).sort(),keys);
 assert.ok(Object.isFrozen(copy));
 for(const key of keys) {
  assert.equal(typeof copy[key],'string');assert.ok(copy[key].trim());
  assert.deepEqual(placeholders(copy[key]),placeholders(reference[key]),`${lang}.${key}`);
  assert.doesNotMatch(copy[key],/Ã|â€|ðŸ|�/,`${lang}.${key} encoding`);
 }
 assert.ok(formatBookingCopy(copy.frameTitle,{name:'Sazón',provider:'TableCheck'}).includes('Sazón'));
 assert.ok(formatBookingCopy(copy.policyChecked,{date:'2026-10-16'}).includes('2026-10-16'));
}
assert.equal(getBookingCopy('__proto__'),reference);
assert.equal(getBookingCopy(undefined),reference);
assert.equal(formatBookingCopy('{provider} {missing}',{provider:'$& <literal>'}),'$& <literal> {missing}');
assert.equal(formatBookingCopy('{constructor}'),'{constructor}');
console.log(`PASS booking shell copy: ${keys.length} keys in sv/en/es/fr, placeholder parity, encoding, fallback and plain-text interpolation`);
