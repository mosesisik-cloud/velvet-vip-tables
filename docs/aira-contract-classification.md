# AIRA — required payment/card contract, no activation

Refs #129. Explicit source-classification task. Base2085ccfec75e6278c4ada1da38ca127c6ed38cae.
Checked16October2026. Exact #129/openPR search found no competing owner. Prior
docs/stockholm-booking-verification.md recorded card required for an unspecified
tested AIRA meal; this report identifies the actual current initial meal fields.
No fallback, availability/calendar/contact/phone/payment or final-action probe.

## Identity and initial sources

Canonical ID curated-STO-aira; hash `5eb41ca79ef5e63bfabfdcbb39e4f6a8`;
exact initial provider name `Aira`. Official https://aira.se/ Make a Reservation
links directly to Bokabord with this hash, version=new and mealid=8192.
The current initial response to that exact official URL exposes ONLY35658 and
33231, not8192. Do not invent a third/current8192 offering from the query string.
Canonical registry URL and exact official URL both expose the same requirements.

Canonical initial HTML SHA256:
`9d6f2c8d8be7d689ec594b9d1b151c5a1665c1e8eaad27df3e82af8cf3b3f74e`.
Official-link initial HTML SHA256:
`0984e1619f6dafd7cb3c20b2cce40807ca87fd271d997214e4fc996798bc5c49`.
Snapshots in a199 checkout work/aira-widget.html and work/aira-official-widget.html.

## Exact two-guest eligibility versus obligations

| Offering | Type | Party bounds | must_pay_directly | mandatory_products | bullets.cc.en |
| --- | --- | --- | --- | --- | --- |
| Main Dining Room35658 | 0 | 1–6 | true | false | Confirmation with credit card |
| Chef's Table33231 | 0 | 2–8 | true | false | Confirmation with credit card |

Two guests fit BOTH capacity ranges. This does not remove payment/card duties.
No unpaid ordinary choice is present in either initial response. Type0 alone
is not the decisive blocker; unlike Dagmar's unpaid Lunch, both exact AIRA meals
have explicit payment AND card requirements. Do not reuse Dagmar's exception.

avg_gtm_price is3644/3950 respectively. Description menu-price figures and these
numeric fields are informational and NOT the basis of this classification. No
claim is made that these prices are the amount charged immediately, deposit,
card hold or cancellation charge. mandatory_products=false does not authorize
dropping the payment/card step; empty_cart_disallowed null/'0' does not override it.
Settings max_people8/max_seating0,group_bookings=false,custom_request=false,
linked_meals=[]; meal group_booking=true is metadata, not observed group state.
Initial canUseAuthFeature=false,auth=false. Contact/review behavior not exercised.

## Exact missing implementation

Before activation, the native required payment/card flow must be established,
including what it authorizes/charges, its user-approved terms and the final
supplier status after that step. The existing ordinary no-payment receipt policy
rejects must_pay_directly or cc requirements and cannot confirm these meals.
A source-only enum exception would not resolve this. Product preselection is
not proven necessary because mandatory_products is explicitlyfalse.

The shared public guestCtrl feature-off branch may complete directly on contact
Next; therefore Next must not be treated as a harmless review advance. No contact
Next, payment, hold, code or save request was sent. Actual card/charge semantics,
hold timing and completed receipt remain unobserved, not fabricated.

## Handoff

Evidence-only negative classification for32d5/master; no new activation policy
or positive integration handoff in the queue. Keep AIRA outside automatic
confirmation. No factory/provider/UI/server/runtime changes; documentation-only
diff checked, no redundant tests. Existing shared guards continue to apply.
Frantzén/Ekstedt are separate assigned source-classification work, not probed here.
