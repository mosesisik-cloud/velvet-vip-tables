# Maison Moly provider handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public287/main34b01ce2463b092fdfd067ccb18d1000760c4a22. Four provider/test/fixture/handoff files only. 32d5 owns shared integration, independent review, app QA and publication.

## Identity and qualified scope

Canonical `curated-LYO-maison-moly`, export `ZENCHEF_MAISON_MOLY`, reserved flag `VELVET_ZENCHEF_MAISON_MOLY`. Maison Moly,38 Rue de l'Arbre Sec,69001 Lyon,04 78 08 89 52, own rid362732. No identity/rid/domain match in base catalog/provider documentation. Own https://www.maisonmoly.fr/ links through its ReserveAction https://www.maisonmoly.fr/reserver-une-table/?rid=362732&lang=fr. Observed301 supplies https://bookings.zenchef.com/results?rid=362732&fullscreen&lang=fr&withCloseButton=1. Empty fullscreen is intentional; no pid was added.

Initial scope: Monday-Friday, exactly two guests, lunch137085, eight quarter-hour starts12:00–13:45. Confirmation true/null; charge and prepayment null; cancellation10800seconds relative to shift. Each slot closes booking at its own start and shift closes13:45. Only exact date prefixes of those own values normalize. Full shift/slot/capacity metadata is pinned; the alternating capacities and turn_times are retained, not replaced with another restaurant's values or interpreted as guest seating limits. Dinner137086 is outside this delivery.

Four room records exist, including COPY names; all are preserved in metadata. Room selection is false/optional and wish.room_id remains null. Dynamic available_rooms is present for guest counts1/2 and does not authorize the app to choose a room. Offers/shiftMenus/custom fields are empty. hasConnectedVouchers=false and voucherParam absent. mandatoryFields.voucher_code is displayed, shouldDisplayShopVoucher=true and shift voucher flag=true, but original client exposes no gift input; these exact settings are preserved and fingerprinted. Empty voucher arrays/custom data are required; outgoing gift/room/offer values are rejected.

The full French notice directs parties above eight to telephone/email. It is exposed before approval; specific-day notice must remain null. Standard six contact fields match the existing flow. Own query/metadata/policy are checked before selection, review and send. Approval and durable journal bind own137085/date/time/party2. Confirmation requires independent saved-booking readback with matching date/time/party, no room and empty offers. POST echo is insufficient; unknown terminal outcomes cannot be resent.

## Original evidence

One ownroot GET, one observed entry301, exactly one23October2026/pax2 results GET, one empty12:00 form GET. Captured22October2026:
- root200 SHA7ee1e3b41e4587731ba35ecf55457d47eba810aa4a3baa084c692e8927a87363
- entry301 empty SHAe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- results200 SHA7d6fa4cc294ed45c75d15988aa028abf107d4f5fa31ea3ab59b6fa2b6e2c2ca1
- form200 SHA1c88eb2feedd40fb75bbeecb0d7f994f1d3120c14e71f9978f41347edd15b888

Raw originals: C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/maison-moly/. Safe full policy projection and exact source/native hashes are in scripts/fixtures/maison-moly-source.json; no auth/payment secrets.

Build907c2a6d69:27 own HTML script/CSS references were matched by exact URL and SHA to existing originals, with no new downloads. This counts referenced/hash-verified assets, not27 browser-executed assets. In particular polyfills-42372ed130431b0a.js is a referenced nomodule resource; its existing verified cache is C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-10/work/office-paris-assetcache/polyfills-42372ed130431b0a.js (SHA0973c1d64c88adc8e3c950410cb58b288f72118d5965b78049438deb8f2f9683). Other26 cached under evidence/bistrot-abel/assets. Existing client ordinary createBookingData and getByUuid/status mapping apply; no new engine/API.

Original unmodified client replayed offline at390/1366 and visually inspected. Actual adapter reached empty contact and passed native verification. All traffic intercepted locally; own summary held only in harness until teardown, mutation requests aborted. No filled personal information, consent or submit click. Phone flag images blocked. No Chabert or Bistrot retests.

## Verification and boundary

`node --test scripts/test-zenchef-moly.mjs`:5/5 PASS including8 synthetic browser scenarios: matching receipt, voucher drift before review/send, policy drift, wrong durable shift, denied journal grant, wrong guest-count receipt and offer-bearing receipt. Terminal resubmission blocked. Later weekday/DST test shows slots expire individually at their starts and all expire13:45. Original SHA/full daily policy projection/27 referenced asset hashes, syntax and diff checks PASS.

No real booking, hold, payment or contact. Synthetic final-send/readback tests remain distinct from original empty-form replay. Observed slots are a dated snapshot, not promised future availability. This provider PR does not publish the app;32d5 retains integration/review/appQA/release.
