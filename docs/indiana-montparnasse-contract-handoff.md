# Indiana Café Montparnasse: required reservation purpose

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Base main256 8d8b274a3c4d18135e1ed3dee63b586e2d905e8f. Provider-only handoff to release owner 32d5.

## Identity and evidence lineage

Canonical curated-PAR-indiana-cafe-montparnasse; export ZENCHEF_INDIANAMONTPARNASSE; flag VELVET_ZENCHEF_INDIANAMONTPARNASSE. Own restaurant 375451 / explicit string pid1001 / 72 Boulevard du Montparnasse, Paris75014. Identity commit 21c05d7773b2a9d4a9fe56dcfb5a1b76d2d2c9b9 remains separately owned by 32d5. Club Maine 77/74 address conflict is not resolved by this work.

Evidence collected 2026-10-18 in PR374 (8677fb56b4fff1c168ab8f8db2e649ef3c274ca9): results SHA256 f02d421a59392f39c3a4cfe3cb2bcf41d474f587519ca608d01f55d75a4bbe79; form SHA256 571631c0d6c3a31b10e8345806897289ddd58e256252f05ea0a33e7cb7e72e16. Own saved official page https://www.indianacafe.fr/restaurant/montparnasse SHA256 65cb287f9b91692afa6e28c416d76d752614b4c8948a5108db4dfd5621ed35e2. Native lunch314295/exact2/auto false until30/null charge and prepayment/no offers/10800 seconds SHIFT/strict no room;13 candidate times11:30–14:30. Candidate times are not reservations or guarantees. Excluded other services276633/314297/314298/314299. Raw own notice distinguishes72Montparnasse from74Maine,15minute retention, own phone01 43 35 36 28; shiftcomment null. No terrace rule imported.

PR375 de075cf2f06c3d029f783aa17a226fe8643f0dc1 independently reviewed cached native field analysis. Custom field4815 is own375451, slug motif-de-la-reservation, title Motif de la réservation, type auto/displayType text, step3, options[], enabled false, required true. Native requiredness is independent of enabled. Native text serializes to legacy custom_field[slug], not V2 or numeric ID. Analysis used existing cached app/form assets only.

ce5c proved actual saved native DOM at390/1366: exact title -> xpath=../following-sibling::label/input, unique visible editable input, type property text. No getByLabel association or native id/name/testid/required attribute. Artifacts in sibling files-pasted-by-the-user-ja-10/work: montparnasse-native-purpose-{390,1366}.json/.png, native-field-tree-{390,1366}.json, montparnasse-dom-manifest.json. Requiredness derives from metadata. Empty-field proof only; no native input was filled. Native EULA/GTC375451 present; full raw restaurant notice was NOT visible at contact stage. Shared UI must show own notice. This implementation introduced no external GET/assets/contact writes/holds/bookings/payments/messages or receipt reads.

## Provider contract

Single named-only reservationPurpose field: required text, maxLength200 UTF16 units, nonblank, no ASCII control characters. This is a product restriction, not a claimed supplier limit. Exact untrimmed string is retained. Exposed in fields, details/review, approval top-level and approval.details. Shared UI label: Anledning till bokningen (Motif de la réservation).

Exact own metadata plus isInUpdateFlow=false checked at select/review/submit and before durable grant; schema identity digest participates in terms/review fingerprint. Unique actual input and exact readback required after fill, before review, submit and native POST grant. No native store mutation. Editing invalidates review. Sole legacy payload key must equal frozen approval.details.reservationPurpose and top-level purpose; extra keys/V2/comment/customersheet substitutions fail. Other venues reject injected purpose and retain generic required-field guard.

Shared ledger must store details:{shiftId:314295,reservationPurpose} exactly and bind it through reserve/record/restart/replay with date/time/party and existing owner/session/revision/fingerprint. Provider rejects durable attempt mismatch before any send. 32d5 owns shared ledger/journal/UI/results/server integration (preliminary shared commit5e6730c054967f31f4e632082e8b5fcc6f5702fa). Purpose is private: no public history/proof/receipt echo invented. Independent own-booking readback rules unchanged; POST echo alone never confirms.

## Validation and remaining gates

Focused Montparnasse command: ZENCHEF_TEST_SCENARIO_PREFIX=montparnasse node --test --test-name-pattern='native booking and own-booking|Montparnasse|Fresh required|Explicit partner venues' scripts/test-zenchef-playwright.mjs:5/5PASS,21 synthetic browser scenarios. Includes exact accented/quoted/ampersand/spaced text, blank/control/overlength, before-review/after-review/pre-grant drift, metadata/update-flow/duplicate field, extra payload, durable purpose mismatch and review invalidation. Pre-grant negatives send zero requests. Native DOM structure is mirrored in synthetic harness; this does not constitute real supplier submission.

Bounded Tolbiac regression with prefix tolbiac and pattern native booking and own-booking|Fresh required|Explicit partner venues:3/3PASS,10 synthetic browser scenarios. node --check and git diff --check PASS. Initial harness field placement error corrected before passing runs. No broad completed matrix rerun.

Only provider/tests/ownfixture/handoff delivered. Integration, independent review, actual local app QA and publication remain 32d5 responsibility. Actual supplier confirmation remains unproven; no real booking is claimed.
