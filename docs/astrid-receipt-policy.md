# Brasserie Astrid Lunch — next concrete integration

Refs #129. Base0bd075b3eec4da050f5f3b4c255b89f9017517e0. Existing22 registry;
no prior owner in exact #129/open-PR search. One candidate, no alternatives.
This is32d5's next concrete integration after the current release, subject to
existing full-app validation. No new master acknowledgement is needed. Only
policy/test/evidence changed; no shared runtime/server/UI or new engine.

## Identity and bounded source scope

On16 October2026 https://brasserieastrid.se/restaurang linked Boka bord to
Waiteraid hash `e3a1940c68c7fcb34cb950162eeaaaef`, redirecting to Bokabord with
the same hash. Canonical `curated-STO-brasserie-astrid`; exact provider name
`Brasserie Astrid`. Initial widget HTML SHA256:
`1ca5ff61f13f788d6fc7058e11cd77660f151c1de2310edd9366450b89d376e1`.

Lunch55508/type2 has must_pay_directly=false, mandatory_products=false,
bullets={}; meal min/max_amount0 mean unset bounds under getAmountsList5373–5401.
Global max_people8/max_seating9 includes the large-party request choice; initial
Velvet policy caps at2, with actual party2 checked. group_bookings=false and
linked_meals=[]. Benign meal group_booking=true is metadata; actual
groupEnabled()false. Numeric restid not exposed, not invented.

Unlike prior candidates, settings.custom_request=true. This enables an optional
request route; it is NOT the selected ordinary booking. Actual Booking.custom_request
was asserted false before contact Next. Source selectAmount590–591 enables it
for the large-party choice. Do not enable sendCustomRequest, group/private requests
or treat request acceptance as booking confirmation. Existing saveBooking-only
request guard and exact receipt endpoint remain intact. Out of scope: dinner55509,
Chambre Séparée58704/type0/min12, brunch65363/type0 and parties above2.

## Original provider check and phone

At2026-10-16T04:02:18.286Z reached Lunch/two guests/22October2026/13:30.
Nineteen selectable slots11:30–16:00 observed; transient availability only.
Before Next asserted actual authFeature=true,isAuth()=false,custom_request=false;
groupEnabledfalse and no payment/products/card requirements. Common
guestCtrl.next2360–2369 therefore enters auth, not direct completion. This
result must not be generalized to authenticated/feature-disabled sessions.

Existing availability allowlist blocked sendAuthCode, contact stats/tracking and
unknown requests before network dispatch. Visible Fortsätt utan konto reached
actual Kontrollera din bokning and Slutför bokningen; final never clicked.
No auth/provider-model mutation. Existing native phone getter beforeNext read
synthetic input plus se/46 while Booking.phone empty; afterNext canonical
bookingDetails exactly matched phone/meal55508/party2 and country_code/dial_code46.
No manual normalization. Zero real bookings, holds, codes or payments.

Probe/evidence: a199 checkout work/inspect-astrid-flow.mjs and
work/astrid-flow-evidence.json. Shared receipt contract is reused; positive
receipt fixture is synthetic, no historical per-venue receipt prerequisite.

## Handoff contract

Register ASTRID_LUNCH_RECEIPT_POLICY in the existing Noema/Ciccios/Beirut/Balzac
provider-review path, NOT contactFinalPolicies, with its own scoped opt-in.
Keep ordinary native review/final consent, accepted durable-before-dispatch
contract, exact POST binding, bound receipt document and unknown/replay locks.
The focused fixture rejects other meals, large parties and sendCustomRequest
endpoint. Existing full-app harness must retain those boundaries before release.
Actual authorized transaction/receipt remains unobserved. No external blocker
found; public activation remains32d5's work. This is the only new completed
policy delivered to the integration queue in this turn.

## Integrated verification

Runtimea6a5890 independently enables the receipt policy only;16focused tests and
narrow independent review pass. Actualapp/API/Chromium/SQLite harnessfb74fce
passed85API/4restarts/3mockPOST on that exact runtime. The actual adapter aborts
native sendCustomRequest before transport: zero attempts/POST and no confirmation.
The ordinary custom_request=false flow then passes guest/noaccountcode, native
Next-onlyphonecopy, fresh approval, actualSQLitebeforeNETWORK, double-click,
missing/wrongreceiptunknown, originalmatchingreceiptconfirmed and owner/restart/
replay checks. No pre-DOM-click claim. Zero actual supplier reservations, holds,
codes or payments; completed real supplier booking remains unobserved.
