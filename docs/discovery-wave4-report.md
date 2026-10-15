# Discovery wave 4 — 15 October 2026

Twenty previously unclassified restaurant records were checked against official websites and their booking routes. Eight reviewed mappings are in `work/discovery-wave4-registry.json`: five native initial forms and three external booking links. The remaining twelve have individual dispositions in `work/discovery-wave4-decisions.json`.

## Reviewed booking destinations

| Restaurant | Provider | Mode | Official evidence |
|---|---|---|---|
| Restaurang AG | Elyra | Native initial form | https://restaurangag.se/boka-bord |
| Farang | Elyra | Native initial form | https://farang.se/boka-bord |
| Hallwylska Restaurang | Elyra | Native initial form | https://hallwylskarestaurang.com/ |
| Septime | Zenchef | Native initial form | https://www.septime-charonne.fr/ |
| Amber, Hong Kong | SevenRooms | Native initial form | https://www.mandarinoriental.com/en/hong-kong/the-landmark/dine/amber |
| ARCA Tulum | OpenTable | External only | https://arcatulum.com/ |
| Bâoli Cannes | Restaurant website | External only | https://baolicannes.com/ |
| Franchino Ristorante | Prenota Web | External only | https://ristorantefranchino.com/prenota-un-tavolo/ |

Each native form was loaded in a real cross-origin iframe with its actual initial controls. All non-GET/HEAD traffic was blocked. No time was selected, no hold was requested, and no personal or card details were entered. This verifies initial rendering only, not a complete reservation or live inventory.

ARCA's actual Reserve Now button opened the exact OpenTable URL in the fragment; that provider page failed during the test. Bâoli's official reservation link is the custom `booking.baolicannes.com` host, which returned 403 in the browser. Franchino's own table-booking page links the restaurant-specific Prenota Web form; its restaurant name and initial booking fields were read, but native embedding was not tested. These three remain external links.

## Corrections and unavailable restaurants

- **Quay is permanently closed.** Its own website redirects to the operator's [farewell page](https://finkgroup.com.au/a-farewell-to-quay/), which states: “On 15 February 2026, Quay served its final guests and closed its doors on Sydney Harbour.” Set operating status accordingly; do not substitute bookings at its sister restaurants.
- **La Guérite Cannes is seasonally closed.** The [official Cannes page](https://www.restaurantlaguerite.com/cannes/) links the correctly named provider form, whose current notice says: “We are now closed for the 2026 season.” The URL is recorded in decisions, excluded from the active fragment.
- **Septime's catalogue URL was wrong.** `timenightclub.com` is not its restaurant website. The verified source is `septime-charonne.fr`, showing 80 rue de Charonne, Paris 11, and the matching Zenchef restaurant 356354.
- Hallwylska's currently loaded form offers Christmas dining from 20 November. Its website says ordinary dinner service is closed during weeks 41–43. Do not infer availability for ordinary dinner from a working initial form.
- Lucca's supplied website and request form identify **Lucca Bebek**, not Lucca by the Sea in Bodrum. That mapping was withheld.
- Pujol's official page surfaced two OpenTable IDs and two addresses. No arbitrary branch or experience was selected while provider identity could not be independently checked.
- Billionaire's former Porto Cervo page returned 404; the current global site did not establish an active Porto Cervo booking destination.
- Antichi Orti del Sole's WuBook route books overnight accommodation, not restaurant tables.
- Il Pirata's website returned 521. Bayshore Club's site showed an access challenge; it was not bypassed. These findings do not establish restaurant closure.
- Agriturismo Serafina has official contact details but no verified table-booking route from these checks. It remains unresolved rather than being labelled offline-only.

## Contact and manual confirmation

[Island Athens Riviera's reservations page](https://www.islandresortathensriviera.com/clubrestaurant/contact) explicitly provides phone, WhatsApp and reservations email. Those details are in decisions for an honest contact-booking path.

[Melchiò's restaurant page](https://www.melchio.it/ristorante/) supplies a reservation-request form and requires at least 24 hours' notice. The restaurant accepts a booking only after its staff sends a confirmation email. Treat submission as a request, never as an instantly confirmed table.

[Greenwood Fish Market's official reservation page](https://greenwoodfishmarket.com/reservations/) identifies the Quayside Isle contact methods. Groups of ten or more are instructed to arrange their deposit via WhatsApp. A direct online widget was not verified; this is not evidence that none exists.

## Integration notes

The fragment includes exact host/path identity keys and official sources. New external-only provider hosts are `booking.baolicannes.com` and `franchino.prenota-web.it`; any resolver addition should allow these exact hosts and reviewed paths only. No completion detection or live availability support is claimed by these records.

Evidence is retained in the `work/discovery-wave4-*` files: source audits, rendered pages, readonly button navigation, actual frame results, and final decisions. Shared registry, application code, catalogue and production were not modified by this discovery batch.
