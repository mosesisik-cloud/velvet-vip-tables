# Café Comptoir Abel app QA

Runtime tested: `cf7d3529b13f1391418bdc9e0ec3c18988dc8045`.
Executed 22 October 2026 by the integrator using the real local frontend,
API, Chromium adapter and private SQLite databases with a synthetic supplier.
This is not independent ce5c QA and is not a real supplier confirmation.
External browser traffic was blocked. Actual supplier requests: zero.

The saved 20 October source for 21 October was rebased to synthetic future
dates in the fixture. It does not establish current availability.

| Run | Result | API requests | Backend restarts | Synthetic dispatches |
| --- | --- | ---: | ---: | ---: |
| Abel main, `--abel --visit-choice-only` | PASS | 48 | 2 | 2 |
| Abel eight controls, `--abel --cafe-comptoir-abel-tail` | PASS | 104 | 8 | 0 |
| Escudella four controls, `--escudella --escudella-tail --lunch-core-only` | PASS | 49 | 4 | 0 |
| Christine main and 27 controls, `--christine --lunch-core` | PASS | 414 | 29 | 9 |

Main exercises consent, double click, server-owned idempotency, own-booking
readback, reference, restart recovery, lost reply, durable unknown status,
owner isolation and no replay. Eight Abel controls reject a required gift
field, populated gift input, new voucher metadata, changed query language,
changed notice, changed connected-voucher state, readonly gift input at grant,
and a blank gift key in the outbound payload. Escudella names in these
synthetic mutations identify reused test mechanics, not borrowed Abel policy.

Guest route checks cover global Lyon and restaurant-name search, the Lyon
restaurant list, destination and restaurant detail without authentication or
booking dispatch. Main screenshots cover 390 and 1366 pixels, own scope and
full French notice before unchecked consent. No table end time is inferred.

Raw logs and screenshots are retained beside the checkout in `work/`:
`abel-main-qa-v3.log`, `abel-tail-qa-v4.log`,
`abel-regression-escudella-core.log`, `abel-regression-christine.log`, and
`abel-app-{scope,review,notice}-{390,1366}.png`.

Earlier attempts are retained separately: main v1/v2 stopped before submit
because of inherited test time/notice expectations; tail v1 used an incorrect
search selector and v2/v3 collided with SPA scroll restoration. The final tail
returns to a fresh document. The initial Escudella regression accidentally
used unrecognized `--lunch-core` and was interrupted during its broad tail;
the completed four-case run above replaces it. Christine's same unrecognized
argument caused the full 27-case run reported above, not a four-case run.

Independent identity/shared/provider review is recorded on PR 483. These
test and documentation changes do not alter the staged runtime.
