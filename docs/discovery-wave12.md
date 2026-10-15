# Wave 12: European provider audit

2026-10-15. Fifteen previously unreviewed inventory IDs, excluding registry and prior decision waves. GET/HEAD/OPTIONS only; no selected slots, holds, bookings or payment. Evidence in parent work/discovery-wave12-{results,followup,frames,decisions,registry}.json.

Three proposed additions: Pirouette Zenchef rid363313, Gigi Tavola Zenchef rid353615, Sushi Arson Delicity /sushi-arson. Official links and actual embedded initial forms show matching names. Zenchef native initial rendering verified; Delicity conservatively external pending journey testing. No full checkout or availability claim.

All three are actually in Nice despite catalog Monaco grouping: Pirouette 34 rue Bonaparte; Gigi Tavola 5 Quai des Deux Emmanuels; Sushi Arson 2 Place Arson. Preserve stable IDs, but do not use Monaco as exact municipality for availability filtering. Pirouette sibling Les Agitateurs rid356570 is explicitly excluded.

Le Bavastro has an official Delicity booking link but its form currently displays an error with phone fallback; excluded from functional registry. La Vigna offers a manual reservation request form. Chez Pipo explicitly welcomes walk-ins without reservations (group inquiry separate). Asia Food provides delivery and phone; Aradhana phone; Baia Blu reservation phone; Agora Riviera table phone and separate event request; Sumosan Courchevel exact location phone/email. None establishes real-time online availability.

Four unresolved: La Veranda and Le Cap sources return access denied; La Flara DNS fails; Chabrol TLS fails. These are not evidence of closure. Do not bypass protections or infer booking availability from failure.

Initial iframe tests used a local HTML response at the Velvet origin. This proves initial cross-origin rendering only, not deployed integration or complete guest checkout. No shared application/catalog files changed.
