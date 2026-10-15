# Catalog duplicate identifier audit

Repository audit: 2026-10-16. Implemented locally after review; not deployed by this agent.

## Exact counts

- 770 restaurant rows, 736 distinct placeIds.
- Five duplicate ID groups affect39 restaurant rows; there are34 excess collisions.
- `osm-DXB-`:2 rows; `osm-HKT-`:6; `osm-BKK-`:10; `osm-ATH-`:12; `osm-HKG-`:9.
- Bangkok's two website-bearing entries are only a subset of its ten collisions.

The generator `scripts/expand-restaurants-osm.mjs:18` removes every non-ASCII character from names. Line63 uses that empty slug as the placeId suffix. The source OSM element type/id and coordinates are discarded when writing rows, so original globally stable OSM identities cannot be reconstructed from this catalog alone.

## Concrete routing risk

`js/app.js:2441` uses `.find(item => item.placeId === placeId)` for detail pages. Every duplicated link therefore resolves to the first matching restaurant in its city rather than the selected row. The menu/detail lookup at approximately2791 has the same issue. Existing image visibility may hide some affected rows today; it does not fix identity.

Provider registrations are keyed by placeId. Adding one provider mapping for a duplicate key would attach that booking destination to all matching restaurants and can send users to the wrong venue. Do not map a shared ID or use last-write-wins to deduplicate the catalog. Discovery ledgers keyed only by ID can also silently skip or overwrite the other restaurants.

## Reference impact

Structured exact-key/value scanning of all `data/**/*.json` and top-level `api/*.json` found39 references, all in `data/restaurants.json`. Current booking provider registries, Bokabord registry and restaurant-menus have no exact references to these five ambiguous IDs. `rg` confirmed no additional exact quoted occurrences in source/test/docs at audit time.

Historical parent-work discovery results do contain shared IDs. They are evidence, not runtime data: retain history and link migration by city+exact name instead of blanket search/replace. This audit did not inspect production SQLite, operator stores, browser localStorage, user bookmarks or external links. A repository scan cannot prove that these contain no references.

## Deterministic rename proposal

`work/catalog-duplicate-audit.json` contains all39 individual renames, full names, city, original row index, source website, identity digest and exact reference paths. Reproduction: `python work/audit-catalog-duplicates.py`.

For each affected row, form `city + LF + NFC(name).trim()`, hash its UTF-8 bytes with SHA-256, and assign `osm-{city}-u{first12hex}`. The names retain their proper scripts; only IDs become stable ASCII. Rename **all39** affected rows so none inherits the ambiguous old ID. Proposed IDs are unique and do not overlap any existing ID. Once migrated, freeze the assigned ID; do not regenerate it when a displayed name changes.

Examples:

- Patonggo Cafe (`ปาท่องโก๋`): `osm-BKK-uca22dc274c49`.
- Tom Yum Goong Banglamphu (`ร้านต้มยำกุ้งบางลำพู`): `osm-BKK-u7179573ef178`.

Migration must match `{oldId, cityCode, exact name}` (and assert the audited row index/name still agree), not oldId alone. Do not automatically redirect `#/restaurant/osm-BKK-` to one replacement: it has ten possible targets. Present a city/restaurant chooser or an explicit ambiguous-link result. Stored bookings with only an old ID must not be silently reassigned; require additional recorded restaurant identity or leave unresolved.

For future OSM imports, preserve and use element type+numeric source ID, plus coordinates. Validate global uniqueness before writing. Preserve existing established IDs; do not churn all770 merely to adopt a new generator.

## Checks performed and implementation tests required

Audit script already asserts proposed39 IDs are distinct, none collides with existing736 IDs, and the resulting total remains770 rows/770 IDs.

Before production migration, add regression checks:

1. Catalog count unchanged; every row has a nonempty globally unique ID and no `osm-CITY-` empty suffix.
2. Permuting rows does not alter assigned proposed IDs; all non-ID fields remain byte-equivalent in parsed form.
3. Applying migration twice is idempotent; mismatched city/name or duplicate fingerprint aborts before write.
4. Every existing booking/menu mapping still points to exactly one original restaurant; no mapping copied to unrelated rows.
5. Each of the39 detail URLs resolves to its exact intended name; ambiguous old IDs never resolve automatically.
6. Imported Arabic, Thai, Greek and Chinese names cannot collide; future same-name branches retain distinct OSM source identities.
7. An input collision in booking registry/catalog validation fails closed rather than permitting first/last-match behavior.

Implementation complete locally: renamed39 duplicate-group rows plus one additional singleton empty-slug `osm-IST-` (40 ID changes total). Catalog now has770 rows and770 unique IDs, with no empty OSM slugs. No live reservations were changed.

`work/catalog-duplicate-audit.json` preserves the original audit and all40 old/new mappings. Do not rerun the original audit generator over this evidence file after migration if retaining the pre-migration snapshot. `scripts/restaurant-identity.mjs` is the pure generator identity/validation helper; `scripts/expand-restaurants-osm.mjs` now retains OSM type/id/coordinates, assigns source-based IDs for new records, and validates uniqueness before writing. Existing root catalog edits were retained.

Passed `node scripts/test-restaurant-identity.mjs`:770/770, provider/Bokabord/menu referential integrity, Unicode fallback identity, source type distinction, deterministic names independent of ordering, normalization, duplicate rejection and distinct Bangkok routing. Passed `node scripts/test-booking-providers.mjs`:100 provider mappings and destination guards. Generator syntax check passed; no Overpass query was executed. No ambiguous old-ID redirects or runtime aliases were added.
