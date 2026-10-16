# Playwright booking release readiness

Owner: release chat `01a1415d-cf0f-70c3-8851-b9ab3de132d5`. Coordination: issue #129. Observed 2026-10-16 (Europe/Stockholm), baseline main `7c0e45dc34dc997ffcdc6a73f05294ecec264972`, deployed release 191. This is a read-only deployment assessment, not a provider implementation or permission to submit reservations.

## Acceptance target

The guest stays inside Velvet for date/party, provider-verified availability, guest details, review, explicit confirmation and the actual supplier result, using backend Playwright. External links, manual contact and iframe-only forms are fallback/research. Registry counts do not measure completed booking integrations. Record implementation, local fixture tests, provider sandbox tests, read-only live observations, actual supplier-confirmation verification and deployment separately. A fixture confirmation must never become a live confirmation in the API or UI.

## Observed deployment

No configuration, container restart, session creation or provider write was performed for this assessment.

| Observation | Evidence and limit |
| --- | --- |
| Host memory | `free -m`: 3819 MiB total, 1778 MiB available at the sample; no swap. A single sample is not a capacity test. |
| API container | Docker memory limit 1073741824 bytes (1 GiB); sampled 24.2 MiB, 7 PIDs, 0.00% CPU, restart count 0. Chromium load was not exercised. No explicit NanoCPU limit or PIDs limit reported. |
| Public Bokabord config | GET `/restaurant-bookings/mirror/config`: enabled, live mode, guestBooking true, 22 registered IDs. This does not prove 22 end-to-end bookings. |
| Browser admission | `api/bokabord-mirror.mjs`: maximum 4 sessions, 10-minute idle TTL, one pending/active session per owner. Each provider adding an independent pool would multiply resource use. |
| Availability worker | `api/providers/bokabord-availability.mjs`: maximum 2 concurrent reads by default, bounded queue and timeouts. This budget is separate from interactive sessions. |
| Asset cache | Public script/style/font caching only, default 10 MiB per cache instance. No API, HTML or guest-response caching is intended. |
| Shutdown | `api/server.mjs` closes the HTTP server and current Bokabord availability/mirror workers on SIGTERM/SIGINT. New workers need explicit registration in the same shutdown path. |
| Health | `/health` confirms the HTTP service, not provider readiness, browser capacity or confirmation capability. |

Do not raise session limits based on the idle sample. Establish a shared admission budget across providers and availability workers before enabling additional live pools. Measure local/sandbox browser startup, peak RSS, queued duration, failure cleanup and overlapping sessions; choose the limit from measurements with headroom inside the 1 GiB container. Do not change infrastructure during this assessment.

## Reuse and unresolved requirements

- Keep server-derived guest ownership (`bookingGuest` opaque HttpOnly credential), per-context cookies/storage and immutable session restaurant/provider identity. Never trust a client-supplied owner or provider URL. No cross-owner snapshot or recovery.
- Keep revision, busy and TTL checks, pending-owner cleanup and explicit teardown. A new adapter must close contexts on creation error, timeout and process shutdown. Deny unexpected navigation, downloads, popups and unreviewed mutations; do not assume GET or WebSocket traffic is harmless.
- Use a provider-neutral durable attempt journal before transmission. The current `BookingLedger` writes atomically with `wx` and fsync, but hardcodes BokaBord/Stockholm. Provider identity, restaurant identity and review/terms binding need an agreed contract. Multiple processes/replicas cannot rely only on an in-memory owner/session map or unshared local directories.
- A timeout after transmission is an unknown outcome, not a retry invitation. Preserve the attempt across TTL, reload and restart; return an owner-bound recovery view even without a new screenshot. Never automatically resubmit unknown or payment-pending attempts.
- Keep payment/hold/CAPTCHA and provider-access restrictions explicit. The existing SevenRooms legacy direct HTTP hold/book code is not a reviewed reusable Playwright implementation and must not be exercised as a shortcut.
- Verify proxy identity handling before traffic expansion. The current request budget has a mirror-action bucket specific to the Bokabord route, while server loopback handling and forwarded-IP trust require topology review. New provider routes must not silently bypass or share the wrong quota. No proxy behavior was asserted or changed here.

## Stop conditions before another affected live-submit release

PR #135 reports reproducible behavior, not approved behavior:

1. Bokabord success plus an ID with missing/unknown status can become `confirmed`. Accept only documented provider-specific terminal confirmation states; malformed, pending and unknown responses remain distinct. Validate through response listener, durable record, API and actual UI.
2. After transmission timeout, `current()` can expose an old actionable snapshot. Backend duplicate protection alone is insufficient. Invalidate the actionable snapshot when the durable reservation is made and expose the current attempt outcome during recovery.

The integrator owns these runtime fixes; the assigned safety reviewer owns revalidation. Existing 11/11 Bokabord tests passed in this assessment, but do not cover or negate these findings. Do not expand live submit by reusing these gaps.

## Arpege read-only evidence and present limit

Inspected `https://bookings.zenchef.com/results?rid=354036&lang=en` in an isolated browser with service workers blocked and all non-GET/HEAD requests aborted. Opened only the guest-count dropdown. No date/time selection, search, reservation, hold, contact entry, payment or confirmation was performed.

- The page displayed a credit-card deposit requirement and a free-change/cancellation deadline of 48 hours.
- Initial controls displayed guest count, date, time and Reserve; guest choices 1–6 were visible. Listed time choices were not verified availability.
- Observed reads included locale resources and a feature-flag request. Blocked POST traffic included metrics and an AWS WAF verification endpoint. No bypass was attempted; do not treat a loaded initial page as validation of later steps.
- Zenchef draft PR #132 exposes a local-fixture state machine and restricted inspect mode, not a verified supplier booking flow. Its fixture is not a supplier sandbox. It does not yet implement the proposed semantic UI v1 contract, review-token/terms-version binding or validated provider submission.

This evidence has been shared with the sole Zenchef owner. Provider source/hold boundaries, card handling, supported production actions and truthful terminal results remain explicit gates. An integration may be tested with local fixtures, but must not be advertised or enabled as live full booking on that basis.

## Release evidence packet

The integration owner supplies an immutable tested head and an explicit runtime file/dependency list, the common contract version and capability mode. Require:

1. Real adapter and UI modules exercised together with fixtures: owner isolation, stale revisions, busy/TTL cleanup, review/terms changes, double-click, timeout before/after send, restart recovery, payment-pending, rejected and unknown responses. No fabricated production slots.
2. Provider allowlist and request/hold boundaries reviewed independently, with the exact venue and scope of read-only or sandbox evidence. Missing credentials/permission/access are documented blockers.
3. A shared session/queue budget, graceful shutdown coverage and reviewed recovery journal. No additional live worker pool is inferred safe from idle memory.
4. Privacy-safe observability: provider, stage, latency bucket, queue depth, active count, timeout/error code and non-sensitive attempt correlation. Do not log screenshots, guest fields, cookies/tokens, card details or raw provider payloads. Provider failure and HTTP health must remain separate signals.
5. Runtime capability gates default to unsupported/inspect until validated; production fixtures are rejected. Show only a provider-verified result as a confirmation and preserve honest fallback when blocked.
6. Serialized publication with baseline and per-file hashes, recoverable backup, public health and guest UI checks. Preserve attempt journals/configuration during rollout and rollback. Do not restart away an in-flight attempt without durable recovery.

Only the release owner publishes after the shared-file integrator's explicit handoff. No runtime files or deployment settings are changed by this document.
