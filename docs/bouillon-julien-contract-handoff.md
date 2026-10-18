# Bouillon Julien — ordinary lunch for exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Main233 based3a97fa81ebf4b399eea57caaca38dd6d85ba9c1. Canonical `curated-PAR-bouillon-julien` reserved by32d5. Native350246,16 rue du Faubourg Saint-Denis,75010Paris. Only ordinary Déjeuner12711, exactly two. Dinner, groups/events, room guarantees and paid special dates are excluded.

## Official widget and current source, 2026-10-18

https://www.bouillon-julien.com/rserver returned200, SHA256 `9261fee3394f3c3fc6441943ae349f77b3027eb929e58dadf7864d23ac6e94bd`. Contains actual zc-widget-config/data-restaurant350246 and SDK script https://sdk.zenchef.com/v1/sdk.min.js . SDK fetched SHA256 `f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c`: data-restaurant maps to rid, default production base is bookings.zenchef.com, ordinary path is results. Thus entry derives from the actual widget source, not a guessed restaurant mapping. Widget code was read, not executed.

One readonly https://bookings.zenchef.com/results?rid=350246&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `b454452243eab5af086953854a0a5284046a18af34e093b13240838a5cd846d4`. Native identity/address match. Lunch12711 showed11:45/14:30/15:00/15:30/16:00/16:30/17:00 for two. These are observed slots, not holds or bookings.

Readonly https://bookings.zenchef.com/form?rid=350246&lang=fr&day=2026-10-23&pax=2&slot=11%3A45 returned200, SHA256 `6aacce62bfb5accd2463807faaa81dd987ffec815723b9e8c6114998aebe128d`. Correct name/wish/date/pax/slot; required first/last/email/phone/country/civility. Optional voucher/gift code unsupported.

Current referenced assets fetched and hash-matched to reviewed source:

- https://bookings.zenchef.com/_next/static/chunks/pages/_app-30bffcb9f4c3b7b2.js — `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js — `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`. Native auto rule is is_auto OR (is_auto_until not undefined AND pax<=is_auto_until); false/numeric8 permits two.

Exact lunch policy:12711/nameDéjeuner,false/until8; charge/prepaymentnull; required-offerfalse/frompaxnull; cancellation cutoff**10860 seconds relative to shift**, not10800 or booking. EUR/fr/EuropeParis; no room selection/mandatory room; wish roomnull/offers[]. Unknown/changed fields block.

Own notice: walk-ins are invited if preferred times are unavailable; comment-field requests do not change the booked time; the full party must be present before seating; the reservation time is fixed. Preserve complete raw notice without promising walk-in availability or adding a15-minute rule.

## Date scope and shared handoff

Conservative scope excludes24,25 and31December **every year**, independently of native availability. This is an implementation limit for the separately identified paid special dates, not a claim that the restaurant is closed. zenchefSearchUrl rejects these MM-DD values for this exact venue; zenchefFormUrl calls the same guard, including selection/request checks and verifyNativeRoom during review/submit before click/transport. Immutable approval and durable attempt bind date.32d5 must mirror exclusions in API/UI and reserve/record validators. No holiday endpoint was probed.

Only provider/test/sanitized fixture/docs changed. Existing named no-room lunch engine reused. Frozen selection/approval/reserve details/proof carry shiftId12711; durable attempt.details.shiftId must match. Shared ledger/journal/projection must extend ID/party2/12711 and require bookingEvidence=own_booking_readback. Existing safe notice rendering and version hash `[EULA text, restaurantComment, shift]` apply; fingerprint binds details/version and review/submit recheck policy/digest.

First enabled mutation is exact native bookingPOST after explicit final consent, accepted terms and durable sendAllowedtrue; no early hold/cart. Independent ownGET only uses same-attempt createdUUID/rid350246. Saved id/date/time/pax/confirmed status must match without charge/action/error. Service binds via native selection/frozen approval/durable attempt and matching saved date/time/pax, not invented raw receipt shift_id. Conservative empty booking_offers/no chosen room required; unknown receipt structure yields unknown. Real final receipt unverified; POST echo never confirms.

## Verification boundaries

Guarded actual Chromium form GET using existing allowedZenchefPreparationRequest rendered empty contact input/native EULA;8 requests blocked. Service workers/redirects/unreviewed traffic blocked. No fields filled, contact/code/booking/hold/cart/payment/message/capability/receipt request; no bypass or repeated results/date probe.

Local replay tests cover synthetic ownGET success, wrong/missing saved fields, pending/offer mismatches, card/manual changes, stale notice and wrong durable service. Captured-source tests cover seven slots, missing fields, exact10860 cutoff, threshold typing, dinner/party3 exclusion and24/25/31December in2026 and2030 through both search/form guards. These are mock/source tests, not real bookings.

32d5 alone integrates shared files and routes exact-SHA independent review, actual app/API/Chromium/SQLite QA with simulated mutations, CI and release. No publication is included in this provider PR.

Validation: node --test scripts/test-zenchef-playwright.mjs — 27/27 PASS, zero failures (107.45 seconds). git diff --check PASS.
