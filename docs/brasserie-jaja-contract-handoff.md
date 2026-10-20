# Brasserie Jaja — lunch for exactly two

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Four provider-owned files only, based on public275 1b4e95a302284b072ecf4a27efb7d2c9a1cebf8c. Release owner32d5 supplies identity 58fabaa02edfe9a4b1faaae9a27223ba7eb17ec6 and shared integration f997967e8dba0ac5181d131dbfd452f5597360df. Canonical curated-PAR-brasserie-jaja-amsterdam / ZENCHEF_BRASSERIEJAJA / VELVET_ZENCHEF_BRASSERIEJAJA.

## Source evidence, 2026-10-20

Brasserie Jaja, 47 rue d’amsterdam, 75008 Paris, +33967408593. Amsterdam refers to the street, not the city. Distinct from Jaja in rue Sainte-Croix and Brasserie Jaja in rue Saint-Denis. Normalized identity scan found zero duplicates in 830 catalog /186 registry entries.

Own https://www.brasseriejaja.fr/ returned200, SHA256 f0481df22ca568f9b6bc870f4eec07368e2cb567aa4c8f681cf148d0930516c8. Its ReserveAction redirected from /reserver-une-table/?rid=373777&lang=fr to https://bookings.zenchef.com/results?rid=373777&fullscreen&lang=fr&withCloseButton=1. One results GET for 2026-10-23/exactly2 returned200, SHA256 262609d901d21881ade4765a4995cfd744dc8375d4c13c6088fa6bbd5752f58a. One conditional empty form GET at11:45 returned200, SHA256 3bc4f258adbd95cf71e115114602ef891a86402ab09381947d77f740778c4fad. Raw evidence remains outside repo in the worker evidence/brasserie-jaja-amsterdam directory. No other dates or party sizes probed.

Own restaurant373777, shift347295 Midi, three times11:45/12:00/12:15 only. Raw confirmation false/until6 retained exactly; two qualifies under the supplier threshold logic. Card/prepayment null, no required offer/from null, cancellation10800seconds relative to shift, shift comment null. Six standard required fields, customFields[]/V2[], no room selection, wish room null, raw and selected offers[]. Raw rooms84989/91890 are unselected metadata. French/French/EUR/updatefalse. Query preserves empty fullscreen, langfr and withCloseButton1; no pid/sdk/statepartner. Existing French payload default partner string1001 remains separate.

Full raw French notice is preserved and returned in terms.restaurantNotice:

```text
Bienvenue à la Brasserie Jaja.
<br><br>
Pour toutes réservations de plus de 14 couverts, merci de nous contacter au 09 67 40 85 93
<br><br>
A bientôt
```

Afternoon250843 and dinner249381 remain excluded, including their different cancellation/card policies. No menu, seating duration, room choice or group booking promise inferred. Later lunch times are rejected even if returned by the supplier. Availability must be refreshed and is not held or guaranteed.

## Native review and provider behavior

ce5c and master verified cached original Contact/EULA at390/1366. Twelve-file manifest SHA256 96fe3ce0097170c473d4c137abf44eac0b537b24c082529ae59c1b89e33d7f93; asset manifest9e387863b6394a8a787f646ac1e231a8dbb59b5ace99e6102f8795c777f7df94. Direct Contact, empty fields/unselected civility/unchecked opt-ins. Unique unchecked French EULA with own /gtc?rid=373777&lang=fr. Mobile EULA top903.421875/bottom944.421875 requires normal scroll; desktop is inside initial viewport. Restaurant notice absent in native Contact and must be projected completely before Velvet consent. Voucher displayed in raw metadata but no visible input; no gift or comment input added. Cached renderer had zero remote requests, two automatic quotation POSTs aborted before transport and zero page errors. No new assets/provider GETs.

Named policy/query guards and full schema/EULA/notice/shift freshness apply before review and durable approval. Existing owner/revision/TTL, consent, durable attempt binding, one POST/no retry and independent own-booking UUID readback remain. A POST echo cannot confirm a reservation; unknown outcome stays locked.

## Validation and remaining gates

Focused Jaja run passed4/4 top-level tests: ten intercepted browser scenarios plus three pure tests. Subsequent run passed12/12: Bien eleve intercepted browser test and seven Bien eleve/Ardent pure regressions, plus all four Jaja pure tests including added exact-time scope rejection. Syntax checks passed. All booking POST/readback tests are synthetic and intercepted; zero real reservations, holds, payments or supplier confirmations.

32d5 owns combined integration, notice projection, feature flag, release and publication. Independent review and actual integrated appQA remain required before activation. No shared app/server/catalog/registry/ledger/deploy files changed here. Native review is not a completed booking.
