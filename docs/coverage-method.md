# Booking coverage method

Run `node scripts/report-booking-coverage.mjs`. An optional first argument sets the JSON output path. Default: task `outputs/booking-coverage-audit.json`. The script reads local inputs and performs one read-only public registry GET and changes no runtime files or provider state.

Inputs: current `data/restaurants.json`, `data/booking-providers.json`, `api/bokabord-restaurants.json`; historical migration `work/catalog-duplicate-audit.json`; parent-work discovery waves2–11. For each wave, a decisions file takes precedence over its raw results file. Missing waves are explicitly listed; wave11 was missing at this snapshot. Raw results establish that investigation occurred, not a successful booking integration.

## Snapshot

770 rows /770 unique IDs. The WORKSPACE registry changed while this work was underway:104 generic entries plus22 Bokabord entries produce126 WORKSPACE integrated routes and644 remaining records. Published release176 was reported by the parent as101+22=123 routes. This report separately GETs the public generic registry and lists new/changed prepared rows. It does not independently verify the published Bokabord count, so live total remains null; never present workspace126 as published. Always read the generated counts rather than hardcoding647.

| Exclusive category | Count | Meaning |
| --- | ---: | --- |
| integrated_native |58| Current registry routes into an original embedded form; does not establish completed checkout. |
| integrated_external |46| Current registry routes to the original provider externally; not an in-Velvet automated booking. |
| integrated_bokabord |22| Current approved Bokabord registry; individual sessions may require external handoff. |
| manual_request |23| Observed contact/request route, not live inventory or instant confirmation. Generic contact availability does not guarantee reservations are accepted. |
| walkin |2| Explicit decision indicates walk-in only. |
| closed |2| Explicit permanent-closure catalog flag or latest decision. Seasonal closure alone stays unresolved. |
| unresolved |81| Audited but no current integration or supported disposition established. |
| unaudited |536| No evidence in these waves or current registry; not a claim that nobody ever reviewed it elsewhere. |

These categories sum to770. The644 remaining records are **not644 automatically buildable booking systems**. They include manual-contact restaurants, walk-ins, closures, incomplete identities, unavailable websites and records without evidence. Availability search support and completed payment/booking verification are independent of registry integration.

## Identity and precedence

- Every current catalog ID must be unique; every current registry ID must exist in the catalog. Assertions fail if either condition is violated.
- Exact current ID matches are used first. Historical ambiguous IDs map only through the saved migration's oldID plus exact normalized name (and city code where present). No historical ID is assigned to every replacement or first replacement. Unmatched/ambiguous evidence is retained in `unmappedEvidence`.
- Both old `osm-BKK-` website-bearing records map to different new IDs. This snapshot has zero unmapped records.
- Histories are preserved in full. Latest wave takes precedence over earlier waves for non-integrated dispositions. A decision within the same wave is later only by source-file order; `checkedAt` is reported but not treated as stronger than wave order because most records share dates.
- Explicit permanent closure takes precedence; an overlapping registry mapping becomes a conflict. Otherwise Bokabord takes precedence over generic registry, then explicit native/external mode, then known manual/walk-in decision statuses. All other audited statuses remain unresolved. Unknown future status names do not become success automatically.
- A verified-provider discovery decision alone is not integrated until it appears in the runtime registry.

## Duplicate real-world venues

770 unique record IDs do not prove770 distinct businesses. The report flags exact normalized same-city names, exact same-city website URLs and identical provider destinations as **review candidates**, not automatic merges. Shared group sites can represent different branches.

Current candidate: Kem-Kon and Kem-Kon Kaosan share the official website. Wave9 separately identifies the OSM Bagatelle Courchevel row as the same venue as its curated record; this appears in `duplicateVenueEvidence`. That evidence does not remove rows or inflate unique-business coverage. Earlier ID collisions between different Thai/Greek/Arabic/Chinese restaurants are not treated as duplicate businesses.

The script excludes dynamic `generatedAt` from any expectation of byte-identical repeat output; unchanged inputs otherwise produce the same classifications. Inputs reside partly in this task's work artifacts, so preserve the migration and decision files when reproducing elsewhere. Missing migration is a hard error; missing wave inputs are visible report limitations.
