# La Coupole — ordinary lunch for exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Main226 baseline efa4c2b90c96c0d1cce2a2221b722c31007f2997. Canonical ID `curated-PAR-la-coupole` reserved by32d5 after duplicate check. Identity: La Coupole,102boulevard de Montparnasse,75014Paris. Native restaurant83871; only ordinary Déjeuner20148 and party2 supported. Breakfast, both dinners, groups, Dancing/Paris Follies, takeaway and delivery are excluded.

## Current source, 2026-10-18

- Official https://www.lacoupole-paris.com/ has restaurantId83871 and ordinary Zenchef entry. HTML SHA256 `d3c45864916a5a982a59ae830634d9c87908d63684923094149e0902ed484e30`.
- Readonly https://bookings.zenchef.com/results?rid=83871&lang=fr&day=2026-10-23&pax=2 returned200; HTML SHA256 `4edc18fc24711f0d8e0349412f9c5d57127b6c1606c38fb5c492d957559b9673`. Correct rid/date/pax and Europe/Paris. Ordinary lunch20148 showed12:00/12:15/12:30/12:45/13:00/14:15/14:30/15:00/15:30/16:00/16:30 for two. Availability is not a hold or booking.
- Direct readonly https://bookings.zenchef.com/form?rid=83871&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200; HTML SHA256 `af4d11c806144e300c8f097327c8924dec603f55b4bbc9c38316e088e083d021`. Identity La Coupole, correct native wish, required first/last/email/phone/country/civility. No required custom fields. Voucher input remains unsupported.
- Current page references https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js ; fetched SHA256 `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`. Native code computes automatic using `is_auto || (is_auto_until !== undefined && pax <= is_auto_until)`. Lunch false/until6 permits two; this is not inference from a field name.

Exact pinned policy: shift20148/nameDéjeuner; confirmation false/numeric6; charge_param null; prepayment_param null; is_offer_requiredfalse/frompaxnull; cancellation cutoff10800 seconds relative to shift; EUR/fr; room selection and mandatory room false; wish roomnull/offers[]. Unknown/changed fields fail closed. No global manual-confirmation or card exception. Sanitized fixture retains only relevant public source fields and the lunch shift, without keys or capability data.

Restaurant notice says the table is no longer guaranteed after15minutes lateness and asks groups over6 to contact the restaurant if slots are unavailable. The entire raw notice is in terms.restaurantNotice; the latter group text does not expand scope.

## Existing-engine extension

La Coupole has its own explicit policy predicate. Only the two named no-room lunch venues reuse the existing Bofinger proof/notice/service code. Other venue policies are unchanged. Native no-room slots do not expose available_rooms; that is permitted only under these exact named policies.

Selection, frozen approval, reserve details and proof carry shiftId20148. attempt.details.shiftId must survive durable storage and match; a mismatch stops before supplier transport. Proof is bookingEvidence=own_booking_readback plus shiftId20148. Shared integration must extend226's scoped ledger/journal/projection checks to this ID/shift/party2, retaining Bofinger19170.

terms.version hashes `[nativeEulaText, restaurantComment, shift]`; review fingerprint binds details and version. Policy and digest are rechecked before review/submit. Existing UI must show restaurantNotice as text with br normalized to newline and retain the same approval/version binding.

The first permitted mutation remains exact native bookingPOST only after explicit consent, terms acceptance and durable sendAllowedtrue. No earlier cart/hold request is enabled. Same-attempt UUID/rid ownGET, saved id/date/time/pax/confirmed status and absence of payment/error are required. Service is bound through validated native selection/frozen approval/durable attempt and matching saved date/time/pax, not an invented raw receipt shift_id. Empty saved booking_offers and no chosen room are conservative receipt requirements; missing/unknown data yields unknown. Actual La Coupole final receipt structure remains unverified. POST echo alone never confirms.

## Verification and release boundary

One guarded actual adapter preparation reached contact for12:00 on23October,party2, showing six empty contact fields and native EULA/notice. canSubmitfalse, checkoutBlockersubmission_disabled,51blockedrequests. No guest data entered, no contact/code/booking/hold/cart/payment/restaurant message or actual receipt/capability request. Guard allowed only already-scoped public GET preparation resources, blocked unreviewed traffic and service workers. No access-control bypass.

Local Chromium replay covers synthetic ownGET success; missing/wrong saved fields, pending or unexpected offers; card/manual policy change; stale notice; wrong durable service. Captured source checks all11lunchslots, absent policy fields, null/string/changed threshold and exclusion of breakfast/dinner/Bofinger services and party3. These are local source-derived/mock tests, not real bookings.

32d5 alone owns catalog/app/server/ledger/integration/release. Requires independent exact-SHA review and real app/API/Chromium/SQLite QA with simulated supplier mutation, then CI and release-owner publication. No shared files or activation included in this provider PR.

Validation result: node --test scripts/test-zenchef-playwright.mjs passed20/20, including unchanged Bofinger and De Kas regression paths. git diff --check passed.
