# Le Petit Bouillon Pharamond — mandatory-offer contract gap

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main236 a7ce120ceeed6af0e262bc3c66cfe45734fd740d. Reserved canonical `curated-PAR-le-petit-bouillon-pharamond`. Status: evidence delivered, runtime not activated. 32d5 acknowledged the gap and requested negative docs/fixture only, without further probes.

## Official route and identity, checked 2026-10-18

https://www.petitbouillonpharamond.com/reserver returned 200, SHA256 `a7407d507528c8b6efc08373a503b4aaf92f13cba09c8047e4dfd41e38351b2e`. Actual zc-widget-config has data-restaurant=377578 and references https://sdk.zenchef.com/v1/sdk.min.js. SDK returned 200, SHA256 `f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c`; data-restaurant maps to rid, production base bookings.zenchef.com, default ordinary route results. data-open=2000 is only widget opening delay, not a booking-policy value. The widget was read, not executed.

One readonly https://bookings.zenchef.com/results?rid=377578&lang=fr&day=2026-10-23&pax=2 returned 200, SHA256 `8ecc6383b90eb5f75a24af73f2e7163dfb10057070400681cc686e3f63f30c49`. Native identity `Le petit bouillon pharamond`, 24 Rue de la Grande Truanderie, Paris, fr/EUR/Europe/Paris matches the Paris restaurant. Nancy and group/private-salon routes are outside this assignment.

## Exact positive observations and unresolved contract

Lunch 309402, `Réservation midi`, has automatic true/until null, charge null, prepayment null, cancellation cutoff **60 seconds relative to shift**. The shift requires an offer: is_offer_required=true, offer_required_from_pax=1. Two slots are observed for party two: 11:45 and 12:00. Dinner 409767 is excluded.

Both lunch slots contain classic offer **86319**, `Réservation classique`: payment_type=none, has_prepayment=false, catalog/base charge_per_guests=null, same-for-all and limited-to-pax true, minimum1/maximum8. Slot inventory includes party two. Slot and base both specify has_specific_rooms=true, rooms=[115221]; the native room label is `RDC + 1er`. State itself has no room-selection requirement and wish.room_id=null. This is not a verified user-selected room or floor guarantee.

The same two slots also contain prepaid two-person salon offers 86309, 86321 and 86329. Their payment_type is prepayment and has_prepayment=true. The classic option is not itself evidenced as requiring a deposit; do not misreport the entire restaurant as paid-only. Source notice explains classic seating on ground/first floors and separate paid private-salon rentals, with meals paid separately on site. It does not state a 15-minute grace period. No annual date rule is established or copied.

The supported no-offer engine explicitly rejects mandatory offers. Existing De Kas support is venue-specific: one EN Lunch offer, an exact native selection path, particular seating terms, payload approval and own-readback binding. Its assumptions do not establish Pharamond's mixed French classic/prepaid-offer selection or its room association. Neither replacing a restaurant ID nor removing the required-offer check proves this contract.

Unverified steps: selecting precisely classic 86319/count2 among mixed paid offers without an early supplier write; own native form state and room handling after selection; exact final POST payload and independent same-attempt saved-booking offer/room evidence. No claim is made that an actual hold occurs. The blocker is missing verified contract support, not demonstrated payment for the classic option, closure, lack of availability, or a proven provider malfunction.

## Scope and handoff

No offers/form page, selection click, contact/code, hold/cart/reservation/payment/message or receipt-capability read was performed. No second date/party probe and no bypass. Further probes were stopped after 32d5 requested evidence-only handoff. Only this document and a sanitized subset of the captured public results are added; no runtime/provider/registry/UI mutation.

Fixture retains identity, own notice, exact lunch policy and relevant classic/paid offer rows for two. Full raw source is kept only in local scratch. Future implementation needs a separately coordinated, source-backed mixed-offer contract review before enabling this venue; it must keep paid salons/Nancy/groups outside scope and preserve the actual classic offer and room binding. No production activation requested. Isolated identity 3047409 remains unpublished.

Validation: captured identity, mandatory classic/paid offer separation and own policy assertions PASS; git diff --check PASS. No runtime changed, so no booking-suite rerun.
