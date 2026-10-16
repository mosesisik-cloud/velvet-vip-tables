# Sperling & Co and Animo — bounded negative evidence

Refs #129. Basee0fb71d864c8bef46ffa6128fae3d6305cb2b8c7. Checked16October2026.
Exact #129/open-PR ownership searches found no implementation owner for either.
Sperling was the initial named candidate; Animo the single motivated fallback
because prior existing22 availability evidence had real dinner slots. No further
candidate inspected. No usable no-payment policy is delivered by this change.

## Sperling & Co

Canonical curated-STO-sperling-co, hashfc8a3ebc31e1b243fda481dc4f0de20d;
initial provider name is `Sperling & co` (lowercase co). Existing registry source
is https://sperlingco.se/; current web read timed out, not an identity migration
claim. Canonical initial widget GET succeeded and returned:

| Meal | Type | Required direct payment | Mandatory products |
| --- | --- | --- | --- |
| Fredagslunch51735 | 2 | true | false |
| Middag51736 | 3 | true | true |

These are all exposed meals. Both have group_booking=true metadata and no cc
bullet, but absence of cc does not cancel must_pay_directly. Auth featuretrue,
authfalse observed in initial HTML; contact/phone/review not tested because the
no-payment eligibility gate already failed. SHA256 initial HTML:
`9d4a9dc6df00805c875cc3828dd48a94c8518045ef08d3017898863837a1f3e1`.

Exact gap: implement and separately validate required payment, and for dinner
mandatory product selection/approval, before booking activation. Do not disable
flags, omit products or equate a payment-pending receipt with confirmation.
Existing earlier late-slot availability observation does not remove requirements.
No repeat of the earlier unavailable-time-window probe.

## Animo

Canonical curated-STO-animo, hashced986f291b0ecbf61267c5e8fc8600e, provider name
`Animo`. Official https://www.animorestaurant.se/en identifies Kungstensgatan9
and exposes its native Bokabord reservation link. Initial canonical widget:

| Meal | Type | Party bounds | Direct payment | Other requirement |
| --- | --- | --- | --- | --- |
| Middag20664 | 3 | min0 unset/max7 | true | cc confirmation bullet |
| Lägenheten48555 | 0 | 10–18 | true | private group offering |

These are all exposed meals. mandatory_products=false for both; absence of
products does not cancel direct payment/card requirements. Initial auth feature
true/authfalse. SHA256:
`7c3bc45ac06feee08536f064d2844f7ac6b621c973e5f61bc42989dfdd0d0d6c`.
Exact gap: native required payment/card approval and verified final status for
ordinary dinner; private room is additionally outside party2. No eligible unpaid
meal was found, so no contact/phone/review probe was run.

## Handoff and remaining work

This is evidence-only, not a complete integration task or activation approval.
32d5 should keep both outside automatic confirmation and leave the Copine/current
release order unchanged. No factory/policy/runtime/UI/server change and no new
tests for this documentation-only delta; existing verifier already rejects direct
payment, mandatory products and card bullets. Zero final/code/hold/payment writes;
only public initial configuration reads. Local source snapshots are
work/sperling-widget.html and work/animo-widget.html in a199 checkout.

Do not infer that all remaining22 are exhausted: Frantzén and Ekstedt have earlier
bounded unavailable/waitlist evidence in docs/bokabord-availability.md; that alone
is not a permanent contract classification. AIRA's booking contract is not
assessed here. No extra venue probe, no Paraden/OLLI/Tête or published-flow recheck.
