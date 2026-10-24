# Le Musée qualification: parked

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public287/main34b01ce2463b092fdfd067ccb18d1000760c4a22. Evidence only: no provider, catalog, shared flow or deployment changes.

## Own identity and route

Restaurant Le Musée,2 Rue des Forces,69002 Lyon,04 78 37 71 54. This is distinct from Café des Musées in Paris. Own root https://www.bouchonlemusee.fr/ returned200 on22October2026 and links directly to https://bookings.zenchef.com/results?rid=377171&pid=1001. No match for own rid/domain/address was found in base data/docs/provider. The root was fetched once; the sole results GET adds day2026-10-23 and pax2. No separate default-date entry query was needed because the original root supplies the complete entry URL.

Own captured root says Tuesday-Friday dinner19:30–21:30 and lunch12–14; Saturday lunch12–14; Sunday/Monday closed. This differs from the earlier master snapshot describing19/21 sittings and summer lunch closure. The current own source is preserved; no old first-sitting or summer assumption is carried into a provider.

## Negative qualification

Dinner shift303945,Service Soir,is marked_as_full=true. All eight quarter-hour slot rows19:30–21:15 have empty possible_guests and waitlist_possible_guests. Thus no two-person dinner slot is evidenced for the requested date.

Confirmation is is_auto=false/is_auto_until=null: manual confirmation, not an automatic-below-threshold contract. charge_param is is_web_booking_askable=true,min_guests=1,charge_per_guests=35; prepayment_param is null. This is card-guarantee configuration, not evidence that a payment was made or a validated charge contract. Currency and the complete raw policy are retained in the JSON. Cancellation is10800seconds relative to shift. Slot cutoffs equal their respective starts; shift cutoff21:15. There is no separately verified first-sitting departure requirement. Raw turn_times are internal capacity configuration and are not relabeled as a guest seating promise.

Rooms100245/101302 exist with hasRoomSelection=false/isRoomMandatory=false. Offers and custom fields are empty; hasConnectedVouchers=false; voucherParam is absent, while shift is_voucher_codes_active=true. Full multilingual welcome notice and selected-day null notice are retained. These facts do not overcome the failed availability/manual/card qualification.

Lunch301631 is present in the same response but outside the dinner assignment; it is also marked full and false/null confirmation, with charge_per_guests30. No lunch query or fallback was performed.

## Evidence and boundary

- Root200,2026-10-22T18:53:09.992Z,180736bytes,SHA7c874dfa671372e7c3560dfb5ac18e571d5cd1e4a929ddaff2d8ea19c2b128e2.
- Results200,2026-10-22T18:53:12.996Z,153031bytes,SHAe1d73f9d318a5d7b4075b98024163805a380598677566148f75b09634a48011a.

Original bytes and metadata are under C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/le-musee/. Sanitized full policy projection and exact query are in docs/evidence/le-musee-source.json. Original SHA verification and JSON parsing pass. No runtime code changed, so no booking regression run was needed; Chabert was not retested.

Parked without form/client requests, native replay, further dates, holds, reservations, payments, contact or capability reads. Missing for any future safe integration: supported card/manual contract and an actually selectable dinner option with its own verified final form. This single observation does not establish permanent unavailability.
