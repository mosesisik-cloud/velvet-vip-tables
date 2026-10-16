# Brasserie Balzac Lunch — bounded provider-review handoff

Refs #129. Base f05f6d92e1c5656042c8baeea6c5164295dc4868. Selected from the
existing22 registry. No existing Balzac claim in #129 or open PR search; claimed
before provider inspection. One candidate only; no alternative or broad sweep.
32d5 owns shared runtime/server/UI and release after the current integration queue.

## Identity and meal

On16 October2026 https://balzac.se/ linked Boka bord to Waiteraid hash
`a0dd019e24669fadaaa6486567307f61`, redirecting to Bokabord with the same hash.
Canonical ID `curated-STO-balzac`; exact provider name `Brasserie Balzac`.
Initial HTML SHA256:
`8b2af87fb17cb8c219e36053e73d2bec7c7ea10f4c1eee8e355390c019e70ee5`.

Lunch354/type2 has must_pay_directly=false, mandatory_products=false, bullets={}.
Meal min_amount/max_amount are both0: these are unset bounds, not zero capacity.
Common getAmountsList5373–5401 applies meal bounds only when positive, within
settings max_seating/max_people, both10 here. Thus source ordinary list is1–10;
initial Velvet policy deliberately caps at2, with actual party2 inspected.
Settings group_bookings=false, custom_request=false, linked_meals=[]. Benign
meal group_booking=true does not imply a group transaction: groupEnabled()false
was observed. Actual group/parent receipt state remains rejected.
Numeric restid is not exposed and is not invented.

Excluded: dinner9116/type3 (not inspected even though initial requirements are
also unpaid), brunch10951/type4 and Chambre Séparée62983/type0/ten guests.
No automatic widening to another unpaid meal or larger party.

## Actual guarded provider route and phone binding

At2026-10-16T03:49:01.372Z, original provider reached contact for Lunch/two
guests/22October2026/13:30. Twelve selectable times11:30–14:30 were observed;
this is transient availability. Before Next, actual authFeature=true,
isAuth()=false, custom_request=false, groupEnabled=false, no mandatory
payment/products/card requirement. Common guestCtrl.next2360–2369 therefore
goes to auth; authenticated or feature-disabled states instead may save directly.
This check must not be generalized to arbitrary logged-in sessions.

Existing availability allowlist aborted sendAuthCode and contact-stat/tracking
POSTs before network dispatch. Native Fortsätt utan konto reached the actual
Kontrollera din bokning heading and Slutför bokningen button. That final button
was never clicked. No provider auth flag/model manipulation or fabricated review.
Before Next, existing readRicheContactPhone read and validated the synthetic
phone and se/46 selection while Booking.phone was empty. After native Next and
guest continuation, canonical bookingDetails phone exactly matched; meal354,
party2 and native country_code/dial_code46 matched too. No manual normalization.

Probe and sanitized evidence remain in a199 checkout work/inspect-balzac-flow.mjs
and work/balzac-flow-evidence.json. Zero real reservations, holds, auth codes,
payments or final clicks. No completed real receipt is claimed or required for
this conditional shared receipt-policy implementation.

## Small integration delta

BALZAC_LUNCH_RECEIPT_POLICY reuses the unchanged common verifier. Register it in
the existing Noema/Ciccios/Beirut provider-review path with its own opt-in, NOT
contactFinalPolicies. Preserve visible provider review, final explicit consent,
approval/request binding, durable pre-click reserve, one POST, bound receipt
document and unknown/replay locks. No shared file or second engine in this PR.

Focused fixture verifies full provider name, party cap, excluded meal IDs,
new payment requirement and missing document. The existing full-app guest-review
harness remains required before activation; positive receipt tests are synthetic.
The unresolved limitation is actual authorized transaction/receipt behavior, not
an external blocker in reaching review. Public activation belongs to32d5.
