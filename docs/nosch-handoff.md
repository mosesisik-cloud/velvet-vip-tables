# NOSCH restaurant provider handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public288/bc4b058632661f5e1b86b05affd773632b04bebe. Four provider/test/fixture/handoff files only;32d5 owns shared integration, review, app QA and release.

## Own identity and contract

Canonical curated-LYO-nosch, export ZENCHEF_NOSCH, flag VELVET_ZENCHEF_NOSCH. NOSCH restaurant,24 Rue Palais Grillet,69002 Lyon,+33478420831. Own https://nosch.fr/ directly links https://bookings.zenchef.com/results?rid=361415&pid=1001. No matching name/rid/domain in base catalog/provider. Query keeps pid1001; state.partner_id is the string1001. No fullscreen/lang/SDK parameters invented.

Monday-Friday,exactly two, lunch107873. Seven raw slot policies preserved; five selectable starts12:00,12:15,12:30,12:45,13:30. Slots13:00/13:15 have zero total_per_slot and empty possible guests; they are excluded even if dynamic data later claimed otherwise. Every slot and shift closes booking at11:30 local on selected date. Only that date prefix normalizes; all other own capacity and policy values are pinned.

Confirmation false/until4 uses existing automatic-below-threshold contract; charge/prepayment null. Cancellation3600seconds relative to shift. No room choice, selected offers or vouchers. Five room records including COMPTOIR are retained as metadata; room selection false/optional and wish.room_id null. No ability to choose Comptoir is exposed. Offers/custom fields empty. Connected vouchers false, voucherParam absent, mandatory voucher_code displayed and shift voucher flag true; actual original client exposes no gift input. Empty voucher arrays and custom data are pinned.

Full French/English notices are preserved. French explicitly restricts reservations to Restaurant, excludes Comptoir, allows special requests in comments and says some services have card guarantee. The selected lunch has charge_param null; dinner107874 has its own charge policy and is outside scope. Do not generalize lunch as all services being card-free. Internal turn_times are not a guest seating-duration promise.

Own query, state and full shift policy checked at availability/form/review/send. Approval and durable attempt bind lunch107873/date/time/party2. Independent saved booking must match date/time/party with no room and empty offers. POST echo alone stays unknown; terminal attempts cannot be resent.

## Source and native evidence

One ownroot, ONE results23October2026/pax2, and one empty12:00 form GET; no default-date query or additional date. Captured22October2026:
- root200:400d35910fc90b4483b6436f2daed005e5d6563b1d92eef1fe52bcb09d2cf5e2
- results200:d13c7092fe57167e53c775981b3696e5a6d97f5ad126e89e856533268ef97a3e
- form200:9a8dbdf25fb64bcd9e516488586768f6603bd69e650dc6a87b3c3079af8e91b7

Raw evidence C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/nosch/. Exact query, full safe policy projection, source/native hashes and27 referenced asset hashes in scripts/fixtures/nosch-source.json. No auth/payment secrets.

Own build907c2a6d69 uses existing ordinary createBookingData/getByUuid/status contract. All27 HTML script/CSS references matched exact URL and SHA to existing cached originals; no new asset requests. Referenced/hash-verified does not mean all executed. Polyfills nomodule file exists under files-pasted-by-the-user-ja-10/work/office-paris-assetcache/polyfills-42372ed130431b0a.js with SHA0973c1d64c88adc8e3c950410cb58b288f72118d5965b78049438deb8f2f9683; other26 under evidence/bistrot-abel/assets.

Original client replayed offline390/1366; actual adapter reached empty contact and native verification. Views inspected. All traffic local or aborted; own summary held only in harness until teardown. No entered contact details, consent or submit click; phone images blocked. No Moly/Chabert retest.

## Verification

node --test scripts/test-zenchef-nosch.mjs:5/5 PASS, including8 synthetic browser scenarios for success, voucher/policy drift, wrong durable shift, denied grant, wrong guest-count/offer-bearing receipt, with duplicate blocking. Query rejects foreign identity/partner and extra parameters; zero-capacity times rejected. Later-date/DST test preserves fixed11:30 cutoff. Source hashes, full daily policy projection,27 asset hashes, syntax and diff checks PASS.

No actual booking, hold, payment or contact. Final-send/readback tests use synthetic transport and are distinct from unmodified original-client empty form. Dated slots are not a guarantee of later availability. Publication remains32d5 responsibility.
