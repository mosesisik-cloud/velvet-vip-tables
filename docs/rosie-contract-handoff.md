# Brasserie Rosie (Bastille) — weekday lunch for exactly two

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main236 a7ce120ceeed6af0e262bc3c66cfe45734fd740d. Canonical `curated-PAR-brasserie-rosie` confirmed by 32d5. Export ZENCHEF_ROSIE. Only native weekday lunch 43203, `Midi Semaine`, party two; no dinner, groups, room/terrace guarantee or other Rosie branch.

## Official and native evidence, 2026-10-18

https://brasseriesalamode.com/brasserie-rosie returned 200, SHA256 `555ddd9f4aa984a0835b360bed4c42c9ec8b969d75a23aa1ae765c2f040d43ee`. Own address 53 rue du Faubourg Saint-Antoine, 75011 Paris. Named a.open-reserver data-id=nos-etablissements/brasserie-rosie links directly to https://bookings.zenchef.com/results?rid=355132, with matching widget data-restaurant=355132. Rosie Lou, Rosie Jolie and Bigoudi are separate and excluded.

One readonly https://bookings.zenchef.com/results?rid=355132&lang=fr&day=2026-10-23&pax=2 returned 200, SHA256 `ad27fb8000d85b4d3a3b734eb463f9c85b0ca6674b3c7be8dea21d1fcb695405`. Native `Brasserie Rosie (Bastille)`, 53 Rue du Faubourg Saint-Antoine, Paris, fr/EUR/Europe/Paris. Wish matches date/party, room null/offers empty, room selection and mandatory room false.

Own exact lunch policy: 43203 / Midi Semaine; confirmation true/until null; charge askable true/min_guests 5/charge_per_guests 10; prepayment null; required offer false/from pax null; cancellation cutoff **21600 seconds relative to booking**. Party two is below the card threshold. Missing or changed typed values fail closed. This does not use République's shift-relative cancellation or Pigalle's card policy.

Ten observed times for two: 12:00,12:15,12:30,12:45,13:00,13:15,13:30,13:45,14:00,14:15. Times are observations, not holds or bookings. The named lunch service is the scope; no unrelated hardcoded time list or guessed weekday/calendar rule is added. Dinner80093 is excluded despite its own separate policy. No date-specific notice on the observed day; no annual rule established or copied.

Readonly https://bookings.zenchef.com/form?rid=355132&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned 200, SHA256 `d473a1e75c3f4a60021f99563804254e2b31ffdb753f841f69c2ccc738e865f2`. Required first/last/email/phone/country/civility, no custom fields, voucher hidden. Native room/terrace labels do not promise specific seating; no room selected.

Current referenced form bundles were fetched and matched reviewed source:

- `_app-30bffcb9f4c3b7b2.js`: SHA256 `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: SHA256 `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own French notice explicitly holds the table for 15 minutes, no more. It invites guests to visit/call if full and directs parties above16 to a dedicated group form. Preserve the complete raw FR notice, with existing safe text rendering and line breaks. Do not turn the contact invitation into guaranteed walk-in availability. This 15-minute statement is directly observed here, not inherited from another restaurant.

## Integration and transaction boundaries

Only provider/test/sanitized fixture/docs changed. Reuses existing named no-room engine. 32d5 owns registry/API/UI/ledger/journal: bind exact party two and shift43203 in approval, durable reserve/record/proof/snapshot. Expected export ZENCHEF_ROSIE. Preserve the own notice and version digest of native EULA/restaurantComment/shift, rechecked on review and submit.

The first permitted write is the final native booking POST after explicit final consent, accepted terms and durable sendAllowed grant. Same-attempt returned UUID alone permits independent own-booking GET. Saved reference/date/time/pax/confirmed status must match, with no charge/action/error and empty offers/no chosen room. POST echo cannot confirm. Shift binding comes from validated native service, frozen approval and durable attempt.details.shiftId plus matching saved details, not an invented raw receipt shift field. Real final receipt structure remains unverified; unknown stays unknown.

Guarded actual Chromium form GET rendered empty firstname and native EULA; 12 requests blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact/code input, hold/cart/reservation/payment/message/capability/receipt read or bypass. No duplicate results/date probe.

Synthetic browser cases cover own-readback success, missing/pending/wrong date/party/offer, lowered card threshold, manual policy, stale notice and wrong durable service. Captured-source tests pin ten slots, typed policy, booking-relative21600 cutoff, dinner exclusion and party-three rejection. Synthetic receipts and fixture dates are not real reservations or current availability.

Shared integration, independent exact-SHA review, actual app QA with simulated mutations and release belong to 32d5. Parked identities remain excluded from this clean branch.

Validation: node --test scripts/test-zenchef-playwright.mjs — 30/30 PASS, zero failures (127.67 seconds). git diff --check PASS.
