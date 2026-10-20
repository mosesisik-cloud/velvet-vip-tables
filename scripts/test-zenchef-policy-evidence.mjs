import assert from 'node:assert/strict';
import { interpretZenchefPolicy as policy } from '../api/providers/zenchef-policy-evidence.mjs';
assert.equal(policy({}, 2).confirmationMode, 'unknown');
assert.equal(policy({}, 2).cardGuaranteeApplies, null);
assert.equal(policy({}, 2).prepaymentApplies, null);
assert.equal(policy({confirmation:{is_auto:false}}, 2).confirmationMode, 'unknown');
assert.equal(policy({confirmation:{is_auto:false,is_auto_until:null}}, 2).confirmationMode, 'manual');
assert.equal(policy({confirmation:{is_auto:false,is_auto_until:2}}, 2).confirmationMode, 'automatic');
assert.equal(policy({confirmation:{is_auto:false,is_auto_until:2}}, 3).confirmationMode, 'manual');
assert.equal(policy({confirmation:{is_auto_until:4}}, 2).confirmationMode, 'unknown');
for (const value of [-1, '4', NaN]) {
  assert.equal(policy({confirmation:{is_auto:false,is_auto_until:value}}, 2).confirmationMode, 'unknown');
}
for (const field of ['charge_param', 'prepayment_param']) {
  const key = field === 'charge_param' ? 'cardGuaranteeApplies' : 'prepaymentApplies';
  assert.equal(policy({[field]:{is_web_booking_askable:false}}, 2)[key], false);
  assert.equal(policy({[field]:{is_web_booking_askable:true,min_guests:2}}, 2)[key], true);
  assert.equal(policy({[field]:{is_web_booking_askable:true,min_guests:3}}, 2)[key], false);
  for (const min_guests of [undefined, null, 0, -1, '2']) {
    assert.equal(policy({[field]:{is_web_booking_askable:true,min_guests}}, 2)[key], null);
  }
}
assert.throws(() => policy({}, 0), /invalid_party/);
assert.equal(policy({confirmation:{is_auto:true}}, 2).bookingConfirmed, false);
assert.equal(policy({confirmation:{is_auto:true}}, 2).formInspected, false);
console.log('PASS offline policy evidence: unknown fields, guest thresholds, manual/automatic distinction; no network or reservations.');

