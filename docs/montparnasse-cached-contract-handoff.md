# Montparnasse custom purpose field — cached native contract established

Refs #129, follows parked PR374. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Analysis-only branch from main2568d8b274a3c4d18135e1ed3dee63b586e2d905e8f. No runtime guard changed or venue activated. The existing blocker is a bounded implementation gap, not an unresolved native field-mapping contract.

## Exact local sources

- Own work/indiana-montparnasse-form.html SHA256571631c0d6c3a31b10e8345806897289ddd58e256252f05ea0a33e7cb7e72e16, rid375451/query.pid1001/own72BdduMontparnasse. The HTML references the two exact asset paths below.
- work/aux-bons-crus-app-bundle.js corresponds to /_next/static/chunks/pages/_app-30bffcb9f4c3b7b2.js; SHA256f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd.
- work/aux-bons-crus-form-bundle.js corresponds to /_next/static/chunks/pages/form-84144e7c9a8b854d.js; SHA256b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4.

Full exact excerpts, original offsets and hashes are in scripts/fixtures/montparnasse-cached-contract.json. Offsets are zero-based JavaScript UTF-16 code units, not byte/line numbers. No downloads or new network calls.

## What the native code establishes

1. App offset427575, getFields: nonempty options choose radio/select; otherwise checkbox type chooses checkbox, every other type becomes text. Thus this actual typeauto/options[] field becomes text without guessing what auto means generally. The same function sets enabled only when mandatoryFields[key] equals displayed, while required is separately set when it equals required. Therefore enabledfalse/requiredtrue is the expected representation of a required field here, not evidence that it is hidden.
2. App offsets414308/414494, isRequired/isDisplayed: outside update flow, required is read from mandatoryFields; displayed means present and not hidden. Both return true for this own field.
3. Form offset22627 includes fields when isRequired OR isDisplayed. Form offset30113 renders the non-voucher text field with its title and omits the optional label for required fields. Its value reads ev.custom_field[t.slug] or empty string. The onChange handler at20856 stores the input under that slug. No enabled predicate excludes it. This is a code-path rendering proof, not a claimed screenshot/full React replay.
4. Form validation at718: the native legacy custom field validation checks the matching slug exists in customFields, then tests formData.custom_field[slug] truthiness outside update flow. validateForm additionally counts required values. Blank/deleted fail; nonempty input passes this field's check. This says nothing about other required fields or supplier acceptance. Whitespace normalization is not shown; an application nonblank-input rule would be a product restriction, not a discovered supplier rule.
5. App createBookingData at428581 aliases formData.custom_field to g and includes custom_field:g in the native booking object. It is the legacy slug-keyed object, not custom_field_v2, a numeric4815 key, comment, or customersheet value. In the no-payment ordinary path, the mapping is:

```json
{"custom_field":{"motif-de-la-reservation":"<exact user-entered text>"}}
```

The placeholder is explanatory, not an answer to send. No purpose is inferred or prefilled. Payload construction was statically traced, not executed or transmitted.

## Local verification and limits

scripts/test-montparnasse-cached-contract.mjs reads only the three existing files. It extracts and executes the exact native getFields/isRequired/isDisplayed functions in an isolated VM against the own metadata, and the exact native validateField for this custom field. Blank -> error; local synthetic marker -> no field error; deleted -> error: PASS. The marker existed only in copied memory, never a browser or contact input. Static checks trace the real rendering predicate/text binding/onChange/payload mapping: PASS. No full form validateForm with invented contacts, full React DOM screenshot, submit, network, holds, capability, payment or receipt read. The fixture contains exact source excerpts, not a fabricated mock supplier contract. Current fresh required-field guard remains unchanged.

## Concrete implementation handoff to32d5

Evidence now supports implementing a narrow Montparnasse required-purpose text field; separate app/server work and integrated tests are still necessary. This is not activation approval.

- Own branch identity remains curated-PAR-indiana-cafe-montparnasse/rid375451; lunch314295/exact2/false-until30/nullcardprepay/nooffer/10800SHIFT/no-room/pid1001. Preserve own FR notice/15minute retention and explicit72Montparnasse identity. Club Maine remains separately parked.
- Add exactly one required user-supplied text field labelled Motif de la réservation with clear translated UI label if desired. No invented/default purpose, optional marketing or general custom-field editor. Include its value in contact/review/consent and bind the exact text into approval fingerprint, session revision and durable attempt data. A changed answer invalidates approval; restart recovery uses the same frozen approved value and cannot replay a second send.
- Bind the exception to this restaurant and own field4815/slug motif-de-la-reservation/typeauto/displayTypetext/options[]/requiredtrue/enabledfalse, mandatoryFields required, customFieldsV2[] and initial/fresh own metadata. Any other required field, schema drift, missing field or partner/room/policy/notice drift continues to fail closed. Do not weaken the generic six-field guard for other venues.
- Fill only the actual native text input associated with the exact field title; verify unique visible association in existing cached-native DOM QA before relying on a selector. The source does not supply a legacy text-field testId. Do not write provider store state or replace its component. Read the input back before review and immediately before the durable grant.
- Extend approvedZenchefPayload only for this named restaurant: custom_field must have exactly one own key, string value equal to frozen explicit approval. Reject empty/missing/extra/changed keys or values, wrong branch and v2 injection. All other venues retain exact empty custom_field; existing payment/offer/room/contact/consent protections remain.
- Scope tests to blank/no-purpose refusal; requiredtrue/enabledfalse rendering; exact slug serialization and escaping; metadata drift at selection/review/submit; changed purpose after approval; extra/v2/wrongbranch fields; notice/pid drift; restart/duplicate-click/unknown readback. Reuse the saved own HTML and existing cached assets for local native render proof. Do not fetch new assets or claim a real supplier confirmation.

Next step:32d5 assigns provider vs shared app/server file ownership for this bounded feature and integrated QA. This handoff provides the native semantics; implementation, actual local app/native DOM checks and publication are still outstanding. No additional external evidence is needed merely to determine the legacy field's key/type/required rule/serialization; supplier receipt confirmation remains unverified as before.
