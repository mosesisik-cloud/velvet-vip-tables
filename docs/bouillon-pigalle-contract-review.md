# Bouillon Pigalle — parked: card policy reaches two guests

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Assigned solely by master following release 235. Base main a8a41d39a6d192d324630544494fbb236dd91f2e. Status: negative evidence; no provider registration or runtime activation.

## Identity and route, 2026-10-18

Official https://bouillonlesite.com/reservation returned 200, SHA256 `3dcfe884a591afc672f2ec8802e146217ba9e66dcd72a4c5109da47420d0a427`. Its named Bouillon Pigalle link has data-rid=357951 and address 22 boulevard de Clichy, 75018 Paris. Actual openResa JavaScript builds `https://bookings.zenchef.com/results?rid=` plus the clicked rid and fullscreen=1. This is the ordinary route, distinct from République 357115, group forms and takeaway/shop at 18 boulevard de Clichy. No alternative route was probed.

One readonly native request https://bookings.zenchef.com/results?rid=357951&lang=fr&day=2026-10-23&pax=2 returned 200, SHA256 `1d61de7895e88ac1adeebe0e2c3093fe254cbc62063a3ed43740fd80c26874aa`. Native identity is Bouillon Pigalle, 22 Boulevard de Clichy, Paris, fr/EUR/Europe/Paris. Wish date and party match; room null, no room selection/mandatory room, offers empty.

## Concrete blocker

The captured day has service 531429, `Service du Vendredi`, spanning lunch and late evening, rather than a separately named lunch. Its typed values are:

- confirmation.is_auto = true; is_auto_until = null.
- charge_param.is_web_booking_askable = true.
- charge_param.min_guests = 2.
- charge_param.charge_per_guests = 4.
- prepayment_param = null.
- is_offer_required = false; offer_required_from_pax = null.
- cancelation_param.enduser_cancelable_before = 28800; enduser_cancelable_reference = booking.

The card/charge threshold includes the requested party of two, so this does not qualify for the approved no-card engine. The amount is a native charge parameter, not evidence that money was charged or that an immediate payment is due. Exact card-entry, authorization, cancellation-fee and final-receipt behavior was not traversed and is not claimed verified.

Observed times for two: 11:30, 12:00, 12:30, 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30, 22:00, 22:30, 23:00, 23:30. These are availability evidence only. They do not override the card-policy blocker or prove a complete booking flow.

Own notice asks the whole party to arrive on time and redirects parties above 12 to a dedicated group form. It gives no 15-minute allowance. No date-specific notice is set on the observed day. No annual date rule or other restaurant's cancellation reference was copied.

## Boundaries and handoff

Stop after this single results observation. No form, contact/code submit, hold/cart/reservation/payment/message, receipt-capability read, alternate date/party probe or access bypass. No provider, UI, registry, ledger or journal changes. Only this document and a sanitized public source fixture are delivered. Final submission and receipt contracts remain unverified; do not register this venue as supported in-app booking.

Current external blocker: the observed two-person scope requires a card policy outside the approved engine. A future change needs a separately assigned card-flow contract and explicit authorization for any real transaction, or new source evidence under a new scoped assignment. This is not a claim that the restaurant is unavailable or closed. Integration/release decisions remain with 32d5; no publication requested.

Canonical reserved by 32d5: curated-PAR-bouillon-pigalle (isolated identity only, not published). Validation: captured identity and typed blocker assertions PASS; git diff --check PASS. No runtime changed, so no synthetic booking suite rerun was needed.
