# Indiana Café Montparnasse — parked: unsupported required custom field

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939 / chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Canonical curated-PAR-indiana-cafe-montparnasse/rid375451,72 Boulevard du Montparnasse75014Paris.32d5 isolated identity21c05d7773b2a9d4a9fe56dcfb5a1b76d2d2c9b9 stays unpublished. Clean main2568d8b274a3c4d18135e1ed3dee63b586e2d905e8f. No runtime activation.

## Own evidence,2026-10-18

Read saved C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/indiana-official-20261018.html SHA2563e6d9d4f6ca036c62a64e6c33e9335de5d8e53536b67df49b8733bcf10e2c3c7 and indiana-montparnasse-official-20261018.html SHA25665cb287f9b91692afa6e28c416d76d752614b4c8948a5108db4dfd5621ed35e2 locally, both matched. Root https://www.indianacafe.fr/ actual375451/pid1001 anchor in own card and https://www.indianacafe.fr/restaurant/montparnasse own name/address/slug-popup confirmed. No new official GET; Club Maine remains separate and parked.

One GET https://bookings.zenchef.com/results?rid=375451&pid=1001&lang=fr&day=2026-10-23&pax=2 returned200 SHA256f02d421a59392f39c3a4cfe3cb2bcf41d474f587519ca608d01f55d75a4bbe79. Native Indiana Café - Montparnasse/72 Bd du Montparnasse/Paris/75014 matches own official identity. Lunch314295 Déjeuner auto false/until30, nullcharge/prepayment, offerfalse/fromnull,10800 seconds SHIFT. Roomselectionfalse/mandatoryfalse/wishroomnull/offers[].13candidate times11:30–14:30 every15minutes are not reservations/holds. Other services not pursued.

Conditional form GET https://bookings.zenchef.com/form?rid=375451&pid=1001&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200/pageform SHA256571631c0d6c3a31b10e8345806897289ddd58e256252f05ea0a33e7cb7e72e16. Own identity/policy and query.pid/partner_id string1001 match. In addition to six standard required fields, mandatoryFields custom_field.motif-de-la-reservation is required. customFields contains4815, title Motif de la réservation, slug motif-de-la-reservation, typeauto/displayTypetext/requiredtrue, enabledfalse/options[]; customFieldsV2[]. Despite the enabledfalse metadata, the mandatoryFields requirement is explicit. Do not ignore it, assume optional, fabricate an answer or invent native mapping/submission semantics. Existing standard-field adapter cannot safely complete this contract.

Own raw FR notice says72 boulevard du Montparnasse, distinguishing another restaurant at74 avenue du Maine with billiards. This supports Montparnasse's own identity and does not resolve Club Maine's separate77/74 contradiction. Own15minute retention/contact01 43 35 36 28; no terrace rule inherited. Shiftcommentnull. Full notice/custom metadata saved in sanitized fixture.

## Delivery and checks

Only this handoff and scripts/fixtures/indiana-montparnasse-blocked-source.json. Local own identity/required custom field/auto threshold/JSON assertions PASS. Existing verifyNativeRoom fresh-field guard called locally against own saved form rejects provider_fields_unverified/409 before further handling: PASS, no network. git diff --check PASS; no broad matrix or actual browser booking test.

Raw work/indiana-montparnasse-results.html/work/indiana-montparnasse-form.html and parsed *-state.json retained. One results and one form only, no assets/alternate probes/inputs/choices/holds/reservations/payments/messages/capability/receipt reads. Not a manual/card/payment blocker. Master/32d5 should consolidate evidence and keep identity isolated. Any support for required custom answers needs separate scope and verified native semantics, not a generic relaxation. Actual supplier confirmation remains unverified; production256 untouched.
