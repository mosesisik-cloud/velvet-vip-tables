# Kommendören Lunch — scoped provider-review handoff

Refs #129. Base69203175409f7ccdda8db245e74d5bbf188926f7. Existing22 registry;
exact name/ID and open PR search found no owner. Claimed before contact probe.
32d5 owns integration and release after Balzac; no shared runtime/server/UI edits.

## Public identity and scope

Checked16 October2026. https://www.kommendoren.se/ embeds BOKA BORD anchors with
class waiteraid-widget and data-hash `4dcf4bbddfb1d7c4f3f0d2d5186d4f00` plus
the provider widget loader, matching the canonical registry and provider HTML.
ID `curated-STO-kommendoren`, exact provider name `Kommendören`.
Initial widget HTML SHA256:
`fedcba8b54cb612f4ee91b78ae2b3456b89eb438c36adba8f2de7fbbe226fdaf`.

Lunch3501/type2: must_pay_directly=false, mandatory_products=false, bullets={}.
Meal min/max_amount0 are unset bounds; common getAmountsList only applies
positive meal limits. Settings max_people10/max_seating11; do not interpret
the extra seating option as an ordinary party authorization. Initial policy
maxParty2, actual party2 checked. group_bookings=false, custom_request=false,
linked_meals=[]. Meal group_booking=true is benign metadata; actual
groupEnabled()false observed. Actual group/parent orders remain rejected.
Numeric restid not exposed, not invented.

Excluded IDs: dinner453/type3, Saturday lunch1805/type4, drink table56547/type0,
Seafood Shack65558/type0 and Thanksgiving65397/type0. Only normal Lunch3501.

## Bounded actual flow

At2026-10-16T03:56:51.176Z reached Lunch/two guests/22October2026/13:30.
Eleven selectable times11:30–14:00 were observed; transient inventory only.
Before Next asserted actual canUseAuthFeature=true,isAuth()=false,
custom_request=false; payment/products/card absent,groupEnabledfalse.
Common guestCtrl.next2360–2369 therefore enters auth rather than direct save.
This must not be generalized to authenticated or feature-disabled sessions.

Existing availability allowlist blocked sendAuthCode, contact stats/tracking
and unknown requests before network dispatch. Visible Fortsätt utan konto led
to actual Kontrollera din bokning and Slutför bokningen. Final button untouched.
No auth/model mutation to manufacture a review. Existing native phone getter
validated the synthetic input and se/46 before Next while model phone was empty;
after native Next and guest continuation, canonical bookingDetails matched
phone,meal3501,party2 and native country_code/dial_code46. No manual projection.

Sanitized evidence/probe in a199 checkout work/kommendoren-flow-evidence.json
and work/inspect-kommendoren-flow.mjs. Zero real bookings/holds/codes/payments.
No actual completed receipt claimed; shared source-backed receipt contract and
synthetic positive fixture reused without per-venue historical receipt requirement.

## Integration

KOMMENDOREN_LUNCH_RECEIPT_POLICY goes into the existing provider-review path
used by Noema/Ciccios/Beirut, NOT contactFinalPolicies. Keep separate opt-in,
native review/fresh consent, existing durable-before-dispatch contract, exact
approval/request binding, receipt document verification and unknown/replay locks.
No new pre-click refactor or engine required. Focused fixture tests exact name,
excluded meal IDs including Saturday lunch, cap, new mandatory products and
missing document. Existing full-app guest-review harness and release remain
with32d5; actual authorized transaction/receipt remains unobserved.

## Initial candidate stopped at source

OLLI was first claimed and stopped without contact probing: matsal25128/type3
requires direct payment and card; OLLI LUNCH41905/type0 requires direct payment.
Unpaid type0 options are not substitutes for the ordinary type2/3 contract.
Need: separately reviewed payment/special-meal handling, outside current scope.
OLLI initial HTML SHA256:
`91aca43058012dffffc1056ad8e76d881be2d2d1a17a9dfb2beb248e1450a60d`.
Kommendören was the sole alternative; Paraden not reprobed, no broad inventory.
