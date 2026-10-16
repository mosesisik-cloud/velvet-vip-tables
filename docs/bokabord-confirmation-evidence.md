# Reviewed Zink confirmation policy

Refs #129. Owner `codex-20261016-01`. Checked 2026-10-16 Europe/Stockholm.

## What changed

The historical authorized Zink test artifacts were found on the shared local host and inspected without calling the supplier booking URL. They supply the positive observation missing from PR145: an ordinary Zink booking had **numeric status 1**, alongside a rendered completion message stating that confirmation had been sent by email. The separate `confirmed` field was numeric 0 and is not the reservation-outcome enum.

`api/bokabord-confirmation-policy.mjs` provides a backend-only, narrow positive verifier using PR145's bound-result verifier. It does not modify the shared mirror/server/classifier and grants no dispatch authority. The runtime owner must wire it to the actual intercepted response and reserved attempt. Until then it does not change live behavior.

## Evidence provenance, without private data

Local historical artifacts: `zink-current-state.json` (captured 2026-10-15T17:48:11.508Z), `zink-booking-approval.json`, `zink-slutkontroll.json` (checked 17:48:29.760Z), and `zink-bokningsbekraftelse.png` in the original test workspace. Their private guest fields, booking reference, short code, invitation code, image and capability URLs are **not** copied into this repository or public report.

Independent local checks performed:

- Raw `result.booking.id` equals the snapshot reference and the separate final-check reference.
- Raw date, time, party, first/last name and email match the prior approval exactly. Supplier phone is numeric; normalized digits match the approved string. The policy supports safe-integer supplier phone values for that observed representation.
- Decoded snapshot image SHA-256 equals its `imageHash`, the separate final-check hash and the saved PNG hash.
- The recorded provider text identifies Zink and says “Du är nu klar och bekräftelse har skickats via epost.” The final-check file records contact match, original-image match and provider-reported email dispatch as true. This verifies the saved artifacts' agreement; it is not independent proof of inbox delivery.
- Raw nonprivate routing fields: restid 1359, mealid 9778, meal type 3, numeric status 1, numeric waitlist 0, empty products, `require_noshow: false`, `group_booking: false`. `payinwidget: true` is present even in this completed ordinary booking and is not used alone to infer an outstanding payment.

The saved snapshot retains the booking object, not the complete HTTP exchange. A local replay constructs a synthetic successful HTTP envelope and uses **fixture mode**; it does not claim another live response. The production verifier requires a fresh actual successful HTTP response and an already dispatched, server-bound attempt. The historical raw object passes the narrow verifier in fixture mode with the original approval; only the boolean outcome was logged.

Public first-party source also inspected: `https://app.bokabord.se/production/app-widget.js?v=6.0.3`, SHA-256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5`. It supports numeric 0 as payment-required and numeric 2 as cancelled for ordinary meals; it does not itself establish the positive enum. The initial public Zink widget was fetched without executing its scripts. Its `booking-success.html` is a **review** template with a final-submit button, so that name must never be treated as confirmation evidence.

## Narrow implementation contract

Import `bokabordApprovalDigest(approval)` and `verifyZinkBookingConfirmation(attempt, approval, observation)`.

- Only `curated-STO-zink-italian-cuisine`, public restaurant hash `e9d3e6917bc7f05c0df1ae157d9aed5b`, supplier restid 1359, mealid 9778 and meal type 3 are accepted. Other venues/meals remain unknown until reviewed evidence extends the policy.
- The digest binds approved selection, contact data, comment and explicit terms. Runtime must compute and reserve it **before** dispatch, preserve the exact approval and map it to the journal's review fingerprint. Do not recompute approval from an untrusted post-submit client request.
- `attempt` uses PR145 verifier fields: provider `BokaBord`, restaurantId, sessionId, server attemptId, client idempotencyKey, detailsDigest, mode and dispatched. Owner authorization and journal first-send reservation remain upstream duties.
- `observation` comes from the backend interception and includes independently supplied matching provider/restaurant/session/attempt/key/digest bindings, `source: provider` or `fixture`, `httpOk: true`, and `data: {success: true, booking}`. Never accept these fields from browser request JSON or copy raw booking data into a public result.
- Only exact numeric status 1 can confirm, with positive valid ID and matching approved venue/meal/selection/contact receipt. Waiting list, card requirement, products, temporary/gift/group/linked booking paths are excluded. Missing/malformed/mismatched values return unknown. A fixture proof cannot confirm a live attempt.
- The returned result has PR145's public proof shape. Durable result recording must succeed before claiming completion to the guest. HTTP errors, timeouts and persistence failures remain unknown; no automatic retry.
- Retain the existing conservative payment/rejection classification as a separate fallback. Do not turn a mismatch into success, generalize numeric 1 to every Bokabord row, or map `confirmed: 0` to failure.

## Validation and remaining integration

`node --test scripts/test-bokabord-confirmation-policy.mjs scripts/test-booking-result.mjs api/test-zink-playwright.mjs` runs the new synthetic policy cases plus existing PR145 and Zink tests. The new cases cover positive binding/privacy, malformed states, venue/meal scope, unsupported requirements, receipt mismatch, stale approval/terms, attempt/source isolation and transport/ID failures. They exercise the real shared verifier but do not submit through the real provider or the full runtime.

This change is stacked on PR145 (`bfc34aad0b9f8dbe1b04903f0dde6c5f87fdee19`); the integrator should take only this policy commit after that dependency. Integration owner owns mirror/server/journal wiring and must independently review the local artifacts before enabling the positive policy. Then test the actual intercepted-response → durable journal → current/reload → guest UI chain with synthetic fixtures, preserving source labels and rejection cases. No new live reservation, hold, email, payment, merge or deployment was performed here.
