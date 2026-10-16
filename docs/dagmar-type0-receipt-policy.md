# Villa Dagmar Lunch63588 — exact type0 opt-in

Refs #129. Base65e70a816e6e998be57dc3ed3764cb85aaa426f3. Explicit assigned
contract task, superseding the provisional type0 gap in the Boqueria evidence.
No other candidate inspected.32d5 owns integration after Boqueria/current queue.

## Public identity and requirements

https://hotelvilladagmar.com/food-drink/restaurangen/ embeds Boka bord with
waiteraid-widget class and hash `a7eea669cf574253557648c3db0db765`, matching
registry `curated-STO-villa-dagmar` and exact provider name `Villa Dagmar`.
Initial HTML SHA256 `59eaa2bc0f131dfaa5069fcd2689cef7f0fb79b17c148a29e633a0a2f73e6031`.
Lunch63588/type0 is named Lunch, min1/max8; must_pay_directly=false,
mandatory_products=false,bullets={},meal.group_booking=[]. Settings max_people8,
max_seating8,custom_request=false,linked_meals=[]. Global group_bookings='Y' is
not itself a group transaction: groupEnabled requires a matching nonempty meal
group configuration; this meal's array is empty and actual groupEnabled=false.
Initial Velvet maxParty2, with actual party2 inspected. Numeric restid not
exposed and not invented. Exclude paid dinner34285/type0, paid weekend63586/type0
and breakfast16915/type1/card confirmation.

## Why this exact type0 meal follows the same contract

Fresh GET of public https://app.bokabord.se/production/app-widget.js?v=6.0.3
on16October2026 still hashes to
`ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`.
The inspected guestCtrl route does not branch to another transaction for type0:

- next2360–2369: auth-feature enabled and unauthenticated goes to account choice;
  authenticated/feature-off may complete directly.
- guest return2388 sets requireConfirmation from authentication state.
- havePayment2526 handles special types8/9/10, direct payment and product totals;
  type0 alone does not trigger payment.
- completeBooking2531–2540 validates, handles giftcard separately, then calls
  Booking.save. save5057 posts getQuery() to /reservation/api/booking/saveBooking.
- completion2627–2631 routes status0 to payment; otherwise navigates to the same
  /reservation/booking/?code=<response.short_code>&new=1. There is no type0-specific
  receipt route in this branch. Status/event alone is still not sufficient proof.

This source plus the native flow below supports reusing the conditional bound
receipt verifier for THIS identity/meal, not all type0 offerings. No invented
provider field or step, no actual save/receipt requested. Server-rendered receipt
content for a new Dagmar booking remains unobserved: missing/different receipt
will stay unknown; no historical per-venue receipt is required or claimed.

## Guarded actual form

At2026-10-16T04:26:25.174Z: Lunch63588/type0,two guests,22October2026/13:30.
Fifteen selectable times11:30–15:00, transient only. Before Next asserted actual
authFeaturetrue,isAuthfalse,custom_requestfalse,groupEnabledfalse and no payment,
products or card. Existing read-only network allowlist blocked sendAuthCode,
contact statistics/tracking and unknown requests before dispatch. Native visible
Fortsätt utan konto reached Kontrollera din bokning plus Slutför bokningen.
Final button untouched; no auth/model manipulation.

Existing native phone getter validated synthetic input/se/46 beforeNext while
model phone empty. After native Next, canonical bookingDetails matched phone,
meal63588,party2 and native country_code/dial_code46. No manual normalization.
Zero real bookings/holds/codes/payments. Scratch evidence/probe:
work/dagmar-flow-evidence.json and work/inspect-dagmar-flow.mjs in a199 checkout.

## Changed common control and narrow integration

Only factory policy validation changes. DAGMAR_LUNCH_RECEIPT_POLICY adds
type0Contract='villa-dagmar-lunch:63588:v1'. Type0 is accepted only when every
explicit property of that immutable export matches: restaurantId,name,hash,
mealid63588,mealType numeric0,maxParty2 and contract marker. Missing marker,
copied marker on another venue/meal, different cap/name/hash/type all throw.
A marker attached to an ordinary2/3 policy also throws. No generic allowType0
switch. Existing type2/3 configurations retain their previous behavior.

Receipt/request/approval/status/document/requirements verification is unchanged.
Tests exercise the exact synthetic positive and negative tuple mutations, every
existing policy rejecting type0, dinner/weekend/breakfast exclusions, numeric
versus string receipt type, changed payment/products/card/group/parent/waitlist,
consent/phone mismatch, temp/custom-request endpoint, replay/dispatched binding,
and navigation mismatch.20 focused tests pass.

Next concrete integration for32d5 after current queue: use existing provider-
review path, NOT contactFinalPolicies, with own scoped opt-in. Retain native
review/final consent, accepted durable-before-dispatch and replay contract. Review
the factory opt-in narrowly, then run the existing full-app harness before
activation. No shared server/UI/runtime changes, new engine or broad type0
permission. This is the only new complete handoff in this task.
