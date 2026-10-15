# SevenRooms language integration — verified 15 October 2026

**Use the provider's actual `lang` query parameter. It is supported by both current modern and legacy reservation forms, but a venue must enable the requested language. Adding `lang=sv` does not guarantee Swedish content.**

## Actual browser results

Clean isolated browser contexts; all writes blocked, no booking selected. Modern forms redirect from `/reservations/{venue}` to `/explore/{venue}/reservations/create/search` while preserving `lang`.

| Venue | Form | Actual language result |
|---|---|---|
| Strandvägen 1 | Modern | `en`: Guests, Date, Time, All Times; `sv`: Gäster, Datum, Tid, Alla tider, Logga In |
| Florentine Stockholm | Modern | `en`: English booking instructions; `sv`: Swedish labels and restaurant instructions, including Boka bord för 2–16 gäster |
| Strandbryggan | Modern | `sv` changes native interface labels; a restaurant-authored age/dress-code paragraph remains English |
| Villa Valentina | Modern | `sv` changes labels and restaurant booking instructions |
| Amber Hong Kong | Modern | `en` and `sv` both render English; venue exposes only enabled English |
| Brasserie Astoria | Legacy | `en` and `sv` both render English; the `sv` request reaches provider API but its response selects English |
| Il Riccio | Legacy | `en`: Date, Guests, Time, Search; `it`: Data, Ospiti, Orario, Cerca; language picker changes English→Italiano |

For Astoria, the observed provider request contains `guest_preferred_lang=sv`; response `venue_info.selected_language` is `en`, and `venue_languages_json` contains English only. This proves provider fallback, rather than a Velvet URL bug.

## Source-backed configuration

Current public frontend, observed loaded from the browser:
https://www.sevenrooms.com/static2/reservations/index-Dl0eB3PF.js

Its `Rt` language hook reads `lang` from the reservation query. The `yv` selection helper normalizes the locale, honors a query locale only when matching an enabled entry in `venueLanguages`, otherwise consults stored preference and then venue default, falling back to English. Its language picker updates the same query field. Current public locale list in `vendor4-TmmK2iGu.js` includes both `sv` and `en`; it is not evidence that every venue enables them. Never manipulate provider storage to force a disabled venue locale.

Observed configuration read: `/api-yoa/dining/widget_info?venue_url_key={venue}` exposes `data.base_venue.venue_languages`. Verified enabled settings:

- Strandvägen 1, Florentine, Strandbryggan, Villa Valentina: English + Swedish (Swedish default).
- Amber and Brasserie Astoria: English only.
- Nobu Marbella: English + Spanish.
- Zozoï: English + Spanish + French.
- Il Riccio: English + Italian.
- Les Amis: English + Simplified Chinese.

SevenRooms' [official onboarding guidance](https://sevenrooms.com/newcustomer/marketing/) explicitly makes additional guest-facing languages a venue configuration step. The older [official multi-language announcement](https://sevenrooms.com/blog/sevenrooms-multi-language-support-direct-reservations/) describes a widget language dropdown and translated guest communications; its historical list is not a complete current locale list.

## Integration recommendation

Pass Velvet's normalized selected language via `lang` for SevenRooms only, preserving exact venue identity and other accepted booking selection parameters. Include this parameter in the provider-specific URL guard. New iframe/open-tab URLs must use the latest Velvet selection. Reinitializing an already-started provider flow on language change can discard user state; expose a deliberate restart when needed.

Keep Velvet interface language consistent independently. When the venue cannot supply the selected language, state its actual supported language clearly. Do not claim full Swedish booking or translated cancellation terms based on Swedish buttons alone: restaurant-authored policy text may remain English, as Strandbryggan demonstrates. Cancellation/payment wording must come from the provider's chosen offer, with no automatic invented translation.

Evidence scripts and JSON are parent `work/e2e-sevenrooms-language*`. Actual initial-page language changes are verified; checkout/confirmation email language has not been tested because no reservation was made.
