# JEANNE-AIMÉE: results route redirects to unavailable

Refs #129. Worker `codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939`, chat `01a141e3-6cf0-7ef1-8908-41a5840b1b4e`. Exact candidate assigned by master; shared integration and release remain with 32d5. Inspected 20 October 2026, 23:29–23:30 Europe/Stockholm. Evidence only.

The own [English website](https://www.restaurantjeanneaimee.com/en/) returned 200 and identifies JEANNE-AIMÉE, 3 rue Bourdaloue, 75009 Paris, +33 9 73 88 48 44. Normalized name/domain/address/phone search across data, docs and API at main `256572e7ecea022023e5850fc08c6c32e747238f` returned no matches. No canonical restaurantId was assigned.

The root contains the Zenchef SDK loader at `https://sdk.zenchef.com/v1/sdk.min.js` and a `zc-widget-config` element with exactly `data-restaurant="356997"` and `data-lang="en"`. It contains no direct ordinary booking results href or structured ReserveAction. The terms link is not treated as a booking destination.

One GET of the referenced SDK returned 200, SHA-256 `f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c`. Its bytes match the previously inspected SDK, but the restaurant configuration is taken only from this own root. Static inspection establishes `loadConfig` parameters sdk=1 and withCloseButton=1, restaurant-to-rid and lang mappings, and showCollapsed=1 when data-hide-default-button is absent. The default page is results, because there are no payment or multivenue parameters. No SDK code was executed.

The resulting ordinary initial URL is:

```text
https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=356997&lang=en&showCollapsed=1
```

Exactly one time query appended only `day=2026-10-21&pax=2`. At 21:30:47.982Z it returned HTTP302, empty body, with Location:

```text
/unavailable?sdk=1&withCloseButton=1&rid=356997&lang=en&showCollapsed=1&day=2026-10-21&pax=2
```

That response supplies no availability, confirmation, menu, card, room, field or cancellation policy evidence. It does not establish that the restaurant is closed or universally unbookable. The redirect was not followed; no alternative date, language, query or restaurant was attempted. A local extraction script expected HTML and reported a missing-script error after successfully saving the empty response and metadata; it made no retry.

[`evidence/jeanne-aimee-source.json`](evidence/jeanne-aimee-source.json) preserves source URLs, timestamps, original byte hashes, deduplication result, exact own configuration and observed redirect. All three byte hashes, own configuration, SDK defaults and HTTP302 assertions passed. Raw captures remain in this chat’s `evidence/jeanne-aimee` folder outside the repository.

Exactly three read-only GETs were made: own root, referenced SDK text, and one provider results query. No browser, form, slot selection, submission, personal details, reservation, hold, payment or restaurant contact. No runtime/canonical files changed and no publication. Status: blocked at provider results response; preserve the evidence and park pending a concrete change to the ordinary booking route, rather than repeat probes.
