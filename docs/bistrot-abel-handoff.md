# Bistrot Abel provider handoff

Refs #129. Owner `codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939`, chat `01a141e3-6cf0-7ef1-8908-41a5840b1b4e`. Base public285/main `d3fa758181fb84acdd3ba860f2d0b1f871812af3`. 32d5 alone owns shared identity/app/server/integration/release. This four-file delivery is provider, dedicated test, own fixture and this handoff.

## Identity and scope

Canonical `curated-LYO-bistrot-abel`, export `ZENCHEF_BISTROT_ABEL`, requested integration flag `VELVET_ZENCHEF_BISTROT_ABEL`. Own name BISTROT ABEL; provider name Le Bistrot d’Abel, 49 Rue de la Bourse, 69002 Lyon, +33 4 37 57 92 51. This is a separate establishment from Café Comptoir Abel at25RueGuynemer. Normalized identity/ID search found only the latter’s explicit distinction/recommendation documentation, no catalog/provider duplicate.

Own contact page `https://www.maisonabel.fr/maison-abel/contact/` explicitly associates this Bistrot row with `https://bookings.zenchef.com/results?rid=357746&fullscreen=1`. The page also contains a separate Café Comptoir link; it was not followed. No route was derived from another restaurant’s suggestions. Visible Bistrot telephone matches the provider; a nested contact-page accessibility label retains the other establishment’s telephone, so the visible Bistrot text and provider match are the identity evidence.

Initial implementation scope: Monday–Friday, exactly two guests, lunch77813, seven quarter-hour slots12:00–13:30. Confirmation false/until8 is the existing automatic-below-threshold contract, not false/null manual confirmation. Card/prepayment null. Cancellation10,800seconds relative to shift. No selected room, offer, gift or waiting list. Every lunch slot and the shift itself closes booking at11:45 local time on the selected date; this is not the slot’s own start time. Date normalization changes only the exact selected-day prefix of that11:45 cutoff. Other policy and capacity fields are pinned to this own source.

The full multilingual restaurant notice is retained and fingerprinted. The original French notice is exposed before consent:15-minute lateness cancellation, no terrace reservations, email contact above eight guests, and the generic first-service21:30 statement. That last statement is not relabeled as a lunch seating duration. The English-key source happens to contain the same French text; it is not invented translation. Specific-day notice must remain null.

Global offers25228 and27477 are historical2024 event menus, with active flags still set. Their complete metadata is pinned; the current wish and lunch policy select no offer. They are not discarded or offered to guests. Optional legacy gift3107 has its own exact metadata; connected vouchers are true and voucherParam is absent. Original DOM exposes the existing optional empty input#mybeezbox/“Votre code cadeau”; reuse only its verified DOM guard, not Café Comptoir’s metadata. Ordinary outbound payload rejects gift, room and menu values.

Provider destination is Lyon. Shared intent details remain date/time/party/shiftId, plus six standard contact fields in contact snapshots. Approval binds shift77813, party2 and supported time; the durable attempt must match. Confirmation requires independent same-attempt saved-booking readback with matching date/time/party, no room and empty booking_offers. A POST echo is insufficient; unknown outcomes cannot be resubmitted.

## Source and original client

Captured22October2026 for23October. Exactly one own contact-page GET, one results search and one empty-form GET. The results search adds only day2026-10-23/pax2; form additionally adds slot12:00. No language, partner, SDK, room or menu parameters were invented. Original byte hashes:

- Contact page: `a4e6c47ea9583037e701903c8058dcb113313bcbb35ec1efa827432c2e456efe`.
- Results: `83e0ef6b737718182c283fd4999f731578d282ae741c6a9cc5a60cd36b283315`.
- Form: `8e855f121a745ec685f62bceba1a1026f068a7701e2428428e31ac62ba05a475`.

Own build is907c2a6d69. The first offline replay lacked this new build’s assets; it was retried after fetching exactly the27 unique script/CSS references in the saved pages (26new, one already saved). Hashes and reuse flags are in the fixture. Static inspection of its own app bundle preserves createBookingData’s existing ordinary field shape, empty offers, default partner1001, optional voucher handling and booking.getByUuid readback/status mapping. No unknown new transaction contract is implemented.

The original client was replayed offline at390/1366, and both views inspected. The actual adapter then reached empty contact and passed its native verification; its gift/consent region was also inspected. Own availability summary was held only inside the offline harness until teardown; the production allowlist retains its normal own GET. All POSTs, including quotation-preview, were aborted. No foreign store is suggested by this source. No state injection, personal details, consent or final-submit click in original-client replay. Phone flag images were blocked.

Raw files: `C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/bistrot-abel/`. Full policy projection, exact query, source/native/asset hashes and limitations are in `scripts/fixtures/bistrot-abel-source.json`. Auth/payment secrets are excluded. Observed slots are a dated snapshot, never a guarantee of later availability.

## Verification and handoff boundary

- `node --test scripts/test-zenchef-bistrot-abel.mjs`:5/5 pass. Includes eight synthetic browser scenarios for matching receipt, gift before review/send, changed confirmation, wrong durable shift, denied grant, wrong guest-count receipt and nonempty offer receipt. Terminal cases reject duplicate submission.
- Explicit cutoff/date test preserves11:45 on a later weekday and yields no candidates at the cutoff, including local timezone handling across the daylight-saving change. An invented per-slot deadline is rejected.
- `node --test scripts/test-zenchef-abel.mjs`:4/4 pass, including its eight synthetic browser scenarios. Syntax, diff, original source hashes and full daily-policy projection checks pass.

No actual reservation, hold, payment or restaurant message. All final-send/readback tests are synthetic and distinct from empty-form original-client replay. No self-merge/publication. 32d5 retains shared integration, independent review/app QA and authorized release; this provider delivery is not itself a published flow or real supplier confirmation.
