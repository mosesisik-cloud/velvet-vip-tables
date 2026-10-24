# Le Bistrot de Lyon app verification

Runtime ec5344bff1374b355a952a89221545ecce89c3a3; manifest commit458a556da5f5b98356c959257e3e42a105d35eda has identical runtime bytes and only test/log-label fixes. Base public294/f8b91440802f53e7eef564a02a6bb46c2e17388b. Provider514/0cbb2e332527dd47bb06aa7bf8ca715e99ed6b30 remains unchanged.

Integrator real local app/API/native Chromium adapter/SQLite journal with synthetic supplier boundary:

- Main `--bistrot-de-lyon --visit-choice-only` v3 PASS390/1366:60API requests,2restarts,2synthetic dispatches. Guest global search, Lyon list/destination/restaurant routes; full original global and lunch notices and native90-minute seating end before consent; duplicate prevention, own-booking fixture readback, unknown outcome, owner isolation and restart recovery.
- Tail `--bistrot-de-lyon --bistrot-de-lyon-tail` PASS:107API requests,8restarts,0dispatches. Changed opening date, native seating end, voucher metadata or required field; notice and seating changes after review; metadata drift at dispatch and unapproved blank payload key.
- Cutoff `--bistrot-de-lyon --bistrot-cutoff-only` PASS:48API requests,4restarts,0dispatches.23/26October2026 synthetic dates test11:49/11:50 across DST;5/0slots with no persisted attempts.
- Shared journal64/64PASS, own journalPASS, catalog849unique/205mappingsPASS. Provider's own5/5tests/10synthetic scenarios retained without rerunning.

Main v1 stopped before dispatch on an inherited SHIYO price-text assertion; v2 stopped before dispatch on an inherited no-seating assertion. Corrected only the test conditions; v3 ran the same runtime and passed. Scope, notice and review screenshots inspected at390/1366. Logs in parent work directory:bistrot-lyon-main.log,bistrot-lyon-main-v2.log,bistrot-lyon-main-v3.log,bistrot-lyon-tail.log,bistrot-lyon-cutoff.log,bistrot-lyon-journal.log.

Own saved root/results/form hashes,37form projection fields and27exact cached asset hashes verified locally. Form query/wish add slot12:00 compared to results; those differences were checked explicitly. Fixture has no nativeEvidence manifest, so no claim of checking native files against such a manifest is made. Raw originals and native replay evidence remain in evidence/bistrot-de-lyon; original buildb59e3e3c70.

This is integrator QA, not independent executed app QA. No actual supplier reservation, hold, payment or contact. Source27October2026 observation does not establish current availability. Independent review, exact-final CI and publication recorded separately.
