# Next provider batch — 15 October 2026

Reviewed all 18 inventory candidates that referenced CoverManager, Guestplan, Meitre, Inline, Chope, NowBookIt or Elyra. Prepared 11 restaurant mappings in the parent work directory `next-wave-registry.json` (not deployed):

| Provider | Native original form verified in Velvet-origin iframe | External link only |
| --- | --- | --- |
| Meitre | La Susana, Oro, Fasano Punta del Este | — |
| Elyra | Hillenberg, Basta Stockholm | — |
| Guestplan | Angelica Capri | — |
| CoverManager | — | Lío Ibiza, Can Caus, Casa Maca, Don Alfonso 1890, Skina |

Iframe tests use the real booking website inside a locally fulfilled parent HTML page with the production Velvet origin. The production server is not modified. Meitre tests opened the guest-count screen from “Book a table”; no date/time or reservation was submitted. Elyra loaded the original experience selection. Guestplan uses shadow DOM, so its accessibility tree (not body.innerText) was checked: restaurant identity, guest/date/time selectors and the actual €25/person deposit policy were visible.

All network mutations were blocked except Guestplan's observed read-only `POST https://api.guestplan.com/api/v2/getAvailability`, restricted to account 51472, partySize 2 and the three observed keys accountId/date/partySize. No holds, bookings, personal details, card details or payments were submitted. Tests do not establish completed checkout, payment authentication or automatic booking reporting.

CoverManager's real forms issue POST `/reservation/ibox2/0` or `/Config/get_init_module/...` on initial load. Those unreviewed initialization calls were blocked, leaving partial UI. Official venue-specific links are preserved, but native iframe readiness is not claimed.

Excluded or unresolved:

- Sarkara's CoverManager references are Le Bottleneck/L'Altiplano, not Sarkara.
- La terraza's reference is Bosco de Lobos, not the listed restaurant.
- LeNu's Inline link opens the general Paradise Group location directory. No exact LeNu branch is verified.
- Both Chope candidates (Locavore NXT's old 2025 event and No Signboard's archived source) now redirect to generic Chope destination landing pages. No booking link activated.
- Lulu Bistrot's NowBookIt reference is only a shared iframe-resizer script; its actual booking form is ResDiary. Do not classify the script as a NowBookIt booking integration.
- RIJKS has a Guestplan script on its official reservation page, but no independently verified stand-alone venue URL was found. Keep its official page as website fallback, not a ready provider integration.

All 11 mappings set `liveAvailabilitySupported: false`, `completionTracking: unsupported`. These native embeds can show genuine provider availability to the visitor, but this audit does not establish an aggregated live availability API.

Evidence: parent-work `next-wave-probes.json` (18 website/provider probes), `next-wave-embed-probes.json` (6 iframe tests), their reproducible scripts and the registry fragment. Registry contains no personal information or secrets.
