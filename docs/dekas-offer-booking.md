# De Kas: explicit Lunch offer for two

Integration of provider handoff #207, tracked in #129. Server flag
`VELVET_ZENCHEF_DEKAS=live` enables only `curated-AMS-de-kas`, Zenchef restaurant
386643, ordinary Lunch shift 494748, offer 118785 with count 2. Friday shift
500609 and other meals are outside this scope.

Official sources: https://restaurantdekas.com/eng/reservations- and
https://restaurantdekas.com/eng/menu; booking terms:
https://bookings.zenchef.com/gtc?rid=386643&lang=en.

The provider handoff observed the native offers/form flow for two on
16 November 2026 at 12:00, using guarded reads and synthetic contact details.
No actual booking, hold, payment, authentication code or saved booking UUID was
requested. A successful real reservation remains unobserved.

The admitted source configuration requires automatic confirmation with no cutoff,
null card policy, and deposit threshold seven guests (not applicable to two).
The offer has no prepayment. The booking form does not supply a meal price:
`mealPrice` stays null and Velvet explicitly displays that the price is not given.
The official menu link is informational; no price is inferred or represented as free.

The guest chooses a date/time and then explicitly chooses the native Lunch offer.
Velvet displays its name, native description, count, price status and deposit
applicability before selection and in the final review. Native seating notice and
terms appear before a fresh consent checkbox. Menu and policy changes invalidate
the previous version. No provider login or Velvet account is required.

The journal stores the exact approved non-personal offer metadata in
`attempt.details.offer` before provider dispatch. SQLite recovery retains that
selection and the existing date/time/party duplicate barrier; changing session,
review or offer version cannot authorize another send. History preserves the
approved menu and unknown price through an explicit metadata allowlist.

The actual POST must contain exactly the selected offer ID/count. Its response
alone cannot confirm. The adapter independently reads only the UUID returned by
that same approved POST, with server-fixed restaurant 386643, and verifies saved
booking identity, status, date/time/party and exactly one `booking_offers` row
with matching `offer_id` and `count`. Saved supplier description or price fields
are not invented or required. Native metadata is used only through the existing
provider SDK; there is no token generation, header guessing or retry.

The public proof retains only the checked offer ID/count/version and
`offerEvidence=own_booking_readback`. Journal and UI also bind those fields to
the persisted approval. Missing or mismatching evidence stays unknown and
consumes the attempt. Existing room selections and FishCorner use their existing
contracts.

Local validation includes provider scenarios, SQLite restart/replay and metadata
mutation tests, the shared journal/runtime tests and native UI regression tests.
End-to-end supplier responses are local fixtures, not evidence of a real booking.

## Integrated release validation

Runtime candidate `aab1d6d524cd358fa642e6a0d4e78268a5ad7310` passed the actual
Velvet UI/API/provider/journal/register chain with local supplier transport:
De Kas 131 API calls, eight restarts, six mocked POSTs; FishCorner 42/two/two;
Pirouette 316/17/12. All real supplier writes and real UUID reads: zero.
Test handoff #210 (`2a2718a14acd96c82bc8633a5d65186146c028db`) adds the repeatable
`--dekas` harness. Screenshots at 390 and 1366 pixels were inspected.

The harness checks raw fill before offer selection and stale offer-version
rejection, exact SQLite menu metadata/version before transport, POST offer
ID/count, independent saved-offer proof, mismatching/missing saved offers,
changed metadata, altered POST offer, restart with rotated version, and exact
public history. Independent scoped review reported no concrete blockers;
source contract review did not itself make a live reservation.
