# La Lorraine — ordinary lunch for exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Main229 base18cc863bf16d2f6663ce5a48b8ec7844852209dd. Canonical `curated-PAR-la-lorraine` reserved by32d5 after duplicate check. Identity: La Lorraine,2 place des Ternes,75008Paris. Native478; only Service Déjeuner16674 and exactly two guests. Breakfast, afternoon, both dinners, events, seafood takeaway/delivery and terrace guarantees are excluded.

## Evidence, 2026-10-18

Own official https://www.brasserielalorraine.com/ contains the ordinary Zenchef478 anchor and matching restaurantId. HTML SHA256 `c80aeb8c0ad610743be74fb364bef28fb44762f485d35d613f452379108b33fb`.

One readonly https://bookings.zenchef.com/results?rid=478&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `92f9052d481c5a22fd4a10d0229d4f1431ec45c4bb47f7d94845956bdf462f29`. Native name/address/zip/city match. Lunch16674 showed12:00/12:15/12:30/12:45/13:00/13:15/14:00/14:30 for two. Availability is not a hold or confirmed booking.

Readonly https://bookings.zenchef.com/form?rid=478&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `29abaecda52961fd59b26da527291727a0719c53f2de5d360ad4320e970efa69`. Name/wish/date/pax/slot match. Required first/last/email/phone/country/civility. Optional voucher/gift field remains unsupported.

Current referenced public assets were fetched and exactly match already reviewed source:

- https://bookings.zenchef.com/_next/static/chunks/pages/_app-30bffcb9f4c3b7b2.js SHA256 `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`. Native shouldPrecharge requires hasPrecharge/min_guests/pax>=min_guests plus no prepayment/waitlist. Two is below eight.
- https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js SHA256 `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`. Automatic is is_auto OR (is_auto_until not undefined AND pax<=is_auto_until). False/numeric6 permits two.

Pinned policy:16674/nameServiceDéjeuner, confirmation false/until6, charge web-askabletrue/min8/perguest20; prepaymentnull; required-offerfalse/frompaxnull; cancellation cutoff172800 seconds relative to shift. EUR/fr/EuropeParis; no room selection/mandatory room; wish roomnull/offers[]. Unknown/changed values fail closed, with no generic card exception.

Native restaurantNotice explicitly says the table is no longer guaranteed after15minutes lateness and mentions valet parking. Preserve the full raw notice; no price or valet inclusion is inferred. Other venues' café/group notices are not substituted.

## Existing engine and integration contract

Add only a named exact policy to existing no-room lunch engine. Other venue predicates and contracts remain unchanged. Provider/test/sanitized fixture/docs only; no shared catalog/server/UI/ledger activation.

Native selection/frozen approval/reserve details/verification carry shiftId16674. Durable attempt.details.shiftId must match before booking transport.32d5 must extend scoped ledger/journal/projection to this canonical ID,party2,16674 and require bookingEvidence=own_booking_readback. Existing notice UI safely renders text with br normalized. terms.version hashes `[EULA text, restaurantComment, shift]`; review fingerprint binds details and version; review/submit recheck policy/digest.

First enabled mutation is exact native bookingPOST only after explicit final consent, accepted terms and durable sendAllowedtrue. No early hold/cart. OwnGET uses only same-attempt createdUUID and rid478. Saved id/date/time/pax/confirmed status must match without charge/action/error. Service binds through native selection/frozen approval/durable attempt and matching saved date/time/pax, not an invented raw receipt shift_id. Conservative explicit empty booking_offers/no chosen room are required; missing/unknown receipt data yields unknown. Actual La Lorraine final receipt remains unverified. POST echo never confirms.

## Validation boundaries

Guarded actual Chromium form GET through existing allowedZenchefPreparationRequest rendered empty contact input and native EULA;13 requests blocked. Service workers blocked, redirects disabled, unreviewed traffic denied. No fields filled, contact/code submitted, time-click mutation, actual reservation/hold/cart/payment/restaurant message or capability/receipt access. No bypass and no repeated results/date probe.

Local Chromium scenarios cover synthetic ownGET success, missing/wrong saved fields, pending/offer mismatches, card/manual changes, stale notice and wrong durable service. Captured-source tests cover eight observed slots, missing policy fields, wrong auto/card thresholds, excluded services and party3. Source/mock tests are not actual supplier confirmations.

32d5 alone handles shared integration, independent exact-SHA review, actual app/API/Chromium/SQLite QA with simulated mutations, CI and release. This provider PR is not publication.

Validation result: Zenchef suite23/23 PASS including prior named venue regressions. git diff --check PASS.
