# ZEN: ordinary dinner for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Base main263 0323dd699e4363a706fba6749e05f73dc197c7f5. Canonical curated-PAR-zen-restaurant; export ZENCHEF_ZENRESTAURANT; flag VELVET_ZENCHEF_ZENRESTAURANT. Shared integration/release solely 32d5; isolated identity f7784ab285f02395f2b276320a243d43cc924efc.

## Evidence on 2026-10-18

Reused official https://www.zenrestaurantparis.fr/en/reservation/ from C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/zen-restaurant-official-20261018.html SHA256 5a0a241c147c444edfaf8fbe9bd7487cf5f8dbbf53c902f314912aafcd8c47dc. Own ZEN, 8 rue de L'Echelle 75001 Paris, 0142619399, actual ordinary reservation iframe https://bookings.zenchef.com/results?rid=359831&pid=1001. Separate private Omakase form is not ordinary dinner. No duplicate official request.

One results GET https://bookings.zenchef.com/results?rid=359831&pid=1001&lang=fr&day=2026-10-23&pax=2 returned 200, SHA256 0d5b4011b24f754b24cce40fbd4fe2386ecfb552b2b6ab3c94e820b9ca8aecfb.
One conditional form GET https://bookings.zenchef.com/form?rid=359831&pid=1001&lang=fr&day=2026-10-23&pax=2&slot=19%3A00 returned 200/page form, SHA256 e1804b4d3f83841a0a2383493fb77000d6496b6f0ed473330617b2c35a29d48a.
Own native identity ZEN/8 Rue de l'Échelle/75001 and policy agree. Raw files work/zen-restaurant-results.html and -form.html; parsed -state.json and -form-state.json. No further native requests or browser/receipt reads.

Own DINNER shift192088, exact label Dîner, exactly two, auto false/until4, charge/prepayment null, cancellation 86400 seconds SHIFT (24 hours, not seating duration). Five observed candidates 19:00,19:30,20:00,21:00,21:30; not holds or confirmed availability at a future time. Explicit query pid and state partner_id string1001. No room selection, no mandatory room, wish.room_id null, selected wish.offers empty. Six standard fields; customFields and customFieldsV2 empty; voucher hidden, shift comment null.

## Optional offer threshold, narrowly scoped

Raw and shift catalog contain private Omakase offer66398, min8/max30, 80 EUR per person, 30% deposit (24 EUR per person), seven days ahead, room99264. Shift offer config is_limited_to_pax true/min_pax_available8; is_private and has_prepayment true. It is NOT selected and NOT required for this ordinary two-person dinner.
Own shift is_offer_required true/offer_required_from_pax9. Cached native app function at JS UTF16 offset400327:
isOfferRequiredInShiftForPax:(0,y.iB)(function(e,r){var o;return e.is_offer_required&&(null!=(o=e.offer_required_from_pax)?o:0)<=r})
At two this is false. No generic required-offer guard weakened. Named exact typed threshold9 policy only for own venue/shift; changes fail closed.

Existing cached app _app-30bffcb9f4c3b7b2.js SHA256 f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd and form-84144e7c9a8b854d.js SHA256 b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4 references match these pages. No fresh assets/hash claim.

## Notices and shared integration contract

Preserve full bilingual restaurantComment verbatim, including discrepancy: French says contact for eight or more/current service; English says nine or more. Do not normalize them to the same number. French says lunch cannot be reserved; groups of three or more OR busy periods may be downstairs. Exactly two does not guarantee any floor. Ordinary dinner only, lunch and private Omakase unsupported. No automatic offer choice/deposit/payment, no invented seating duration.

Keep existing consent, owner/session/revision/TTL, fresh policy/notice verification, durable attempt.details.shiftId192088, one final native POST and independent same-attempt own-booking readback. POST echo never confirms. Missing/mismatched/pending receipt remains unknown and locked. No real supplier receipt shape was established by these synthetic tests.

32d5 owns catalog/server/ledger/journal/UI integration, ordinary dinner wording, no floor guarantee, 24-hour cancellation, raw bilingual notice display before consent, cached native EULA/notice verification through ce5c, independent review and actual app QA/publication. No self-merge/deploy.

## Validation

Focused test command: ZENCHEF_TEST_SCENARIO_PREFIX=zenrestaurant node --test --test-name-pattern='native booking and own-booking|ZEN ordinary|ZEN fresh' scripts/test-zenchef-playwright.mjs.
PASS 3/3: browser test with ten synthetic scenarios plus two own pure/fresh-form tests. Covers positive, missing/pending/wrong date/party/selected offer readback, card/manual/stale changes, wrong durable shift; five actual candidate times, identity, exact threshold, optional versus selected offer, other-venue exclusion, pid types, parties, rooms, cancellation and raw FR/EN notice changes, unexpected required/custom fields. Empty custom field arrays are explicitly bound in own policy.
Draft test failures caught an overly broad template schema inclusion and missing custom-field guard; corrected and all focused tests passed. Syntax and diff checks pass. No broad old matrices repeated. Only provider, tests, own fixture and this handoff changed; no real reservation/hold/payment/contact/message/capability/receipt operations.
