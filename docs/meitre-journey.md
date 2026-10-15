# Oro / Meitre journey audit — 15 October 2026

Real deployed route: https://b2b.bakemyday.se/velvet/#/restaurant/curated-RIO-oro
Direct provider: https://oro.meitre.com/
Identity verified by provider public restaurant response: Oro, Av. Gen. San Martin 889, Leblon, Rio de Janeiro; restaurant ID 10.

## Coverage and boundary

The test uses the actual provider, with every POST/PUT/etc blocked and only three explicitly observed read-only Meitre API families allowed. Mutating GET endpoints are also blocked. No OTP was sent, no real contact information entered, and no hold, reservation or payment created. Email format was checked in-browser using an invalid-format value and `velvet-test@example.invalid`, then cleared. There is no simulated success or invented confirmation.

| Stage | Result |
|---|---|
| Open Oro provider inside deployed Velvet | PASS, desktop and mobile |
| Change party from 2 to 3 and back to 2 | PASS |
| Select 17 October 2026, dinner, two guests | PASS |
| Change date 17→16→17 and reload dinner times | PASS; actual read calls refresh the selected date |
| Real availability | PASS: 22:30 offered at audit time |
| Choose 22:30 | PASS: proceeds to provider verification without creating a hold |
| Preserve party/date/service/time across auth redirect | PASS: all four values asserted in provider return URL |
| Direct provider versus Velvet | Same actual provider, same selected details and available time; responsive decorative separators/footer differ |
| Email input format validation | PASS, browser only |
| Email OTP / guest identity | BLOCKED deliberately before Send code |
| Guest name/phone, complete terms, card fields, final review | NOT VERIFIED: behind real provider identity verification |
| Booking confirmation | NOT VERIFIED; no reservation made |

This is a genuine journey through availability and verification, not full checkout certification. No local fixture would prove the provider's post-OTP implementation, so none is presented as such. A consenting human can continue with their own verification code for final-stage testing, while stopping before the final booking action if no reservation is desired.

## Cancellation policy and card requirement

No cancellation deadline or penalty is rendered on the observed welcome, party, date, service, time-selection or email-verification screens. This is also true when visiting the provider directly. Therefore Velvet currently does not give users an independently visible cancellation policy before that identity step.

Read-only source for the specific selection:
`https://api.meitre.com/api/search-all-hours/en/2/2026-10-17/dinner/10`

Use **center**, not left/right (adjacent dates). The 22:30 slot reports `type=no_show`, `guaranteeType=per_person`, `fee=780`, `allFees.noShow=390`; the restaurant response reports BRL. Enabled menu options each report `cancellationHours=24`, while `cancellationPolicyText`, `cancellationFeeAmount` and `cancellationFeeCurrency` are null. The slot also has a dietary condition about inability to meet gluten cross-contamination restrictions. These are structured slot-specific data, not a verified final cancellation contract. In particular, do not label the no-show amount as an unconditional cancellation fee, invent a full policy, or generalize it to other dates or party sizes.

Provider configuration lists Stripe and allows deposits, but that does not prove every booking is a prepayment. The selected slot's no-show guarantee is stronger evidence for this selection. Actual card form, authorization wording and final liability remain unverified behind OTP.

Suggested implementation: obtain and display the current selected offer's cancellation/guarantee terms before commitment; bind them to venue/date/time/party/area/menu and refresh when selection changes. Where the full text cannot be observed, explicitly say it must be reviewed in the restaurant's final booking form, without promising free cancellation.

## Concrete UI finding

Mobile iframe has no horizontal overflow. However, browser focus scrolling can position the email heading partly underneath Velvet's fixed navigation (see `meitre-velvet-mobile-email.png`). Keep provider content below the sticky header with scroll offset/margin and test input focus, not only initial opening. The native provider remains narrow in the desktop sidebar but functional.

## Reproduction and evidence

Run `node scripts/test-meitre-journey.mjs` from the repo. This is an audit pinned to 17 October 2026 and 22:30; live availability can change, so a later lack of that slot is not itself a product defect. Outputs are in the parent task's `outputs/`: `meitre-journey-results.json`, `meitre-slot-policy-evidence.json`, plus desktop/direct/mobile availability, verification and email screenshots. The report deliberately excludes request bodies and analytics identifiers.

Public frontend source contains separate reservation-grab and confirmation endpoints. Their existence is not evidence of successful integration or confirmation capture. Velvet cannot inspect arbitrary cross-origin confirmation DOM from its frontend; do not mark a booking confirmed merely because an iframe loaded or an OTP page was reached.
