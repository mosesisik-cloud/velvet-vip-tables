# Wave 9 European provider audit

15 catalog rows examined on 15 October 2026; current registry and previous decision artifacts excluded. All browser probes blocked non-GET/HEAD/OPTIONS requests. No dates/times selected, holds, reservations, contact submissions or payments made.

Four proposed provider entries in parent `work/discovery-wave9-registry.json`:

| Venue | Provider identity | Mode and evidence |
| --- | --- | --- |
| La Môme Plage | Zenchef `rid=355085` | Native initial form verified with exact venue name from https://www.lamomeplage.com/ |
| Le Monchu Méribel | Zenchef `rid=352039` | Native initial form verified from https://www.lemonchu-meribel.com/; catalog city Courchevel needs review because actual venue is Méribel |
| Alma Lisbon | SevenRooms `alma` | Official direct link at https://www.almalisboa.pt/; iframe failed to load in test, so external only |
| Gigi Ramatuelle | SevenRooms experiences `GigiSaint-Tropez` | Official link and exact Ramatuelle address verified; provider currently says no offers available, so external only and no bookable-time claim |

Initial form loading is not full booking verification; live availability and completion tracking remain false/unsupported.

Identity safeguards:

- La Môme Cannes `rid=355086` from the original catalog website is a different venue. The correct beach restaurant source gives `rid=355085`.
- NAMMOS Mykonos' original SevenRooms evidence actually points to NAMMOS Cannes. Mykonos' current official page offers an inquiry form/email; no cross-city mapping added.
- Sarkara's K2 source links CoverManager for Bottleneck and Altiplano, not Sarkara. Those sibling links were rejected; no closure inferred.
- CURA's observed OpenTable `355611` / experience `816226` is a special event on 17 October. It was not converted into a general booking URL without verification. Official source: https://www.fourseasons.com/lisbon/dining/restaurants/cura.html/ .
- Bagatelle Courchevel appears twice in the catalog. Both lead to the same official email reservation-request page; cookie-provider names do not establish a booking integration.

Other outcomes: Scorpios source exposes distinct restaurant/beach/event slugs, but restaurant widget navigation remains unverified; Mamzel exposes provider references without a verified current booking destination; Bella Mbriana's main group site confirms Marbella contact details but its Spanish subdomain fails; Mr Pizza identifies a Marbella phone contact; CasaCri/La Maison des Jumeaux says its venue is now dedicated to events and requires catalog review.

All 15 decisions: `work/discovery-wave9-decisions.json`. Evidence: `discovery-wave9-results.json`, `discovery-wave9-followup-results.json`, `discovery-wave9-frames.json`, official-page HTML and probe scripts with the same prefix. No shared code, catalog or registry changed. Two rendered native candidates plus two external official links do not mean four newly completed booking flows.
