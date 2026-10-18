# Brasserie Rosie Lou — weekday lunch for exactly two

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main237 56eb3085f2c562033c3d46ca0e2d608f8f12dbe0. Canonical `curated-PAR-brasserie-rosie-lou` confirmed by 32d5; export ZENCHEF_ROSIELOU. Only native weekday lunch118503, exactly two. No dinner, groups, other Rosie branch, room or terrace guarantee.

## Current sources, checked 2026-10-18

https://brasseriesalamode.com/brasserie-rosie-lou returned200, SHA256 `6f3021efcf785ad362db49c9a3e846e9b63c7d9a1e522da80180ba83fd7d16f7`. Own address31 boulevard de Bonne Nouvelle,75002 Paris. Named open-reserver data-id=nos-etablissements/brasserie-rosie-lou links directly to https://bookings.zenchef.com/results?rid=361941; own widget agrees. Other restaurant links are excluded.

One readonly https://bookings.zenchef.com/results?rid=361941&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `961e93f50a981bf2cb4423e7e2b129f807c0419c6e438b5f91a5b0d5ae658a03`. Native name `Brasserie Rosie-Lou (Bonne Nouvelle)`, address31 Boulevard BONNE NOUVELLE, PARIS, fr/EUR/Europe/Paris. Wish date/party match, offers empty, room null, no room selection/mandatory room.

Own policy: service118503 `Service midi semaine`; automatic true/until null; charge askable true/min_guests5/charge_per_guests10; prepayment null; required offer false/from pax null; cancellation cutoff **43200 seconds relative to booking**. Party two is below the card threshold. Missing or changed typed policy fails closed. Rosie's21600-second cutoff is not used.

Ten observed times for two:12:00,12:15,12:30,12:45,13:00,13:15,13:30,13:45,14:00,14:15. These are observations, not holds/bookings. Named weekday lunch is the supported service; no inherited fixed time list or calendar guard. Dinner118508 is excluded. No date-specific notice on the observed day; no annual exclusion established or copied.

Readonly https://bookings.zenchef.com/form?rid=361941&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `2c37e397152fbaf5936bef33a3b71c3e79ea01f7fef625583a2ba9950f31e432`. Six required contact fields: first/last/email/phone/country/civility. Custom fields empty, voucher hidden. Room/terrace labels do not establish a seating guarantee; no room selected.

Current referenced form bundles fetched and hash-matched to reviewed source:

- `_app-30bffcb9f4c3b7b2.js`: `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own French notice addresses Loupiots and describes an Atlantic setting. It explicitly holds tables15 minutes, no more; invites guests to visit/call if full without guaranteeing availability; directs parties **above12** to the group form. Preserve complete raw FR notice with safe text/line-break rendering. This is independently captured, not Rosie's Rositos/above16 notice.

## Integration and verification boundaries

Only provider/tests/sanitized fixture/docs changed. Existing named no-room engine reused. 32d5 owns registry/API/UI/ledger/journal and must bind canonical/rid361941/party2/shift118503 through approval, durable reserve/record/proof/snapshot. Native EULA/restaurantComment/shift digest versions the complete terms and is rechecked before review/final submit.

First permitted write is exact native final booking POST after explicit final consent, terms acceptance and durable sendAllowed grant. Only the UUID created by that same attempt permits independent own-booking GET. Saved reference/date/time/pax/confirmed status must match with no charge/action/error, empty offers and no chosen room. POST echo never confirms. Service binding uses validated shift, frozen approval, durable attempt.details.shiftId and matching saved details, not an invented raw receipt shift field. Actual final receipt structure unverified; unknown stays unknown.

Guarded actual Chromium form GET rendered empty firstname and native EULA;12 requests blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact/code input, hold/cart/reservation/payment/message/capability/receipt read, bypass or repeated results/date probe.

Synthetic browser cases cover own-readback success, missing/pending/wrong date/party/offer, lowered card threshold, manual policy, stale notice and wrong durable service. Captured-source tests pin ten slots, field/type completeness, booking-relative43200 cutoff, dinner exclusion and party-three rejection. Synthetic receipts/fixture dates are not real reservations or current availability.

Independent exact-SHA review, actual app QA with simulated mutations and publication remain with32d5. Parked identities excluded from clean branch.

Validation: node --test scripts/test-zenchef-playwright.mjs — 31/31 PASS, zero failures (146.13 seconds). git diff --check PASS.
