# Au Pied de Cochon — lunch for exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base main2300ab66a0dbe8ccdc07345f16860be976b84eedab9. Canonical `curated-PAR-au-pied-de-cochon` reserved by32d5 after duplicate check. Native247,6 rue Coquillière,75001Paris. Only ordinary Déjeuner29 and exactly two. No breakfast/dinner, takeaway/delivery/events, room or terrace guarantee.

## Source evidence, 2026-10-18

Own homepage https://www.pieddecochon.com/ contains the ordinary anchor https://bookings.zenchef.com/results?rid=247&fullscreen&lang=fr&withCloseButton=1 . HTML SHA256 `358aea3ef12bc6e3bb48278af0291c5173c35bc734618cfdf7e198a5ac39a748`. The takeaway page /o/reservation/ was not used.

One readonly https://bookings.zenchef.com/results?rid=247&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `8ccfcc6abb9488ade2b5006e40a3ffe3d81c0ef9af763ac169176a492a0c73e7`. Native identity/name/address/zip match. Lunch29 showed11:30/12:00/12:30/13:00 for two, not holds or confirmations.

Readonly https://bookings.zenchef.com/form?rid=247&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `bc5d1296f25af10236f8f2a886d081bb5675f6d6ec11c7333e8c601c4a37c9fe`. Native wish matches date/party/slot. Required first/last/email/phone/country/civility; optional voucher/gift code is unsupported.

Current referenced assets fetched and hash-matched to previously reviewed code:

- https://bookings.zenchef.com/_next/static/chunks/pages/_app-30bffcb9f4c3b7b2.js — `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`. shouldPrecharge requires hasPrecharge/min_guests/pax>=min_guests and no prepayment/waitlist. Party2 is below5.
- https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js — `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`. Automatic is is_auto OR (is_auto_until not undefined AND pax<=is_auto_until); false/numeric6 permits two.

Pinned policy:29/nameDéjeuner; confirmation false/until6; charge web-askabletrue/min5/perguest15; prepaymentnull; required-offerfalse/frompaxnull; cancellation172800 seconds relative to shift. EUR/fr/EuropeParis; no room selection/mandatory room; wish roomnull/offers[]. Unknown/changed fields block. Native notice says the table is no longer guaranteed after15minutes lateness and some seats are available without reservations. Preserve both statements; do not invent online capacity or a terrace guarantee.

## Existing-engine contract

One explicit venue policy is added to the existing named no-room lunch path. No shared files changed. Selection/frozen approval/reserve details/proof carry shiftId29; durable attempt.details.shiftId must match before transport.32d5 must extend ledger/journal/projection to canonical ID,party2,29 and require bookingEvidence=own_booking_readback. Existing safe restaurantNotice UI and terms.version hashing `[EULA text, restaurantComment, shift]` apply. Review/submit recheck policy/digest and fingerprint binds details/version.

First enabled mutation is exact native bookingPOST after explicit final consent, terms acceptance and durable sendAllowedtrue. No earlier hold/cart. OwnGET restricted to same-attempt createdUUID/rid247; saved id/date/time/pax/confirmed status must match with no charge/action/error. Service binds through validated native selection/frozen approval/durable attempt and matching saved date/time/pax, not invented raw receipt shift_id. Conservative explicit empty booking_offers/no chosen room remains required; missing/unknown receipt shape yields unknown. Actual final supplier receipt has not been verified. POST echo cannot confirm.

## Validation boundaries

Guarded real Chromium form GET used existing allowedZenchefPreparationRequest, service workers blocked, redirects disabled and unreviewed traffic denied. Empty contact field and native EULA rendered;7 requests blocked. No fields filled, contact/code submitted, time-click mutation, booking/hold/cart/payment/restaurant message or capability/readback access. No bypass/repeated results/date probe.

Local Chromium tests cover synthetic ownGET success, missing/wrong saved fields, pending/offer mismatch, card/manual policy changes, stale notice and wrong durable service. Captured-source tests cover four lunch slots, missing policy fields, changed/null/string auto/card thresholds, other service IDs and party3. These are mock/source tests, not real reservations.

32d5 owns integration, independent exact-SHA review, actual app/API/Chromium/SQLite QA with simulated supplier writes, CI and release. This provider PR does not activate or publish the restaurant.

Validation result:24/24 Zenchef tests PASS including previous venue regressions. git diff --check PASS.
