# Beirut Café Lunch — guest review policy handoff

Refs #129. Base d171de7974e1b726763db40d25da3202df91643d. Scope is one
restaurant from the existing22 registry. Checked #129 claims and open PRs before
claiming: no Beirut owner found. 32d5 owns runtime/UI/release integration.

## Exact source scope

On16 October2026 https://www.beirutcafe.se/sv linked its booking button to
Waiteraid hash `ca902bc03574cc4643a6f071e93e2a98`, redirecting to Bokabord with
the same hash. Canonical ID `curated-STO-beirut-cafe`; exact provider name
`Beirut Café`, including the accent. Initial widget HTML SHA256:
`37e6a44daef44d3bea324e53b91ea86fc4e862c650d3eb080441c271dfd931af`.
Lunch30471/type2 permits1–40 in source; initial Velvet policy deliberately caps
at2, with actual party2 inspected. must_pay_directly=false,
mandatory_products=false, bullets={}. Settings max_people40/max_seating0,
group_bookings=false, custom_request=false, linked_meals=[].
Meal group_booking=true is metadata; actual groupEnabled() is false. Actual
group/parent orders still fail receipt verification. No numeric restid invented.

Excluded: dinner19973/type3 has a credit-card confirmation bullet; theatre52207
is type0; Christmas27393 is type5 and must_pay_directly=true. No payment support
or broader meal/party activation is included.

## Guarded original-provider flow

At2026-10-16T03:34:35.372Z selected Lunch/two guests/22October2026/13:30.
Thirteen actual selectable slots11:00–14:00 were observed; this is transient
inventory. Before contact Next, read actual canUseAuthFeature=true,
isAuth()=false, custom_request=false, no mandatory payment/products/card,
groupEnabled()=false. Thus the known common guestCtrl.next branch goes to auth
instead of direct completeBooking. Source app-widget6.0.3 lines2360–2369:
authenticated or feature-disabled routes may complete directly; unauthenticated
feature-enabled guests go to auth with sendAuthCode/backTo/complete parameters.

Existing read-only availability allowlist blocked sendAuthCode, contact stats,
tracking and unknown requests before network dispatch. The visible native
Fortsätt utan konto choice reached Kontrollera din bokning with Slutför bokningen
visible. The final button was NEVER clicked. No auth code was actually sent.
No provider model/auth flags were changed to manufacture this review path.

Before Next, the existing native readRicheContactPhone helper validated the
synthetic +46 input and selected se/46 metadata while Booking.phone was empty.
After native Next and guest continuation, canonical adapter bookingDetails
returned exactly that phone, meal30471 and party2; Booking.country_code and
getQuery().dial_code both matched46. This establishes native normalization and
the normal provider-review branch. It is not a contact-final activation and
does not need a new synthetic/native Velvet review mechanism.

Probe: a199 checkout work/inspect-beirut-flow.mjs; sanitized evidence:
work/beirut-flow-evidence.json. No real reservation/hold/code/payment or final
click; no actual completed receipt claimed. Shared receipt semantics and an
explicitly synthetic bound-document fixture are reused without requiring a
historical completed booking at this restaurant.

## Integration and focused validation

Register BEIRUT_LUNCH_RECEIPT_POLICY with the existing provider-review policy
path used by Noema/Ciccios, under its own scoped opt-in, not contactFinalPolicies.
Preserve provider review, explicit final consent, immutable approval, exact POST
matching, durable pre-dispatch reservation, document-bound receipt verification
and unknown/replay locks. Source-shape fixture tests accented identity, party cap,
excluded meal IDs, new card requirement and missing completion document.
Run existing full-app provider-review harness before activation. No server/UI,
shared runtime or release changes in this policy PR.

## Single alternative decision

Paraden was initially claimed but stopped after public initial configuration:
Lunch57371/type0 and dinner2884/type3 both require direct payment. Unpaid special
type0 meals are not substitutes for the ordinary type2/3 contract. Exact initial
HTML SHA256 `8985003275a4911f7dd374173f7afeb2f7de633b616b8213b490b171a86416de`.
It needs separately reviewed payment/special-meal handling, outside this task.
No Paraden contact action or repeated blocker probe. Beirut is the only alternative
inspected; no broader candidate sweep or second engine.

## Integrated runtime boundary

Candidate d3b927e adds only the separate VELVET_BEIRUT_RECEIPT flag to
receiptPolicies. contactFinalPolicies remains Riche/Sturehof only. The existing
provider-review path reserves the SQLite attempt inside the intercepted save
request, before route.fetch sends any provider write. This is AFTER the native
Slutför button click; it is not a claim of pre-click reservation. The contact-final
path has a different pre-click boundary. Both prevent unreserved provider writes.
Focused receipt tests13 and narrow independent policy/flag review pass. Existing
Noema actual app/API/Chromium/SQLite regression passed84API/4restarts/3mockPOST
on d3b927e, with zero real supplier requests.

Final Beirut actual app/API/Chromium/SQLite harness9befae3 passed84API calls,
4backend restarts and3simulated POSTs on runtime d3b927e. The supplier route.fetch
boundary reads the actual SQLite file and asserts the durable unknown attempt
already exists. Guest continuation sends no code; native contact Next copies
phone into the model; provider review requires fresh final approval. Missing or
wrong receipts stay unknown, exact original receipt confirms and survives
restart, and cross-owner/replay requests cannot send again. Real supplier test
writes are zero. The gate is before network dispatch, not before local DOM click.
