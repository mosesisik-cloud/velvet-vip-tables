# OpenTable coverage and adapter — 15 October 2026

The inventory contained 17 OpenTable references. Eight exact restaurant links were rechecked on the restaurant's own website and are available as **external handoffs**, not embedded booking forms or live slot results.

| Destination | Ready as external links | Other references and outcome |
|---|---|---|
| Miami | MILA Miami; Mayfair Grill; La Cabrera – Coconut Grove | Coconut Grove is restaurant 1377148, not the chain's Sunny Isles restaurant 1264252. |
| Sydney | Saint Peter | Uses restaurant 60911. Special-event links were excluded. |
| London | CORE by Clare Smyth; The Ledbury | Exact restaurant links from their own websites. |
| Aspen | Cache Cache; Bosq | Matsuhisa Aspen has official widget restaurant 6946, but no reviewed direct consumer destination yet. |
| Monaco | None | La Veranda reference is a Four Seasons Cap-Ferrat page and special experiences; geography and experience scope require review. |
| Lisbon | None | CURA source returned 403; inventory contains a special-experience link, not a general reservation link. |
| Dubai | None added | COYA OpenTable links are commented-out awards; retain working SevenRooms integration. |
| Hvar | None | Silk link actually names Zagreb. Rejected as wrong city. |
| Singapore | None | Arbora candidate is an OpenTable page rather than restaurant source; source timed out. |
| Los Angeles | None | Providence restaurant source returned 403. Spago's link was found on tourism-site Discover Los Angeles; restaurant-source identity remains to verify. |
| Courchevel | None | Le 1947 page's OpenTable links belong to Pavyllon London and Le Bar Antoine in global navigation. Rejected. |

## Implementation

`api/providers/opentable-restaurants.json` contains the eight reviewed entries, with exact source URL, city, check date, external mode and no completion tracking.

`api/providers/opentable.mjs` exports:

- `resolveOpenTable(placeId)`: reviewed exact-match destination, or null.
- `listOpenTableRestaurants({ city })`: reviewed mappings only.
- `searchOpenTableAvailability({ placeId, date, time, party })`: validated input and an explicitly **unknown** availability result plus the reviewed handoff link. `slots` is empty, `checkedAt` is null, and `prefilled` is false. An empty array must not be displayed as “fully booked.” This interface is ready to replace with a supported live availability adapter later.

Suggested UI: “Kontrollera tider hos OpenTable” opens the returned URL with `target=_blank` and `rel=noopener noreferrer`. Keep these restaurants outside verified-available search results. The guest chooses date/time/party on the provider page; do not pretend the search values are applied there.

Opening a link can record a started booking flow. It cannot record a confirmed booking. No iframe postMessage or click is accepted as provider confirmation.

## Verification and limits

Source audit: `work/opentable-source-audit.json`. Direct Playwright navigations to 13 candidate provider destinations all initially failed with `ERR_HTTP2_PROTOCOL_ERROR`. An HTTP/1 fallback also timed out on the first page. These are connectivity failures, not evidence of restaurant availability, iframe support or completed bookings. The official OpenTable widget-loader endpoint for Matsuhisa returned HTTP 200 via a read-only request, but that alone does not prove the booking form works.

Read-only test contexts abort non-GET/HEAD requests. No hold, booking, payment, card detail, or personal detail was sent. No third-party anti-bot/security bypass is implemented. All registry entries deliberately retain `mode: external`; no cross-origin embed support is claimed.

Run `node --test api/providers/opentable.test.mjs`: two tests passed, covering mapping identity, dangerous/unknown IDs, invalid search values and truthful unknown availability semantics. Live final booking and checkout have not been tested.

Eight mappings cover four destinations. This does not establish support for every restaurant in those destinations, or every destination in Velvet.
