# SHIYO integrated app QA

Runtime6ba899689bed406b108aa1249d268171c808f3a3 over public291c0a1fa2c706b4b0daa5aebac7453cc89b9ea6439. Provider50115eb4ede68321fd32250158881c456461f046d2d unchanged. Independent e98a reviewed this runtime with no findings. Local QA is integrator-run; unavailable ce5c was not retried or described as independent app QA.

Real local app/API/provider adapter/durable journal with intercepted synthetic supplier traffic. No actual reservation, hold, payment or contact. Original-client empty-contact evidence remains separate from synthetic final-send/readback.

- `--shiyo --visit-choice-only`: main-v2 PASS390/1366, guest search/Lyon list/destination/restaurant routes, full notice before unchecked consent, duplicate protection, independent synthetic confirmation, lost-reply unknown state, owner isolation and restart recovery. 60API requests,2restarts,2synthetic dispatches.
- `--shiyo --shiyo-tail`: eight negative cases PASS: changed null opening date, extra required field, voucher parameter, foreign language query, changed lunch notice, changed shop flag, grant-time voucher parameter, extra payload key. 107API requests,8restarts,0dispatches.
- `--shiyo --bistrot-cutoff-only`: eight boundaries PASS on23/26October across DST, candidate counts6/5/4/0 at11:44/11:45/12:00/13:00 local. No excluded raw slot becomes selectable. 84API requests,8restarts,0dispatches.

Exact raw globalFR + two newlines + full own lunchFR notice asserted. Both normalized full strings are present in the rendered terms before consent, with no literal HTML breaks. Specific assertions cover weekday27.90EUR, weekend AND public-holiday35.90EUR, kitchen14:30 and restaurant15:00. These times are not a seating-duration guarantee. Both notice screenshots and review screenshot inspected; suspected placeholder phone not published.

Main-v1 stopped before opening any supplier session because its reused test expected a placement sentence absent from the correct own scope; test changed to assert own no-guaranteed-duration text. Before commit, a generated JavaScript line failed syntax checking due to an embedded semicolon and was corrected. Neither is counted as passing coverage. Source hashes, identity846/mappings202, strict journal/restart, syntax/diff checks PASS. No previous-venue matrix reruns. Eleven runtime files staged with full prior baseline; only verified catalog fetchedAt/serialization differences allowed. Final cutoff results/CI/merge/public GET/HEAD verification are recorded in the release receipt.
