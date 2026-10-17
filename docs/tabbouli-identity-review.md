# Tabbouli: branch identity unresolved; not a Bokabord handoff

Checked 2026-10-17 against catalog commit `a694308a5dcc611c5eae70598de337ebf2fac525` and the public [official homepage](https://tabbouli.eu/). Scope is only `curated-STO-tabbouli`.

The catalog names Tabbouli, address `Stockholm, Sweden`, website and bookingUrl `https://tabbouli.eu/`. Its Maps URL is a generic name/city search. Neither the catalog nor its original entry in `scripts/add-stockholm-restaurants.mjs` identifies a street address or branch. The historical missing provider mapping is not evidence that booking is unavailable.

The current official homepage identifies these separate venues and booking links:

| Branch | Address | Official homepage booking target |
| --- | --- | --- |
| Tavastgatan – Söder | Tavastgatan 22 | `https://module.lafourchette.com/sv_SE/module/623625-84768` |
| Skånegatan – Söder | Skånegatan 51 | `https://widget.thefork.com/ac159cf6-80cf-4648-8ef5-897d9ffeb054` |
| City | Regeringsgatan 70 | `https://module.lafourchette.com/sv_SE/module/623621-3e443` |
| Djurgården | Sirishovsvägen 3 | No booking link in this homepage branch block; marked summer-only |

These are link targets read from official HTML, not verified provider responses or successful reservations. No provider widget was opened. Absence of a homepage booking link for Djurgården does not establish that no other booking route exists.

Saved homepage HTML (UTF-8 serialization) SHA256: `ce465f1d66e50eda1516e09c70a701c2599ef810eaac88b75ebc9dd0c62518be`. The captured source is local scratch, not a new production asset. Branch/address/link ordering was checked in the saved source and against the rendered text returned by the public page reader.

## Decision for integration owner32d5

Stop this candidate. Exact branch identity is unresolved, and the three visible booking routes use TheFork/LaFourchette domains rather than the scoped Bokabord/WaiterAid chain. There is no supported Bokabord venue hash, ordinary meal ID, payment requirement contract or receipt policy to hand off for this catalog ID. Do not assign one branch arbitrarily, reuse another venue's policy, or activate a generic provider mapping.

Reconsideration requires an explicit catalog branch/address decision and evidence of that branch's official supported provider contract. A TheFork implementation would be separate scope; none is started here. No shared files, adapter, booking engine, catalog mapping or production activation changed. No holds, contacts, authentication codes, reservations or payments were submitted. Ekstedt remains parked. No further probes or broad inventory were performed after this blocker was established.

Validation: reviewed the latest catalog entry and original catalog-creation row; extracted the three booking targets from official homepage HTML; `git diff --check`. Documentation-only change, so no synthetic booking tests were added.
