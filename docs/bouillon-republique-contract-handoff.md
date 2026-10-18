# Bouillon République — seven lunch times, exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base clean main 235 a8a41d39a6d192d324630544494fbb236dd91f2e. Canonical `curated-PAR-bouillon-republique` confirmed by 32d5. Pigalle parked identity and evidence are not in this branch.

## Current sources, checked 2026-10-18

https://bouillonlesite.com/reservation returned 200, SHA256 `3dcfe884a591afc672f2ec8802e146217ba9e66dcd72a4c5109da47420d0a427`. Named Bouillon République has data-rid=357115 and address 39 boulevard du Temple, 75003 Paris. The actual openResa function builds bookings.zenchef.com/results from the clicked rid. Pigalle 357951, group forms and takeaway are separate and not used.

One readonly https://bookings.zenchef.com/results?rid=357115&lang=fr&day=2026-10-23&pax=2 returned 200, SHA256 `16ffac454a4a216103194d12f599de744e0c2115fd11cfed29fa1bb77585c6ec`. Native name Bouillon République, 39 Bd du Temple, Paris 3e Arrondissement, fr/EUR/Europe/Paris. Wish party/date match, no room selection/mandatory room, room null, offers empty.

The observed service is 528175, `Service du Vendredi`, spanning both lunch and late evening. This implementation deliberately restricts it to the seven observed midday times **11:30, 12:00, 12:30, 13:00, 13:30, 14:00, 14:30**. This is an implementation scope, not a claim that the restaurant has no other meal times. Later observed times 15:30–17:30 and 22:00–23:30 are excluded. No other service/weekday has been established. No guessed weekday/date rules or inherited annual exclusions are added.

Exact own policy: automatic true/until null; charge is_web_booking_askable true, min_guests **4**, charge_per_guests **4**; prepayment null; required offer false/from pax null; cancellation cutoff **21600 seconds relative to shift**. Party two is below the four-person card threshold. Values are typed and exact; missing/changed policy fails closed. Pigalle's two-person threshold and booking-relative cancellation do not apply.

Readonly https://bookings.zenchef.com/form?rid=357115&lang=fr&day=2026-10-23&pax=2&slot=11%3A30 returned 200, SHA256 `ea0faaa7ae2aee6f1be8131f786c486df6f0c28bac735d5945c1a7a2aa3c71c5`. Required first/last/email/phone/country/civility. Optional voucher unsupported, custom fields empty. Native room labels do not provide a room guarantee; no room chosen.

Current form-referenced bundles fetched and matched the reviewed native source:

- `_app-30bffcb9f4c3b7b2.js`: SHA256 `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: SHA256 `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own notice asks the full party to arrive on time and directs parties above 20 to a separate group form. Full native French field includes English repetition; preserve it with safe text rendering. No 15-minute grace period is stated. No day-specific notice on the observed day, no established annual exclusion. No holiday probe or holiday-availability claim.

## Integration contract

Provider explicitly filters candidates to lunchTimes and zenchefFormUrl rejects every other time with time_outside_lunch_scope. The form guard is used for selection, request allowlisting and verifyNativeRoom on review/submit. Frozen approval and durable attempt bind time. 32d5 must mirror the exact seven-time scope, shift 528175 and party two in shared API/UI/ledger/journal reserve/record/proof/snapshot paths. Do not publish the entire all-day service as lunch.

Uses existing named no-room engine: exact native final booking POST only after explicit consent, accepted terms and durable sendAllowed grant. Same-attempt UUID from that POST is the only permitted independent own-booking GET capability. Saved reference/date/time/pax/status must match and have no charge/action/error; empty offers/no chosen room required. POST echo alone never confirms. Service binds through native selection, frozen approval, durable attempt.details.shiftId and matching saved details, not a fabricated receipt shift field. Real receipt structure remains unverified; unknown stays unknown.

EULA/restaurantComment/shift digest is versioned and rechecked before final submit. Own full-party/on-time notice remains distinct from other restaurants. No real payment or booking behavior was tested.

## Validation boundaries

Guarded actual Chromium form GET rendered an empty firstname input and native EULA; ten requests blocked. Service workers, websockets, redirects and unreviewed requests blocked. No contact entry, code, hold/cart/reservation/payment/message/capability/receipt read or bypass. Only one results-date probe.

Synthetic browser cases exercise own-readback success, missing/pending/date/party/offer mismatches, card/manual policy changes, stale notice and wrong durable service. Captured-source test proves exact lunch filtering, rejects later form times, verifies typed threshold/cancellation and excludes Pigalle's shift. Synthetic fixture dates/times/receipts are not actual availability or bookings.

Only provider/tests/sanitized fixture/docs changed. Independent exact-SHA review, actual app QA with simulated mutations and publication remain with 32d5.

Validation: node --test scripts/test-zenchef-playwright.mjs — 29/29 PASS, zero failures (134.29 seconds). git diff --check PASS.
