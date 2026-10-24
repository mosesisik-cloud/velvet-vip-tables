# L’Affable Paris integrated QA

Runtime d9bc8bf84a0ed546bebd5454d6f5c35b31b4f04a on public295/461e6ab08e29a3eca166d9005540658f9e3bf9ff. Provider516/69e0bbbc9ccd06eb8845224db68fdfc978751f4c unchanged; cherry66b0534cbe2f66201254adacf73151b5de62b5fe.

Integrator real local app, HTTP API, native Chromium adapter and SQLite journal with synthetic supplier boundary:

- Main `--laffable-paris --visit-choice-only` v2 PASS390/1366:60API requests,2restarts,2synthetic dispatches. Paris guest search/list/destination/restaurant routes, consent, all global+lunch+dated text, duplicate prevention, independent fixture readback, durable unknown outcome, owner isolation and restart recovery. Main ran the working tree over66b0534; runtime committed unchanged asd9bc8bf.
- Tail `--laffable-paris --laffable-paris-tail` PASS:113API requests,8restarts,0dispatches. Changed day notice, opening date, card threshold, mandatory room selection; day/global notice changes after review; voucher metadata drift at dispatch and unapproved payload key.
- Cutoff `--laffable-paris --bistrot-cutoff-only` PASS:84API requests,8restarts,0dispatches.23/26October2026 synthetic dates exercise both DST offsets at11:59/12:00/12:15/14:00;9/8/7/0available slots, no persisted attempts.
- Shared journal65/65PASS, own journalPASS,850unique catalog IDs and206mappingsPASS. Provider's5/5tests/10synthetic cases retained without rerunning.

Main v1 stopped before provider start because the existing scope test expected 'ordinarie lunch' but UI said 'vardagslunch'. UI wording aligned; no booking occurred. No other aborted app runs. Local source verifier checks3raw hashes,36form projection keys and27asset hashes. The fixture has no nativeEvidence hash manifest; no such hash verification is claimed. Scope/review/notice captures inspected; long element captures include clipped visible regions, while full notice contents/order are verified via DOM assertions in main QA.

Logs in parent work directory:laffable-main.log,laffable-main-v2.log,laffable-tail.log,laffable-cutoff.log,laffable-journal.log; images laffable-paris-app-*.png. Raw originals in provider evidence/laffable-paris; buildb59e3e3c70. No real supplier booking, hold, payment, contact, room selection or gift operation. Provider-attached historical summer text remains verbatim and does not establish an October closure. This is integrator QA, not separately executed independent browser QA. Independent review/finalCI/publication are recorded separately.
