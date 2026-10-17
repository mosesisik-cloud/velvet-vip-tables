# Le Grand Colbert — source review, 2026-10-18

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129.

## Outcome

Blocked for automatic confirmed booking. All four services in the observed native result have `confirmation.is_auto=false`. Available times establish availability, not a confirmed reservation. No adapter activation or catalog addition is proposed. No stable Velvet restaurantId has been assigned.

## Identity and source

Official contact page: https://www.legrandcolbert.fr/informations-contact/ identifies Le Grand Colbert, 2 Rue Vivienne, 75002 Paris. Its normal reservation widget uses Zenchef restaurant 353935; private events are separate.

One read-only GET: https://bookings.zenchef.com/results?rid=353935&lang=fr&day=2026-10-23&pax=2 returned HTTP 200. Raw HTML SHA256: `6a1875f5e24a0b14f3b76184f01473f1531b4ba333758091a1f54f108bfe2f1a`.

The native `__NEXT_DATA__.props.initialState.appStoreState` binds restaurantId 353935, requested day 2026-10-23, pax 2, Europe/Paris, EUR and the matching restaurant name. Raw HTML remains local scratch; no public keys or unrelated state are included here.

## Observed ordinary services

| Shift | Service | Available times for two | Auto confirmation | Card threshold | Cancellation cutoff |
| --- | --- | --- | --- | --- | --- |
| 34521 | Déjeuner | 12:00–16:45 every 15 minutes | false, until null | 5 guests, 20 EUR per guest | 172800 seconds relative to shift |
| 34522 | Dîner 1er service | 17:00, 17:15, 17:30, 17:45, 18:00, 18:15, 21:00 | false, until null | 6 guests, 50 EUR per guest | 86400 seconds relative to shift |
| 34523 | Dîner 2eme service | 21:45–22:45 every 15 minutes | false, until null | 8 guests, 20 EUR per guest | 86400 seconds relative to shift |
| 38701 | Service Tardif | 23:00, 23:15, 23:30 | false, until 0 | charge_param null | 21600 seconds relative to shift |

All four have prepayment_param null and is_offer_required false. Card thresholds do not apply to two guests in this snapshot; that does not override manual confirmation. Room 15163 is Salle principale; hasRoomSelection and isRoomMandatory are false. Optional gift-certificate input is not a mandatory menu purchase.

## Verification and boundaries

Parsed the captured native JSON and checked all four shifts, their possible_guests arrays and policy fields. No additional date probe, JavaScript execution, slot selection, contact submission, hold, cart, reservation, payment, restaurant message or real booking receipt/capability read occurred. No mock booking or actual final confirmation was produced. No runtime files changed; runtime tests are not applicable to this documentation-only handoff.

The existing Zenchef engine must retain manual-confirmation blocking. A future automatic-booking activation requires source-backed eligible service policy and the existing independent own-GET final receipt verification; POST echo/status/ID alone is insufficient. Park this candidate without routine reprobes. Shared integration and release remain with 32d5.
