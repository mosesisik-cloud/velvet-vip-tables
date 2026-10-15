# Wave 10: fifteen European restaurants

Read-only audit 15 October 2026. Prior decision waves and current registry excluded. No slots selected, holds, contact messages, reservations or payments submitted; all non-read HTTP methods blocked in browser probes.

Two proposed entries:

- **La Pesquière / Le Mazagran / Lou Revelen:** official reservation page https://www.lapesquiere.fr/contact-restaurant-a-saint-tropez-dans-le-var-83/ embeds Zenchef `rid=362908`. Velvet-origin iframe renders “LA PESQUIERE ET LE MAZAGRAN”, guest/date controls and the same reservation telephone. Native initial rendering verified only. Official site identifies the three neighboring spaces as one family restaurant. Provider advises calling for last-minute or over-ten-person bookings and may release tables after15minutes late.
- **Carnissage Poltu Quatu:** https://carnissage.com/it/poltu-quatu/ embeds OpenTable `rid=487287&restRef=487287`, alongside exact Sardinia address and contact. Iframe failed, so external only. Do not use generic navigation `restRef=453228`, a different location, or stale `okstaging.com` links. Source page title incorrectly says Milano, but its restaurant-specific section/address and embedded ID distinguish Poltu Quatu. OpenTable itself also lists Carnissage Poltu Quatu in Arzachena. No availability or checkout verified.

Remaining thirteen:

| Venue | Classification |
| --- | --- |
| Le Quai | Original path/root404; unresolved |
| L'Escale | Original domain replaced by unrelated Japanese rhubarb-jam promotion; public link should be removed pending replacement |
| Loro Charly | Catalog link is menu PDF on Google Drive |
| L'anfora | Domain parked at DonDominio |
| Terra Gourmet | Explicit request form requiring restaurant confirmation |
| ESPAIS VIDA | DNS failure |
| Can Nanclares | Redirects La Yaya Amelia by Nanclares; manual phone/WhatsApp/group inquiry, identity/name/location review needed |
| El Brot de l'All i Oli | Telephone reservation; Cornellà de Llobregat |
| Il Pescatore | Site timeout; unresolved |
| Hivaoa | Official instruction to reserve by phone |
| L'Approdo | Reservation buttons call phone; Baja Sardinia |
| Barracuda | Phone/contact only observed; Baja Sardinia |
| Il Guscio | Italian and English booking pages expressly request phone reservations |

No site failure was treated as evidence of restaurant closure. Manual request forms do not count as confirmed bookings or live inventory. Broader destination labels Barcelona/Porto Cervo should not be mistaken for physical municipalities.

Parent workspace artifacts: `work/discovery-wave10-registry.json`, `discovery-wave10-decisions.json` (15 rows), original/follow-up/second source results, `discovery-wave10-frames.json`, and corresponding `.mjs` probes. No shared app, registry or catalog changes.
