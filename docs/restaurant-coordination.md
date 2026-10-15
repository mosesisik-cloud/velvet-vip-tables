# Restaurant integration coordination

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
