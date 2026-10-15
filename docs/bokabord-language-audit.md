# Bokabord mirror language audit

Audit date: 2026-10-16. No shared code changed and no English mirror submission enabled.

## Read-only provider evidence

Opened the original Zink widget with browser locale en-US. It remained Swedish until selecting the footer language control. The original control offered only Swedish and English, with observed URLs containing `lang=sw` and `lang=en` respectively. Clicking English navigated to:

https://app.bokabord.se/reservation/?app_type=bokabord&app_type=bokabord&lang=en&hash=e9d3e6917bc7f05c0df1ae157d9aed5b&date=2026-10-15

The rendered meal screen showed `Dinner`, `Christmas menu`, `Read more`, `Log in`, `English`, and English restaurant descriptions. Browser locale alone does not select the language. Swedish's provider code is `sw`, not Velvet's `sv`. Spanish and French were absent from this selector; do not invent support.

All requests went through `allowedAvailabilityRequest`, allowing only known read-only calls; no meal, time, contact, hold or booking was selected. No provider mutations were sent. Scratch reproduction: `work/audit-bokabord-language.mjs`; delivered HTML: `work/bokabord-english-observed.html`.

The delivered public HTML includes inactive Angular templates. These establish literal text but NOT a tested end-to-end English contact/review journey:

| Existing Swedish selector | English template text | Evidence |
| --- | --- | --- |
| Kontaktuppgifter | Your contact details | contact template heading, source line 974 |
| Kontrollera din bokning | Review your booking | headings at 1731 and 2047 |
| Nästa | Next | contact next button at 1554; other templates also contain Next |
| Slutför bokningen | Complete reservation | confirmBooking button 2087–2089; card widget also has this label |
| Fortsätt utan konto | CONTINUE WITHOUT LOGIN | login template routeBack footer at 2420–2421 |

Do not use broad text matching across all templates/buttons. Scope to visible controls in the current step; fail closed on ambiguous matches. Restaurant-owned translations can differ or be missing; no guarantee that all 22 restaurants translate policies.

## Safety-critical backend changes required

Current locations in `api/bokabord-mirror.mjs`:

- `create`, line 90: hardcodes context locale sv-SE; line 128 navigation uses registry URL unchanged. Accept only validated sv/en selection, derive `lang=sw/en` from a canonical URL and store language in session. Reject unknown locale rather than forwarding arbitrary URL/query data.
- `snapshot`, line 147: exact Kontaktuppgifter heading detects contact. This controls marketing checkbox unchecking, contact field overlays and contact status. English currently causes all to fail.
- `snapshot`, line 161: exact Kontrollera din bokning heading detects review and changes final-action label.
- `action submit`, lines 205–206: repeats exact review/contact checks. English would fail contact_required. Both must use the same step detector as snapshot.
- `action submit`, line 209: exact Nästa or regex Slutför bokningen dispatches the submit action. Use verified English equivalents, visible/scoped unique button checks and keep confirmation, terms, approval equality and duplicate submission guards.
- `action submit`, line 211: Fortsätt utan konto needs the observed English CONTINUE WITHOUT LOGIN alternative. Do not replace it with login/registration or infer consent.
- `action fill`, line 221: contact heading gate requires English handling; contact field selectors by `name` are language independent and should stay unchanged.
- `action click`, line 231: **critical contact-stop gate** requires English handling. Changing only the URL makes contact detection false and allows coordinate clicks on the contact screen. Network saveBooking protection would still block unarmed mutation, but the deliberate contact/consent interaction boundary would be lost.
- `snapshot.handoff` currently returns the original registry URL, so a localized session would hand off into Swedish unless localization is reapplied safely.
- Session current/resume returns an existing screenshot; changing selected language must not silently reload a contact/review session or mix the saved session language with a new shell label. Record and surface session language and use a deliberate restart if required.

`CONTACT_FIELDS`, providerReady, bookingDetails/model reads, exact saveBooking endpoint, matchesApprovedBooking, payload/terms checks, record-result verification and one-shot reserveSubmission are not language-based; keep their behavior intact. Never treat English text alone as proof of a confirmed booking.

## Frontend copy requiring translation

`js/bokabord-mirror.js`:

- line 3: source/no account, intro, start, image alt, up/down aria labels and text, refresh/close, consent statement and legal link labels, continue, accessible text summary.
- line 27: all error/status messages (rate limit, busy, auth, disabled/capacity, expiry, existing session, contact stop, stale view).
- line 34: opening/updating; line 49: contact overlay field labels.
- line 77: review vs final-submit action text.
- lines 80–82: handoff link, card/product/waitlist/provider reasons and explicit no-booking-sent explanation.
- lines 85–87: prepare/inspect contact status, blocked/handoff, verified confirmation/reference and unknown-result warning.
- line 91: other restaurant and connection error; line 95: required approval reminder; line 104: closed state.
- line 37: create request must send validated language; resume behavior must respect the existing session language rather than silently translating the shell only.

Provider screenshots/text remain original content. Translating frontend overlay labels alone does not translate screenshot content. Preserve separate explicit user consent and never auto-check consent when choosing a language.

## Required validation before enabling English

Use local provider-template fixtures for both languages; do not create real reservations:

1. Contact detection exposes only the permitted fields and clears marketing checkboxes once.
2. Raw coordinate click at contact returns contact_stop in both languages.
3. Fill outside contact returns contact_required; unknown contact/review headings fail closed.
4. Review detection is exact and visible; correct scoped Next/Complete action is selected with duplicate/hidden buttons present.
5. Final submission requires explicit confirmation and terms, approved payload equality, current revision, one-shot persistence and matching provider response; localization must not loosen any check.
6. Guest-without-login flow uses only observed safe guest control; missing/ambiguous selector cannot trigger a different action.
7. Language change/resume and external handoff preserve canonical restaurant identity, active booking data and explicit restart semantics.
8. Regression-test Swedish unchanged. A real read-only English contact/review UI journey has NOT been performed: this audit stopped at the meal screen and inspected delivered inactive templates only.

Recommendation: keep Swedish mirror active with an honest language limitation notice until these checks are implemented. A direct original English provider link may use the observed lang=en mechanism independently, but do not label the current screenshot mirror English-ready.
