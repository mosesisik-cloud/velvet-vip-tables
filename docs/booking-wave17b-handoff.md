# Wave 17B — five coordinated review outcomes

Agent/claim owner: `gabbe-wave17-01a02152`. Checked 2026-10-16 Europe/Stockholm.
Base: main `ab7fbe172fe0be8eae393614650c4bbf296785f5` (release 186).
Refs #89, #91, #93, #94, #102. Continues Wave 17 PR #109.

This is evidence for the existing booking coordinator, not a second canonical
registry. No runtime, provider registry, canonical worklist or release file changes.
All claims remain owned until coordinator review. No booking, hold, contact,
guest-data, payment, CAPTCHA or access-bypass action was deliberately performed.
This describes reported operator actions, not a network audit of background effects.

## Outcomes

| Issue / stable ID | Verified route | Integration decision |
| --- | --- | --- |
| #89 `curated-HKG-caprice` | Official Four Seasons Caprice page opens its own date/people/time form. | External official page proposal only; exact backend ID unverified. Phone is optional fallback, not the only available route. |
| #91 `curated-HKT-acqua-restaurant-phuket` | Current Phuket homepage has a request form and reservation email. | Request-only; restaurant reply is required. Two hours is minimum notice, not promised response time. |
| #93 `curated-HVA-dalmatino-hvar` | Official SevenRooms `dalmatinohvar`; provider name/address observed. | Alias/revalidation: already exists as `osm-HVA-dalmatino`. Do not count as a net-new venue or downgrade existing evidence. |
| #94 `curated-HVA-gariful` | Repeated official primary CTA to i-host `restaurant=1779`; initial form observed. | External-only proposal with full exact URL binding. Secondary BookMeATable navigation remains on official site; status not inferred. |
| #102 `curated-SIN-burnt-ends` | Official site's Weeloy iframe, `bkrestaurant=SG_SG_R_BurntEnds`, initial form observed. | Exact external provider proposal. Operator-side iframe is not proof of embedding in Velvet. Distinguish restaurant #01-02 from cocktail bar #01-04. |

Evidence fragments in `work/booking-wave17b-{asia,acqua,hvar}-evidence.json`
contain sources, exact paths/queries, identities, observations and limitations.
Five reviewed tasks do not mean five newly activated booking integrations.

## Coordinator-only next steps

1. Deduplicate Dalmatino's curated and OSM IDs before any registry change. Existing
   OSM entry has stronger recorded embedding evidence from October 15. This
   review only observed the standalone initial page; reconcile, do not overwrite.
2. Caprice and Acqua need exact stable-ID + host/path/source rules for their
   official-page routes. Do not broadly allow Four Seasons or arbitrary websites.
   Caprice's hotel-room links and other hotel restaurants are not its booking route.
3. Gariful requires pinning the full official query, including `restaurant=1779`
   and original `lang=eng`. Generic identity extraction omits `restaurant`.
   Do not import cancellation terms from unresolved provider templates.
4. Burnt Ends requires an exact Weeloy/restaurants.sg rule including `bkrestaurant`,
   full path and source, plus substitution/unknown-host rejection tests. Preserve
   separate seating areas; never default a restaurant request into the cocktail bar.
5. Keep new proposals external-only, live availability disabled and completion
   tracking unsupported until separately observed in Velvet. Opening a form or
   showing time choices is not a bookable-inventory or confirmed-reservation test.
6. If choosing reviewed phone/email alternatives, add exact contact bindings and
   appropriate manual/request-only copy. Existing manual contact UI uses email
   copy; phone/WhatsApp need a narrow localized channel-copy change, not a generic
   contact fallback. Acqua's visible phone numbers conflict with its tel href, so
   only the matching reservation email is proposed.
7. Acqua's request-only semantics must also be pinned to its exact mapping.
   Do not copy another venue's 24–72-hour reply or card-guarantee defaults to Acqua.
   Later main188 already added unknown/max-only response handling; the historical
   base186 warning is not a present main188 defect. Acqua's payment/cancellation
   conditions are unknown. Runtime sanitization may omit `paymentRequirement:
   "unknown"`; omission must stay unknown rather than inventing a guarantee.

Root browser checks used the initial forms only: Caprice's same-page opener,
Acqua's blank request fields, Dalmatino's initial date response, Gariful's disabled
Reserve form and Burnt Ends' operator-embedded seating/calendar form. Dalmatino's
default date said closed on October 15; this is not evidence of permanent closure.
No availability search or onward booking/Continue/Submit action was performed.

## Browser safeguard provenance

The PR #109 review's safety-provenance finding also applies to this historical
batch. All five records now explicitly mark background side effects as unknown.
Original service-worker blocking, request-write interception and network-audit
provenance were not recorded. Initial-page observations and absent operator
submissions do not certify write-free end-to-end behavior. Unmeasured system
effect counts/flags are null; source identity and capability limits are preserved.

No provider was revisited for this correction. Offline contract and mutation
tests reject missing provenance, invented safety verification and unsupported
zero/false system outcomes. Future write-free browser testing requires actual
recorded safeguards and audit evidence; these JSON tests are not a substitute.

## Verification and publication

Run `node scripts/test-wave17b-evidence.mjs` for scoped evidence contracts, plus
existing provider, booking-language and availability-gate tests. Evidence tests
check structure/exact bindings, not the truth of every prose observation.

Status: proposed evidence, not integrated or deployed. The existing integrator
owns canonical updates; the existing release owner alone publishes them. Review
may accept manual, alias or blocked outcomes without claiming instant booking.
