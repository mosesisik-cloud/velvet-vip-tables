# Brasserie Vagenende — ordinary lunch for two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Main232 basea2016d59f0b60f64ee26ac9346d7010662110101. Canonical `curated-PAR-brasserie-vagenende` reserved by32d5. Display Brasserie Vagenende; native name Restaurant Vagenende,356807,142 boulevard Saint-Germain,75006Paris. Only Déjeuner63972 and exactly two; dinner/events/delivery/room or terrace guarantee excluded.

## Sources, 2026-10-18

Own official https://www.vagenende.com/reserver embeds https://bookings.zenchef.com/results?rid=356807&fullscreen=1 . HTML SHA256 `773c2bd0b69891339073580039986feb00c77d92eda9e596b106c183849e418b`. The .fr search result is not used as an authority.

One readonly https://bookings.zenchef.com/results?rid=356807&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `693d347e61340836fe8bc02c6e7340f3eac95d9b7fcf3108de620c1a608b33ab`. Native identity/address match. Lunch63972 showed19 times12:00–16:30 every15minutes for two, not holds/bookings.

Readonly https://bookings.zenchef.com/form?rid=356807&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `79478d66526815793dcc2404a0b8957af2a21c10feaeaee969e52a8a7d69c7d3`. Name/wish/date/pax/slot match; required first/last/email/phone/country/civility. A custom acknowledgement about confirmation after redirect is hidden, enabledfalse,requiredfalse. It is not treated as a required step or as confirmation evidence. No optional custom input is submitted.

Current referenced assets fetched and hash-match reviewed code:

- https://bookings.zenchef.com/_next/static/chunks/pages/_app-30bffcb9f4c3b7b2.js — `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`. shouldPrecharge requires hasPrecharge/min_guests/pax>=min_guests plus no prepayment/waitlist;2<5.
- https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js — `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`. is_auto true takes the automatic branch. Exact true/null policy is pinned.

Policy:63972/nameDéjeuner,true/untilnull; charge web-askabletrue/min5/perguest25; prepaymentnull; required-offerfalse/frompaxnull; cancellation cutoff10800 seconds relative to **booking**, not shift. EUR/fr/EuropeParis; no room selection/mandatory room; wish roomnull/offers[]. Unknown or changed fields block.

Notice must remain venue-specific: groups over8 should contact the restaurant; another paragraph explicitly concerns dinner31December2025 and its two sittings/table-release time. Preserve raw text and date, but do not present that expired dinner paragraph as a current ordinary-lunch restriction. No15-minute lateness rule is present or copied. No room preference is promised.

## Contract and integration

Provider/test/sanitized fixture/docs only; existing named no-room lunch engine reused with its own exact predicate. Native selection/frozen approval/reserve details/proof bind shiftId63972. Durable attempt.details.shiftId must match before transport. Shared ledger/journal/projection must extend this canonical ID/party2/63972 and require bookingEvidence=own_booking_readback. Safe notice text rendering and terms.version hash `[EULA text, restaurantComment, shift]` remain; review fingerprint binds details/version and policy/digest are rechecked before review/submit.

First enabled mutation remains exact bookingPOST after explicit final consent, terms acceptance and durable sendAllowedtrue; no early hold/cart. OwnGET restricted to same-attempt createdUUID/rid356807. Saved id/date/time/pax/confirmed status must match without charge/action/error. Service binds through native selection/frozen approval/durable attempt and saved date/time/pax, not invented raw receipt shift_id. Conservative empty booking_offers/no chosen room required; unknown shape yields unknown. Real final receipt structure remains unverified; POST echo/redirect alone cannot confirm.

## Validation boundaries

Guarded actual Chromium form GET through existing allowedZenchefPreparationRequest rendered an empty contact field and native EULA;7 requests blocked. Service workers/redirects/unreviewed traffic blocked. No fields filled, contact/code/booking/hold/cart/payment/message/capability/receipt request, no access bypass or repeated results query.

Local Chromium replay tests synthetic ownGET success, receipt errors/pending/offer mismatch, card/manual changes, stale notice and wrong durable service. Captured-source test covers19slots, missing fields, exact automatic/card rules, booking-relative cancellation and excluded dinner/party3. Final-booking tests are synthetic, not real reservations.

32d5 owns shared integration, independent exact-SHA review, actual app/API/Chromium/SQLite QA with simulated writes, CI and release. No activation/publication in this provider PR.

Validation result:26/26 Zenchef tests PASS including prior venue regressions. git diff --check PASS.
