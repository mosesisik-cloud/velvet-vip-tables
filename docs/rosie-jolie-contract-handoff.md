# Brasserie Rosie Jolie — ordinary lunch for exactly two

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main238 2c8666da1cd35189d89d8280240a004db45126e6. Canonical `curated-PAR-brasserie-rosie-jolie` confirmed by 32d5; export ZENCHEF_ROSIEJOLIE. Only lunch298043, exactly two. Other Rosie branches/Bigoudi/dinner/groups and room guarantees excluded.

## Sources checked 2026-10-18

https://brasseriesalamode.com/brasserie-rosie-jolie returned200, SHA256 `be7c273f5bff7131e9e07150875b93bbd625db244924f4abb6b102bede1cb948`. Own address38 avenue Raymond Poincaré,75116 Paris. Named open-reserver data-id=nos-etablissements/brasserie-rosie-jolie links directly to https://bookings.zenchef.com/results?rid=376490, matching own widget. Other named restaurant links are not used.

One readonly https://bookings.zenchef.com/results?rid=376490&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `3d2c1722e8545fb6917937fa2c2a873c79ecaabbd95f883e52fa551032440819`. Native identity Brasserie Rosie Jolie (Trocadéro),38 Avenue Raymond Poincaré,Paris matches. fr/EUR/Europe/Paris; wish date/party match, room null/offers empty, no room selection or mandatory room.

Own lunch policy:298043 `DÉJEUNER`, automatic true/until null, **charge null**, prepayment null, required offer false/from pax null, cancellation cutoff **21600 seconds relative to booking**. No Rosie/Lou card threshold is imported. Typed missing/changed policy fails closed. Dinner411615 is excluded.

Ten observed times for two:12:00,12:15,12:30,12:45,13:00,13:15,13:30,13:45,14:00,14:15. These are observations, not held/confirmed bookings. Scope is the named lunch; no unrelated fixed time list or weekday rule is added.

Readonly https://bookings.zenchef.com/form?rid=376490&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `9275016483f1f84236f57e68efedb5a3140331a1e75f64272bb7f30c531fdef9`. Required first/last/email/phone/country/civility; custom fields empty, voucher hidden. Native room/terrace labels grant no specific seating guarantee.

Current referenced bundles fetched and hash-matched to reviewed native source:

- `_app-30bffcb9f4c3b7b2.js`: `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

## Own notice and conservative summer scope

Current FR notice says the restaurant has a Provençal/French Riviera atmosphere, keeps the table15 minutes after reservation time, has summer closure3–23August inclusive, directs parties above16 to a group form, and states this reservation concerns only Rosie Jolie. The closure has **no year**. Other language strings differ and omit this closure; do not substitute them for the current French notice or import walk-in promises. Preserve full raw FR and all source strings in the version digest. No day-specific notice on the observed day.

Conservative implementation excludes **August3–23 inclusive every year** until clarified. This is an explicit supported-scope limit, **not proof of recurring annual closure**. 32d5 accepted this distinction and will mirror the limit in shared code. zenchefSearchUrl raises summer_date_unsupported; zenchefFormUrl calls it, including selection/request guarding and verifyNativeRoom during review/submit. Immutable approval and durable attempt bind the date. Boundaries August2/24 remain eligible for ordinary policy/availability validation, not guaranteed bookable. No August/date probe was made.

## Integration and verification boundaries

Only provider/tests/sanitized fixture/docs changed. Existing named no-room engine reused. Shared registry/API/UI/ledger/journal belongs to32d5: canonical/rid376490/party2/shift298043 and annual conservative summer limit must bind reserve/record/proof/snapshot and UI search/canSubmit/outcome. Terms digest uses native EULA/restaurantComment/shift and is rechecked before review/final submit.

First permitted write is exact final native booking POST after explicit consent, terms acceptance and durable sendAllowed grant. Only its same-attempt UUID permits independent own-booking GET. Saved reference/date/time/pax/confirmed status must match, no charge/action/error, empty offers/no chosen room. POST echo cannot confirm. Service binds via native validated shift, frozen approval and durable attempt.details.shiftId plus matching saved details, not invented receipt shift fields. Actual final receipt remains unverified; unknown stays unknown.

Guarded actual Chromium form GET rendered empty firstname/native EULA;12 requests blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact/code input, hold/cart/reservation/payment/message/capability/receipt read or bypass; no repeated results/date probe.

Synthetic browser cases cover success, missing/pending/wrong date/party/offer, card/manual changes, stale notice and wrong durable service. Captured-source tests pin slots, exact typed policy/cancellation, excluded services and summer-boundary rejection/acceptance in2026 and2030 through both search/form guards. Synthetic dates/receipts are not live availability or actual reservations.

Independent exact-SHA review, actual app QA with simulated mutations and publication remain with32d5. Parked identities excluded from clean branch.

Validation: node --test scripts/test-zenchef-playwright.mjs — 32/32 PASS, zero failures (113.43 seconds). git diff --check PASS.
