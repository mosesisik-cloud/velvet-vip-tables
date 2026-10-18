# Bouillon Racine — first lunch for exactly two

Owner: codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939, chat 01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Base main 234: 05d64efea79c4198e08932ea24690603aeeca84f. Canonical `curated-PAR-bouillon-racine` reserved by 32d5.

## Identity and official route, checked 2026-10-18

Official https://www.bouillonracine.fr/ returned 200, SHA256 `9630a1f1fe9c9ff225b1d31549c4c6a8acbbcf0de9fe9eeadbd6333602ddb2da`. The homepage describes Bouillon Racine restaurant lunch/dinner at 3 Rue Racine, 75006 Paris. Its current site title and native restaurant name are both “Bouillon Racine - Bar du Bouillon”. The ordinary Réserver button uses data-zc-action=open and zc-widget-config data-restaurant=132, data-lang=fr. The separate privatisation?rid=132&pid=1001 route was not opened or used.

Referenced https://sdk.zenchef.com/v1/sdk.min.js returned 200, SHA256 `f5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c`: data-restaurant maps to rid, production base bookings.zenchef.com, normal path results. Widget JavaScript was read, not executed.

The site's linked https://www.bouillonracine.fr/o/bar-du-bouillon/ returned 200, SHA256 `a549a51b047c9ab99c2d5e489fecae5bf083e829c96cdce4caf9f6144ea4b34f`, and describes a separate bar/private-events offering. The common brand name does not establish a bar booking or seating guarantee. This contract covers the ordinary restaurant first-lunch shift only, with no chosen room. No independent bar integration is claimed.

## Captured native contract

One readonly https://bookings.zenchef.com/results?rid=132&lang=fr&day=2026-10-23&pax=2 returned 200, SHA256 `39d998361e0814f86b056a02a5cd209d46d8f4c0ee90522b15d7e160b6d14ece`. Native name above, address 3 Rue Racine, city Paris, Europe/Paris. First lunch 93989, name `Déjeuner 1 service`, offers 12:00/12:15/12:30 for two. These are observed slots, not holds or confirmed bookings. Later lunch 371604 and dinner 515773/95695 are excluded.

Exact positive policy: party 2; EUR/fr; automatic true/until null; charge and prepayment null; required offer false/from pax null; cancellation cutoff **10800 seconds relative to shift**. No room selection or mandatory room, wish room null, offers empty. Native room labels RDC/Etage and disabled, non-required custom fields do not grant a floor/room guarantee.

Readonly https://bookings.zenchef.com/form?rid=132&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned 200, SHA256 `0b6f30b5ebb1f8974e1c3cf1748d3345cdbacdff0b308b6f22ead1a6dee68bc5`. Required first/last/email/phone/country/civility; optional voucher unsupported. Current referenced bundles were fetched and matched reviewed source:

- `_app-30bffcb9f4c3b7b2.js`: `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd`.
- `form-84144e7c9a8b854d.js`: `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4`.

Own FR notice asks guests to respect the reservation time and says tables are no longer guaranteed beyond 15 minutes late; parties above 10 should contact the restaurant. The EN source instead says 20 minutes. The adapter is pinned to French and retains the complete French notice; it does not reconcile the translation discrepancy by inventing a universal grace period. Both source strings remain in the fixture and version digest.

No date-specific notice is set for the observed day. No current annual exclusion has been established, so Julien's December 24/25/31 exclusions are not copied. An older indexed special-menu claim is not promoted to a current rule. This observation does not establish holiday availability: other shifts, required menus, charges and changed policy fail the exact contract. No holiday probe was performed.

## Integration and validation boundaries

Only provider/test/sanitized fixture/docs changed. Reuses the existing named no-room own-booking-readback engine. Shared registry/API/UI/ledger/journal belongs to 32d5: bind rid 132, party 2, shift 93989, own_booking_readback proof and the same durable shift scope. Preserve raw FR notice with existing safe text rendering; native EULA/restaurantComment/shift digest and frozen approval are rechecked before final submission. There is no Julien date guard for Racine.

The first permitted write is the native final booking POST after explicit consent, terms acceptance and durable sendAllowed grant. An independent same-attempt booking GET can then verify only the UUID created by that POST. Saved id/date/time/pax/confirmed status, no charge/action/error, empty offers and no chosen room are required. POST echo alone cannot confirm. Service binding uses validated shift, frozen approval and durable attempt details; no invented raw receipt shift field. Real receipt structure remains unverified; unknown structures stay unknown.

Guarded actual Chromium form GET rendered empty firstname and native EULA; nine requests were blocked. Service workers, websockets, redirects and unreviewed traffic blocked. No contact input, code, hold, cart, reservation, payment, message, capability or receipt read was performed. No bypass or duplicate results probe.

Local tests extend synthetic native browser success/missing/pending/date/party/offer/card/manual/stale-notice/durable-attempt cases. Source tests pin three captured slots, field completeness and types, 10800 shift-relative cutoff, excluded services and party-three rejection. Synthetic booking dates/times and receipts are not live availability or real reservations.

Validation: node --test scripts/test-zenchef-playwright.mjs — 28/28 PASS, no failures (112.84 seconds). git diff --check PASS. Independent review, actual local app QA with simulated mutations and publication remain with 32d5.
