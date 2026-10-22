# Maison Moly app QA

Runtime `5d25e94926320dfd42941b79b090b7ea382730af`, tested22October2026.
Integrator local frontend/API/Chromium/SQLite QA with a synthetic supplier;
not independent ce5c QA. Only Maison Moly's provider flag is enabled. External
supplier traffic is blocked. Actual supplier transactions/confirmations: zero.

| Run | Result | API calls | Backend restarts | Synthetic dispatches |
| --- | --- | ---: | ---: | ---: |
| `--moly --visit-choice-only` | PASS | 60 | 2 | 2 |
| `--moly --maison-moly-tail` | PASS | 104 | 8 | 0 |
| `--moly --bistrot-cutoff-only` | PASS | 84 | 8 | 0 |

Main covers guest global search/list/destination/detail, unchecked consent,
double click, server-owned idempotency, own-booking readback, reference,
restart recovery, lost reply, durable unknown, owner isolation and no replay.
Eight controls reject added required custom fields, customFieldsV2, voucher
metadata, changed language, changed notice, changed shop setting, voucher
drift at grant and an outbound blank gift key. Inherited scenario names reuse
test mechanics only; Moly has its own full source and no gift input.

Individual expiry is tested at11:59,12:00,12:15 and13:45Europe/Paris on both
23 and26October, using UTC clocks adjusted for the DST transition. The real
UI/API show8,7,6,0 candidates respectively, without creating an attempt.
Other runs use a ticking synthetic08:00UTC clock on the selected fixture
date. Source-date rebasing is not proof of future actual availability.

Raw logs beside the checkout: `moly-main.log`, `moly-tail.log`,
`moly-cutoff.log`. Screenshots: `moly-app-{scope,review,notice}-{390,1366}.png`.
Full original French notice precedes unchecked consent. No lateness or seating
duration is inferred. Independent integrated review,842identity,198mappings
and own journal/restart checks passed. Provider original-client evidence
stops at empty contact; final-send/readback evidence is synthetic.27 referenced
asset hashes do not imply27 executed scripts. No earlier candidate was retested.
