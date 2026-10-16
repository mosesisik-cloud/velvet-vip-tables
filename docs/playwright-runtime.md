# Playwright booking runtime

The public preview at booking-preview.html is a browser-memory simulation. It sends no API/provider requests and creates no reservation. Test date: 2030-01-15. Its UI module is shared with the proposed semantic v1 contract, but no live semantic provider adapter is claimed.

## Guest booking

Configured live Bokabord restaurants use the native server Playwright mirror before external embeds. Guests do not need a Velvet account. The browser shows actual supplier pixels, validates the image hash, and requires explicit terms/confirmation. Cards, mandatory products and unsupported reservation steps remain supplier handoffs. An unrecognized provider response is unknown, never confirmed. Positive confirmation is restricted to the historically evidenced ordinary Zink meal9778/rest1359/type3 response, matching the exact approved details and reserved attempt. Other restaurants and meal types remain unknown unless separately verified.

New attempts use api/playwright-attempts.sqlite (override VELVET_PLAYWRIGHT_DB). The old mirror-attempts directory is a read-only duplicate barrier. Do not delete or relocate either store. The hook must throw on denied reserve; returning false does not stop the native adapter. The journal stores metadata and a server-computed approval fingerprint, not contact details. For the narrow Zink policy, detailsDigest explicitly equals the canonical approval digest stored as reviewFingerprint. Venue/session/server attempt/client key/source must all match before the journal accepts confirmation; the native handler additionally checks the current revision before submission.

GET /restaurant-bookings/playwright/attempts returns only the authenticated account or opaque guest owner's attempts. GET /restaurant-bookings also repairs that owner's booking-register projection after a crash. Unknown attempts survive restart and key/session changes; refreshing cannot grant permission to resend.

## Inspection adapters

Zenchef and SevenRooms native adapters are connected behind /restaurant-bookings/playwright, disabled by default. VELVET_PLAYWRIGHT_INSPECTION=enabled permits authenticated operators only. Never enable it before checking capacity on the actual deployment. One shared inspection session is allowed across these two providers; existing Bokabord and availability pools retain their own limits. No extra browsers launch while disabled. These are not verified inventory or checkout integrations.

POST the root with provider and registered restaurantId creates an inspection session. POST /:id/current reads it, POST /:id/action permits refresh only, DELETE /:id closes it. Owners always come from trusted server sessions. Neither modes, supplier URLs nor fixture HTML are client controlled. Expiry/shutdown closes contexts. Public config reports the limitation explicitly. The old SevenRooms direct HTTP hold/book path returns provider_checkout_unverified; its bypass implementation is removed.

## Verification and release

node --test api/test-zink-playwright.mjs scripts/test-booking-result.mjs scripts/test-playwright-attempt-ledger.mjs scripts/test-playwright-runtime.mjs scripts/test-playwright-booking-journal.mjs
node scripts/test-playwright-server.mjs
node scripts/test-native-booking-ui.mjs
node scripts/test-booking-preview.mjs

These tests use doubles, local Chromium fixtures and temporary databases, not supplier bookings. The journal integration test exercises the actual native request handler and proves zero mock transmissions after restart/replay or a legacy barrier.

Do not roll back to a writer that only understands the old JSON journal after new SQLite attempts exist. Preserve the SQLite guard or disable booking submission during rollback; otherwise old code cannot see new duplicate barriers. Back up both stores alongside code. Provider inspection stays disabled in the public release.
