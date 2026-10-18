# Les Deux Magots — required placement-preference contract gap

Agent codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939; chat01a141e3-6cf0-7ef1-8908-41a5840b1b4e. Refs #129. Clean main239 7f7ab64359f5381bba558024fb4f0d082e5bc590. Canonical `curated-PAR-les-deux-magots` reserved by32d5. Status: evidence-only parking, no runtime activation.

## Actual source, checked 2026-10-18

https://lesdeuxmagots.fr/reserver/ returned200, SHA256 `8f85c91fa64f3a6b7cad5fc2f12133d203c90c70f8ed260c6aa225fae25e57ed`. Own address6 place Saint-Germain-des-Prés,75006Paris. Actual iframe is https://bookings.zenchef.com/results?rid=384667&pid=1001&fullscreen=1. Partner pid1001 and fullscreen1 were preserved in both native observations.

One readonly https://bookings.zenchef.com/results?rid=384667&pid=1001&fullscreen=1&lang=fr&day=2026-10-23&pax=2 returned200, SHA256 `44a95f6ef62ac29d9511c263fbdd81fbfde475aedb483c17c5492d870b395af6`. Native identity Les Deux Magots,6 place Saint-Germain-des-Prés,Paris; fr/EUR/Europe/Paris. Query retains pid/fullscreen; wish date/party match, room null/offers empty, room selection/mandatory room false.

Lunch441859 `Déjeuner`: auto true/until null; charge **askable false**, min_guests1, charge_per_guests30; prepayment null; required offer false/from pax null; cancellation14400 seconds relative to shift. Eleven observed times12:00–14:30 at15-minute intervals for two. These are observations, not successful reservations. Breakfast459615, goûter460524 and dinner454653 have askable=true and are not included in a hypothetical lunch scope. No blanket card-required claim for lunch is justified.

One readonly https://bookings.zenchef.com/form?rid=384667&pid=1001&fullscreen=1&lang=fr&day=2026-10-23&pax=2&slot=12%3A00 returned200, SHA256 `ece235b0a36d9c5a767692f5683581cc7381ea19a163998999558b795f454ac1`. This revealed the concrete blocker below. Current referenced app/form assets were fetched, with hashes `f93de04840ca6c559814f814a2c2bd86886a7962dbf24bd024bb3c01360d0cdd` and `b5ada4d2894b110846303a2b4d33120be97c42b88e89d4b33b522001d4ec50c4` respectively; asset identity alone does not establish a venue-specific field contract.

## Mandatory custom field

Beyond six standard contact fields, mandatoryFields contains `custom_field_v2.1093: required`. customFieldsV2 defines id1093, type select, scope booking, French label `Préférence de placement`, widget_form displayed=true/required=true. It cannot be silently omitted or filled by assumption.

Current source options deliberately retained exactly:

| Option id | French label | Native value |
| --- | --- | --- |
| 666 | Pas de préférence | historic-room |
| 667 | Salle historique | verandas |
| 668 | Vérandas | terrace |
| 669 | Terrasse | garden |
| 670 | Jardin | garden-2 |

The label/value mismatch is source evidence, not permission to correct or infer a mapping. No option was selected. Even no-preference requires a verified explicit-choice and payload contract; it is not safe to guess which field/id/value is serialized. A preference does not guarantee seating.

The current provider supports six contact fields and enforces empty custom_field_v2 in approved payloads. It rejects this form as unsupported. Missing contract: explicit guest preference choice and consent binding, native control/serialization proof, exact payload allowlist and same-attempt saved result consistency. No new field engine, guessed hidden payload or silent default was introduced. Actual submit/receipt behavior remains unverified.

Own French notice says reservations are for lunch/dinner, tables are kept for walk-ins, placement is subject to availability, and groups of nine or more/private events use a separate contact route. No15-minute or annual-date rule is stated. No room/terrace guarantee or guaranteed walk-in availability is inferred.

## Boundaries and next step

Only one results and one source HTML form GET. No rendered UI interaction, selected preference, contact/code submit, hold/cart/reservation/payment/message/capability/receipt read, duplicate date probe or bypass. No real charge or early hold asserted. This is a missing mandatory-field contract, not a closure/unavailability claim.

Two files only: this document and sanitized public evidence containing query context, own policy/notice, mandatory-field definition and exact options. Provider/shared runtime unchanged.32d5 owns integration/release and keeps isolated identity unpublished. Further work requires a separately coordinated custom-field contract assignment, preserving pid1001 and actual labels/values; no production activation requested.

Validation: captured pid context, lunch policy and required native option mapping assertions PASS; git diff --check PASS. Runtime unchanged, no booking-suite rerun.32d5 accepted docs/fixture-only parking; isolated identity572847bfd55a816f9157c635aeca47fc77d3a23a stays unpublished.
