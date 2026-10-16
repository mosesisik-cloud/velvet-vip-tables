# Italiano Dining Room — queued after De Kas/current integration

Refs #129. Base7b2ab8a0cee59760da3579e2c376885fd34e2701. Existing22 registry;
exact #129/open PR ownership checks empty; claimed before source/form inspection.
One candidate, no fallback.32d5 owns shared integration and release; De Kas keeps
its earlier queue position. Only policy/test/source evidence in this change.

## Identity and source

Official https://italiano.se/italiano names Italiano at Nybrogatan12.
Its public /_next/static/chunks/783-74911a31f99bd94c.js maps route /italiano to
hash `db5f54c8e9643fd5e54cd57016fb2544`; reservation button opens Waiteraid
/reservation/?hash=<mapped hash>&version=new. Exact canonical ID
`curated-STO-italiano`, provider name `Italiano`, matching existing registry.
Initial provider HTML SHA256:
`daf29c2929109aca575d8bc6d83fa8e41b7b667bb2a26eb637acfd94cc0fea61`.

Dining Room22890/type3: must_pay_directly=false,mandatory_products=false,bullets={}.
Meal min/max0 unset under common getAmountsList; global max_people8/max_seating9.
Initial policy maxParty2, actual2 checked. group_bookings=false,custom_request=false,
linked_meals=[]. Benign meal group_booking=true; actual groupEnabledfalse.
Numeric restid not exposed/not invented. Exclude Saturday Wine Lunch13836/type2
and Bar56070/type0; neither is a substitute for the reviewed Dining Room.

## Guarded native flow and phone

At2026-10-16T04:34:56.227Z reached Dining Room/two guests/22October2026/19:00.
Twelve selectable times17:00–21:30 observed; transient availability only.
Before contactNext asserted authFeaturetrue,isAuthfalse,custom_requestfalse,
groupEnabledfalse and no payment/products/card. Common guestCtrl.next2360–2369
therefore enters auth; do not generalize to authenticated/feature-disabled states.
Existing availability allowlist aborted sendAuthCode/contact stats/tracking and
unknown requests before dispatch. Visible native Fortsätt utan konto reached
Kontrollera din bokning/Slutför bokningen. Final button untouched; no auth/model
manipulation. Native phone getter beforeNext validated synthetic input+se/46
while Booking.phone empty; after native Next canonical bookingDetails matched
phone,meal22890,party2 and native country_code/dial_code46. No manual normalization.
Zero real bookings/holds/codes/payments. Scratch evidence/probe:
work/italiano-flow-evidence.json and work/inspect-italiano-flow.mjs in a199 checkout.

## Concrete integration after existing queue

ITALIANO_DINING_RECEIPT_POLICY uses the existing provider-review path, NOT
contactFinalPolicies. Separate scoped opt-in; preserve native review/final consent,
accepted durable-before-dispatch, exact approved POST, document-bound receipt
and unknown/replay guards. Common factory logic including Dagmar's exact type0
exception is unchanged. Focused fixture covers evening date/time, type3, excluded
Saturday lunch/Bar, cap, new no-show guarantee and missing receipt. Positive
receipt is synthetic; actual authorized transaction/receipt remains unobserved.
32d5 runs existing full-app provider-review harness before scoped release. No
new engine/shared edits or historical receipt prerequisite. Sole completed new
handoff this turn; no queue-order change and no extra master acknowledgement.
