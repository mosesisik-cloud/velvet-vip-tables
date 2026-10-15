# Wave 9 Zenchef read-only journey check

15 October 2026. Original live Zenchef forms, desktop browser, all non-GET/HEAD/OPTIONS requests blocked. No time slot, hold, reservation, contact or payment submission. Earlier embedded identity/render checks are recorded separately in `discovery-wave9-frames.json`.

| Venue | Party/calendar | Availability observation | Limit |
| --- | --- | --- | --- |
| La Môme Plage, rid355085 | PASS: party2→3; date calendar and next month; 8 November selected | Real BRUNCH time buttons displayed:12:00,12:15,12:30,12:45,13:00,15:00,15:15,15:30,15:45,16:30 | No time selected; no checkout/confirmation verified |
| Le Monchu Méribel, rid352039 | PASS: party2→3; calendar opens and navigates to December | October21 attempt showed Fermé. December12 attempt did not produce a selected date/time list; availability remains unverified | Do not label globally sold out or booking broken from this result |

Both provider pages loaded live restaurant information and GET `getAvailabilitiesSummary` returned200. Blanket write blocking also blocked AWS WAF verification/report POSTs and feature metrics. No challenge was bypassed; these restrictions limit production conclusions. Initial calendar-button clicks collapsed the automatically expanded date section; using its actual “Autre” control correctly opened the date grid. That first automation behavior was not a product defect.

La Môme's time buttons are live displayed availability, not a guaranteed reservation. The October test's “Passé” tooltip was not treated as a real past-date rule for all dates. No provider adapter or shared registry was changed.

## Le Monchu location correction

The restaurant's official contact page https://www.lemonchu-meribel.com/contact/ and legal page https://www.lemonchu-meribel.com/mentions-legales/ give **Piste des Rhodos,73550 Méribel**, telephone+33(0)479224609. Contact instructions place it at the Rhodos/Marmotte piste intersection, reached via Rhodos or Saulire Express lifts.

Official Méribel tourism's listing for the Monchu premises at https://www.meribel.net/apidae/le-food-truck-perche-du-monchu-meribel/ gives **73550 Les Allues** and Méribel Centre. The restaurant's own home page announces the season5December2026–16April2027; this supports the October closure observation but is not a reservation-availability guarantee.

Recommended catalog fields: display city/resort **Méribel**, municipality **Les Allues**, address **Piste des Rhodos**, postcode73550, countryFrance. Keep the existing stable restaurant ID to preserve links. Do not show this venue as physically in Courchevel in literal city availability results. A broader “3 Vallées” destination association may remain only if clearly distinguished from municipality/city. Coordinates were not independently reverified in this task.

Evidence in parent workspace: `work/discovery-wave9-journey-{party,date,network,after-party,calendar,selected-date,season-date,times}.json` and matching `.mjs` scripts. Most useful final artifact: `discovery-wave9-journey-times.json`. No shared application/catalog edits.
