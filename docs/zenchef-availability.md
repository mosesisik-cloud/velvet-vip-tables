# Zenchef catalogue availability

The generic catalogue search now has a read-only adapter for four original-catalogue restaurants: De Kas, Pirouette, FishCorner and La Pesquiere. Each is explicitly bound to its reviewed identity and existing Zenchef contract. Other Zenchef records remain unsupported.

Only two guests and the reviewed shift are covered. The adapter makes one GET to the fixed provider results URL with date/pax, rejects redirects, and validates server-rendered state using `zenchefAvailabilityEvidence`. It never loads scripts, opens forms, chooses rooms/offers, creates holds, or submits reservations. Results are filtered to the search window of +/-90 minutes. Room/offer choices are retained in the response; links go to the supplier results page for explicit selection. Payment/cancellation remain unknown at this stage. Empty results mean no candidates within this reviewed scope, not that the whole restaurant is full.

The UI labels the limited scope in Swedish, English, Spanish and French, including rows with no matching candidates. Existing link/embed verification and completion tracking fields are unchanged. Availability support is separate from live guest-booking configuration and from confirmed reservations.

Validation: `node scripts/test-zenchef-availability.mjs`, plus availability gates, progressive jobs and SevenRooms safety regressions. Tests use mocked GET responses and create no supplier state. A separate live check on 2026-10-20 for 2026-10-23/two guests returned validated responses for all four venues; this is a dated observation, not ongoing availability or confirmation.

Deployment must include the new adapter and `zenchef-search-bindings.json` with server/registry/UI changes. Keep other Zenchef support disabled until its specific contract is reviewed. Do not enable all Zenchef rows by provider name.
