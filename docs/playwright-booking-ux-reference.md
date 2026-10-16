# Velvet booking UX reference: Zink / Bokabord

Audit: 2026-10-16. Owner: branding/UX chat 01a14138-697b-7681-aac3-72cf68a8f205. Coordination: #129. Baseline: `7c0e45dc34dc997ffcdc6a73f05294ecec264972`.

## Scope and evidence limits

Read-only audit, not a replacement UI implementation. Only this document changes. UI owner 692b owns the new component; integrator owns routing and transport; result-semantics owner beb9 owns the shared outcome vocabulary.

Live observation: the public Zink detail route rendered the correct restaurant, a **Boka bord** entry, cancellation information, **Bokning via Bokabord**, **Utan Velvet-konto**, and **Hitta ett bord**. The provider session was not started; no dates, slots, guest details, holds, reservations or payments were submitted. A later browser command timed out, so focus transfer and responsive behavior were not independently verified in this audit.

Later-step findings below come from source inspection, not a new live journey. `docs/bokabord-playwright-pilot.md` records an earlier authorized completed test; that historical record does not prove this audit or every provider can complete booking. `scripts/test-bokabord-ui.mjs` contains a local slow-edit fixture, but this audit did not rerun it or claim its assertions as newly passed. Other assigned workers own regression execution.

Primary code: `js/bokabord-mirror.js` (mount, perform, controls, close); `api/bokabord-mirror.mjs` (snapshot, bookingDetails, action); `js/app.js` (restaurant detail integration, approximately lines 2515-2605). Language evidence: `docs/bokabord-language-audit.md`.

## Reference journey and preservation requirements

| Stage | Existing implementation / evidence | Preserve in normalized UI |
| --- | --- | --- |
| Restaurant entry | Live Zink entry observed. app.js Boka bord handler focuses booking heading and scrolls to it; it does not itself open the provider. | Restaurant identity and one clear booking entry. Keep focus transfer and reduced-motion behavior. Explain the next action without implying a reservation exists. |
| Start or resume | Hitta ett bord creates a mirror with restaurantId, resume:true and width. The provider image is decoded and hash-checked before state/revision is replaced. | Show opening progress, prevent duplicate starts, bind session to restaurant. Resume must identify saved selection and provider language before further actions. |
| Meal / guests / date / time | Original provider pixels receive scaled coordinate clicks. Earlier pilot documents meal, party and date/time progression. | Semantic controls reflecting actual adapter state, real availability provenance and venue-local date/time. Do not fabricate the order or available times for another provider. |
| Contact details | Overlay fields have labels and email/tel types. Input is queued in a field package, latest edits and focus are preserved. Unsynced edits disable progression. | Keep user input during latency; distinguish editing, saving, saved and failed. Do not advance until all required edits are acknowledged. Never infer marketing consent. |
| Review | Contact action says Kontrollera bokningen; review action says Slutför bokningen. Backend checks current details and revision; consent is cleared after each response. | Review restaurant, local date/time, party, contact details and applicable terms before an explicit final action. Editing invalidates the previous review/consent token. |
| Submission | Explicit confirm and terms are sent; backend has durable one-attempt protection. Raw image interaction is disabled at contact/review/result. | Exactly one intentional submission, visible progress and server-enforced idempotency. Disabling a button alone is insufficient. |
| Result | Backend provides status/reference; frontend currently distinguishes confirmed from everything else. | Use semantics owner's verified outcome, not a reference string alone. Separate confirmed, pending, unknown, rejected and payment-required. Never turn a timeout into permission to resubmit. |
| Unsupported route | Card, mandatory products, waitlist and provider-reservation requirements produce an explained handoff. | Be honest about capability. Handoff is not completed booking inside Velvet. Do not imply a held table, transferred input, or completed payment. |

## Findings for the new component

### P1: selection is not keyboard-operable in the mirror

`js/bokabord-mirror.js` renders the provider as an img with onclick and a generic alt. Date, party and slot controls are not exposed as native interactive elements. The expandable text is a preformatted body-text snapshot, not an operable form. Contact overlays help later, but do not make selection accessible.

Requirement: native labeled controls for each adapter-supported selection; visible focus; keyboard-operable slots; semantic heading and live status for step transitions. A screenshot or text dump can supplement the form, not replace operable controls. Validate keyboard-only selection through review with the actual new component and fixture.

### P1: failed contact sync can disable its own recovery controls

`perform` restores failed fill values into pendingFields. `controls` disables every button when pendingFields is nonempty, including Uppdatera and Stäng. The generic error asks the user to update the view, while that button can be disabled. A subsequent input/blur may retry, but this recovery is undiscoverable. Existing fixture asserts submit remains disabled after failure, not that a clear recovery action works.

Requirement: preserve the draft, expose an enabled **Försök spara uppgifterna igen** action for safe field synchronization, and a deliberate discard/exit choice. Keep final submit locked. Never apply this retry behavior to a possibly dispatched booking submission. Acceptance: fail one field sync; recover without changing a character; confirm latest draft remains intact and no submit is sent.

### P1: no explicit edit path at review

The image click handler ignores contact and review states. Navigation exposes only up/down, refresh and close; backend action types contain no back action. There is therefore no Velvet-exposed semantic path from review back to selection or contact editing. Restarting the whole session is not an adequate correction flow.

Requirement: review-level **Ändra datum och gäster** and **Ändra kontaktuppgifter**, implemented only when the adapter safely supports those transitions. Preserve compatible draft details; invalidate slot/review/consent as necessary. If provider state cannot safely go back, explain a deliberate restart before discarding anything.

### P1: expired-session recovery repeats the stale session

A session_expired error changes the message but leaves local state in place. Uppdatera posts another action to that same state.id; the fresh-start button stays hidden until close succeeds. close awaits DELETE before resetting state and has no local catch. Consequently the instruction to open again lacks a robust direct path in this component.

Requirement: explicit expired state, read-only reconciliation first when a submission may have happened, and an enabled restart only once safe. Closing the UI must not erase a durable unknown/confirmed attempt. Acceptance: expired current/action and failed remove do not trap the guest or automatically start another booking.

### P1: outcomes are collapsed into an unhelpful warning

All result statuses other than confirmed render the same unverified/no-new-booking message. It is appropriately cautious for unknown, but does not explain rejection, outstanding payment or payload mismatch. There is no direct reconciliation/history action in the message itself.

Requirement: adopt the shared semantics contract rather than a parallel vocabulary. Unknown must lock resubmission and offer read-only status checking; payment-required must not be labeled confirmed or paid; rejection must distinguish proven non-creation from uncertain dispatch. Link any history/status action to the same attempt and restaurant. Supplier outcome verification belongs to the adapter/server.

### P2: consent and progress feedback are too coarse

The same consent block is requested before contact-to-review and again before final submission, and is cleared on every response. This is safe but can feel repetitive. No stable step indicator or persistent selection summary is rendered by the mirror itself. The final action should clearly mean sending a reservation, while review navigation should mean checking information.

Requirement: retain explicit final consent bound to the actual review/terms version, with a clear reason when edits invalidate it. Do not remove backend gates merely to reduce clicks. Show a persistent restaurant/date/time/party summary and step context from adapter state. Separate progress announcements from field-save feedback to avoid excessive screen-reader interruption.

### P2: language belongs to the session, not only the shell

The current mirror shell is hardcoded Swedish; backend step selectors use Swedish headings. The existing language audit documents a provider English option, but not a completed English journey. Locale changes can affect contact detection and submission boundaries.

Requirement: advertise only tested provider languages, retain the original terms meaning, and disclose a language mismatch. Store provider locale with the session; do not silently reload or relabel a contact/review session when the Velvet shell language changes. Translation must never broaden which provider controls can be clicked.

### P2: close, route changes and resumption need a clear contract

The current MutationObserver closes/removes the session when the component leaves the DOM; this is different from a browser reload potentially resuming a server session. Removal while busy also has different behavior. A guest cannot infer whether **Stäng**, back navigation and reload preserve progress.

Requirement: define close-view versus abandon-session separately, preserve recoverable drafts according to the server contract, and make destructive restart explicit. Pending/unknown submissions must survive UI disposal in the durable journal. Avoid automatic resubmission or resumption into a different restaurant.

## Acceptance handoff to UI owner and independent journey tester

1. Keyboard-only date/party/slot/contact/review progression using actual native component controls; focus follows the current step and errors.
2. Slow field updates preserve latest values and focus; failed sync offers a usable retry that never submits a booking.
3. Review supports safe edits and invalidates prior approval; a changed price, terms version or slot cannot reuse stale consent.
4. Expiry, other-restaurant session, capacity and stale revision have distinct useful actions; unknown outcomes never offer ordinary retry.
5. Reload/back/close during selection versus after possible dispatch are tested separately. No data from another owner or restaurant is shown.
6. Language changes do not silently reset selection or weaken contact/final-submit boundaries.
7. Result UI uses adapter-verified outcome tied to the attempt. Fixture mode stays visibly test-only throughout; no fixture confirmation is described as supplier-confirmed.
8. Empty availability, loading and provider errors are distinct from no tables. Do not display stale slots as bookable after a selection change.

These are requirements and source-backed findings, not newly executed tests. This document does not authorize provider writes, holds, payments, access-protection bypasses or a production release. Full supplier confirmation and end-to-end live capability remain separate evidence dimensions in #129.
