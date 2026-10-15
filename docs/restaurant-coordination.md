# Restaurant integration coordination

## Active coordination snapshot — 2026-10-16

This snapshot records assignments, not merge or publication approval. GitHub claim locks remain authoritative for restaurant research. Root serializes runtime integration from current main (release188 baseline); the release owner alone changes deployment/cache versions and publishes.

| Owner / chat or subagent | Exact scope | File authority | State / next handoff |
| --- | --- | --- | --- |
| Root `01a14080-83ed-7991-ac52-7f57761f13e7` | Canonical evidence; runtime integration queue | Sole integrator of app, copy, provider registry, API and canonical worklist | Consolidate reviewed patches; send tested PR to release owner |
| Root subagent `remaining_providers` | CURA PR107 / Arpège PR116 | Provider registry, provider resolver and focused tests only, on root branch | Implementation in progress; commit own files to root for push/PR |
| `01a1415d-cf0f-70c3-8851-b9ab3de132d5` | Release188 verification and approved subsequent releases | Exclusive SSH, deployment manifests and cache/version files | Release188 reported live; await next reviewed PR |
| `01a141e3-5af0-7df1-b408-95422709692b` / fd320c54 | PR114 Black Pepper | READ ONLY | Return identity/destination review and i-host blocker |
| `01a141e3-2f17-7af0-bdf9-22a01334e98a` / 34e97833 | PR115 Gymkhana | READ ONLY | Return exact route and activation review |
| `01a141e3-efb0-7553-91f0-e19d39cfce5c` / 33473488 | PR112 Club55 | READ ONLY | Verify explicit phone-booking evidence |
| `01a141e3-cbff-73e1-bb75-de781a538a16` / eb26bdf0 | PR110 Den | READ ONLY | Verify telephone booking policy and limitations |
| `01a141e4-a9ca-73a3-abf7-566167c993e1` / 33857d8d | PR109, exactly its five restaurant IDs | READ ONLY | Per-ID evidence acceptance and adapter readiness |
| `01a14189-8468-7353-97ad-3549532fc728` | Reserved external200; PR121 | Scoped external200 files and isolated proposed registry additions; no app/manual-contact/copy/API edits | Resolve branch conflict, rerun tests and CI; no merge until reviewed |
| `01a14138-697b-7681-aac3-72cf68a8f205` | Reserved official branding second pass | Brand registry, review evidence and assets only | Submit independently reviewed PR; no booking/catalog edits |
| Master `01a141b2-2d9a-7bf3-a5f3-1eff7253fa32` | GitHub issue creation, claims and workforce allocation | Queue infrastructure and claim lifecycle | Resolve missing owners; confirm proposed reviewer handoffs below |

Master-mediated reviews proposed earlier: worker1-ac9f → PR88; worker3-323f → PR80; Disfrutar worker → PR108; worker4 → PR79. Assignment acceptance is not independently confirmed here: master must confirm before any duplicate delegation. Kimi/Grok/Gabbe retain their original PR/issue ownership; reviewer assignment never transfers that claim.

Integration order: (1) finish CURA/Arpège on the root branch, preserving release188; (2) accept evidence-only reviewed PRs separately from activation; (3) review PR121 only after its branch sync and green CI, then reconcile registry additions once; (4) integrate other approved runtime changes in bounded batches. PR78 RIJKS remains pending source/language/version fixes. No reviewer edits shared runtime files. Confirm main and release-owner status before any app/copy/cache merge. After a review handoff, root/master explicitly assigns the next task; no autonomous scope expansion.

Goal: every catalog restaurant has a verified identity and an honestly described, tested booking or contact route where one exists. Unknown, closed and walk-in cases stay explicit. A reviewed record is not a completed integration or reservation.

## Canonical record

`data/restaurant-worklist.json` is the sole consolidated worklist, keyed by stable restaurant ID. Booking coordinator `01a14080-83ed-7991-ac52-7f57761f13e7` owns it. Other teams submit scoped evidence rather than editing it. Identity, booking route, implementation, tests, publication and branding remain independent fields. Prepared counts never imply publication or completed reservations.

## Ownership and handoff

Before editing, assign an owner, exact IDs or provider scope, files and next step. Inventory and preserve ongoing edits. Report overlaps before touching shared files. Use isolated branches/worktrees across chats and one integrator for shared files; within a shared agent checkout, allocate disjoint files and serialize commits.

- Booking integration and canonical worklist: `01a14080-83ed-7991-ac52-7f57761f13e7`.
- Reserved external200 manifest and scoped route evidence: `01a14189-8468-7353-97ad-3549532fc728`.
- Official branding and brand evidence: `01a14138-697b-7681-aac3-72cf68a8f205`.
- Exclusive production release owner: `01a1415d-cf0f-70c3-8851-b9ab3de132d5`.
- Cross-team scope conflicts and blockers: `01a141b2-2d9a-7bf3-a5f3-1eff7253fa32`.

Booking and branding may run on the same restaurant with disjoint file ownership. Do not change stable IDs to fix city metadata. No parallel SSH publication.

## Required progress report

Each scoped handoff states: status (in progress / complete / blocked), owner, restaurant IDs or provider scope, changed files, evidence and tests, limitations, next action, commit/PR, and publication status. Send it to the booking coordinator for consolidation. Distinguish official external link, embedded original form, observed live availability, simulated checkout and confirmed reservation.

## Verification boundaries

No real test reservations, holds, payments or messages to restaurants/guests. Provider-page inspection must block unreviewed write requests and service workers; absence of clicks alone does not establish absence of side effects. Historical evidence retains its limitations. Never infer a booking channel from a phone number alone, or definitive closure from an unavailable page or secondary report.

This coordination document grants no additional booking, payment or deployment authority. Publication follows the existing authorized release process after checks, with per-file verification and recoverable backup. The worklist itself does not need to be deployed.
