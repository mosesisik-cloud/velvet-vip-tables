# La Huella and Gitano Tulum: read-only journey evidence

Checked 15 October 2026. Isolated iframe on local Velvet origin versus direct provider, using real party/date controls. No offered slot clicked, OTP/contact entered, holds, reservations or payments created. All non-GET/HEAD traffic blocked; Meitre GETs restricted to observed read-only families. This audit goes beyond initial form rendering but stops before checkout.

## La Huella — Meitre

Source: https://lahuella.meitre.com/

Party changed2→3→2, selected17October2026 and dinner. Both contexts offer **20:00,20:30,21:00,21:30,22:30**. Exact same selection and times.

No cancellation text is visible on the time-selection screen. The observed selected-day response `/api/search-all-hours/en/2/2026-10-17/dinner/11` reports traditional booking, no guarantee, fee0, à-la-carte menu, `cancellationHours:6`, and null cancellation text/fee amount. This metadata is not a complete final cancellation contract and must not be translated into an unconditional free-cancellation promise. Terms in that response require both first and last name; guests missing a surname will not appear on the entrance list. These terms were not rendered in the observed time-list stage.

## Gitano Tulum — SevenRooms Experiences

Source: https://www.sevenrooms.com/reservations/gitanotulum

Party changed2→3; selected17October2026, all times. **Current-date bookable offers**:

- Dinner Reservation:18:00,18:30,19:00,19:30,20:00,20:30,20:45,21:00,21:15,21:30,21:45,22:00.
- Chef Tasting Menu:18:00,18:30,19:00,19:30,19:45,20:00,20:15,20:30,20:45,21:00,21:15,21:30,21:45,22:00,22:15.

Visible dinner restrictions include a two-hour table duration and dress code. Other experience cards are request-only/unavailable for the selected date and may show future alternatives. General Admission explicitly excludes a table reservation. Do not count those cards as available dinner tables.

The selected-date response marks tasting-menu slots as requiring advance payment; dinner slots do not require a credit card. Cancellation strings reference a seven-day cutoff and100USD deduction from prepayment; dinner's similar wording conflicts with its no-card metadata. The full cancellation text is **not visible at this list stage**, and final applicability has not been verified. Preserve offer scope and let the provider's final contract resolve it; do not advertise a universal cancellation fee.

## Critical extraction finding

The Gitano DOM contains hidden responsive duplicates and time buttons for future suggested dates (including holiday events). A raw button/time scrape is unsafe. The test now matches the observed experience response to selected date and party, then accepts only `type=book` within `availabilities['2026-10-17']`. `type=request`, future suggestions and duplicate DOM nodes are excluded. Embedded/direct parity compares these scoped offer/time sets.

Artifacts: parent `work/wave7-journey.mjs`, `wave7-journey-results.json`, `wave7-journey-lahuella-policy.json`, `wave7-journey-gitano-summary.json`; screenshots in task `outputs/wave7-journey-*`. Earlier diagnostic result files retain failed selector/broad-DOM attempts for traceability; only final scoped results are authoritative. No production files changed.
