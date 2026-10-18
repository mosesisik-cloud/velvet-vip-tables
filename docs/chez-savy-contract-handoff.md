# Chez Savy — Midi for exactly two

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main240 e6875c374b2cecdd6accf943c1e2184434d398fb. Canonical `curated-PAR-chez-savy` confirmed by32d5; export ZENCHEF_CHEZSAVY. Only lunch68279/Midi, exactly two. Dinner, private salons/groups and room guarantees excluded.

## Source and identity, checked 2026-10-18

GET https://www.chezsavy.com/ followed the site's current redirect to https://lcep.fr/savy/, returned200, SHA256 `f2080314aaa21a7d0045062e103a4c30555dde29ea89c7c07d9c96cc9006e87a`. The destination has own23 rue Bayard,75008Paris address and actual iframe https://bookings.zenchef.com/results?rid=357117&fullscreen=1. This is an observed official redirect, not an alternate access-bypass route. Provider source uses the observed destination. No pid is present in the source URL.

One readonly https://bookings.zenchef.com/results?rid=357117&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `1d7533d4a038f243a49586b1487f4327fc4128a3919c4cd5c62e64c3fa8aed2c`. Native name SAVY,23 Rue Bayard,Paris matches. fr/EUR/Europe/Paris; query retains fullscreen1; wish date/party match, offers empty/room null, no room selection/mandatory room.

Own lunch policy:68279 `Midi`, automatic true/until null; charge askable true/min_guests6/charge_per_guests20; prepayment null; required offer false/from pax null; cancellation cutoff **10800 seconds relative to shift**. Party two is below the six-person card threshold. Missing/changed typed values fail closed. Dinner68280 has different confirmation/card policy and is excluded.

Five observed two-person times:12:00,12:30,13:00,13:30,14:00. These are observations, not held or confirmed bookings. The named Midi service defines scope, without a borrowed fixed time list, seasonal or annual date rule.

Readonly https://bookings.zenchef.com/form?rid=357117&fullscreen=1&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `8ee013955fb3f060dc68e6f646dc33036080a02a420df6e16fe1a0dae6e7cd03`. Required first/last/email/phone/country/civility; custom fields empty, optional voucher unsupported. Room labels do not guarantee a salon or table; no room selected.

Current referenced form bundles fetched and matched reviewed source:

- `_app-30bffcb9f4c3b7b2.js`: `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own French notice welcomes guests to Chez Savy and directs private-salon requests for12–40 people to a separate email contact. Preserve full raw notice with safe text rendering. It does not state15-minute retention, walk-in availability or any annual date rule. Day-specific notice is null. Sommelier's explicit-empty-notice exception does not apply here.

## Integration and checks

Provider search/form preserves fullscreen1 and does not inject a pid query parameter. Exact document allowlist/form URL checks retain that context. Existing reviewed native default partner_id1001 payload rule remains; this does not introduce Sommelier's explicit pid URL/SSR guard into Savy.

Only provider/tests/sanitized fixture/docs changed. Existing named no-room engine reused. Shared registry/API/UI/ledger/journal belongs to32d5: bind canonical/rid357117/party2/shift68279 through approval/durable reserve/record/proof/snapshot. No other date/time rules. Terms digest includes native EULA/restaurantComment/shift and is rechecked at review/submit.

First permitted write is final native booking POST after explicit final consent, accepted EULA and durable sendAllowed grant. Only its same-attempt created UUID permits independent own-booking GET. Saved reference/date/time/pax/confirmed status must match without charge/action/error, with empty offers/no chosen room. POST echo never confirms. Service binds via validated shift, frozen approval, durable attempt.details.shiftId and matching saved details, not invented raw receipt fields. Actual final receipt structure remains unverified; unknown stays unknown.

Guarded actual Chromium form GET rendered empty firstname/native EULA with fullscreen1; nine requests blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact/code input, hold/cart/reservation/payment/message/capability/receipt read, bypass or duplicate results/date probe.

Synthetic browser cases exercise own-readback success, missing/pending/wrong date/party/offer, lowered card threshold/manual policy, stale notice and wrong durable service. Captured-source tests cover five slots, exact typed policy, shift-relative10800 cutoff, dinner exclusion, party-three rejection and preserved fullscreen/no injected pid. Synthetic dates/receipts are not real reservations/current availability.

Independent exact-SHA review, actual app QA with simulated mutations and publication remain with32d5. Parked identities excluded from clean branch.

Validation: node --test scripts/test-zenchef-playwright.mjs — 34/34 PASS, zero failures (124.96 seconds). git diff --check PASS.
