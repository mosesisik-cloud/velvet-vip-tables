# SevenRooms integration — release 169

27 restaurant mappings were checked against their source website and loaded inside a cross-origin iframe on 2026-10-15. The allowlisted mappings and source URLs are in `data/booking-providers.json`. This is the actual SevenRooms form, not a reconstructed interface or a new server-side Playwright mirror. The provider controls availability, consent, payment and confirmation. No Velvet login is required. Provider account features, if shown, belong to SevenRooms.

The official embedding approach is documented at https://go.sevenrooms.com/rs/519-YNM-008/images/Sevenrooms_Direct_Reservations_Playbook_Clients.pdf . We verified current iframe loading rather than relying only on that older document.

## Scope and validation

- All 27 registered provider forms loaded in a real browser, with title/restaurant matching. Current availability is not guaranteed. Yuki Canggu explicitly reports a temporary closure; seasonal venues and sold-out dates remain visible as the provider reports them.
- All 27 Velvet restaurant routes passed the mobile browser test. Missing verified photographs no longer hide a reviewed booking destination; those venues use neutral placeholders. Unverified images are not displayed.
- Brasserie Astoria Stockholm: live date, party and time search reached seating choices in approximately 0.9 seconds. The subsequent POST `/api-yoa/dining/hold/add` was blocked during testing, so no temporary hold, reservation or payment occurred. Final checkout, email confirmation and 3-D Secure have NOT been tested live.
- Unit tests reject wrong hosts, wrong venue IDs, stale date parameters and non-booking paths. Browser tests verify guest access, retained provider input, responsive width and that forged postMessages cannot create a Velvet confirmation.
- Existing Bokabord tests and API regression suite pass.
- Service worker bypasses provider navigations and private booking responses. No provider availability or personal information is copied into Velvet caches.

Four investigated mappings (Gitano Tulum, La Guerite, Alma and Locavore NXT) failed the initial frame probe and are not enabled. Failure is not evidence that the restaurant cannot accept bookings; each needs further investigation. Search results for other providers remain candidates, not active integrations. There is no claim of complete 770-restaurant support.

## Runtime behavior

The frame is created once on the guest's click and retained across interactions. Velvet never listens for a completion postMessage and never labels an iframe load as a confirmed booking. Confirmation remains inside the provider's form and in the provider's own confirmation channels; these bookings are not automatically inserted into Velvet booking history. A separate-tab link is always available if a browser or payment step prevents embedding.

## Reproduce

`npm test`, `npm run test:rails`, `npm run test:booking-providers`.

Serve the repository at `http://127.0.0.1:4179`, then run `node scripts/test-booking-providers-ui.mjs`. That test mocks the provider page and sends no bookings. The external frame audit and live availability probe were read-only and blocked non-GET/HEAD requests.
