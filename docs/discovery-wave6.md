# Wave 6: fifteen remaining European restaurants

Read-only audit on 15 October 2026, excluding current registry and wave 4/5 decisions. Thirteen Ibiza venues plus Altamirano and Stuzzikini in Marbella. Official-site browser probes blocked all non-read HTTP methods. No slots, holds, bookings, payment or contact forms were submitted.

**Zero new verified booking-engine integrations.** The empty registry fragment is intentional: inquiry/contact channels must not inflate working reservation coverage.

| Venue | Outcome |
| --- | --- |
| WOW Ibiza | Original website renders empty; unresolved |
| La Chickeria | Official site offers takeaway phone and delivery; no table engine observed |
| Olivia's Ibiza Kitchen | Original site unavailable; no closure inferred |
| Can'ta | Third-party inventory page is 404; exact official source unresolved |
| VIVO bistrot | Old domain fails; replacement esvivobistrot.com identifies Santa Gertrudis venue but booking destination remains unverified |
| Zeno Pizzeria | Original DNS fails; unresolved |
| Wild Beets | Official phone/email; no table engine observed |
| L'Atelier nº74 | Current site sells creative workshops, not verified table reservations |
| Overall | Official dinner links lead to custom contact inquiry form |
| Restaurante Santa Gertrudis | Official phone/email; no engine observed |
| Musset Cafe | Current mussetibiza.com verified by name/address; reservation buttons open email |
| Bottega il Buco | Parent site directs to current Stevie alla Bottega collaboration; current site exposes email/phone only |
| Can Pilot | Official phone/email; no engine observed |
| Altamirano | Official Marbella website has contact phone; no engine observed |
| Stuzzikini | Online inquiry form explicitly requires subsequent telephone confirmation |

Important false positive: the Resy links on https://ilbuco.com/pages/bottega point to New York/Hamptons siblings. They must not be assigned to Ibiza. That official page directs diners to https://www.stevieallabottega.com/ and identifies the collaboration; the current site's Santa Gertrudis address and description confirm the relationship. No booking-engine destination was present there.

Recovered contact source: https://mussetibiza.com/ identifies Es Musset at Carrer Venda de sa Picassa 2, Santa Gertrudis. Its reservation buttons use `mailto:m.santagertrudis@gmail.com`; they are not an instant-booking integration. Stuzzikini's https://stuzzikini.com/#post-95-title form says the restaurant will call to confirm, so the offered times are request preferences, not verified availability.

Artifact paths in parent workspace: `work/discovery-wave6-input.json`, `discovery-wave6-results.json`, `discovery-wave6-followup-results.json`, `discovery-wave6-actions.json`, `discovery-wave6-stevie.json`, and `discovery-wave6-decisions.json` preserve evidence and exact IDs. `work/discovery-wave6-registry.json` is empty. Contact-only findings describe what was observed, not proof that no off-site reservation service exists. No catalog, provider registry or shared application code was changed.
