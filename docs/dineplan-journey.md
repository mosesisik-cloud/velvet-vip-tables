# Salsify / Dineplan journey audit

Checked 15 October 2026 against deployed Velvet 172 and the original provider. Restaurant: `curated-CPT-salsify-at-the-roundhouse`. Provider: https://calendar.dineplan.com/m0w4SxVp?type=inline .

## Result

Use the direct provider link for Salsify. Its embedded desktop and mobile flow did not progress from party selection to the calendar. The same interaction worked standalone. This is not an end-to-end booking success: no reservation, hold, payment or confirmation was created.

| Stage | Embedded Velvet | Standalone provider |
| --- | --- | --- |
| Original restaurant identity and party controls | PASS | PASS |
| Party 2 to calendar | BLOCKED on desktop/mobile | PASS on desktop/mobile |
| Change date and inspect times | Not reachable | PASS, 19–21 October |
| Select actual available slot | Not reachable | 21 October, 12:30, Sea Room accepted by UI |
| Additional questions | Not reachable | PASS: dietary needs, occasion, requests |
| Deposit and review | Not reachable | PASS: R1,000 per guest; R2,000 total for two |
| Empty contact validation | Not reachable | PASS: payment action disabled |
| Invalid email | Not reachable | Input marked invalid on mobile, but generic “Failed to create reservation” toast; validation UX not cleanly verified |
| Valid synthetic contact | Not reachable | Final “Proceed to payment” enabled, deliberately not clicked |
| Payment, booking confirmation, cancellation execution | UNTESTED | UNTESTED |

Displayed times are not equivalent to bookable inventory: 19 October 18:30 and 20 October 12:30 were displayed, but selecting them returned “Fully Booked”. The 21 October selection progressed through questions and review. This observation is time-specific, not a promise of future availability.

## Embedded failure isolation

The iframe was scrolled into the viewport before a normal click; an initial Playwright off-screen click error was an automation artifact. After correcting that, navigation still remained at `/guests?type=inline&guests=2`. A bare 800px iframe on the Velvet origin reproduced the behavior without Velvet layout or JavaScript. Standalone with the exact same URL and request policy reached `/date`.

No provider read request was blocked at this step. Non-GET requests blocked by the test were telemetry (Sentry, Firebase installation, Google analytics). Cookie metadata showed partitioned Secure SameSite=None `dp_csrf` cookies in both cases, with embedding-origin-dependent partition keys. This does not establish the underlying cause; do not attribute it conclusively to cookies.

## Cancellation and deposit disclosure

Official source checked: https://salsify.co.za/reservations/ . The published policy specifies R1,000 per guest deposit; cancellation/change at least 24 hours before the reservation receives a full refund. Late cancellation, no-show, and absent guests can forfeit the corresponding deposit, subject to management discretion. Reduced group numbers do not transfer the removed guests' deposit to remaining guests.

The website describes payment within 24 hours of a provisional booking, whereas the observed checkout displayed “Total due now” R2,000. Preserve the provider's current checkout instruction rather than synthesizing a single payment deadline. This is a deposit, not merely a card guarantee.

The observed contact/review screen contained Dineplan terms/privacy links and an age-12 notice, but did not expose the restaurant's specific cancellation deadline. Velvet should show the verified restaurant policy and its source before sending the guest to checkout, with a reminder to review the current provider terms.

## Safety and evidence

All non-GET/HEAD/OPTIONS traffic was aborted. No provider responses were mocked. Synthetic contact fields were marked with a visible test banner. The invalid-email final action was exercised only with network writes blocked; the syntactically valid final action was never submitted. Payment/card handling and successful reservation creation require a provider test environment or a separately authorized real test.

Reusable probe: `scripts/test-dineplan-journey.mjs`. Run from repository root with `DIRECT_ONLY=mobile` for mobile standalone, another nonempty value for desktop standalone, or unset for deployed embedded plus standalone. Fixed October 2026 dates make this an audit probe, not a permanent CI test.

User-facing evidence is in the workspace `outputs/` directory:

- `dineplan-journey-report.json`: embedded desktop/mobile and standalone stages.
- `dineplan-direct-report.json`: standalone desktop review.
- `dineplan-direct-mobile-report.json`: standalone mobile review and validation qualification.
- `dineplan-direct-contact.png`: actual provider review and R2,000 deposit.
- `dineplan-direct-mobile-contact.png`: mobile review before synthetic data.
- `dineplan-direct-mobile-contact-test-input.png`: watermarked synthetic-data check, including the generic validation error toast.
- `dineplan-desktop-party-navigation.png`, `dineplan-mobile-party-navigation.png`: embedded party navigation result.

Recommendation for Gabbe: use the official external Dineplan flow for Salsify, review the R1,000/person deposit and 24-hour cancellation terms, and treat confirmation as complete only when the provider supplies a real confirmation. No claim is made that this test completed payment or booking.
