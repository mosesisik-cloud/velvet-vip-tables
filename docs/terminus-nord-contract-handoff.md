# Terminus Nord — ordinary lunch for exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base main227 aed3c8e86da1b932fede7c4d90985d3ab680b6c0. Canonical `curated-PAR-terminus-nord` reserved by32d5 after duplicate check. This is a separately assigned restaurant, never a relabeling of Vaudeville; Vaudeville stays parked.

Scope: Terminus Nord,23 rue de Dunkerque,75010 Paris; native82241, ordinary Déjeuner19380, exactly two guests. Breakfast, dinner, groups, room/terrace guarantees, takeaway and delivery are excluded.

## Source, 2026-10-18

- Own official https://www.terminusnord.com/ identifies the restaurant/address and uses restaurantId82241 plus ordinary reservation anchor https://bookings.zenchef.com/results?rid=82241&lang=fr&withCloseButton=1 . HTML SHA256 `f0f586a9a98d14a5d26c69ef05eefda153b5afdcac714e14560ded8f80d35587`.
- Reused the already captured readonly https://bookings.zenchef.com/results?rid=82241&lang=fr&day=2026-10-23&pax=2 from the rejected Vaudeville link review. No repeat results request. HTML SHA256 `f1c3f9c76a7f3d212d251e81611bd65b4075d57afef7749eda4421da0fad5d57`. Native name/address/zip/phone identify Terminus Nord. Lunch19380 showed25 times,11:00–17:00 every15minutes, for two. These are observations, not holds or bookings.
- Missing native form inspected at https://bookings.zenchef.com/form?rid=82241&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 . HTML SHA256 `b1086396b8fc85b6c3fcbb0a9cd52022121ad7b05b2f3d4b6a25587cfa0472a3`. Correct name/wish/date/pax/slot. Required first/last/email/phone/country/civility; no required custom fields. Voucher input is unsupported.
- Current form bundle https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js SHA256 `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4` computes automatic as is_auto OR (is_auto_until not undefined AND pax<=is_auto_until). False/numeric6 therefore permits two.
- Current form references https://bookings.zenchef.com/_next/static/chunks/pages/_app-30bffcb9f4c3b7b2.js . Fetched SHA256 `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`. Native shouldPrecharge requires hasPrecharge AND min_guests AND pax>=min_guests, along with no prepayment/waitlist. Party2 is below12; this is code-supported, not inference from the threshold field name.

Pinned lunch policy:19380/nameDéjeuner, confirmation false/until6; charge web-askable true/min12/perguest20; prepayment null; required-offer false/frompax null; cancellation cutoff10800 seconds relative to shift; EUR/fr/EuropeParis; no room selection/mandatory room, wish roomnull/offers[]. Any missing/changed policy blocks. No generic card exception. Public sanitized source fixture excludes keys/capabilities and retains only lunch.

Native notice states that the table is no longer guaranteed after15minutes lateness. It separately directs groups over15 to contact the restaurant; that does not broaden our scope. Full native notice is preserved in terms.restaurantNotice.

## Contract and release handoff

Reuse the existing named no-room lunch path, adding one explicit Terminus policy. Bofinger and La Coupole keep their exact policies. No shared app/server/ledger/catalog changes in this PR.

Frozen selection/approval/reserve details/proof carry shiftId19380. Durable attempt.details.shiftId must match19380, or transport is denied. Shared ledger/journal/projection must extend existing scoped checks to curated-PAR-terminus-nord/party2/19380. Proof requires bookingEvidence=own_booking_readback and matching shiftId. terms.version hashes `[EULA text, restaurantComment, shift]`; the review fingerprint binds details plus version. Existing safe notice UI must show text with br converted to newline. Review/submit recheck native policy and digest.

Only exact native bookingPOST is enabled after explicit final consent, accepted terms and durable sendAllowedtrue. No earlier cart/hold is enabled. Independent ownGET uses only same-attempt createdUUID and rid82241. Saved id/date/time/pax/confirmed status must match, without charge/action/error. Service is bound through native selection/frozen approval/durable attempt and saved date/time/pax; no invented rawreceipt shift_id. Conservative empty booking_offers and no chosen room are required; missing or conflicting data yields unknown. A real Terminus final receipt remains unverified. POST echo never confirms this venue.

## Validation boundaries

Guarded actual Chromium form GET used the existing allowedZenchefPreparationRequest predicate with service workers blocked, redirects disabled and all other traffic aborted. Contact field rendered empty and native EULA was visible;13 requests blocked. No contact fields filled or submitted, no time-click mutation, booking/hold/cart/payment/restaurant message or actual capability/readback request. No access-control bypass. This direct form check intentionally did not repeat the captured results GET.

Local Chromium replay covers synthetic ownGET success, missing/wrong saved fields, pending/offer mismatches, stale notice, manual/card policy changes and wrong durable service. Captured-source tests cover25 observed lunch slots, missing fields, wrong auto thresholds, card thresholds2/11/13/string/null/undefined, wrong service and party3. These are mock/source tests, not supplier confirmations.

32d5 owns integration, independent exact-SHA review, actual app/API/Chromium/SQLite QA with simulated supplier writes, CI and release. No new restaurant activation is claimed by this provider delivery.

Validation result: Zenchef suite passed21/21 including Bofinger/La Coupole/De Kas regressions. git diff --check passed.
