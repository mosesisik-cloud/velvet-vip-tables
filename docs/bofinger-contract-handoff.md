# Bofinger — ordinary lunch for two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Canonical ID `curated-PAR-bofinger` reserved by shared integrator32d5. Provider84941, Paris, 5–7 rue de la Bastille75004. Only lunch19170 and exactly two guests are implemented. Shared catalog/server/journal/UI/release remain32d5-owned.

## Source evidence, 2026-10-18

- Official https://www.bofingerparis.com/ identifies the restaurant and ordinary Zenchef84941 entry. HTML SHA256 `d292789b6edb89e78282b5f50aa6611a37ba9f532fa24bbf7dacba965f9b9543`.
- Readonly https://bookings.zenchef.com/results?rid=84941&lang=fr&day=2026-10-23&pax=2 returned200. SHA256 `9ed93b75f4151f8e0e013c695d8a202e7e2ed90e28b2c800fcbea4274c888409`. Lunch19170 had12:00/12:30/13:00/14:30 for two. These are observed availability, not holds or guarantees. Native no-room-selection slots lack available_rooms; the exception is scoped only to Bofinger with matching policy.
- Direct readonly https://bookings.zenchef.com/form?rid=84941&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200. SHA256 `c7365237b86a33f27dae0ad2996575c4be5d9517e83cda13e11d3f2bb34ecbb0`. Correct restaurant/date/pax/slot, required native first/last/email/phone/country/civility; optional gift code stays unsupported.
- Current public form bundle https://bookings.zenchef.com/_next/static/chunks/pages/form-84144e7c9a8b854d.js SHA256 `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4` computes automatic as `is_auto || (is_auto_until !== undefined && pax <= is_auto_until)`. Thus false plus numeric6 permits two; false alone does NOT establish manual confirmation. This does not reopen Grand Colbert, whose thresholds were null/0.

The exact lunch policy is confirmation false/until6; charge web-askable false/min6/perguest10; prepayment null; offer-required false/frompax null; cancellation cutoff172800 seconds relative to shift; EUR/fr/EuropeParis; room selection false. Unknown or changed policy blocks. No dinner expansion. Restaurant says the table is no longer guaranteed after15minutes lateness. Raw native notice is included in `terms.restaurantNotice`.

## Implementation and integration contract

Reuse existing Zenchef browser/session/network/journal engine. No new engine or generic policy relaxation. Search and fresh native form verify the fixed policy. Review and submit recheck source policy and terms digest. `terms.version` hashes `[nativeEulaText, restaurantComment, shift]`; review fingerprint also binds details. UI must show the restaurantNotice safely as text (normalize the native br tag if desired), plus native EULA, and bind the existing version/token. `terms.text` alone is the EULA, not the restaurant notice.

Selection/frozen approval includes shiftId19170; reserve details includes shiftId19170. Returned durable attempt MUST retain matching `details.shiftId` or provider fails closed before booking transport. Shared journal must preserve/check this binding along with restaurant/pax2/session/fingerprint. Confirmation proof adds `bookingEvidence: own_booking_readback` and `shiftId:19170`; shared result projection and journal validator must retain/check those fields. No catalog or activation is included in this PR.

The only booking mutation is the existing exact native bookingPOST after explicit final consent and durable sendAllowedtrue. POST echo is never final Bofinger confirmation. OwnGET is restricted to the UUID from that same attempt and restaurant84941. Saved id/date/time/pax/confirmed status must match, with optional UUID/date metadata consistency and no charge/action/error. No chosen room and explicit empty booking_offers are required conservatively; absence produces unknown. This empty-offers response requirement has not been verified against a real Bofinger booking. Service19170 is proven by validated native selected service plus frozen approval/durable attempt and saved date/time/pax, not by an invented raw receipt shift_id. Capability never appears in public proof.

## Validation and limits

The guarded existing adapter reached the actual native contact page for12:00 on23October, party2, with six empty contact fields, native EULA and restaurant notice. `checkoutBlocker=submission_disabled`, canSubmitfalse,44blockedrequests. No fields filled, contact/code submission, hold/cart, booking, payment or real capability read. Public GETs and current static assets only were permitted by the existing guard; service workers and unreviewed traffic were blocked.

Local Chromium contract replay covers successful synthetic ownGET, missing/wrong saved date or party, pending response, unexpected offer, card/manual policy changes, stale notice and wrong durable service. Separate captured-source test checks observed lunch slots and missing/null/string/changed thresholds. Synthetic results are not supplier-confirmed bookings. Existing venue regressions run in the same test suite.

Release requires32d5 shared integration, independent exact-SHA review, app/API/Chromium/SQLite QA, CI and release-owner publication. Actual final provider booking remains unverified; no development reservation is authorized.

Test result: node --test scripts/test-zenchef-playwright.mjs passed19/19. Expanded missing-policy-field test separately passed1/1. git diff --check passed.
