# Remaining booking providers: reviewed coverage, 15 October 2026

Registry fragment is `../remaining-providers-registry.json` relative to the repository. It has 27 additional restaurant mappings: 11 original provider forms loaded successfully inside a real cross-origin iframe under the Velvet origin, and 16 external-link-only mappings. These are preparation artifacts, not deployed integrations.

Native iframe candidates:

| Provider | Restaurants |
| --- | --- |
| TableCheck | Sazón (Bali), Ciel Bleu (Amsterdam), SUAY Cherngtalay (Phuket), Sorn (Bangkok) |
| Zenchef | Café de la Paix (Paris), Au Caprice des Deux (Saint-Tropez) |
| ResDiary | Apéritif Restaurant, Mozaic Ubud (Bali) |
| Tableo | Las Dos Lunas (Ibiza) |
| Restoo | La Paloma Ibiza |
| Eat App | La Source (Paris) |

External-only links cover Resy (COTE Miami, Le Bernardin, Eleven Madison Park); Tock (Sushi by Scratch Miami, Oteque, Lasai, Quintonil, n/naka, Atomix); TheFork (Su Entu, Almaza, Lebanon Meza Lounge, Cocina Hermanos Torres, Da Tonino); OMAKASE (Narisawa); Zenchef (Salama). TheFork, Tock and OMAKASE returned bot/security challenges in read-only tests. No attempts were made to bypass these. Salama's embedded widget was collapsed and its full form was not verified. Resy may require its own provider account; Velvet must not promise account-free provider checkout.

Excluded ambiguous or incorrect mappings:

- Bottega il Buco Ibiza had Resy links to New York/Hamptons venues.
- Pirouette and Gigi Tavola were categorized under Monaco but the sourced venues are in Nice. Correct geography before activation.
- La Môme Plage linked La Môme Cannes, not independently verified as the beach venue.
- Sarkara links led to Le Bottleneck and L'Altiplano.
- La terraza linked Bosco de Lobos.
- Le 1947 source included Zenchef links to Alléno Paris, L'Abysse, Pavyllon and Pavyllon Lyon.
- Quandoo now returns its official closure notice. Sabio/Felek must not activate through Quandoo.
- Locavore's Chope link was for a dated 2025 event, not a general reservation.
- CoverManager loaded only partial forms while non-GET requests were blocked; full widget usability remains unverified. Do not call these ready based on the page title.

## Test limits

All probes allowed GET/HEAD/OPTIONS only. No hold, reservation, personal details, card data or payment was submitted. Native-form loading does not verify final checkout, card guarantee, payment authentication, guest-account policy or completed booking. Cross-origin iframes do not expose completion to Velvet; do not mark an opened iframe as a confirmed booking.

The reusable `api/providers/remaining-registry.mjs` resolver accepts only explicit reviewed registry entries on provider-specific host allowlists. Its output always states `liveAvailabilitySupported: false` and `completionTracking: unsupported`. City/date search must show these as external/provider checks, not confirmed free tables. A separate supported read-only availability adapter is required for live aggregated results.

## Evidence and destination coverage

Parent work directory contains `remaining-providers-probes.json` (54 top-level probes), `remaining-providers-embed-probes.json` (13 iframe probes), `remaining-providers-source-checks.json`, and reproducible probe scripts. The destination coverage file covers all 770 inventory records in 39 destinations. Unknown or unverified records are explicit; `handled_by_other_workstream` means provider references were seen and another workstream owns verification, not that a restaurant is working.


## Follow-up: aggregated live availability investigation

No new live availability adapter has been enabled. Two observed provider paths were investigated:

- Zenchef: the real form issued GET `https://bookings-middleware.zenchef.com/getAvailabilitiesSummary?restaurantId=352690&date_begin=2026-10-01&date_end=2026-10-31` (also restaurant `361007`). Response fields were date, bookable_from, bookable_to, isOpen and shifts. The observed requests did not include party size and did not establish bookable times for the requested party. These calendar summaries must not be displayed as available reservations or used to assert sold out. The widget additionally encountered an AWS WAF challenge. We did not bypass it.
- TableCheck: Ciel Bleu's actual form tried POST `/v2/booking/cart/init` (shop identifier, locale, session_ref), along with `/queue/api/okura-nl-cielbleu/heartbeat`, before its search could populate. Those operations were blocked in this read-only audit. No observed independent, validated read-only slot endpoint was established. Do not guess endpoints or treat the empty UI resulting from blocked requests as zero availability.

For these providers, aggregate search should return `unsupported` / “Kontrollera hos bokningstjänsten”, with their verified original booking link. An authentic supported adapter still requires a documented read-only API or a separately reviewed provider session flow. No fake adapter or tests against invented response schemas were added.
