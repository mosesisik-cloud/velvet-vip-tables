# Discovery wave 8 — Asia-Pacific

12 remaining records with websites were audited after excluding the current registry and wave4/5 decisions. This differs from the requested estimate of15: the current source catalog has12 matching records, including two distinct Bangkok restaurants sharing `osm-BKK-`. No registry entries were added merely to meet a count.

`../discovery-wave8-registry.json` is intentionally empty: none of these records yielded a new, verified restaurant-specific operational table-booking form in this bounded pass. `../discovery-wave8-decisions.json` records all12 individually.

| Restaurant | Finding |
| --- | --- |
| Kem-Kon Kaosan | Official cafe homepage loaded; no booking endpoint observed. |
| Patonggo Cafe | Official homepage loaded; no booking endpoint; duplicate catalog ID. |
| Tom Yum Goong Banglamphu | Catalog website is a food-review article, not restaurant booking; same duplicate ID. |
| Ganic Kitchen | Instagram-only source; no verified booking. Third-party closure claims are not treated as fact. |
| The Bench, Canggu | Official site links catalog Instagram and BOOK NOW to https://wa.me/6281237930213. Manual WhatsApp request only. |
| Jia Xiang Sarawak Kolo Mee | Listed take.sg redirects to Take App food-ordering page; table reservation not established. |
| Toss & Turn Vivo City | Listed official site404; unresolved. |
| LeNu | Official page links group Inline reservation portal; exact branch missing from catalog, cannot safely map. |
| Sabio by the Sea | Listed official page404; three Quandoo widgets in shared site footer all show official service-closure notice. |
| DEN, Tokyo | Official policy requires direct telephone reservations and rejects online/third-party booking. |
| Caprice | Official page says OpenTable under maintenance and requests direct telephone reservation; direct browser403. |
| The Chairman | Direct official site403. Search-accessible official pages confirm restaurant identity but expose no exact booking endpoint. Do not use lookalike domains. |

## Primary sources

- [DEN reservation policy](https://www.jimbochoden.com/en/reserve/): phone +81-3-6455-5433, booking window two months; no online or intermediary reservations. Preserve this as a direct-contact destination.
- [Caprice official restaurant page](https://www.fourseasons.com/hongkong/dining/restaurants/caprice/): system maintenance message, direct restaurant number +85231968882.
- [The Bench official Book Now](https://thebenchcanggu.com/whats-on): exact WhatsApp link was extracted from source; no message sent.
- [LeNu official page](https://www.paradisegp.com/lenu/) links https://inline.app/paradise-group-online-booking; generic group portal is not proof of a LeNu branch mapping.
- [The Chairman official notice](https://www.thechairmangroup.com/importantannouncement) distinguishes its own domain from impersonators. No impersonator domain was opened or integrated.
- [Observed Quandoo widget](https://widget.quandoo.sg/widget/reservation/merchant/hxH6U?aid=2&countryId=SGP) renders the provider closure notice. Other shared-footer merchant IDs h8heq and ilqY8 produce the same notice. These IDs were not identified as Sabio and must not be guessed as such.

Evidence: parent-work `discovery-wave8-input.json`, `source-audit.json`, `rendered.json`, `sabio.json`, `bench.html`, plus reproduction scripts. Browser sessions blocked all non-GET/HEAD traffic. No reservations, holds, forms submitted, messages or payments. Ordinary403 responses were recorded; no access-control workaround attempted. No shared production files modified.
