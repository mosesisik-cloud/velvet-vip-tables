# Restaurant Le Vivarais provider handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939,chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public290/d1ed2e46de9a8cb9358b301bcca70050cd9e9710. Four provider/test/fixture/handoff files only;32d5 retains shared integration/review/appQA/release.

## Identity and scope

Reserved curated-LYO-le-vivarais / ZENCHEF_LE_VIVARAIS / VELVET_ZENCHEF_LE_VIVARAIS. Restaurant Le Vivarais,1 Pl. Gailleton,69002 Lyon,+33478378515. Own https://www.restaurant-levivarais.fr/ supplies ReserveAction /reserver-une-table/?rid=356393&lang=fr, whose301 location is https://bookings.zenchef.com/results?rid=356393&fullscreen&lang=fr&withCloseButton=1. No pid added; state partner_id and voucherParam absent. No duplicate identity/rid in base catalog/provider. Own root says Tuesday-Saturday12–14 and19–22, Monday/Sunday closed. Initial scope deliberately Tuesday-Friday lunch only, exactly two.

Own lunch58213 has six raw quarter-hour policies12–13:15. Four evidenced selectable times:12:00,12:15,12:45,13:00.12:30 and13:15 are excluded from the provider's allowed time list despite retaining full raw policies. Each deadline is its slot start; shift deadline13:15. Opening2026-04-26 12:00:00 is pinned exactly, no inferred180-day recurrence. Only exact selected-date deadline prefixes normalize. Full own capacities and all policy fields retained.

Confirmation false/until6. Charge is nonnull, askabletrue/min_guests6/23EUR per guest; prepayment null, cancellation3600seconds relative to shift. This is not a claim that all bookings are card-free. Exactly two is below the card threshold, following an already supported provider pattern; master explicitly confirmed this interpretation. Changes to threshold or amount fail closed, and other party sizes are rejected. Original empty form for two has no card requirement or additional payment step. Dinner and other groups are excluded.

Own historical global offer50338 is Menu Saint Valentin, dated14February2026, activeflagtrue,60EUR; its entire metadata is preserved and fingerprinted, not selected. Current wish.offers empty; no offer stage. Three rooms retained, selectionfalse/mandatoryfalse, wish.room_id null. Full French notice directs parties above12 to email; no message sent. Selected-day notice null required.

Optional custom field1275 Bon Cadeaux/bon-cadeaux is distinct from mybeezbox. Connected vouchers false, but own original client renders a plain text input without name/id under exact Bon Cadeaux (facultatif) label. Own guard requires exactly one such input, visible/enabled/empty/text/notrequired/notreadonly and exact enclosing label. Guard runs on initial contact, review and pre-send verification. No guest gift field is exposed in Velvet; nonempty gift/custom values rejected in payload. No borrowed gift metadata.

Approval and durable journal bind ownshift/date/time/party2. Independent saved-booking readback must match with no room and empty offers. A POST echo alone remains unknown; terminal attempts cannot repeat.

## Sources and offline proof

One ownroot, one entry301, ONE23October2026/pax2 results, one empty12:00 form. No additional dates or live mutation. Source SHA:
- root200:7e0f8e03fe2aaa32a7b916bc50d16199abd4c3460000966ee60b540b091c57d0
- entry301:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- results200:6d9bc8c3e6bf86aa551e57ff32f1028d053d76e99a6f1cf60a62f45a2c80dd3a
- form200:e7971088d616868e942099de4a387e710139c5a39cdaf0b6fb5d6b876ec14cdb

Originals under C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/vivarais/. Own fixture carries safe full policy projection, exact query, source/native hashes and27 referenced asset hashes. Build907c2a6d69 uses existing ordinary createBookingData/getByUuid/status contract. All27 script/CSS references matched exact cached URL/SHA; no new asset requests. This is referenced/hash-verified count, not executed count. Polyfill nomodule lives in files-pasted-by-the-user-ja-10/work/office-paris-assetcache; other26 in evidence/bistrot-abel/assets.

Original client replayed locally390/1366 and its plain gift DOM inspected; actual adapter emptycontact and gift verification pass. All network local/aborted; own summary held only in harness until teardown. No entered contact data/consent/finalclick; phone images blocked. No other restaurant retest.

## Validation

node --test scripts/test-zenchef-vivarais.mjs:5/5 PASS including8 synthetic browser scenarios for exact receipt, plain gift before review/send, policy drift, denied journal/wrongshift and wrong guest/offer receipt. Monday/weekend excluded, unsupported times rejected. Card threshold2/amount drift rejected. Later Tuesday afterDST keeps individual deadlines; changed openingdate rejected. Source hashes/full daily policy/27asset hashes, syntax and diff checks PASS.

No real reservation, hold, payment, contact or receipt request. Synthetic finalsend/readback is separate from original emptyform proof. Dated availability is not a guarantee for future searches. Publication remains32d5 responsibility.
