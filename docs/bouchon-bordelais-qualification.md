# Le Bouchon Bordelais — Tuesday–Friday lunch for two

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939;refs #129. Base public296. Sole integrator32d5 reserved curated-BOD-le-bouchon-bordelais, BOD/Bordeaux, ZENCHEF_LE_BOUCHON_BORDELAIS and VELVET_ZENCHEF_LE_BOUCHON_BORDELAIS after deduplication. This change touches only provider, own fixture, test and this document; destination/catalog/runtime activation remains with32d5.

## Own source

https://www.bouchon-bordelais.com/ returned200 at2026-10-24T10:45:42.016Z,35593bytes,SHA256ae280ad0d34e571cb16db13f29b1616be11424bdf7f8cc7fe8c0e5b7f75d9d9d. Current explicit RÉSERVER UNE TABLE/RÉSERVATION links go to https://bookings.zenchef.com/results?rid=349601&pid=1001. A separate older hidden popupiframe omits pid; it is not combined with the selected contract. Own page states lunch/dinner Tuesday–Friday and Saturday dinner.

One27October2026/pax2 results GET:HTTP200,161111bytes,SHA25628dcd090e896680957db1afc7a270274cbf6efb35938ef82b455f3fec6719e9a. One empty12:15form GET:HTTP200,161977bytes,SHA2562624580bd6eca4d6a0ed4b0c674ec25b6b4bd806ef08a63cd9b12fc82a191482. Identity Le Bouchon Bordelais,2 rue Courbin,33000 Bordeaux,0556443300. Full safe state/source metadata in scripts/fixtures/bouchon-bordelais-source.json; raw/network/native evidence under workspace evidence/bouchon-bordelais.

## Scope and policy

Exactly2people,Tuesday–Friday,lunch9714 Déjeuner. Eight raw slots12:00–13:45; five observed normal available times12:15/12:30/12:45/13:00/13:15. The other three raw slots were empty and remain outside exposed scope. Confirmationtrue/null,charge/prepaymentnull,cancellation1200seconds relative to shift. Exact opening2026-09-27 13:00:00 pinned for shift/allslots. Fixed booking cutoff11:50local for shift/allslots; only its requested-date prefix normalizes. The global one-month notice is retained; no unverified rolling opening calculation is inferred from one observation. Changed opening timestamps fail closed.

Dinner9715 is excluded and requires25EUR/guest card guarantee from1guest. Full offer catalogue22233/Menu4temps and22234/Menu6temps retained and hash-pinned, unselected; neither menu is imposed on lunch. No room choice or gift field in original contact UI; wish.room_id null,offers empty,voucherParam absent. Disabled custom field1337/slug a is preserved enabled=false/required=false and mandatory custom_field.a hidden. Activation or metadata changes block the flow.

Full French and English restaurant notices are exposed before consent through existing restaurantNotice rendering. Their different staff references (Fanny/Marin) remain verbatim, not reconciled. Lunch comment and day-specific comment are null. Native client does not show a sitting-end label; internal capacity does not become an invented duration promise. Metadata/fullshift/allslot policy fingerprints include notices,menus,fields,room definitions,cancellation,capacity and opening. Query bound to own rid/pid/date/pax; no SDK/fullscreen/mobile variants invented. Durable attempt and independent receipt guards remain required; POST echo is not confirmation.

## Verification

node --test scripts/test-zenchef-bouchon-bordelais.mjs:5/5PASS with8synthetic browser scenarios. Checks own identity/Bordeaux destination,availability,exactquery,out-of-scope times/parties,full policy drift,field/offer/gift changes,English notice changes,opening drift,cutoff expiry,denied/wrong grant,independent receipt mismatch andduplicate prevention.

Original unmodified client buildb59e3e3c70 replay at390/1366PASS;27exact referenced assets allreused byURL/hash. Mobile screenshot inspected. Actual provider adapter against original empty form reaches contact and passes verifyNativeRoom with complete FR/EN terms. All replay network locally fulfilled or aborted; fake contact/POST only in separate synthetic tests. No contact data, consent, booking, hold, payment, provider POST, restaurant contact or bypass in live work. Actual supplier-confirmed bookings remain untested.
