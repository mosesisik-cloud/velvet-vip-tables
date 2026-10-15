# Discovery wave 2 — 15 October 2026

Reviewed 21 remaining candidate records across 16 destinations. Ten exact restaurant links are supplied in `work/discovery-wave2-registry.json`: three verified native SevenRooms forms and seven external links. Three CoverManager records overlap the other agent's work and must be deduplicated. Fasano was delegated and excluded. This batch does not establish availability or completion for all 770 restaurants.

## Verified additions

| Restaurant | Destination | Provider / mode | Official source |
|---|---|---|---|
| Spago Beverly Hills | Los Angeles | SevenRooms / native form | https://wolfgangpuck.com/restaurants/spago-beverly-hills/ |
| Zozoï | Marbella | SevenRooms / native form | https://zozoi.com/es/reserva-3/ |
| Silk Hvar | Hvar | SevenRooms / native form | https://silkizakaya.com/en/hvar |
| Casa Maca | Ibiza | CoverManager / external | https://www.casamaca.com/en/ |
| Don Alfonso 1890 | Amalfi Coast | CoverManager / external | https://www.donalfonso.com/en/hotel-with-restaurant-sorrento-coast |
| Skina | Marbella | CoverManager / external | https://www.restauranteskina.com/en/booking/ |
| Locavore NXT | Bali | Revasi / external | https://locavorenxt.com/ |
| Lasarte | Barcelona | TheFork / external | https://www.restaurantlasarte.com/es/reserva |
| Arbora | Singapore | OpenTable / external | https://mountfaberdining.com/pages/arbora |
| Providence | Los Angeles | OpenTable / external | https://providencela.com/reservations/ |

Spago's current restaurant website initializes SevenRooms venue `spagobh`, despite earlier OpenTable references. Locavore NXT currently links Revasi, replacing earlier Chope/SevenRooms evidence. Silk Hvar's location-specific page links a landing page whose reservation link is `silkhvar`; the Zagreb OpenTable footer was rejected. Lasarte's first widget is ordinary Lasarte reservations; its second widget belongs to the distinct prepaid Il Milione experience and was excluded.

## Tests and scope

Actual cross-origin SevenRooms frames loaded for Spago, Zozoï and Silk Hvar with matching names/addresses and guest/date/time controls. Every non-GET/HEAD request was blocked. No holds, bookings, personal details or payments were submitted. These tests establish initial form rendering, not completed checkout or current availability.

CoverManager iframe shells loaded, but full booking controls were not established under read-only interception; records remain external-only. Lasarte's TheFork frame was empty, Locavore's Revasi frame did not load, and OpenTable frames failed. Official destinations are verified, but no native-mode claim is made for them.

Evidence files: `work/discovery-wave2-source-audit.json`, `work/discovery-wave2-followup-sources.json`, `work/discovery-wave2-frame-results.json`, `work/discovery-wave2-silk-frame.json`, `work/discovery-wave2-additional-pages.json`. The per-restaurant disposition is in `work/discovery-wave2-results.json`.

## Unresolved or rejected

- Gaggan at Louis Vuitton: official restaurant link recovered, but its experience page explicitly reports not found. Excluded.
- The Meat Co.: official site has two Dubai branches; catalogue contains no branch address. No arbitrary branch chosen.
- La Terraza: candidate website now promotes Cohete. Generic catalogue identity insufficient to establish same restaurant.
- Capri's Ristorante: candidate was Il Riccio, a different restaurant.
- Le Goûter: candidate was a La Vache afternoon event, not the catalogue restaurant.
- Le 1947 and Chalet de Pierres: booking references belonged to other restaurants in site-wide navigation.
- Felek: Quandoo URL redirects to a country update page, not a restaurant booking form.
- No Signboard Seafood: archived page links an Esplanade branch; current branch identity/status unknown.
- Matsuhisa Aspen: current official copy instructs calling for reservations. Dormant widget script alone is insufficient proof.
- Fasano Punta del Este: official Meitre mapping verified, delegated to the other agent and omitted from this fragment to avoid duplicate work.

