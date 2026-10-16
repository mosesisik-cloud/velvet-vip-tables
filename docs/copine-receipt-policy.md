# Copine Lunch — next concrete integration after Italiano/current queue

Refs #129. Base1c5aa348b23d9a512849a7011b9aed982ff7246d. Existing22 registry;
exact #129/open-PR ownership check empty.32d5 owns shared integration/release.
Policy/test/docs only, no shared server/UI/runtime changes or new engine.

## Identity and scope

On16October2026 https://www.jimjacobrestauranger.se/copine linked Boka Bord to
Waiteraid hash `153ead326f6097aa89a7e5db04760c97`, redirecting to same Bokabord
hash with Swedish language/new version. Canonical `curated-STO-copine`, exact
provider name `Copine`. Initial HTML SHA256:
`ba963b520615aef0129ff46dc4a7f56efb9192921f0fd5a1bd4ce4925e4da180`.
Lunch4790/type2 permits1–8; must_pay_directly=false,mandatory_products=false,
bullets={}. Global max_people18/max_seating0 also covers private meals and is
not ordinary Lunch scope. Initial Velvet maxParty2, actual2 inspected.
group_bookings=false,custom_request=false,linked_meals=[]. Benign meal
group_booking=true; actual groupEnabledfalse. Numeric restid not exposed/invented.

Excluded dinner4788/type3 and private dinner5303/type0: direct payment/card.
Private lunch9196/type0 is unpaid but requires8–18 and remains outside scope.
No room-choice or paid-meal contract is added by this policy.

## Guarded real flow

At2026-10-16T04:53:05.575Z reached Lunch/two guests/22October2026/13:30.
Ten selectable times11:30–13:45 observed; transient availability only. Before
Next asserted authFeaturetrue,isAuthfalse,custom_requestfalse,groupEnabledfalse,
no payment/products/card. Common guestCtrl.next2360–2369 enters auth for this
state, not direct save; never generalize to authenticated/feature-disabled states.
Existing availability allowlist aborted sendAuthCode/contactstats/tracking and
unknown requests before network dispatch. Native Fortsätt utan konto reached
Kontrollera din bokning/Slutför bokningen. Final untouched; no auth/model
manipulation. Existing phone getter beforeNext validated synthetic input+se/46
while Booking.phone empty; after native Next canonical bookingDetails matched
phone/meal4790/party2 and country_code/dial_code46. No manual normalization.
Zero real bookings/holds/codes/payments. Evidence/probe in a199 checkout
work/copine-flow-evidence.json and work/inspect-copine-flow.mjs.

## Concrete handoff

COPINE_LUNCH_RECEIPT_POLICY uses existing provider-review path, NOT
contactFinalPolicies. Own scoped opt-in, native review/fresh consent, accepted
durable-before-dispatch, exact approved POST, bound receipt document and unknown/
replay controls stay intact. Common verifier/factory including Dagmar exception
unchanged. Fixture excludes paid dinner and unpaid private lunch, larger parties,
new card/payment requirements and missing document. Existing full-app harness
and scoped release remain required. Positive receipt synthetic; actual authorized
transaction/receipt unobserved. Sole completed new handoff after Italiano/current
queue under standing mandate, no new master acknowledgement or queue reorder.

## Single fallback

Tête initial candidate stopped at source: Middag53187/type3 requires direct
payment AND mandatory products; private53194/type0 also; bar64982/type0 requires
payment. Exact gap is payment/product handling, no contact probe or relaxation.
Initial HTML SHA256 `5379226526ad21336360d5e46c2b70f0e40a0da44eda690a185150b248918e39`.
Copine was the sole motivated fallback (ordinary unpaid lunch); no other candidate,
old-blocker probe or broad inventory.

## Integrated validation

Runtime candidate ccd3526d6df26bec1e835ff231a5bd63b4263026 on release214 passes
all23 focused tests and scoped review with no concrete blockers. The additive
source/test conflict resolution preserves Italiano; common verifier, journal
and De Kas code remain unchanged.

Actual full-app guest flow passes193 API calls / ten restarts / nine mocked
POSTs, zero real supplier writes. Test-only handoff #215, commit
8bcf02d56be01402e4a0e190423e2eaf0d00abbc. Checks include native guest continuation,
phone readback, fresh consent, SQLite before network, original matching receipt,
missing-document unknown, owner isolation, replay/restart and public history.
Response exclusions4788/5303/9196/amount3/require_noshow/must_pay_directly remain
unknown even with matching receipt text. Existing harness modes are preserved.
Positive receipts are simulated; successful actual supplier booking remains
unobserved. No unchanged broad regression loop was needed.
