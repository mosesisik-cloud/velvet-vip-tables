# Wave 11: Cape Town booking audit

15 previously unintegrated catalog IDs reviewed on 2026-10-15. Registry and all existing discovery-wave JSON IDs were excluded before selection. This regional batch reached remaining Cape Town entries; no unresolved Americas entries remained in the filtered set.

## Integration candidates

- Hussar Grill Rondebosch: exact official location at https://hussargrill.co.za/locations/rondebosch opens Dineplan https://account.dineplan.com/widget/v3/frame/1nWHwN9S. Its initial frame returned **403 Forbidden**. External official-link-only candidate; not verified embedded, available or bookable end-to-end.
- Thaiyashi Newlands: https://www.thaiyashi.co.za has two explicit Reserve a table links for FoodBooking restaurant UID `9aa12320-c8cb-4ff7-8d68-61e727ef13a4` with `reservation=true`. Exact address: Dean Street Arcade, corner Dean/Main, Newlands. Provider page blank with non-GET requests blocked. External official-link-only; no native integration claim. The FoodBooking provider family requires a separately reviewed resolver allowlist (exact host, path, UID and reservation=true), not a broad arbitrary external URL allowance.

## Verified offline or catalog issues

- Culture Newlands says **No reservations – walk-ins welcome**. Its Quicket event and membership payments must not be mistaken for table reservations.
- Barristers: explicit phone/email table bookings, +27 21 671 7907 / info@barristersgrill.co.za. No deck bookings after 12:30. Source https://www.barristersgrill.co.za/.
- Kirstenbosch Tea Room is Fynkos, confirmed by garden operator SANBI. Contact +27 21 797 4883 / info@fynkos.co.za. Fynkos party rules differ from ordinary dining; online shop is picnic ordering, not live table inventory. Sources https://www.sanbi.org/gardens/kirstenboch/venues/restaurants/ and https://fynkos.co.za/.
- TEN67 and Table Mountain Cafe are likely duplicate catalog entries: operator annual report expressly identifies the renamed restaurant. Review dedupe of `osm-CPT-table-mountain-cafe` into `osm-CPT-ten-67`; do not falsely mark restaurant closed. Source https://cms.tablemountain.net/uploads/documents/TMACC-Annual-Report-2022-2023.pdf. Current quick-service description: https://www.tablemountain.net/our-blog/ten67-eatery.
- Newlands Cafe hotel page: Book Now is hotel room search, not table reservations. Haru publishes contacts but no explicit booking policy.
- Sushi Box, RocoMamas, Tigers Milk, Holy Macaroni: multiple branches, city-only catalog address. Cannot safely select a provider venue. Food ordering, catering or gift-card links are not table booking.
- Monks Newlands candidate website is unpublished hosting content; don't select a different city branch. The Poke Bar primary identity remains unresolved; The Poke Co is not assumed equivalent.

## Evidence and limits

Parent-work files: `discovery-wave11-decisions.json` (all15), `discovery-wave11-registry.json` (2external candidates), `discovery-wave11-pages.json` (12 rendered official/candidate pages), `discovery-wave11-forms.json` (initial provider frames). Scripts `discovery-wave11-read.mjs`, `discovery-wave11-forms.mjs` use GET/HEAD only and block other methods. Only official Book online opening was clicked; no dates, slots, holds, contact submission, bookings or payments. A blank form under this guard is inconclusive, not provider unavailability.

No shared catalog/registry/app changes. None of these candidates was tested through live Velvet release176. Live availability and completion tracking remain unsupported for both proposed external records.
