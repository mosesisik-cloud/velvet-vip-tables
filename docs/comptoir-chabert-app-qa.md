# Comptoir Chabert app QA

Runtime `04b7f7848a56294c00a13c673d615e6eb4b242ac`, tested22October2026.
Integrator local frontend/API/Chromium/SQLite QA with synthetic supplier;
not independent ce5c QA. Only Chabert's provider flag is enabled. All real
external supplier traffic is blocked. Actual supplier confirmations: zero.

| Run | Result | API calls | Backend restarts | Synthetic dispatches |
| --- | --- | ---: | ---: | ---: |
| `--chabert --visit-choice-only` | PASS | 60 | 2 | 2 |
| `--chabert --comptoir-chabert-tail` | PASS | 104 | 8 | 0 |
| `--chabert --bistrot-cutoff-only` | PASS | 48 | 4 | 0 |

Main covers guest search/list/destination/detail, unchecked consent,
double click, server-owned idempotency, own-booking readback, reference,
restart recovery, lost reply, durable unknown, owner isolation and no replay.
Eight controls reject new required custom fields, customFieldsV2, changed
voucher metadata, changed language, changed notice, changed voucher-shop
setting, voucher drift at grant and a blank gift key in the outbound payload.
Inherited Escudella scenario names reuse mechanics only: the full original
Chabert source is separate, with no gift DOM or custom fields.

Cutoff tests reuse the existing bounded runner with Chabert's own values:
23October09:58/09:59UTC and26October10:58/10:59UTC. The actual API/UI expose
five candidates before11:59Europe/Paris and zero at/after it across the DST
transition. No attempt is created. Other runs use a ticking synthetic clock
from08:00UTC on the selected fixture date. Rebased data do not establish
actual future availability. Scope, notice and unchecked consent were captured
at390/1366; no lateness or seating-time restriction is invented.

Raw logs beside the checkout: `chabert-main-v2.log`, `chabert-tail.log`,
`chabert-cutoff.log`. Images: `chabert-app-{scope,review,notice}-{390,1366}.png`.
Before the completed main run, a harness-edit helper failed before writing;
the subsequent unrecognized Chabert argument started the generic local
Bokabord fixture and was interrupted. That separate `chabert-main.log` is
not Chabert evidence or a completed regression. No actual supplier call occurred.

Independent integrated review found no issues on the runtime SHA above.
Identity841, mappings197, Chabert and Bistrot pure journal checks and Chabert
durable restart passed. Original provider evidence stops at empty contact;
all final-send/readback evidence is synthetic. The27 referenced asset URLs
were hash-verified; that does not assert that all assets, including polyfills,
executed in modern Chromium.
