# Wave 7: Americas, 15 restaurants

Reviewed against current registry plus prior wave2–5 decisions; no shared registry edits. Read-only official-site inspection and initial provider rendering only. No dates/times chosen, holds, reservations, messages or payments created. Every non-GET/HEAD browser request was blocked.

## Four reviewed additions

| Restaurant | System | Mode and evidence |
|---|---|---|
| Parador La Huella, José Ignacio/Punta del Este | Meitre | Native initial form verified. Official paradorlahuella.com links lahuella.meitre.com; provider identity confirms Los Cisnes, Faro de José Ignacio, Maldonado. Add this exact Meitre hostname to allowlist. |
| Gitano Tulum | SevenRooms | Native initial form verified; exact Boca Paila Road Km7.5 Tulum identity. Official group site distinguishes Tulum restaurant from Beach, NYC, Dubai and Casa Gitano hotel. Form currently titled Experiences; no available reservation claimed. |
| Joe's Stone Crab, Miami Beach | OpenTable | External only. Current official reservations page links restRef1021381. Tracking correlation removed, exact restaurant identifier preserved. No iframe/checkout test claim. |
| Rosetta, Mexico City | Tock | External only. Official Colima166 RomaNorte reservation page initializes Tock slug rosetta and renders a party/date/time widget. Provider title confirms Ciudad de México. Full Tock page did not load in iframe. |

Sources: [La Huella](https://paradorlahuella.com/), [Gitano](https://www.gitano.com/), [Joe's reservations](https://www.joesstonecrab.com/reservations/), [Rosetta reservations](https://rosetta.com.mx/reservaciones), [Rosetta Tock](https://www.exploretock.com/rosetta/).

## Important catalog corrections

- **LoKal Coconut Grove is closed.** [The owner](https://kushhospitality.com/lokal/) labels it “lokal, NOW CLOSED.” Its old lokalmiami.com URL now serves unrelated casino-ranking content. Suppress booking and the stale URL; do not map another Kush location as the same restaurant.
- **Kao Sushi & Grill's catalog URL is unsafe/stale.** The inspected kaosushigrill.com/location-contact/ page serves unrelated SLOT88 gambling content. Suppress that website link; operating status remains unknown.
- **Frenchie's Diner has an explicit phone-booking method.** [Current official reservations page](https://frenchiesdiner.net/reservations) says to call 305-442-4554. Exact address2618GalianoStreet, CoralGables. Stale catalog .com should become .net; no instant booking promise.
- **Fritz & Franz is walk-in only.** [Official site](https://bierhaus.cc/) explicitly says it no longer takes table reservations. Direct browser timed out, while the primary site's indexed content was readable. No invented provider mapping.
- **Mister O1:** [Official Coconut Grove page](https://www.mistero1.com/coconut-grove/) states no reservations, walk-ins only. Catalog lacks branch specificity; no branch booking mapping. Correct brand spelling/domain uses O1, not01.

## Remaining unresolved cases

| Restaurant | What remains unresolved |
|---|---|
| Hartwood Tulum | Official reserve link leads to empty `/reservation` page titled `reservation test`; no current booking provider verified. |
| Sipsip Rum Bar | ResortPass cabanas and SynXis hotel rooms are present, but neither proves restaurant table bookings. Private-event inquiry is separate. |
| Peacock Garden | Catalog domain TLS hostname mismatch. Possible closure in landlord-hosted press, not enough current direct operator evidence to mark permanently closed. |
| Sushi Garage Cocowalk | Catalog official site TLS hostname mismatch. Exact branch exists in official indexed content; no live booking destination verified. |
| Ludo's | Catalog domain DNS failure; no current exact official replacement verified. |
| Malakor Thai Isaan | Official CoralGables site and phone7865584862 verified, but no explicit reservation method/provider; general contact is not proof of phone booking. |

Artifacts: parent `work/discovery-wave7-registry.json` (4 entries), `discovery-wave7-decisions.json` (15 outcomes), source/followup/render/frame audit JSON and scripts. Native modes prove only initial provider forms; `liveAvailabilitySupported:false` and `completionTracking:unsupported` remain explicit. No integration/deployment performed here.
