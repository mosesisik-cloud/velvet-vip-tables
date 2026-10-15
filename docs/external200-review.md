# External200 booking audit

This review covers exactly the 200 stable restaurant IDs in `data/external200-manifest.json`, divided into the original ten groups of twenty. Based on origin/main `7fc49f4`, checked 15 October 2026. No production deployment or active registry change is included.

The machine-readable decisions are `data/external200-group01.json` through `external200-group10.json`. Each group's reviewed adapter-compatible additions are also exported in `data/external200-registry-groupNN.json`; `{}` means none qualified. The combined proposed registry is `data/external200-registry-additions.json`. It is deliberately not loaded by the application. The release owner can import reviewed entries into the active registry after reconciliation with current main, then update its count assertions and rerun provider, selection and language tests. Do not replace the entire active registry.

`data/external200-summary.json` supplies counts and definitions. Reviewed means researched and assessed, not fully verified. Counters overlap: a venue can have an external link, a rendered original iframe, and observed inventory. Some official external links are manual request forms with unsupported providers, so external-link count exceeds adapter-ready additions. All proposed integrations remain `external_link`, including ones with working original iframes. Their `liveAvailabilitySupported:false` describes Velvet's adapter capability, not the historical observation.

## Evidence levels

- `identity.status: verified` requires official evidence for a venue and address. An unresolved row may have candidateCity/candidateAddress; those are not confirmed locations. Generic city-only source data often cannot distinguish chain outlets.
- `officialExternalLink` means a restaurant-specific route was established from an official source. It does not prove availability, embedding or automatic confirmation.
- `embeddedOriginalForm` records an original provider iframe interaction. Check the per-record host and mobile limitations: restaurant-site or localhost framing does not establish production-origin compatibility.
- `liveAvailability` means offered times were actually returned for the recorded date and party size. Static time choices in request forms, a loaded iframe, and a no-availability response do not qualify.
- `simulatedValidation` is reserved for simulated guest flows; it remains false. Offline scope/adapter assertions are separately reported in `data/external200-tests.json`.
- `confirmedReservation` remains false. No confirmation was attempted. No contact/card details, payment, email, WhatsApp or LINE message was submitted. Neolokal's request-form time selection was inspected without a pre-click network audit; its hold side-effects cannot be certified absent. The group07 record explicitly retains this limitation.

Statuses additionally distinguish `manual_phone`, `manual_email`, `manual_whatsapp`, `manual_message`, `walk_in`, `takeaway`, `closed`, `closed_reported`, `unresolved_branch`, and `unresolved`. A general contact number is not counted as a verified manual table-booking route. `closed_reported` is secondary reporting awaiting operator confirmation. `takeaway` does not imply a no-reservations policy. Source `kind: rejected` identifies a wrong-location, unavailable or repurposed candidate, never an endorsed destination. Other source kinds are official and secondary. Null policy values mean unknown. Language codes can be observed labels/content only; switch functionality must be explicitly stated.

## Findings that must survive import

Shellona has officially closed to make way for Loulou even though its old SevenRooms search page still renders. The candidate Creperie domain now serves cryptocurrency-casino content. Le Petit Deauville's similarly named French website belongs to Montreuil and is rejected. Victoria is reported closed; Victoire is a separate unresolved ID. The two Creperie IDs and two Bonito IDs are retained without merging. Rowley's Dubai explicitly says walk-ins; London booking routes must not be substituted. No unresolved branch receives a guessed provider slug.

## Validation and limitations

Run `node scripts/external200-validate.mjs`. It checks exactly 200 IDs, twenty per manifest group, allowed claims/statuses, proposal consistency, existing resolver acceptance, and rejection of changed hosts/venues or an unearned embed upgrade. Existing provider, selection and language tests also pass on the unchanged active registry. The registry unit tests do not simulate reservations.

`node scripts/external200-browser-probe.mjs --live` is an optional fresh read-only render probe after dependency installation. It performs no control clicks; successful navigation is not treated as form or availability success. Evidence from the actual interactive checks is in the decision records, group reports and `data/external200-browser-evidence.json`. Selected screenshots: `docs/external200-sella-mobile.png`, `docs/external200-carluccio-mobile.png`. Viewport emulation is not a physical-device/iOS test. Search observations expire as inventory changes. Cancellation/guarantee/prepayment conditions not visible before a potentially mutating step remain unknown.
