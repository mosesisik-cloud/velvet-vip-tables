# Bistrot Abel app QA

Runtime `53da36594fc6b86bc46c98f61ee8d28f80c7b31b`, tested22October2026.
Integrator QA uses the actual local frontend, API, Chromium adapter and
SQLite journals with a synthetic supplier. It is not independent ce5c QA.
All actual external supplier traffic is blocked; no real booking was made.

Only the Bistrot flag is enabled during its tests. Independent review found
that flag missing from both shared adapter activation expressions; commit
53da365 fixes that, and the real app main flow now exercises isolated activation.

| Run | Result | API calls | Backend restarts | Synthetic dispatches |
| --- | --- | ---: | ---: | ---: |
| Main, `--bistrot-abel --visit-choice-only` | PASS | 60 | 2 | 2 |
| Eight negatives, `--bistrot-abel --bistrot-abel-tail` | PASS | 104 | 8 | 0 |
| Cutoff/DST, `--bistrot-abel --bistrot-cutoff-only` | PASS | 48 | 4 | 0 |
| Café Comptoir regression, `--abel --visit-choice-only` | PASS | 60 | 2 | 2 |

Main covers unchecked consent, double click, server-owned idempotency,
matching own-booking readback, restart recovery, lost reply, durable unknown,
owner isolation and no replay. Eight controls reject required or populated
gift fields, added voucher metadata, changed query language, changed notice,
changed connected-voucher state, readonly gift input at grant and a blank gift
key in outbound data. Escudella mutation names reuse synthetic mechanics;
Bistrot's full original metadata and identifiers remain independent.

Guest global name/Lyon search, Lyon list, destination and restaurant routes
pass without login or booking dispatch. Scope, full French notice and unchecked
consent are captured at390/1366. Source21:30 is preserved without being
misrepresented as a lunch end time.

The isolated synthetic backend clock ticks from08:00UTC on its selected date.
Cutoff scenarios instead use23October09:44/09:45UTC and26October10:44/10:45UTC:
seven UI/API candidates before11:45Europe/Paris, zero at/after it on both sides
of the daylight-saving transition. Both dates use the saved source rebased
locally; this is not evidence of actual future availability. No attempt is
created in any cutoff scenario.

Raw logs are retained beside the checkout: `bistrot-abel-main-v2.log`,
`bistrot-abel-tail.log`, `bistrot-abel-cutoff.log`. Screenshots:
The separate Comptoir regression log is `bistrot-regression-comptoir.log`.
`bistrot-abel-app-{scope,review,notice}-{390,1366}.png`.
The first main run stopped before submit because an inherited assertion for
`1h30` also matched the source's `21h30`; a numeric boundary fixes the test.
Its raw log and screenshot are retained separately. Runtime was unchanged.

Identity, shared and provider reviews are independently complete. Shared
pure journal tests for both Abel venues, Bistrot durable restart and196mapping
checks passed. Provider handoff separately records original-client empty-form
evidence and dedicated synthetic tests. No actual supplier confirmation exists.
