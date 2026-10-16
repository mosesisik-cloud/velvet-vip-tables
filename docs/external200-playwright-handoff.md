# External200: backend Playwright handoff

Reviewed against main `7c0e45d` on 2026-10-16. This is the exact reserved manifest of 200 stable IDs in ten groups of 20. It is research and regression-test input for the canonical provider engines, **not a new engine, activation registry or finished in-app booking flow**. Prior work in PR40/47/121 remains intact.

Coordination is recorded in [issue129](https://github.com/mosesisik-cloud/velvet-vip-tables/issues/129). SevenRooms implementation belongs to worker8a16, Zenchef to1b4e, UI to692b, and shared routing/contract/journal to the booking integrator13e7. This branch changes only files prefixed `external200`; it does not compete with those implementations or enable any provider. The canonical pilot restaurants Strandvägen1 and Arpège are outside this manifest; their test results must not automatically qualify these 200 venues.

## Current status

| Mutually exclusive research category | Records |
|---|---:|
| Provider/form candidates requiring engine and venue validation | 18 |
| Explicit manual contact only | 11 |
| Identity or booking route unresolved | 166 |
| Walk-in, takeaway, official closure or reported closure | 5 |
| Total | 200 |

There are **zero verified backend-Playwright implementations, checkout tests or supplier-confirmed reservations for these IDs** in this handoff. No production activation was performed. These are separate from the historical 19 external links, 18 manual contacts (overlap allowed), four original-form observations and five availability observations. Musto's website composes a WhatsApp request, so it remains manual-only here rather than an engine candidate. Request forms are included among the 18 candidates but are not instant-confirmation routes.

## Candidate priorities and venue-specific constraints

SevenRooms covers eight stable IDs and seven physical venues. Start qualification with Shang Palace Dubai (`shangpalacedubai`), then Sella (`restaurantsella`), then Bagatelle (`bagatellestbarth`). The eight existing registry entries explicitly disable live availability and completion tracking; this handoff does not change that. Venue identity/source/URL, historical viewport tests and conditions are recorded in `data/external200-playwright-sevenrooms-evidence.json`.

- Bonito's curated and OSM IDs both identify `bonitostbarth`; preserve both, but do not count two physical venues. An initial page showed a prepaid offer. Price basis, selected-experience rules and checkout remain unverified.
- Le Café (`lecafesaintbarth`) and La Petite Plage (`lapetiteplagesaintbarth`) are request-only, with later operator response and card-guarantee requirements. They must never inherit instant-confirmed semantics from another SevenRooms venue.
- La Guérite uses Gustavia's `lagueritedb`. No offers on one tested date does not establish closure.
- Shellona is officially closed and excluded. Its historical slug must not be revived merely because a provider page still exists.

FishCorner is the sole Zenchef candidate: `osm-SBH-fishcorner`, restaurant ID `388090`, official source `https://www.fishcornerstbarth.com/en/book-online`, exact destination `https://bookings.zenchef.com/results?pid=1001&rid=388090`. Its original page and terms are research evidence; no hold or confirmation boundary is verified. The Arpège pilot's selectors, rules or outcomes cannot be assumed identical.

Other candidates include Eat App/Carluccio's Dubai Mall, Yerim Hazir/Yelken Balık, Rezervem/Neolokal and restaurant-owned request forms. Read the corresponding group record rather than assigning a common checkout contract. Pummarola requires both Coral Gables and Dine-In Reservation selections; its quarter-hour choices are static preferences, not inventory. Eddy's and Black Ginger request forms have anti-abuse constraints; do not bypass them or interpret form submission as confirmed seating. Raya keeps its explicit email fallback and separate original request form.

## Contract boundaries for implementation owners

Every candidate needs exact source-to-venue binding, isolated session ownership, current-revision consent, a durable attempt journal, and provider-specific outcome verification. Approval must cover date, party, experience, guest details and currently displayed conditions before any mutation, including an early hold. A booking reference alone may be a request or payment reference; confirmation needs a provider outcome associated with the same attempt. Unknown outcomes must reconcile rather than retry automatically.

The existing SevenRooms availability parser and its fixtures demonstrate parsing/gating only. The legacy `srBookSlot` code is HTTP-based and contains a claimed access-protection workaround; it is not the canonical Playwright implementation and must not be copied as a verified mutation contract. Official private API documentation requires provisioned access. No protected endpoints or safeguards were bypassed.

These readiness files are static, dated research. They must never be imported by guest runtime as permission to browse arbitrary URLs or submit bookings. Engine implementation, offline fixture tests, read-only live qualification, supplier confirmation and deployment need separate evidence before activation.

## Reproduce offline verification

```sh
node scripts/external200-build-playwright-handoff.mjs --check
node scripts/external200-test-playwright-readiness.mjs
node scripts/external200-validate.mjs
node scripts/external200-test-routes.mjs
```

The readiness test checks all 200 IDs against the original ten manifest groups and independent source/destination bindings. It exercises the existing backend policy gates for the scoped registry entries and rejects stale offers when live availability is disabled or the venue is request-only. All network calls are replaced with a failing spy. These are offline policy tests, not simulated guest checkouts or proof that Playwright can book.

No original form was submitted, no slot selected, no hold/payment/reservation created, and no restaurant contacted in this change. Next action belongs to the canonical provider owners: consume these exact venue bindings as qualification candidates, retain blockers, then submit separate runtime and test evidence to the integrator.
