# Shared restaurant booking queue

GitHub Issues owns **task claims and execution status**. `data/restaurant-worklist.json` owns **restaurant evidence and integration/publication status**. They are linked by stable restaurantId, not competing registries. The booking coordinator alone integrates evidence into the canonical list. The master coordinator manages issue creation and release of claims.

## For every AI system

1. Find an open issue labelled `booking-task` and `booking:ready`. Read its stable ID, evidence, boundaries and current comments. A ready label alone is not proof of availability: a `booking-claims/issue-N` branch takes precedence.
2. Comment `/claim YOUR-UNIQUE-AGENT-ID` (letters, numbers, dots, hyphens, underscores). Repository write access is required; ask the coordinator to claim for systems without access. Agents sharing a GitHub account MUST use distinct agent IDs.
3. Wait for **CLAIM CONFIRMED**. Only one atomic Git ref creation can win. A submitted comment is not a claim. If Actions fails, stop and ask the coordinator. Never work on the claim branch itself.
4. Create your own working branch/worktree from current main. Limit changes to the issue's restaurant and agreed files. For a shared provider/registry file, agree on a single integrator before editing; other workers submit per-restaurant evidence fragments. Provider-wide improvements require a separately assigned task.
5. Verify restaurant/branch/address from official sources before choosing a booking destination. Distinguish external link, original embedded form, observed availability, request-only/manual route and confirmed reservation. Do not infer identity from an ID prefix or a catalog URL.
6. Do not create real reservations, holds, payments or restaurant messages. Follow existing provider inspection safeguards. Do not bypass CAPTCHA/access controls.
7. Open a PR referencing the issue using `Refs #N` (not automatic closure). Report restaurantId, agent, changed files, sources/date, tests and limitations, blocker/next step, commit/PR and publication status. Never include credentials. Do not edit the canonical list concurrently.
8. The integrator reviews/tests/merges. Only the existing release owner deploys. An issue closes after evidence is consolidated and its terminal outcome is documented; merged code is not proof of publication or a completed reservation.

## Coordinator lifecycle

- `booking:ready`: available subject to lock check.
- `booking:claimed`: assigned; agent identity is stored in the claim commit.
- `booking:review`: evidence/PR awaiting review; retain the claim.
- `booking:blocked`: explicit obstacle/next action; retain the claim.
- Closed: accepted outcome, including a documented manual, closed or walk-in case where appropriate.

Only the coordinator imports new issues, deduplicating by stable restaurantId across open AND closed issues. Exclude external200's reserved 200 IDs and all other ongoing claims. A catalog website is an unverified lead unless evidence says otherwise. Keep branding assignments independent and avoid changing shared identity fields without coordination.

Claims never expire automatically. To transfer/release: first stop and obtain handoff from the old worker, record the decision on the issue, then delete only its `booking-claims/issue-N` ref and update labels. Never delete locks for an active worker. Confirmed claims survive label failures and restarts. Do not delete claim branches through blanket branch cleanup.

Batch creation script defaults to a dry run and 20 issues. Review candidates and current claims before using `--apply`. Run only one importer at a time. This queue does not grant deployment or real booking authorization.
