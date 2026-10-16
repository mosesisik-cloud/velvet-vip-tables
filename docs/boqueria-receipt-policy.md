# Boqueria LUNCH — next concrete integration after current queue

Refs #129. Base280e297353f445bf7109fca6066c7b41c4fa0c5d. Existing22 registry;
exact name/ID and open PR checks found no owner.32d5 owns shared integration
and release after Vau/current queue. Only policy/test/source evidence changed.

## Public identity and scope

On16 October2026 https://www.boqueria.se/en/ embedded Book a table/Reserve links
with waiteraid-widget class, hash `0195100c20f372753761a0bbb861f027` and official
Bokabord loader. Canonical `curated-STO-boqueria`, exact provider name `Boqueria`.
Initial HTML SHA256:
`26b567dde89a10e547ac1f7d8a558bf7a8cf76eb859107ba54c2288c90332062`.

LUNCH22/type2: must_pay_directly=false,mandatory_products=false,bullets={}.
Meal min_amount0 unset/max_amount15; global max_people100/max_seating101 includes
other meals and must not be treated as ordinary Lunch scope. Initial policy cap2,
actual party2 inspected. group_bookings=false,custom_request=false,linked_meals=[].
Benign meal group_booking=true; actual groupEnabledfalse. Actual group/parent
receipts remain rejected. Numeric restid not exposed/not invented.

Excluded IDs: short dinner11110/type0 and dinner146/type3 both require payment;
brunch3709/type4; events64620,51751,65006,52627,52902/type0; New Year14627/type0
requires payment/card. No substitution merely because another event is unpaid.

## Guarded native review and phone

At2026-10-16T04:22:05.074Z reached LUNCH/two guests/22October2026/13:30.
Ten selectable slots11:30–13:45 observed, transient inventory only. Before Next
asserted actual authFeaturetrue,isAuthfalse,custom_requestfalse,groupEnabledfalse,
no payment/products/card. Common guestCtrl.next2360–2369 therefore enters auth
instead of direct completion; do not generalize to authenticated/feature-off states.

Existing availability allowlist blocked sendAuthCode/contact stats/tracking and
unknown requests before network dispatch. Visible Fortsätt utan konto led to
actual Kontrollera din bokning/Slutför bokningen; final button never clicked.
No auth/model manipulation. Existing native phone getter beforeNext validated
synthetic input+se/46 while Booking.phone empty; after native Next canonical
bookingDetails matched phone/meal22/party2 and country_code/dial_code46. No manual
normalization. Zero real bookings/holds/codes/payments. Evidence in a199 checkout
work/boqueria-flow-evidence.json and work/inspect-boqueria-flow.mjs.

## Integration and limitations

BOQUERIA_LUNCH_RECEIPT_POLICY uses existing provider-review path, NOT
contactFinalPolicies. Own scoped opt-in; retain provider review/fresh consent,
accepted durable-before-dispatch contract, exact approved POST, document-bound
receipt and unknown/replay locks. Fixture covers upper-case LUNCH receipt label,
all excluded meals, party cap, new payment and missing document. Existing full-app
harness/release remain32d5's gates. Actual authorized transaction/receipt is
unobserved; positive receipt fixture synthetic. No new engine/shared edits.
This is the sole completed handoff for the next integration after the current
queue, with standing mandate and no new master acknowledgement required.

## Single fallback decision

Villa Dagmar stopped after initial source: unpaid Lunch63588 is type0 while
current policy factory permits only2/3. Dinner34285/type0 and weekend63586/type0
require payment; breakfast16915/type1 has card bullet. Exact gap: review a narrow
type0 meal contract before enabling, not a payment blocker for Lunch63588. No
broad factory relaxation or Dagmar contact probe. Initial HTML SHA256:
`59eaa2bc0f131dfaa5069fcd2689cef7f0fb79b17c148a29e633a0a2f73e6031`.
Boqueria was the only fallback; Paraden/OLLI not reprobed, no broad inventory.
