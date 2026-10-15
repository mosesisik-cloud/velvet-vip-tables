# Official place identities

The name headings in restaurant and venue cards, detail pages, venue booking pages and available-table results use verified original logos. Search, booking payloads and accessible names retain the catalogue name.

Coverage: see data/restaurant-brands.json and docs/restaurant-brand-review.json for the current restaurant count and per-place review status. The original 35 Stockholm restaurants and 8 venues remain included. Other places retain their readable names; the registry does not imply global logo verification. The review ledger explicitly separates unfinished web research from reviewed identity mismatches, unavailable sources and unusable artwork.

Each registry entry is keyed by stable catalogue ID and records the local original asset, official source page, original asset URL, verification date and suitable light/dark background. Inline SVG extraction is recorded where applicable. Do not substitute favicons, parent-company logos, photos, approximate fonts or recoloured logos. Verify the exact venue identity and inspect the asset visually at card size.

To add a place: save its verified asset under media/brands/, add the corresponding entry to data/restaurant-brands.json or data/venue-brands.json, and run node scripts/test-place-brand.mjs. The test checks catalogue IDs, local files, provenance, SVG references and fallback behavior. Review a real card and detail page on mobile before publication.

Both manifests are optional, fetched once with a three-second timeout. Missing/invalid entries retain text. Broken images reveal the complete name without clipping. Local assets avoid third-party requests solely to show a logo. Original artwork is rendered with contain and no colour filters.

New restaurant entries require identityEvidence linking the original artwork to the exact restaurant and locality. A familiar-looking logo or a catalogue website URL alone is not sufficient. Reject unrelated redirects, generic hotel/group/payment-platform branding and ambiguous branch matches. File size is capped at512KiB per logo; preserve artwork when optimizing.
