# Playwright booking results and guest consent

Issue: #129. Owner: codex-worker-4-fab7 / chat suffix beb9. Scope: this document only.
Status: proposed contract and acceptance scenarios for integrator review, not an implemented API.
Reviewed baseline: `7c0e45dc34dc997ffcdc6a73f05294ecec264972`, 2026-10-16 Europe/Stockholm.
UI proposal: issue #129 comment 6204760370. Integrator owns final wire schema, persistence,
shared copy and routing; UI, provider and independent-test owners implement their assigned files.

## What counts as completion

The target is a guest completing a supported reservation inside Velvet with backend Playwright
and a verified supplier outcome. An external link, original iframe, telephone/email fallback,
successful HTTP response, selected slot, hold or submitted request is not completion.
Den's verified telephone-only policy remains fallback evidence, not Playwright-ready capability.

Track capability separately from each booking result: implemented; fixture/sandbox tested;
read-only live availability verified; supplier confirmation verified; deployed. Each needs its
own dated evidence and environment. A simulated confirmation must always remain visibly test data.
Neither a deployed adapter nor a passing fixture proves that live booking is supported.

## Result vocabulary

Keep `stage` (selection/slots/guest/review/result) separate from `result.status`.
Before an attempt there is no result (`null`), not a pending booking.
The v1 UI status set can remain unchanged if the server also provides the following meaning.
Names below are proposed additions; adapters must not independently invent incompatible schemas.

| Status | Required server evidence | Suggested Swedish guest text | Allowed next step |
| --- | --- | --- | --- |
| `pending`, reason `submitting` | Durable attempt reserved; submission in progress, final response unresolved | Bokningen behandlas. Ingen bekräftelse ännu. | Read-only status refresh; never another submit |
| `pending`, reason `supplier_request` | Supplier explicitly accepted a request/waitlist entry, not a reservation | Förfrågan mottagen. Bordet är inte bekräftat. | Read-only reconciliation for that attempt |
| `confirmed` | Reviewed adapter positively verified reservation acceptance for this attempt and details; stable supplier reservation reference | Restaurangen har bekräftat bokningen. | Show reference and matching details; no repeat submit |
| `unknown` | Dispatch may have occurred but outcome cannot be established, including lost response/persistence ambiguity | Vi kan inte verifiera resultatet. Skicka inte en ny bokning. | Reconcile same durable attempt; explain support path |
| `payment_required` | Supplier explicitly requires payment/card action; reservation outcome is separately known or unresolved | Betalning eller kortuppgifter krävs. Bokningen är inte verifierad som klar. | Only a separately supported, authorized payment continuation; otherwise stop |
| `rejected` | Supplier explicitly and authoritatively rejected this same attempt without reservation creation | Bokningen kunde inte genomföras. | New reviewed attempt only after backend establishes retry safety |
| `error` | Failure proven to occur before dispatch/side effect, or validation failure | Bokningen skickades inte. Kontrollera uppgifterna. | Correct inputs and re-review; never automatic submit |

The `error` wording is conditional on proven non-dispatch. A client-side fetch error cannot
establish that fact: after submit, render conservative unknown until server reconciliation.
HTTP 200/202, a success toast, redirect, request ID, payment ID or nonempty `reference` alone
does not justify `confirmed`. Missing/unrecognized supplier statuses default to unknown.
Do not infer rejection from timeout, an empty response, CAPTCHA or rate limiting.

## Evidence and payment dimensions

The integrator should normalize a server-owned result with `attemptId`, `status`, `reason`,
`reference` (when applicable), `observedAt`, `revision`, `mode` and a verification indicator.
Suggested verification metadata: source (`supplier_response` or `supplier_readback`),
adapter/version, evidence ID, and matched booking-details digest. Evidence stays server-side;
the UI receives a sanitized verification verdict, never raw credentials or supplier payloads.
These values are not client assertions and are not authorized by merely setting JSON fields.

Confirmation evidence must bind provider + restaurant/venue, date + local time + timezone,
party, approved guest details, and the same durable attempt. Use a reviewed supplier-specific
status allowlist or readback; do not generalize numeric status meanings across providers.
If supplier evidence does not return all details, the adapter must document a reliable binding
to the exact authorized request and reservation record; otherwise leave outcome unknown.

Payment and reservation outcome are separate: suggested `reservationOutcome` is
`unverified|request_accepted|confirmed|rejected`; `paymentState` is
`not_required|required|processing|paid|unknown`. A successful charge is not reservation proof.
A confirmed reservation may still have an outstanding deposit; only explicit supplier evidence
may show that combination. When present, describe both facts rather than a generic success.
When unsupported, `payment_required` remains a visible stop with no payment button and no
hidden redirect. Expiring a hold, closing a modal or losing a session never means cancellation.

## Review and authorization boundary

1. Show exact venue, local date/time/timezone, party, guest details and any products, deposit,
   currency, fees, cancellation/no-show policy and card guarantee returned by the supplier.
   Unknown policy is labelled unknown, never free cancellation or zero cost. If a mandatory
   financial condition cannot be determined or supported, disable submission.
2. Terms require a version/content digest and source, attached to the rendered review.
   No prechecked consent; marketing choices are separate and default off. A boolean alone
   is not sufficient to bind the approved terms to the request.
3. The server binds an immutable, expiring review token to authenticated guest/owner, session,
   provider/venue, revision, selection, guest details and terms version/digest. It validates
   again immediately before dispatch. Changing any binding invalidates consent and token.
4. Only explicit final guest action submits `confirm:true`, `terms:true`, the current terms
   version and review token with an idempotency key. Browsing, selecting a slot, filling fields,
   pressing Back, polling, restoring a session or refreshing must not submit or place a hold.
5. A provider that creates holds while selecting a slot needs a separately reviewed hold
   boundary and explicit authorization. Do not silently label a mutating hold as availability.

`canSubmit` is a server capability for the current snapshot, not consent. The browser cannot
enable a route by changing it. Server validation must hold even when the UI is bypassed.
Development fixtures authorize no real booking, hold, card storage or payment.

## Durable attempt and reconciliation rules

- Reserve the attempt durably before network transmission. Persist the payload digest,
  reviewed terms and attempt identity. An unchanged idempotency key returns the same attempt;
  reuse with a different payload is rejected. A new key must not evade an unresolved equivalent
  booking attempt after reload or session recreation.
- Once dispatch may have occurred, block new submission for that unresolved attempt across
  browser closure, TTL expiry and process restart. A UI lock alone is insufficient.
- A read-only `current` operation may retrieve persisted state/readback, never repeat submit,
  acquire a new hold or pay. Session disappearance must not delete the durable attempt.
- Use monotonic result revisions and authenticated ownership checks. Ignore stale responses;
  pending must not overwrite newer confirmed evidence. Contradictory current supplier evidence
  requires reconciliation, not a silent success/failure flip. Cancellation is a separate flow.
- Persist verification before returning final confirmation to the UI. A persistence failure
  after supplier response is unresolved recovery work; preserve the dispatch guard and avoid
  a second submit. Do not present contradictory confirmed-now/pending-after-reload histories.
- Backend `already_attempted` is a conflict to reconcile, not supplier rejection or proof that
  no booking exists. `payload_mismatch` can be an input error only if no prior dispatch occurred.
- Pending expires into unknown when reconciliation can no longer establish progress; it must
  never turn into rejected merely because a timer elapsed. Polling should be bounded/backed off.

## Current baseline findings, not new implementation claims

- `api/bokabord-mirror.mjs`, response handler: `success === true` plus positive booking ID maps
  numeric status 0 to payment_required and everything else to confirmed. Missing, malformed
  and undocumented nonzero statuses can therefore reach confirmed. This is not a safe generic
  classifier; the provider owner must supply reviewed explicit mappings and negative tests.
- The mirror reserves a ledger entry before releasing saveBooking, sets unknown at dispatch,
  requires final confirm/terms and guards owner/revision/busy. Preserve those protections.
- `api/bokabord-ledger.mjs` starts durable attempts as unknown and blocks duplicate keys across
  restart. Its key binds owner/restaurant/date/time/party; rows hardcode Stockholm/BokaBord.
  It does not implement the proposed generic terms/evidence/payment dimensions.
- `js/bokabord-mirror.js` displays confirmed from status alone and groups other outcomes into
  an unverified message. The new UI must distinguish pending, requests and payment while
  retaining the no-resubmit rule. A reference-only check is stronger but still insufficient.
- UI proposal 6204760370 already has reviewToken, termsVersion, revision, fixture marking,
  explicit confirm and no automatic retry. Add server-verified supplier acceptance and pending
  reason; keep verification at the backend trust boundary. Integrator decides final names.

## Acceptance scenarios for the implementation owners

These are required scenario specifications, not tests executed by this documentation PR.
Run against the real UI/adapter modules with offline fixtures or an explicitly authorized sandbox.

| Scenario | Expected result/invariant |
| --- | --- |
| Slot lookup returns a slot | Selection only; no booking created or success message |
| Slot selection attempts an unreviewed hold | Block before network side effect; unsupported path clearly shown |
| Explicit supplier request receipt with a reference | pending/supplier_request, not confirmed |
| HTTP success and ID, missing/unrecognized supplier status | unknown; no success presentation |
| Reservation confirmation matches attempt/details and is persisted | confirmed with reference and details |
| Reference belongs to another venue/date/party or attempt | No confirmation; reconcile unknown |
| Supplier says payment required; no accepted reservation evidence | payment_required plus unverified reservation; no paid/booked claim |
| Charge succeeds but reservation outcome missing | No reservation confirmation; no second booking or charge |
| Token expired, terms changed, guest/date/slot edited or stale revision | Reject before dispatch; fresh review/consent required |
| Double click, two tabs or replayed request | One durable attempt; at most one authorized supplier submission |
| Timeout/socket loss after submit | unknown and locked; refresh never resubmits |
| Local validation fails before any dispatch | error with actionable correction; no false request receipt |
| Supplier explicitly rejects this attempt | rejected; new attempt only after backend retry-safety decision |
| Process crash after dispatch or result persistence failure | Attempt survives; unknown/reconciliation, no duplicate submission |
| Session TTL/reload/destroy after submission | Durable result recoverable by owner; not cancelled or reset |
| Older pending response arrives after confirmed revision | Ignore stale update; confirmation not downgraded |
| Different owner requests attempt | No result/guest-data disclosure or modification |
| Fixture confirmed record in live transport | Reject or flag protocol error; never a live confirmation |
| Manual Den phone route / external link / iframe only | Explicit fallback; not counted as completed Playwright integration |

## Validation and handoff

Executed on the baseline: `node --test api/test-zink-playwright.mjs`: 11 passed, 0 failed.
These existing offline tests cover ledger, authorization, ownership and request guards; they do
not prove supplier status semantics, live booking, new UI behavior or the scenarios above.
Source inspection establishes the current classification gap; no provider traffic was generated
for this task. No runtime, shared schema, app copy or deployment was changed.

Adoption blockers: integrator approval of result/terms fields; provider-specific reviewed status
maps and reliable confirmation evidence; generic durable reconciliation; UI and independent
fixture tests. Unsupported hold/payment paths stay blocked. The document is a reviewable input
to those owners, not a claim that booking through Velvet is complete.
