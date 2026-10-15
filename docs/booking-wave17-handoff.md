# Wave 17 — coordinated booking handoff

Reviewed 2026-10-16 from main `b0a3b6d`. Claim owner: `gabbe-wave17-01a02152`.
GitHub Actions confirmed ownership of issues 55, 56, 58, 59 and 70 before restaurant work began. Request for five additional non-overlapping assignments: [issue 83](https://github.com/mosesisik-cloud/velvet-vip-tables/issues/83).

This is a five-restaurant evidence and implementation-handoff batch, **not ten activated integrations**. Shared runtime files, provider registries, canonical worklist and branding remain untouched for the existing integrator. No deployment was performed.

| Issue | Stable restaurant ID | Reviewed outcome | Integration next step |
| --- | --- | --- | --- |
| 55 | `curated-ATH-island-athens-riviera` | Official reservation email; manual request only | Add the exact binding to the existing reviewed-contact path, with no invented slots or confirmation. |
| 56 | `curated-ATH-varoulko-seaside` | Official i-host link; standalone initial form observed | Exact stable-ID/source/full-URL guard, including `restaurant=232`. External link only; no embedded or live-inventory claim. |
| 58 | `curated-BDR-lucca-by-the-sea` | Bodrum-specific official site links a shared-group WhatsApp reservation contact | Use reviewed manual contact, preserving branch name. Add correct WhatsApp label/status rather than the existing email-only label. |
| 59 | `curated-BKK-gaggan-at-louis-vuitton` | Historical official SevenRooms experience returns page not found; official indexed location indicates closed | Do not activate or substitute the separate Gaggan restaurant. Closure date/reopening not established. |
| 70 | `curated-DXB-ossiano` | Official Atlantis link and named SevenRooms form exist; current-service evidence conflicts | Keep activation blocked pending reconciliation. The initial form's closed notice is date-specific, not proof of permanent closure. |

## Review inputs

- `work/booking-wave17-greece-evidence.json`: Island and Varoulko sources, identity, proposed records and root browser observation.
- `work/booking-wave17-lucca-evidence.json`: exact Bodrum branch, official WhatsApp CTA and wrong-branch exclusion.
- `work/booking-wave17-gaggan-evidence.json`: exact historical link, unavailable route and closure-evidence limitations.
- `work/booking-wave17-ossiano-evidence.json`: operating-status conflict, official route and date-specific provider observation.
- `work/booking-wave17-integration-notes.md`: existing-schema integration guidance and negative test requirements.
- `scripts/test-wave17-evidence.mjs`: claimed-ID associations, source/URL checks and honest outcome flags. It tests the evidence contract, not live booking completion.

Root browser checks only loaded Varoulko's and Ossiano's initial standalone provider pages. No date/guest/time field was changed and no search, reserve, message, hold or payment action was taken. Scheduled time options are not evidence of available tables. Native embedding remains untested.

## Coordination boundaries

Earlier unpublished local wave16 changes for Pujol and La Guérite Cannes are deliberately excluded; the existing owners of issues 63 and 66 and their PRs retain those tasks. Bagatelle Courchevel was previously researched and is not counted as a new restaurant here. No existing claim was deleted, transferred or closed.

The release owner decides integration and publication after review. Until then these files do not alter the public application. Missing additional assignments and Ossiano's operating-status evidence are tracked in issue 83; do not fill the ten-restaurant target with duplicate work or invented successful integrations.
