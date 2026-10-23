# Can Caus and Ama Lur calendar search

This adds a standalone, disabled-by-default search adapter for original catalogue IDs `osm-IBZ-can-caus` and `osm-IBZ-ama-lur`. No server routing or production registry is changed. Shared integration and deployment remain with the existing release owner.

The exact registered CoverManager pages use the Angular reserve engine. Their native client reads initial configuration from `POST /Config/get_init_module/{slug}/spanish` and calendar data from `POST /Reserve/change_day/{slug}/{date}/2/spanish`. These two POSTs are configuration/search reads. The adapter never invokes selection, cart, `avaible_reserv_module`, booking preparation, waiting-list, group-request, checkout, payment or confirmation endpoints. It does not execute provider scripts or request a reCAPTCHA token.

Each query revalidates the page's exact restaurant slug, language and source limits, then checks the configuration's restaurant identity, Europe/Madrid timezone and lunch/dinner flags. It projects only `hours[2].all`, within 90 minutes of the selected local time, and excludes closed/full service groups. The `not_avaible` field is display text shown by the native template only when `complete` is true; treating the string itself as a sold-out flag would discard actual results. Waiting-list and group-request hours remain separate and are never projected.

Read-only end-to-end observation on 2026-10-20 for 2026-10-23, two guests at 20:00: Can Caus returned five times, 19:30–21:30 every 30 minutes; Ama Lur returned nine times over the same interval every 15 minutes, with Sala as the source zone label. Each adapter call used one page GET and two configuration/calendar POSTs. The committed live-check artifact records exact requests and projected results.

Payment requirements, cancellation terms and confirmation mode remain unknown. No original form was interactively verified and no reservation was confirmed. Calendar availability is query-specific and can change; this is not full booking integration or full CoverManager coverage. The other six registered CoverManager restaurants use a different classic engine and are not covered by this adapter.

Validation: `node scripts/test-covermanager-angular-search.mjs` covers both saved source contracts, endpoint/method/payload boundaries, service restrictions, wrong party, full/closed states, missing data, display-copy independence, query validation, disabled gates and cancellation. CI runs this test without external requests.
