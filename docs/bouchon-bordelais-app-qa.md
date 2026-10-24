# Le Bouchon Bordelais app integration QA

Runtime d73be467fa8422181a4a729fc5f78b96f46a0ce5, base public296/ea0f5e949897549b1fa277ac72927f133729e933, provider520/4c16c8c5a0f72fc533a50c4089b009037f1f99a1 unchanged in all four files. Release297 includes12 runtime files including data/extra-destinations.json for BOD/Bordeaux.

Own three saved source hashes/bytes,37 form projection fields and27 saved asset hashes verified locally; original12:15 form slot is the only normalized projection slot field. No supplier network calls by integrator. Provider owner reports original client390/1366 and actual adapter contact/verifyNativeRoom passing; master separately verified raw source, fields/assets and empty native contact. These are not a real reservation or independently executed integrator native replay.

Local real app, API, provider and SQLite with synthetic supplier:
- Main v3 PASS:60 API requests,2 backend restarts,2 synthetic supplier attempts. Guest global search, BOD listing/destination/detail, scope, full FR/EN notices, explicit consent, duplicate prevention, own receipt and durable unknown isolation/recovery.
- Tail8 PASS:107 API requests,8 restarts,0 supplier attempts. Exact opening,English notice,hidden field activation,selected offers,after-review FR/EN drift,voucher grant drift,extra payload key all stop.
- Cutoff4 PASS:48 API requests,4 restarts,0 attempts.23/27October at11:49 show5 choices and11:50 show0, Europe/Paris across DST. Tuesday–Friday restriction separately tested, including Monday rejection.
- Journal67/67 PASS (66 shared restaurant tests and1 own test);851 unique catalog rows and207 provider mappings PASS.

Initial main v1 expected notices without the existing Français/English labels; v2 incorrectly expected a non-null lunch notice. Both stopped before final supplier dispatch, and test expectations were corrected without runtime changes. Initial common journal fixture used12:00 outside this venue scope; changed only its test time to12:30. No tests were manually aborted. Runtime CI40087418474/40087418513 passed; exact final documentation commit CI is recorded in PR.

Screenshots scope390, review1366 and notice390/1366 were inspected. Long-notice element captures are partially clipped by the viewport; full text, order and FR/EN inclusion are checked via DOM assertions. Public GET/HEAD checks follow activation. No real supplier confirmation has been verified; no real booking/hold/payment/contact was created. Independent master review is readonly code/source/evidence review, not a second executed app QA suite.
