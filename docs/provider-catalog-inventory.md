# Provider catalog inventory

Pinned GitHub main: `7c0e45dc34dc997ffcdc6a73f05294ecec264972`. Generated 2026-10-16T00:39:10.221Z. Machine-readable companion: [provider-catalog-inventory.json](../data/provider-catalog-inventory.json).

All **770 catalog placeId values** are represented exactly once. This measures catalog coverage, not 770 independently verified booking systems or physical restaurants. Main contains **136 generic mappings** and **22 separate Bokabord mappings**, with no overlapping IDs. The external200 cohort contributes exactly **200 rows**, not 200 additional restaurants.

## What is known on pinned main

| Knowledge | Catalog rows |
|---|---:|
| main_registry | 158 |
| not_researched_in_main_inputs | 416 |
| researched_system | 9 |
| researched_unknown | 187 |

| Normalized system family | Catalog rows |
|---|---:|
| Bokabord / WaiterAid | 22 |
| Contact Form 7 | 1 |
| CoverManager | 8 |
| Delicity | 1 |
| Dineplan | 4 |
| Eat App | 2 |
| Elyra | 5 |
| GloriaFood | 1 |
| Guestplan | 1 |
| JoinOko | 1 |
| Meitre | 4 |
| OMAKASE | 1 |
| OpenTable | 13 |
| Prenota Web | 1 |
| ResDiary / Dish Cult | 3 |
| Restaurant-operated route | 6 |
| Restoo | 1 |
| Resy | 3 |
| Revasi | 1 |
| Rezervem | 1 |
| SevenRooms | 51 |
| TABLFY | 1 |
| TableCheck | 5 |
| Tableo | 1 |
| TheFork | 6 |
| Tock | 7 |
| Typeform | 1 |
| Yerim Hazir | 1 |
| Zenchef | 13 |
| i-host | 1 |
| unknown | 603 |

| Route type | Catalog rows |
|---|---:|
| browser_mirror | 22 |
| closed | 3 |
| embedded_form | 64 |
| external | 73 |
| manual | 13 |
| request | 8 |
| takeaway | 1 |
| unknown | 585 |
| walk_in | 1 |

## Interpretation and provenance

The original provider label is retained. Direct restaurant routes, manual contact, request forms and unresolved identities are not promoted to instant booking. An embedded form is not a backend Playwright adapter. Missing registry membership is separate from researched-but-unknown and from no booking research found in these inputs. Catalog websites alone do not establish booking routes. Last verification is the mapping date only; last research is separate and does not imply live verification today.

Each row carries stable placeId, catalog name/city, system family, original label, explicit venue ID when present, route, sources and evidence paths. The JSON includes pinned input file hashes and per-PR head SHAs. 224 rows have open-PR evidence; these proposals remain separate and never replace accepted main facts. PR142 group files overlap the existing external200 cohort and are attached to the same rows. Older PR snapshots of the generic registry contribute only differences from pinned main.

3 rows have explicit or shared-venue-ID alias candidates. These are review flags, not permission to delete or merge physical restaurants. A shared provider identifier can also indicate a group widget. Counts remain per catalog placeId.

## Playwright and completion gaps

Pinned main has Bokabord mirror and availability implementation for its configured cohort. Supplier-confirmed end-to-end booking is not established by this inventory for any row. Other provider mappings describe external or embedded routes; they do not prove backend automation. Separate integration work in PR147 and provider proposals (Zenchef132, SevenRooms144, Tock134, TheFork130) must be evaluated against their own exact commits and venue coverage. New confirmation policy PR155 and recovery PR153 are subsequent integration candidates; neither is represented as deployed or complete here.

There are 611 rows without an explicit main venue identifier and 512 without a booking-evidence official source. These are evidence gaps, not necessarily missing capabilities: manual routes have no supplier venue ID. Prioritize unresolved identity before provider discovery, then exact venue binding, supported automation, supplier response verification, recovery and full guest-journey testing. Request/manual/walk-in/closed routes need accurate guest messaging rather than an invented checkout.

## Limits and validation

This is existing-evidence reconciliation, not a new web audit. Open PR JSON evidence with catalog IDs is indexed; Markdown-only evidence requires a follow-up review and is not silently accepted. Catalog-only changes in NAMMOS PR128 and Mamzel PR124 are indexed as proposals without inventing provider facts. This prevents claiming the open-PR scan is exhaustive. Brand/logo evidence is excluded from booking research.

Validated: 770 unique rows equal the pinned catalog ID set; 136 generic and 22 Bokabord mappings all refer to catalog rows; no registry overlap; exactly 200 unique external200 rows; all count tables sum to 770; all alias targets exist. No canonical registry, restaurant data, runtime, supplier state or booking was changed.
