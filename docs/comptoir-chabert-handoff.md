# Comptoir Chabert provider handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public286/main a8f7e1a40604902ddf999b1cdbbdec0cb0c3d6b6. Four-file provider delivery only; 32d5 retains shared integration, independent review, app QA and release.

Canonical `curated-LYO-comptoir-chabert`; export `ZENCHEF_COMPTOIR_CHABERT`; reserved flag `VELVET_ZENCHEF_COMPTOIR_CHABERT`. Identity: COMPTOIR CHABERT, 14 QUAI ROMAIN ROLLAND, 69005 LYON, +33478429965, rid354752. Normalized name/address/telephone/rid scan found no existing entry on the base.

Own https://www.chezchabert.com/informations-contact/ supplies ReserveAction https://www.chezchabert.com/reserver-une-table/?rid=354752&lang=fr. Its observed301 supplies https://bookings.zenchef.com/results?rid=354752&fullscreen&lang=fr&withCloseButton=1. Empty fullscreen is intentional. Exactly one results query adds day2026-10-23/pax2; one empty form read adds slot12:00. No further date, capability, hold, contact, payment or booking request.

## Qualified contract

Monday-Friday, exactly two guests, lunch41399 MIDI, five quarter-hour starts12:00–13:00. Confirmation false/until10 uses the existing automatic-below-threshold contract. Charge and prepayment null. Cancellation18000 seconds relative to shift. Every lunch slot and shift has selected-day11:59 cutoff. Only that exact date prefix is normalized; all other shift/capacity/slot policy remains pinned. Weekend, other party sizes, other shifts and changed policy fail closed. Observed slots are a dated snapshot, not a future availability guarantee.

Rooms19378/22130/22131 exist but selection is disabled and optional; wish.room_id must remain null. Offers and shiftMenus are empty; wish.offers remains empty. No custom fields. Required contact fields include civility, name, email, phone and country and match the existing six-field flow. Original client exposes no gift input. hasConnectedVouchers=false, shouldDisplayShopVoucher=true, voucherParam574/version tablebooker has null shop/payment-provider fields: preserve and fingerprint this own metadata, never substitute Abel metadata. No voucher or room/offer payload is permitted. Global French notice is retained verbatim; selected-day notice must be null. No invented lateness or seating-time condition.

Query binds own rid, empty fullscreen, langfr, withCloseButton1, day, pax2 and optional slot; unknown query keys fail. Terms and metadata checked again before review/send. Approval binds own shift41399, party2 and supported time; durable attempt mismatch prevents sending. Independent saved-booking readback must match date/time/party, no room and empty offers. POST echo cannot confirm; uncertain outcomes cannot be retried as a new booking.

## Evidence and checks

Own originals captured22October2026:
- root200 SHA0205223b8317c212b395235ebbb4f51e00cc0a3d6488e227e44ed244cc73656c
- entry301 empty SHAe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- results200 SHA8cb3d1533d0308599b17e0b71191dbd4bd38f612c490d63b7059c463d1ec0bdd
- form200 SHAf665e5f50aa86dd3697a7cec0d2e56b89beef4d903065489a76b4df792b355b5

Own build907c2a6d69 references27 script/CSS resources, all matched by exact URL and SHA to locally cached originals. No new asset requests or Bistrot Abel retest. Existing original client supports ordinary createBookingData and saved booking getByUuid/status mapping. No new engine or transaction API.

Original unmodified client replayed offline at390/1366 and inspected; actual adapter reached empty contact and passed native verification. All network traffic intercepted locally. Own summary refresh held only in harness until teardown; mutations aborted. No contact values entered, consent or final button clicked. Phone flag images blocked. Full original hashes, raw safe policy projection, native image/JSON hashes and asset manifest are in `scripts/fixtures/comptoir-chabert-source.json`. Raw local evidence: C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/comptoir-chabert/.

`node --test scripts/test-zenchef-chabert.mjs`:5/5 PASS, including eight synthetic browser scenarios: matched confirmation, voucher drift before review/send, changed confirmation, wrong durable shift, denied grant, wrong guest-count receipt and offer-bearing receipt. Duplicate submission is blocked. Separate cutoff test covers a later weekday after DST and expiration at11:59 local. Original hashes, full daily-policy projection,27 asset hashes, syntax and git diff checks pass.

No actual supplier reservation/hold/payment or message. Synthetic final-send/readback proof is distinct from original-client empty-form proof. This PR does not itself publish the app; shared integration and public receipt belong to32d5.
