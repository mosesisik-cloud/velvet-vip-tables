# Circle qualification: parked

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939,chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public290/d1ed2e46de9a8cb9358b301bcca70050cd9e9710. Evidence only; no provider/catalog/shared changes.

Circle,11 rue Chavanne,69001 Lyon,+33478278693. Own https://circlelyon.fr/ links directly https://bookings.zenchef.com/results?rid=362474&pid=1001. Own root matches master's original SHA. Identity/rid/domain dedup found no matching restaurant; a generic Madiba Circle address in unrelated research is not a duplicate.

Exactly one results request added day2026-10-23/pax2. HTTP200 includes lunch492209 and dinner492212. Both have nine slot rows with empty possible_guests; six rows each allow only one-person waitlist and three have empty waitlist. No two-person normal or waitlist option is evidenced. Lunch marked_as_full=true; dinner false does not override empty slot guest counts.

Both shifts have confirmation false/until4 (not false/null manual), charge_param is_web_booking_askable=true,min_guests1,charge_per_guests95,currencyEUR,prepayment_param null,cancellation86400seconds relative to shift. Full restaurant notice explicitly says reservation confirmed after bank imprint. This card requirement and absent availability block this integration; no card or receipt endpoints were probed.

Lunch bookable_from2026-07-25 12:00:00 and all deadlines23October11:30; dinner from25July20:00 and deadlines23October19:30. Full raw capacities and policy retained.

Full multilingual notice asks for allergies, describes dietary limitations, bank imprint and two-gift-vouchers-per-service quota. Lunch French notice excludes Selfcare menu/vouchers on Tuesday and Friday, refers to changed prices from1September2026 and requires gift number if using a voucher. English lunch notice explicitly describes Interlude six-course-only for Tuesday/Friday lunch. These notices are preserved separately; not silently reconciled into a new menu contract. Global offers[] and is_offer_required=false do not remove stated menu restrictions. No current lunch price was independently verified.

Room49269 exists with selectionfalse/mandatoryfalse. Connected vouchers true; optional gift customfield7013; voucherParam absent. Full notices/custom fields/room/offer/daily policy appear in docs/evidence/circle-source.json. No form was fetched, so actual final form/price/confirmation flow remains unverified.

Sources22October2026:
- root200,164805bytes,SHA22d998a2a1f2d3c5df67363861094e286c7f5d8840611ef66c9ea96ef6457a1c
- results200,159154bytes,SHAcd65c92e7d40412daf6d0ac2dbddc436d18ce44002df959e2efe5588145538f5

Original hashes recomputed and JSON parsed. Originals under C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/circle/. No extra dates, party sizes, form, original-client replay, livePOST/hold/reservation/payment/contact/receipt/capability requests. No runtime change or regression test necessary. No Roseaux or Comptoir Brunet reprobe. This single date observation does not establish permanent unavailability.
