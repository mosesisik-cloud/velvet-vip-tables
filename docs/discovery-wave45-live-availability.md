# Amber and Billy Ho — live availability audit

15 October 2026. This is availability evidence beyond a successfully rendered booking form. It is not checkout or confirmation certification.

| Venue | Identity | Selection | Actual offered times |
|---|---|---|---|
| Amber | 7th Floor, Mandarin Oriental The Landmark, Hong Kong, 15 Queen’s Road Central | 17 October 2026, 3 guests, all times | 12:15, 12:45, 13:15; Amber Weekend Lunch |
| Billy Ho | Jl. Pantai Batu Bolong, Canggu, Badung, Bali | 17 October 2026, 3 guests, all times | 45 Main Dining times, 11:00–22:00 at 15-minute intervals |

Sources: https://www.sevenrooms.com/reservations/ambermandarin and https://www.sevenrooms.com/reservations/billyho, previously linked from each venue's official website. The tested SevenRooms routes load their current native forms. Party was changed from 2 to 3 and date from 15 to 17 October through real controls. Selecting the 12:00 **search filter**, without selecting an offered reservation, gives three Amber lunch results and 13 Billy Ho results. Direct provider and an isolated iframe on the local Velvet origin are compared by exact offered-slot text. This does not assert the new venue mappings are already deployed.

Amber's cookie banner overlaps the time filter dropdown in the iframe until normal cookie preferences are set. The reproducible test uses Cookie Settings → Confirm My Choices, rather than a forced click or hidden overlay. This is a visible friction point to retain in user testing. The default date's 'closed' state must not be treated as the restaurant being permanently closed: changing to 17 October yields live availability.

Billy Ho states that bookings are held for 15 minutes after the scheduled arrival; this wording is not evidence of a technical reservation hold created by this test. No offered slot was clicked, no contact details entered and no request/alert submitted. All non-GET/HEAD requests were blocked. Cancellation deadlines, card requirements and final confirmation remain untested and must not be inferred from this availability audit.

Evidence: parent `work/e2e-sevenrooms-wave45-compare.json` and reproducible `work/e2e-sevenrooms-wave45-compare.mjs`. Earlier inspection artifacts hold full visible initial/selection text. Results are time-sensitive and deliberately tied to a concrete date and party size.
