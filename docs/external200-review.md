# External200 booking audit

This review covers exactly the 200 stable restaurant IDs in data/external200-manifest.json, divided into ten groups of 20. Follow-up research and implementation checked 16 October 2026 against current main. No production deployment is included.

The machine-readable decisions are `data/external200-group01.json` through `external200-group10.json`. Each group's reviewed adapter-compatible additions are also exported in `data/external200-registry-groupNN.json`; `{}` means none qualified. The combined proposed registry is `data/external200-registry-additions.json`. The six original proposals were already integrated by the release owner. The two new proposals (Shang Palace and FishCorner) are now implemented in the active registry on this branch as external links.

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

Run `node scripts/external200-validate.mjs`. It checks exactly 200 IDs, twenty per manifest group, allowed claims/statuses, proposal consistency, existing resolver acceptance, and rejection of changed hosts/venues or an unearned embed upgrade. Existing provider, selection and language tests pass with the two newly integrated mappings. The registry unit tests do not simulate reservations.

`node scripts/external200-browser-probe.mjs --live` is an optional fresh read-only render probe after dependency installation. It performs no control clicks; successful navigation is not treated as form or availability success. Evidence from the actual interactive checks is in the decision records, group reports and `data/external200-browser-evidence.json`. Selected screenshots: `docs/external200-sella-mobile.png`, `docs/external200-carluccio-mobile.png`. Viewport emulation is not a physical-device/iOS test. Search observations expire as inventory changes. Cancellation/guarantee/prepayment conditions not visible before a potentially mutating step remain unknown.

## CI follow-up, 16 October 2026

Route integrity initially rejected a group08 limitation that began with an HTTPS URL followed by prose. The URL is now recorded separately in the structured fetch attempt; the limitation still records failure without inferring closure. No test was weakened or changed. Route integrity, exact-scope validation, provider, selection and language checks pass locally against the refreshed main branch.

## Current delivery

All 200 have a researched decision and a tested guest-facing state. This is NOT 200 bookable restaurants. There are 43 officially verified identities, 15 official external booking/request links, 18 explicit manual contacts (5 overlap with the external routes), and 167 unresolved decisions. Four original iframes and five venues with offered times are historical observations, not guarantees of current inventory. One operator-confirmed closure, two secondary closure reports, one walk-in venue and one takeaway venue are separate.

The scoped fallback exposes 7 original booking/request pages and 13 manual-only routes, while 8 existing adapter mappings take precedence (6 already published by the release owner plus 2 prepared here). Thus 28 distinct records have a reviewed booking/contact path. All remaining records show their actual unresolved or non-bookable status; the generic synthetic request form is suppressed only for the exact 200 IDs. Four languages use the existing locale. No guest account is required to see or follow these routes. Source/contact links do not submit messages. Provider request-only disclosures remain unchanged.

Shellona is marked permanently_closed using the existing catalogue/UI status. The rejected Creperie casino-domain website and image were removed from its catalogue entry. No IDs are merged, renamed or mapped to successors. Only these two manifest IDs change in restaurants.json.

Validation: 400 actual local app routes (200×desktop/mobile), four-language checks, exact scope and generated-data freshness, provider precedence, destination guards, selection/language/request metadata tests. 15 original destinations returned HTTP200 and rendered text at both viewports under a context-wide GET/HEAD-only guard; 136 non-GET/HEAD requests were blocked. This 30-render check does not prove inventory, form completion or no-availability. It may impair provider functionality. No controls were selected during that guarded rerun. Earlier no-click probes and the Shang Palace availability search lacked this guard; provider-JavaScript side effects cannot be certified absent. The historical Neolokal limitation remains.

The per-ID handoff fragment is data/external200-worklist.json. It is input to the canonical list owned by the booking chat, not a second master list. It distinguishes release-owner-confirmed published mappings from locally prepared changes. The release owner alone decides integration and publication.
