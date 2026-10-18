# Chez René — Midi for exactly two

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main241 120fb6d6ee00a2e9eb4afc0b7c044d84849b61b9. Canonical `curated-PAR-chez-rene` confirmed by32d5; export ZENCHEF_CHEZRENE. Only lunch68277/Midi, exactly two; dinner, private salons/groups and room guarantees excluded.

## Own sources checked 2026-10-18

https://lcep.fr/chez-rene/ returned200, SHA256 `7b9675900d5fbfc09d6883222e6a2f9610b12e7a5433b4b65d209942c2a5a633`. Own14 Boulevard Saint-Germain,75005Paris address and actual iframe https://bookings.zenchef.com/results?rid=357076&fullscreen=1. No pid present. This is the named Chez René route from actual group navigation, not another restaurant's guessed ID.

One readonly https://bookings.zenchef.com/results?rid=357076&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `094e66c4f41678a690979baf752ede28cccd1531d966ce7fe31485d4ebd1d08f`. Native Chez René,14 Bd Saint-Germain,Paris matches. fr/EUR/Europe/Paris; wish date/party match, room null/offers empty, no room selection/mandatory room. Query retains fullscreen1.

Own lunch policy:68277 `Midi`, confirmation **is_auto=false/is_auto_until=4**, charge askable true/min_guests5/charge_per_guests50, prepayment null, required offer false/from pax null, cancellation **10800 seconds relative to shift**. Reviewed native formula is is_auto OR (is_auto_until not undefined AND pax<=is_auto_until), so party two qualifies for automatic confirmation while remaining below the five-person card threshold. This is not manual confirmation for two and not an assumed is_auto=true. Typed/missing changes fail closed. Dinner68278 has a different charge parameter and remains excluded.

Five observed two-person times:12:00,12:30,13:00,13:30,14:00. Observed candidates are not holds or bookings. Named Midi service defines scope; no inherited time list, annual/seasonal rule or invented availability.

Readonly https://bookings.zenchef.com/form?rid=357076&fullscreen=1&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `8f0973fbee2b5bb86e50a7addde1e6fbb485f0bb5eee63dd110e7627f9307fd0`. Required first/last/email/phone/country/civility; custom fields empty; optional voucher unsupported. Native room/terrace labels grant no specific seating guarantee.

Current referenced assets were fetched and matched reviewed native source, including the automatic-threshold logic:

- `_app-30bffcb9f4c3b7b2.js`: `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own French notice welcomes guests to Chez René and directs salon privatization for12–40 people to reservations@chezrene1957.com. Preserve complete raw notice using safe text rendering. No15-minute, walk-in guarantee or annual date rule is stated. Day-specific notice is null. Savy's different contact/policy and Sommelier's empty-notice exception do not apply.

## Integration and verification

Only provider/tests/sanitized fixture/docs changed. Existing named no-room engine reused. Fullscreen1 preserved in exact search/form URLs; no pid query injected. Existing reviewed native default partner_id1001 payload validation remains, without importing an explicit partner URL/SSR rule.32d5 owns registry/API/UI/ledger/journal and binds canonical/rid357076/party2/shift68277 through approval/reserve/record/proof/snapshot.

Native EULA/restaurantComment/shift digest versions terms and is rechecked before review/submit. First permitted write is exact final native booking POST after explicit final consent, accepted terms and durable sendAllowed grant. Only its same-attempt UUID permits independent own-booking GET. Saved reference/date/time/pax/confirmed status must match with no charge/action/error, empty offers and no chosen room. POST echo never confirms. Service binds via native validated shift, frozen approval, durable attempt.details.shiftId and matching saved details, not fabricated raw receipt shift fields. Actual final receipt remains unverified; unknown stays unknown.

Guarded actual Chromium form GET rendered empty firstname/native EULA with fullscreen1; nine requests blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact/code input, hold/cart/reservation/payment/message/capability/receipt read, bypass or duplicate results/date probe.

Synthetic browser cases cover own-readback success, missing/pending/wrong date/party/offer, lowered card threshold, removed automatic threshold, stale notice and wrong durable service. Source tests pin five slots, typed false/until4 policy, min5/per50 card policy, shift-relative10800 cutoff, dinner/party-three rejection and fullscreen/no injected pid. Synthetic dates/receipts are not live availability or actual bookings.

Independent exact-SHA review, actual app QA with simulated mutations and publication remain with32d5. Parked identities excluded from clean branch.

Validation: node --test scripts/test-zenchef-playwright.mjs — 35/35 PASS, zero failures (130.78 seconds). git diff --check PASS.
