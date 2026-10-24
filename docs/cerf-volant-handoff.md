# Le Cerf-Volant handoff

Refs #129. Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base public293/fa6ec7ca12f035eb67dcda2139ca0f24ee8ce03b. Four provider/test/fixture/handoff files only;32d5 owns shared integration, app QA, review and release. Reserved curated-LYO-le-cerf-volant / ZENCHEF_LE_CERF_VOLANT / VELVET_ZENCHEF_LE_CERF_VOLANT.

## Own provenance and weekday scope

Fresh https://lecerf-volant.fr/ contains `zc-widget-config data-restaurant="378221"` and injects https://sdk.zenchef.com/v1/sdk.min.js. Its own referenced /assets/index-BlAHWJCf.js renders buttons with `data-zc-action="open"`. The original SDK, replayed offline with that exact config and button, builds https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=378221&showCollapsed=1. No guessed pid and no reliance on a third-party restaurant ID.

Own root address186 avenue des Frères Lumière,Lyon69008; provider186 Av. des Frères Lumières,Lyon69008,+33743662621 matches own site contact. Dedup found no existing identity/rid. Official JS states `Le Midi`, `Lun. au Ven. 12h - 14h30`; its menu metadata says `Lun. au Ven. 12h – 13h30`. Both weekday statements support Monday-Friday lunch; closing-time discrepancy is retained here and does not extend the provider's13:30 boundary. No seating duration is inferred.

Only live results query: future26October2026, two guests, selected from clock24October2026. Own lunch325474/Service déjeuner has seven raw quarter-hour slots12:00–13:30, five available for two:12:00,12:30,13:00,13:15,13:30.12:15/12:45 have no normal availability and are excluded. All seven complete slot policies are pinned. Confirmation true/null, no charge/prepayment, cancellation10800seconds relative to shift. Per-slot deadline equals its start; shift deadline13:30. Opening timestamps stay exactly2026-07-28 13:00:00, without inferred rolling90-day normalization. Dinner326873, other party sizes, waitlists and weekends excluded.

Full original French notice is exposed before consent: lunch can be booked online, dinner generally needs no booking, groups over10 should email, and a call is appreciated for late arrival. No contact instruction was acted upon. Selected-day notice must be null. Complete notices and policy are fingerprinted and rechecked before review/send.

## Original form and narrow adapter changes

One empty12:00 form GET. Own build efdbafc656 uses the SDK collapsed launcher. Initial replay correctly showed only `Réserver une table`; clicking its actual `bookings-btn` reveals the contact form without changing URL or NEXT data. A venue-specific method follows the existing native-launcher pattern, checking query, SDK state, identity, own policy and selected availability before clicking. No query rewrite, forced application state or alternate route.

No room selection, wish.room_id null, no custom fields or offers. Complete room metadata is pinned. Partner ID absent in source; original createBookingData uses string1001 fallback. VoucherParam5503 is tablebooker with its own shop ID and null payment provider fields; all raw fields pinned. Connected vouchers false does NOT imply no voucher input: original DOM shows `input[name=voucher][data-testid=voucher-validate-code-input]` and disabled `voucher-validate-code-btn` labelled Appliquer. The adapter requires one visible enabled optional text input, empty value, and one visible disabled Apply button before review/send. It never applies a code or accesses shop/payment routes. Source voucherCodes and outbound payload must remain empty; independent receipt must have no room/offers.

Original client createBookingData, booking POST route, getByUuid and status mapping inspected. Only independent saved-booking readback may confirm; POST echo remains unknown. Durable shift/date/time/party binding and duplicate protection reused.

## Evidence and verification

Raw originals: C:/Users/moses.isik/Documents/Codex/2026-10-16/files-pasted-by-the-user-ja-8/evidence/cerf-volant/. Fixture holds exact URLs/timestamps, safe full policy projection and hashes. SHA256:

- root4116bytes:4a8db1c668726d65186715f2d972431e7224d921410345c29c9eb494c6be73ff
- officialJS1076071bytes:df62c2e7f5c9e0b525313c819e72313166b83a0eb8c3c3f85a882d3085a68436
- SDK19582bytes:f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c
- results158826bytes:e629d0457050e58607709850cc9c38372c1d83f2428f65b42ce0d3bedde43cf6
- form159692bytes:8be66ac93cded3c7ca70fe4a1004accb91ce97cb29df0e3a926938677ac9a878

27 exact original HTML script/CSS references hash-verified:10 newly downloaded own referenced assets,17 existing exact-URL cache matches. Manifest includes reuse status; count is references, not execution count. Eight native evidence files include SDK entry proof, original390/1366 empty form and actual adapter contact replay. All original-client replays offline, own summary held only in harness until teardown; all mutation/foreign requests aborted. WAF script and Unleash requests were blocked, not bypassed. No entered guest data, consent or final submit. Phone flag images blocked. Screens visually inspected.

Dedicated tests5/5 PASS with8 synthetic browser cases, including original-style collapsed launcher, DOM voucher drift before review/send, changed policy, wrong durable shift, denied journal, mismatched/offer-bearing receipt and duplicate prevention. Per-slot expiry and fixed opening-date drift tested. Actual adapter reaches empty contact and native verification on original assets. No real reservation/hold/payment/contact. Synthetic final submission is not a real provider-confirmed full flow. Public release requires32d5 app checks and receipt.
