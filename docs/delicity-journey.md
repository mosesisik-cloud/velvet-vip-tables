# Delicity: Sushi Arson journey audit

Read-only audit 2026-10-15, exact provider https://booking.delicity.com/sushi-arson. Provider metadata confirms Sushi Arson, 2 Place Arson, 06300 Nice, +33 6 28 40 41 16, official website http://sushiarson.com. No production code or registry changed.

## Results

| Stage | Result |
|---|---|
| Venue identity and initial form | PASS |
| Cross-origin iframe from local Velvet origin vs standalone | PASS for initial form and live availability |
| 17 October, 2 guests | PASS: identical 15 available times, 18:30 through 22:00 in 15-minute increments |
| Mobile party change 2 to 3 through actual UI | PASS: new GET with guests=3, same 15 available times |
| 18 October, 3 guests via observed provider query handling | PASS: 14 available times, 18:30 through 21:45 |
| Continue/contact/review/confirmation | NOT EXECUTED: Continue creates booking state before contact screen |
| Cancellation deadline/fee before booking-state creation | NOT FOUND / NOT VERIFIED |

The exact provider bundle supports `seats` and `when` query parameters. They were used to supply date and party. Its code locally auto-selects a first available schedule for this query flow. We did not click a time slot or Continue. No booking creation occurred; all non-GET/HEAD network calls were blocked. There was no guest/contact entry, OTP, hold, payment or final booking.

## Observed read-only requests

- GET `https://gateway.delicity.io/v1/booking/client/establishments/sushi-arson`
- GET `https://gateway.delicity.io/v1/booking/client/establishments/337/availability?date=2026-10-17&guests=2&zoneId=495b2d0e-e62a-4897-8db3-21506f59413b`
- Same observed availability request for guests=3 and 2026-10-18.

Metadata reports guests 1–4, 60-day window and one zone, `Selon disponibilité (Salle ou terrasse)` (room or terrace according to availability). Times include unavailable entries with nonzero `seats`; availability MUST check `available === true`, correct requested date and party. Raw visible time text is not proof: disabled/unavailable choices also appear in DOM. `allowOverbooking:true` and `autoConfirm:true` are provider settings, not proof a table will be confirmed.

## Mutation boundary and guest flow

Public bundle https://booking.delicity.com/assets/index-CMiGRH4S.js declares GET establishment/availability, POST `/v1/booking/client/bookings`, PATCH booking, POST booking contact/comment/cancel. Initial Continue calls booking creation, then navigates to validation when authenticated or NoAuth otherwise. This is an early state-changing boundary, not merely opening a contact form. Contact-stage testing cannot be claimed from this audit.

Bundle contains a Continue without an account path and firstname/lastname/phone/email validation text. These are static-code findings only; no live guest journey was exercised. No card requirement or card-free guarantee was established.

## Cancellation and terms

Initial page exposes a CGV link to https://pro.delicity.com/cgv/. That document concerns food/product purchases, delivery, payment and withdrawal; it does not establish a Sushi Arson table-cancellation deadline or fee. Initial provider page and establishment description do not expose a restaurant-specific cancellation policy. Do not infer free cancellation or convert retention/keep-table minutes into a cancellation deadline. A terms checkbox exists in the later validation component, but that view was not reached live.

## Recommendation

Native embedding is technically verified for initial selection and read-only live inventory. Do not advertise a fully verified seamless booking journey yet: contact and confirmation remain untested, and the requested cancellation policy is missing before an early booking-creation step. Keep explicit unverified-policy wording and original-provider fallback; a test environment or specifically scoped reservation-state test is needed for deeper coverage. Never label merely loading the frame or clicking Continue as confirmed.

Scratch evidence in parent work: discovery-delicity-parity.json, discovery-delicity-party3.json, discovery-delicity-date18.json, discovery-delicity-requests.json, discovery-delicity-scripts.json, discovery-delicity-bundle-2.js. Screenshots discovery-delicity-initial.png, discovery-delicity-party.png and discovery-delicity-mobile-party3.png. This used a local cross-origin iframe, not a deployed production full-flow test.
