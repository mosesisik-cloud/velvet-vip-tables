# Discovery wave13 — Asia-Pacific

15 previously unaudited catalog records without websites were investigated. Current registry and earlier evidence were excluded; pre-existing provider labels were not used to filter out candidates. No production files changed.

## Ready handoff

[Le Du's official reservation page](https://www.ledubkk.com/reservation) links directly to https://www.covermanager.com/reservation/module_restaurant/restaurante-ledu/english. A real read-only Chromium visit loaded the CoverManager shell, not a fully initialized availability form because non-GET traffic was blocked. `../discovery-wave13-registry.json` therefore proposes one **external-only** mapping, with live availability and completion tracking unsupported. No full booking/payment claim.

## New provider candidate

[Ocean Park's official restaurant list](https://www.oceanpark.com.hk/en/a-day-at-the-park/dining-shopping/restaurants?language=en) places a Book now link inside the Neptune’s Restaurant card to:

https://bookonline.foodcloud.hk/m6104/b0001/tms/en/reserve/create/DNR/2c16c98d9622aed878cc1e7a5934ec5a

The initial provider GET timed out after20seconds. This is verified official linkage, not verified usable form. Candidate is separate in `discovery-wave13-foodcloud-candidate.json` and excluded from the ready fragment because FoodCloud needs its own strict host/full-path allowlist. The path is the provider's original initial-form URL; no fields were filled or actions submitted. The adjacent DGG/TUX/PDC/DCO/CBV endpoints belong to other Ocean Park venues and must not substitute for DNR.

## Other outcomes

- Acqua Phuket: [official request form](https://www.acquarestaurantphuket.com/contactbookings.html) requires restaurant reply to confirm. Manual request, not instant inventory.
- Milk & Madu Beach Road: [official branch contact](https://milkandmadu.com/contact-us/) verifies `https://wa.me/6281353896153`; no message sent. Other branch numbers and GoFood ordering links were excluded.
- Soup Restaurant: official reservation page links Oddle, but catalog branch is unidentified.
- A-One, Fish & Co., Dian Xiao Er and Monster Curry: official brand sources found; catalog has only generic Singapore address. No guessed branch mappings or ordering-as-booking substitutions.
- Sushi Tei: official contact policy says reservations are not accepted by email or phone. This does not prove all channels are walk-in-only; kept unresolved with policy detail.
- LowCal and Bistronomique: third-party/provider listings found but no restaurant-controlled exact booking link verified in this bounded audit. Not promoted to integrated.
- Beach Garden, Papino Pizza, Lalacita: restaurant identity/source remains unresolved; unrelated similarly named businesses excluded.

All15 dispositions and source links are in parent-work `discovery-wave13-decisions.json`; inputs, fetched official links and actual browser output are preserved alongside it. Browser tests allowed GET/HEAD only. No contact details, consent, holds, reservations, payments or messages were sent. No native-form or completed-checkout verification is claimed.
