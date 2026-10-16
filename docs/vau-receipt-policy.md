# Vau De Ville Lunch — next concrete integration after current queue

Refs #129. Base40fda22b65291bf498e07f0636155fdf8ecb4264. Existing22 registry;
no prior owner found in exact #129/open-PR search. Single candidate, no fallback.
32d5 owns integration after Astrid/current release, using standing queue mandate.
Only policy/test/source evidence; no shared server/UI/runtime changes or engine.

## Identity and scope

On16 October2026 https://vaudevillestockholm.se/ embedded a BOOK TABLE button
with waiteraid-widget class and hash `1994e39a706405442f6b37293d883d0b`, plus
the official Bokabord widget loader. Canonical ID `curated-STO-vau-de-ville`.
Exact provider name is `Vau De Ville` (capital D), different from registry label.
Initial HTML SHA256:
`2758e8431878ebd7d98c0af3e667c0c80d05b5ee55a2090da90debac49cca85e`.

Lunch22476/type2: must_pay_directly=false, mandatory_products=false, bullets={}.
Meal min_amount0 unset/max_amount16; settings max_people12/max_seating12 limit
the generated list before the meal bound. Initial Velvet cap2 only, actual2
checked. group_bookings=false,custom_request=false,linked_meals=[]. Benign
meal group_booking=true metadata; actual groupEnabled()false observed. Actual
group/parent receipts remain excluded. Numeric restid not exposed/not invented.
Dinner22477/type3 is excluded: its cc bullet requires credit-card confirmation,
even though must_pay_directly=false. No payment/card contract expansion.

## Bounded real flow

At2026-10-16T04:17:42.198Z reached Lunch/two guests/22October2026/13:30.
Seven selectable slots observed from11:00 to13:30; transient inventory only.
Before Next asserted actual authFeature=true,isAuth()=false,custom_request=false,
groupEnabledfalse, no payment/products/card. Common guestCtrl.next2360–2369
therefore enters auth instead of direct completion. Do not generalize to
authenticated or feature-disabled sessions.

Existing availability allowlist blocked sendAuthCode/contact stats/tracking and
unknown requests before network dispatch. Native visible Fortsätt utan konto
reached Kontrollera din bokning and Slutför bokningen. Final button untouched;
no auth/model manipulation. Existing native phone read beforeNext validated
synthetic input and se/46 while Booking.phone empty; native Next then populated
the model. Canonical bookingDetails matched phone/meal22476/party2, and native
country_code/dial_code matched46. No manual normalization or second mechanism.
Zero real bookings/holds/auth codes/payments. Evidence in a199 checkout
work/vau-flow-evidence.json and work/inspect-vau-flow.mjs.

## Integration and evidence limits

VAU_LUNCH_RECEIPT_POLICY belongs in the existing provider-review path used by
Noema/Ciccios/Beirut/Balzac/Kommendören, NOT contactFinalPolicies. Own scoped
opt-in; preserve native review/fresh final consent, accepted durable-before-
dispatch contract, exact approved POST, receipt document and unknown/replay locks.
Fixture checks exact capitalization, cap, excluded dinner, card requirement
and missing document. Full-app provider-review harness remains required before
activation. Positive receipt is synthetic; actual authorized transaction/receipt
is unobserved. No invented historical receipt prerequisite or external blocker.
This is the only new complete handoff in this turn;32d5 can integrate after the
current queue without another master acknowledgement.

## Integrated verification

Runtime1c01ce2 adds only the independent receipt-policy flag.17focused tests and
narrow independent review pass. Actualapp/API/Chromium/SQLite harnessc281f99 on
that exactruntime passed84API/4restarts/3mockPOST: exactVau De Ville receipt name,
guest/noaccountcode,Next-onlyphone,freshconsent,SQLitebeforeNETWORK,doubleclick,
wrong/missingreceiptunknown,matchingoriginalreceiptconfirmed and owner/restart/
replay. Dinner exclusion is covered by the focused policy tests, not a live
transaction. No pre-DOM-click claim;0real supplier reservations/holds/codes/payments.
