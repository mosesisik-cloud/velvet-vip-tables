# Discovery wave 5: Asia-Pacific

20 unintegrated restaurant records were reviewed, excluding wave4's Amber, Quay and Greenwood Fish Market. Registry fragment in parent-work `discovery-wave5-registry.json` prepares five additions, not yet merged:

| Restaurant | Provider | Verified mode |
| --- | --- | --- |
| Billy Ho, Bali | SevenRooms | Native iframe, original guest/date/time form and address rendered |
| Odette, Singapore | SevenRooms | Native iframe, original guest/date/time form and National Gallery address rendered |
| Luma, Bali | TABLFY (on restaurant's own domain) | Native iframe, branded guest-count and date/time workflow rendered |
| Burnt Ends, Singapore | Restaurants.sg | Native iframe, correct restaurant and seating-section form rendered |
| Lulu Bistrot, Bali | ResDiary | External only; official hidden widget URL verified, iframe remained blank |

Integration notes: TABLFY URL is https://www.lumabali.com/book; allow only that reviewed host/path. Restaurants.sg URL uses `bkrestaurant=SG_SG_R_BurntEnds`; **add bkrestaurant to identity parameters before integrating** and test changed restaurant IDs are rejected. Provider remains native interface only; no aggregate availability or confirmation-reporting claim. SevenRooms URLs normalized by removing transient tracking query and final slash only, then actually tested.

Official Odette source is odetterestaurant.com, verified through primary restaurant page and National Gallery; search-candidate .pw/.icu sites were not used. Billy Ho source billyho.co directly links the correct SevenRooms venue. Burnt Ends group page links burntends.com.sg/reservation/; its exact iframe points to Restaurants.sg with the BurntEnds restaurant key, not its separate bar or other group venues.

Five tests loaded actual cross-origin frames under a locally fulfilled Velvet-origin parent. GET/HEAD/OPTIONS only; no form submission, hold, booking, personal details or payment. No security challenge bypass. All records retain liveAvailabilitySupported:false and completionTracking:unsupported.

20-row decision ledger `discovery-wave5-decisions.json` keeps unresolved/blocked/wrong-identity outcomes explicit. Morganfield's source links Suntec City but the catalog's generic Singapore identity does not prove that branch. Le Goûter candidate is an afternoon-tea product at multiple La Vache venues, not verified as the catalog restaurant. ZIN hotel-room booking links are excluded from table bookings. BAAN fast-food identity is not proven to equal the Wine and Spirits catalog entry. None of these are called operational integrations.

Urgent catalog findings sent to parent: Baraka's listed baraka-restaurant-phuket.com now serves Indonesian gambling/slot content; Ubuntu Eat's domain now shows an unrelated self-development community with Indian contact. Exact titles and screenshots are in `discovery-wave5-wrong-sites.json` and matching PNGs. No catalog changes made in this wave and no restaurant closure inferred. Plant Cartel certificate mismatch and Marché domain DNS failure remain unavailable, not closed.

Evidence files: parent-work discovery-wave5-results.json, script-links.json, frame-results.json, input.json, wrong-sites.json and reproducible probe scripts.
