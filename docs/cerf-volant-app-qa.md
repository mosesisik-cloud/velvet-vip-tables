# Le Cerf-Volant integration QA

Runtime commit96d01990411a03b3a99fc94f6188ee852bd90118, based on public293/fa6ec7ca12f035eb67dcda2139ca0f24ee8ce03b. Provider506/9651db59f1d4940a381e0a73e1202de1be5bff85 is unchanged (cherry a10fce620a2d8e8c0cb2e16c9aac5a34efa95221).

Integrator-run real local app, HTTP API, Chromium adapter and SQLite journal with synthetic supplier boundary:

- Main `--cerf-volant --visit-choice-only`: PASS390/1366;60API requests,2restarts,2synthetic dispatches. Guest global search, Lyon list, destination and restaurant routes, consent, duplicate prevention, independent fixture confirmation, unknown outcome and owner-bound restart recovery. Run started with the integration working tree over a10fce6; its runtime bytes were committed unchanged as96d0199.
- Negative `--cerf-volant --cerf-volant-tail`: PASS;104API requests,8restarts,0dispatches. Opening timestamp drift, filled voucher, enabled Apply, changed voucherParam, changed notice after review, filled voucher after review, voucherParam drift at dispatch and unapproved payload field. Only log wording changed during this run; no scenario or runtime changes.
- Expiry `--cerf-volant --bistrot-cutoff-only`: PASS;84API requests,8restarts,0dispatches.23/26October2026 fixture dates exercise both DST offsets at11:59/12:00/12:30/13:30;5/4/3/0candidates. No attempts persisted or dispatched.

Own journal test and catalog/provider mapping checks pass:848unique identities,204mappings. Five saved original source hashes,37form projection keys and27cached asset hashes verified locally. Original form adds slot12:00 to its wish/query; those deliberate search-to-form differences were checked explicitly after the first comparison caught query's added slot. No source was refetched. Provider's own5/5tests and8synthetic scenarios are retained without rerunning. Original evidence uses build efdbafc656.

Scope, full French notice and review screenshots inspected for390/1366. Logs and images are in the parent work directory:cerf-main.log,cerf-tail.log,cerf-cutoff.log,cerf-volant-app-*.png. No aborted app runs. One shell quoting failure occurred before a log-label correction; a saved Python helper completed that correction.

This is integrator QA, not independent ce5c QA. No real supplier reservation, hold, payment, code application or restaurant contact. Synthetic confirmation is not a real supplier-confirmed full flow. Publication and independent review require a separate receipt.
