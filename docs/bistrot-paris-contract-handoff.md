# Le Bistrot de Paris — Midi for exactly two

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main242 97db55da30ea3082eb668d55f4417a30dcefd36e. Canonical `curated-PAR-le-bistrot-de-paris` confirmed by32d5; export ZENCHEF_BISTROTPARIS. Only lunch68145/Midi, exactly two; dinner, private salons/groups and room guarantees excluded.

## Own sources, 2026-10-18

https://lcep.fr/le-bistrot-de-paris/ returned200, SHA256 `259acba271eaa167d7a9f58702efba0c0db53802e813e28cf659ffba4c5429c1`. Own33 Rue de Lille,75007Paris address and actual iframe https://bookings.zenchef.com/results?rid=357075&fullscreen=1. No pid in source URL.

One readonly https://bookings.zenchef.com/results?rid=357075&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `0303abbaf9930f4309dbcdb822c7ec4f65f29e1702b7ff73048912ae4473c77f`. Native Le Bistrot de Paris,33 Rue de Lille,Paris matches. fr/EUR/Europe/Paris; query keeps fullscreen1, wish date/party match, offers empty/room null, no room selection/mandatory room.

Own lunch policy:68145 `Midi`, confirmation **false/until4**, charge askable true/min_guests6/charge_per_guests20, prepayment null, required offer false/from pax null, cancellation **1800 seconds relative to shift**. Reviewed native automatic formula is is_auto OR (is_auto_until not undefined AND pax<=is_auto_until), so two qualifies for automatic confirmation and remains below the card threshold. This does not inherit René's min5/per50 or10800-second cutoff. Missing/changed typed values fail closed. Dinner68148 has different charge/cancellation policy and is excluded.

Five observed times for two:12:00,12:30,13:00,13:30,14:00. These are observations, not holds/bookings. Scope is the native Midi service; no borrowed fixed-time, annual or seasonal rule.

Readonly https://bookings.zenchef.com/form?rid=357075&fullscreen=1&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `fdc0b3bf5c8d8420bf79c4f4f3340c27ad729383f0c1f5b890c8574301bc432a`. Six required contact fields:first/last/email/phone/country/civility. Optional voucher unsupported. Custom field4379/slug test is disabled, required=false and mandatoryFields custom_field.test=hidden; it does not justify sending any custom-field payload or creating a new field flow. Room/exterior labels provide no seating guarantee.

Current form-referenced bundles fetched and matched reviewed native source, including automatic-threshold logic:

- `_app-30bffcb9f4c3b7b2.js`: `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own French notice welcomes guests to Le Bistrot de Paris and directs salon privatization for12–40 people to reservations@lebistrotdeparis1965.com. Preserve complete raw notice with safe text rendering. No15-minute retention, walk-in guarantee or annual date rule stated; day-specific notice null. Other restaurants' contact/policy/empty-notice exceptions do not apply.

## Integration and boundaries

Only provider/tests/sanitized fixture/docs changed. Existing named no-room engine reused. Fullscreen1 retained in search/form; no pid query injected. Existing reviewed default partner_id1001 payload rule remains without importing an explicit partner URL/SSR requirement.32d5 owns shared registry/API/UI/ledger/journal, binding canonical/rid357075/party2/shift68145 through approval/reserve/record/proof/snapshot.

Native EULA/restaurantComment/shift digest is versioned and rechecked at review/submit. First permitted write is exact final native booking POST after explicit final consent, terms acceptance and durable sendAllowed grant. Only its same-attempt UUID permits independent own-booking GET. Saved reference/date/time/pax/confirmed status must match with no charge/action/error, empty offers and no chosen room. POST echo never confirms. Service binds via validated shift, frozen approval, durable attempt.details.shiftId and matching saved details, not invented raw receipt fields. Actual final receipt remains unverified; unknown stays unknown.

Guarded actual Chromium form GET rendered empty firstname/native EULA with fullscreen1; nine requests blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact/code input, hold/cart/reservation/payment/message/capability/receipt read, bypass or duplicate results/date probe.

Synthetic browser tests cover own-readback success, missing/pending/wrong date/party/offer, lowered card threshold, removed auto threshold, stale notice and wrong durable service. Source tests pin five slots, typed false/until4 and min6/per20, shift-relative1800 cutoff, dinner/party-three rejection and fullscreen/no injected pid. Synthetic dates/receipts are not actual reservations/current availability.

Independent exact-SHA review, actual app QA with simulated mutations and publication remain with32d5. Parked identities excluded from clean branch.

Validation: node --test scripts/test-zenchef-playwright.mjs PASS 36/36 (137.3 seconds); git diff --check PASS.

Post-review blocker correction: actual app QA found that an unsupported custom field becoming required after review bypassed the selection-only check. verifyNativeRoom now rechecks fresh mandatoryFields for the no-room lunch family on review and submit, before approval/durable grant/transport. Missing metadata and required custom_field or custom_field_v2 fail with 409 provider_fields_unverified; the disabled/hidden Bistrot field still passes. Focused Bistrot tests PASS 2/2; actual app reproduction/retest belongs to release QA. No provider traffic or broad matrix repeated.
