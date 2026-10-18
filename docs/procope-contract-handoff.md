# Le Procope — first lunch sitting for exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Main228 base83c86a5104604cd494bc24c7b2b85a91e078a1ef. Canonical `curated-PAR-le-procope` reserved by32d5 after duplicate check.

Identity: Le Procope,13 rue de l'Ancienne Comédie,75006Paris, phone+33140467900. Scope is only first lunch sitting18190, native name Déjeuner 1er service, exactly two. Second lunch, afternoon/café, both dinners and groups are excluded.

## Evidence, 2026-10-18

Official individual-reservation page https://www.procope.com/o/reserver/?no_redirect=true contains the native iframe for250682 and matching window.restaurantId. HTML SHA256 `1158a48ba5dcf6a48a93dc6fb759ee3cb87dd73484dc61bc3b85990ea9007c68`. Native results independently match the restaurant/address/phone.

One readonly results GET https://bookings.zenchef.com/results?rid=250682&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `a999013ea8de93e02812b38848128d4b8c84a5e3fbf4d36053eacdf2013ce857`. First lunch18190 showed12:00/12:15/12:30/12:45/13:00 for two. Availability is not a hold or guaranteed booking.

Readonly native form https://bookings.zenchef.com/form?rid=250682&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `3ff424d22e4426db661619e32364739d5e0b5b272469e1023ea619d52738ba99`. Correct name/wish/date/pax/slot. Required first/last/email/phone/country/civility; optional voucher/gift code unsupported.

Current referenced form asset https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js was fetched and hashes exactly to previously reviewed `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`. Reuse its explicit automatic computation: is_auto OR (is_auto_until not undefined AND pax<=is_auto_until). False/until4 permits two; no new inferred semantics.

Pinned policy:18190/nameDéjeuner1erservice, confirmation false/numeric4, charge_paramnull, prepayment_paramnull, required-offerfalse/frompaxnull, cancellation cutoff86400 seconds relative to shift. EUR/fr/EuropeParis, no room selection/mandatory room, wish roomnull/offers[]. Missing/unknown/changed policy blocks. Native turn-time display is false. No card exception or other-service expansion.

**Notice is different from the prior Paris venues:** it says the café salon is walk-in Monday–Friday15:30–17:30 and groups over9 should use the site's group tab. It contains no15-minute late-arrival guarantee rule. Do not copy that rule into this venue's UI. Preserve the full native notice as terms.restaurantNotice without implying café booking support.

## Provider and shared integration

Only provider/test/sanitized source fixture/docs changed. Reuse the existing explicit no-room lunch engine and add one separately pinned policy. Existing restaurants retain their predicates.

Native selection, frozen approval, reserve details and verification carry shiftId18190. Durable attempt.details.shiftId must survive and match before transport. Shared integration must extend scoped ledger/journal/projection checks to this canonical ID/party2/18190 and require bookingEvidence=own_booking_readback. Display first lunch sitting, not every Procope booking service.

terms.version hashes `[nativeEulaText, restaurantComment, shift]`; fingerprint binds details/version. Review and submit recheck policy/terms. UI safely renders restaurantNotice as text with br normalized; same version/approval binding as the existing engine.

The only enabled mutation is exact native bookingPOST following explicit final consent, accepted terms and durable sendAllowedtrue. No early hold/cart allowed. Independent ownGET uses same-attempt createdUUID and rid250682; saved id/date/time/pax/confirmed status must match with no charge/action/error. Service is bound via validated native selection/frozen approval/durable attempt and saved date/time/pax, not an invented raw receipt shift_id. Conservative explicit empty booking_offers/no chosen room are required; unknown receipt shape remains unknown. Actual Procope final receipt has not been verified. POST echo cannot confirm.

## Validation boundaries

A guarded actual Chromium form GET using allowedZenchefPreparationRequest rendered the empty first-name field and native EULA;14 requests blocked. Service workers blocked, no redirects, only existing allowed reads/resources. No fields filled, contacts/codes submitted, time-click mutation, real reservation/hold/cart/payment/restaurant message or capability/readback access. No bypass and no repeated results probe.

Local replay tests cover synthetic ownGET success; missing/wrong receipt fields, pending/offer mismatch, card/manual policy change, stale notice and wrong durable service. Captured-source tests verify five lunch slots, missing policy fields, changed/null/string thresholds, wrong service and party3. Tests are synthetic/source-based, never actual bookings.

32d5 alone integrates catalog/app/server/ledger, routes independent exact-SHA review and actual app/API/Chromium/SQLite QA, then CI/release. No activation/publication is included in this provider PR.

Validation result: Zenchef suite22/22 PASS including prior Bofinger/La Coupole/Terminus/De Kas regressions. git diff --check PASS.
