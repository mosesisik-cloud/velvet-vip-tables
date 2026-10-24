# FYN original-form destination correction

Refs #129. Evidence fragment for the canonical booking integrator and existing release owner; this branch does not edit shared registries or enable an adapter.

The registered FYN destination is a child calendar widget. Its Book Online handler sends `book_click` to its parent instead of opening the booking form. Used as a standalone external link, the observed click did not navigate. FYN's official booking page embeds the same key, `DjfvyT1k`, and references Dineplan's host script. That script opens `widget/v3/frame/` plus the key when handling the child's message.

For **curated-CPT-fyn only**, proposed registry values:

| Field | Current | Proposed |
| --- | --- | --- |
| url | https://account.dineplan.com/widget/v3/DjfvyT1k?source=direct | https://account.dineplan.com/widget/v3/frame/DjfvyT1k |
| venueKey | account.dineplan.com/widget/v3/DjfvyT1k | account.dineplan.com/widget/v3/frame/DjfvyT1k |

Keep source `https://www.fynrestaurant.com/make-a-booking`, integrationMode `external_link`, liveAvailabilitySupported `false`, completionTracking `unsupported`. The integrator should apply the appropriate existing verification label after reviewing the evidence and set checkedAt to the actual integration verification date. Do not pin a visit date in the destination URL.

The saved native observation on 22 October 2026 used 23 October, two guests. The complete FYN form displayed enabled lunch options 12:00, 12:30, 13:30 and 13:45; evening options were disabled and labelled Fully Booked. No slot was selected. This is a historical, query-specific form observation, not current availability, a held table, confirmed booking, or booking inside Velvet.

`data/evidence/fyn-native-form.json` preserves that observation. `node scripts/verify-fyn-link-source.mjs` checks the official key, script relationship, parent message handler and standalone form markup using four public GETs. It performs no slot query or booking action. The saved source check includes timestamps and SHA-256 hashes; it does not establish dynamic availability.

Remaining: integrator reviews/applies the two field changes, release owner tests the guest link and publishes. The complete in-Velvet booking adapter, final seating/payment/cancellation requirements and supplier confirmation remain unverified. No reservations, holds, payments or restaurant contact were created.
