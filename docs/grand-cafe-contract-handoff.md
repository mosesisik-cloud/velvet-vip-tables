# Le Grand Café Capucines — ordinary lunch for two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base main2310998cf8c8735c793d35cc2d712440dbbdf9d0801. Canonical `curated-PAR-le-grand-cafe-capucines` reserved by32d5. Native101232;4 boulevard des Capucines,75009Paris. Only ordinary Déjeuner19590,exactly two. Breakfast/afternoon/dinner/takeaway/delivery/events/terrace guarantees excluded.

## Sources, 2026-10-18

Own homepage https://www.legrandcafe.com/ contains ordinary anchor https://bookings.zenchef.com/results?rid=101232&fullscreen&lang=fr&withCloseButton=1 and matching restaurantId. HTML SHA256 `85ad83117065b40ddc8814d21c46d9cde2e566ce3e8c0509af46bc54a3b23665`. The takeaway /o/reserver/ page was not used.

One readonly https://bookings.zenchef.com/results?rid=101232&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `9f3946d3ba43fb6596edef384da836cb0b806aa50777ae76350db4bc9e8ef131`. Native name/address/zip/city match. Lunch19590 showed12:00/12:30/13:00/13:30/14:00/14:30 for two. Observed availability is not a hold or final booking.

Readonly https://bookings.zenchef.com/form?rid=101232&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `660cd20e302da66b88cafeddbd33b3b21db562185b4c4846be29314a3b651989`. Native name/wish/date/pax/slot match. Required first/last/email/phone/country/civility; optional voucher/gift code unsupported.

Current referenced assets fetched and exactly hash-match reviewed source:

- https://bookings.zenchef.com/_next/static/chunks/pages/_app-30bffcb9f4c3b7b2.js — `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js — `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`. Native automatic expression accepts is_auto true directly. We pin true/null; no threshold fallback is newly introduced.

Exact policy:19590/nameDéjeuner; confirmation true/untilnull; charge_paramnull/prepayment_paramnull; required-offerfalse/frompaxnull; cancellation cutoff86400 seconds relative to shift. EUR/fr/EuropeParis; no room selection/mandatory room; wish roomnull/offers[]. Missing/changed types or values block. Native notice says the table is not guaranteed after15minutes lateness. No café/drop-in/valet details are present or copied.

## Integration and mutation contract

Only explicit provider policy/test/sanitized fixture/docs changed. Reuse existing named no-room lunch engine; all other venue predicates remain unchanged.

Native selection/frozen approval/reserve details/proof carry shiftId19590. Durable attempt.details.shiftId must match before transport.32d5 must extend scoped ledger/journal/projection to canonical ID,party2,19590 and require bookingEvidence=own_booking_readback. Existing safe notice UI uses raw restaurantNotice as text with br normalized. terms.version hashes `[EULA text, restaurantComment, shift]`; review fingerprint binds details/version; review/submit recheck policy/digest.

First permitted mutation is exact native bookingPOST after explicit final consent, accepted terms and durable sendAllowedtrue. No earlier hold/cart enabled. OwnGET is limited to same-attempt createdUUID and rid101232; saved id/date/time/pax/confirmed status must match with no charge/action/error. Service binding is native selection/frozen approval/durable attempt plus matching saved date/time/pax, not invented raw receipt shift_id. Conservative explicit empty booking_offers/no chosen room required; unknown receipt structure yields unknown. Actual final supplier receipt remains unverified. POST echo cannot confirm.

## Validation boundaries

Guarded actual Chromium form GET used existing allowedZenchefPreparationRequest, blocked service workers/redirects/unreviewed traffic. Empty contact input and native EULA rendered;15 requests blocked. No fields filled or contact/code submitted, no slot-click mutation/booking/hold/cart/payment/restaurant message or capability/receipt read. No bypass or repeated results/date probe.

Local replay scenarios cover synthetic ownGET success, missing/wrong saved fields, pending/offer mismatch, newly introduced card/manual policy, stale notice and wrong durable service. Captured-source tests cover six lunch times, missing policy fields, true/null exact typing, changed thresholds, excluded services and party3. Final-booking tests are mock/source-derived, not real reservations.

32d5 alone integrates shared files and arranges independent exact-SHA review, actual app/API/Chromium/SQLite QA with simulated mutations, CI and release. This provider handoff is not activation/publication.

Validation result:25/25 Zenchef tests PASS including previous venue regressions. git diff --check PASS.
