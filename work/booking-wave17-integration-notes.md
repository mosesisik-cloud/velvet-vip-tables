# Wave 17 integration review — Greece and Lucca

Read-only source inspection at main `b0a3b6d` on 2026-10-16. Shared runtime files and registries were not edited by this reviewer. These recommendations do not establish publication or a completed reservation.

## Existing manual-contact path

`js/restaurant-contact.js` already has an independent frozen map keyed by stable restaurant ID. Its binding schema is exactly `{type, value, source}`. `resolveReviewedRestaurantContact` rejects unknown IDs, changed fields and extra fields. It delegates safe href construction to `external200ContactHref` in `js/external200-booking.js`.

`js/app.js` gives validated provider integrations and enabled Bokabord mappings precedence, then uses the reviewed contact panel before the generic form. The panel suppresses guest inputs, arbitrary time selection, iframes and the previous booking-selection summary. It shows request-only wording, unknown cancellation policy and unknown card/prepayment requirements. Nothing is submitted by opening the panel.

### Island Athens Riviera — issue 55

The Greece fragment now proposes **no generic registry mapping**. Add this exact frozen contact binding under `curated-ATH-island-athens-riviera`:

```json
{
  "type": "email",
  "value": "reservations@islandclubrestaurant.gr",
  "source": "https://www.islandresortathensriviera.com/clubrestaurant/contact"
}
```

The current email renderer can use it unchanged. Expected href is exactly `mailto:reservations@islandclubrestaurant.gr`, without subject, body or other query parameters. The official restaurant reservation page also lists phone and WhatsApp, but adding several channels is unnecessary for this scoped integration. Restaurant email and hotel/Cabanas contacts must not be conflated.

### Lucca by the Sea — issue 58

The colleague's official-source fragment establishes a WhatsApp reservation CTA from the Bodrum-specific site. The existing generic provider resolver should remain unchanged. A reviewed manual binding can be:

```json
{
  "type": "whatsapp",
  "value": "+905354528484",
  "source": "https://luccabythesea.com/"
}
```

`external200ContactHref` already supports this strict international-number form and safely generates `https://wa.me/905354528484`, without message text. However, `restaurantContactPanel` currently hardcodes `data-booking-status="manual_email"` and `copy.manualEmail`. **Adding only the contact row would mislabel WhatsApp as email.** The narrow extension is a validated email/WhatsApp label and status mapping, four-language WhatsApp copy, and `target="_blank" rel="noopener noreferrer"` for HTTPS contact links. Preserve the exact contact validator; do not accept arbitrary URL fields or mutable catalogue contacts. Keep the exact Bodrum branch name visible: this number is shared by the group and is not proof of branch-specific online inventory.

Do not change the externally reserved external200 data to accommodate these non-external200 IDs. Reuse only its existing safe href helper.

## Varoulko Seaside — issue 56

The official source links to exactly:

`https://www.i-host.gr/reservations/new?channel=website&lang=en&restaurant=232`

Use an independently pinned, stable-ID-specific exact external link/source binding under `curated-ATH-varoulko-seaside`, following the JoinOko/Pavyllon pattern in `EXACT_EXTERNAL_LINKS`. The current generic identity-parameter set **does not include `restaurant`**. A broad i-host host allowlist with the current `venueKey` extraction would not protect its restaurant ID. Pinning the full URL also avoids duplicate/query-order/redirect ambiguity. Require exact provider, source, URL, venue key, `external_link`, `official_link_only`, `liveAvailabilitySupported:false` and `completionTracking:"unsupported"`.

Keep `lang=en` as linked by the official source; no provider locale rewrite is verified. Provider web retrieval returned unresolved client templates. Root then observed a standalone initial form with guest/date/time selectors and disabled Reserve. No restaurant name/address was visible in that accessibility tree, so exact official-link provenance remains the venue-identity evidence. The time-selector options are not an availability response. No fields were changed or search submitted. Do not promote to native embedding from a successful standalone page load.

## Tests and unknowns

- Extend `scripts/test-reviewed-manual-contact.mjs` with both exact bindings and mutation rejection (type, value, source, extra fields, query/header injection). Verify manual status, correct channel label, unknown cancellation/payment notices, and no forms/slots/iframe/summary. Mock or prevent contact navigation so tests send no email/message.
- Retain provider/mirror precedence and permanent-closure behavior in the real app route.
- For i-host, reject copied stable IDs, changed restaurant number, host, path, source, duplicate/missing/extra query parameters, fragment, credentials and protocol; reject attempts to mark the row embedded or live-ready.
- Keep response windows and cancellation/payment terms unknown. Do not infer policies from hidden or unresolved provider templates. Availability flags and manual-route presence are not confirmation.
- The broad request-only service test currently assumes every registry request-only row has a 24–72-hour response and card guarantee. Manual contacts should not be inserted into that registry merely to satisfy it.
