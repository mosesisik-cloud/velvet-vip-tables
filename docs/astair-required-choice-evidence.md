# Astair — required room/preference and later reconfirmation, parked

Refs #129. Worker codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939. Base main266877cd5067225b09d5ebc5bcb412adc694c25eac4.32d5 identity-only1ea7610d9da156c6a5adf62ae4c74e3d89f29beb on codex/astair-integration isolated/unpublished. Canonical curated-PAR-astair; reserved ZENCHEF_ASTAIR / VELVET_ZENCHEF_ASTAIR unimplemented. Astair at Passage des Panoramas, not Astier.

## Own source and single results read, 2026-10-18

Official https://www.astair.paris/reservation/ saved C:/Users/moses.isik/Documents/Codex/2026-10-16/jag/work/astair-official-20261018.html SHA256dbadbbd919bbcfbfa1b62707347922a60c427d5a5733298fc966f635ff9d3167 verified locally. Own Astair/19 Passage des Panoramas75002/+33981295095. Actual ordinary iframe https://bookings.zenchef.com/results?rid=351586&pid=1001. Explicit partner preserved; no SDK/fullscreen/lang/showCollapsed introduced.

One GET https://bookings.zenchef.com/results?rid=351586&pid=1001&day=2026-10-23&pax=2 returned200/no redirect/page results/query preserved. Raw SHA256ecdb0c2ccc3dafa73552b201979e5239b1b264c5265ca368455cb454f8cb425a. Native Astair/19 passage des panoramas75002/rid351586 matches; querypid and statepartner both string1001. Files work/astair-results.html,-next.json,-state.json retained. No form GET or selection followed.

## Service and unresolved required choices

Lunch14760 Déjeuner: auto true/untilnull, chargenull/prepaymentnull, noofferfalse/fromnull,7200seconds SHIFT cancellation. Four observed two-person candidates12:00,12:30,13:00,13:30. Dinner434707 Diner Week End separately auto true/null and no card/prepay with7200SHIFT; candidates19:00,19:30,21:00,21:30,22:00,22:15. No inferred calendar restrictions from names, no hold or confirmation claim.

hasRoomSelection=true/isRoomMandatory=true, wishroomnull; selectedoffers[]/rawcatalogoffers[]. In addition to six standard required fields, required legacy96/restaurant351586/slug preference-de-salle/title Préférence de salle/typeauto/displayTypeselect/step3/enabledfalse/requiredtrue. Mandatory key custom_field.preference-de-salle required, V2[]. Three exact options: id298 Intérieur/valueinterieur; id299 Terrasse (chauffée)/valueterrasse; id300 Indifférent/valueindifférent. Each module_custom_field_reservation_id96/enabled1. The required select is not waived by enabledfalse; it is also not proven equivalent to the separate native mandatory room choice. No guessed room-to-preference mapping, no default selection, no field serialization or rendered contract assumed.

## Reconfirmation notice and disposition

Own French restaurant notice says the restaurant will contact guests the day before their visit to reconfirm; any reservation not reconfirmed will not be taken into account. It also describes two services and possible request to release a table for the second service depending on attendance, and asks punctuality. Shift French text asks arrival at the reserved time, especially near end of service, to receive full menu. No fixed seating duration inferred.

PARK: own metadata does show automatic initial confirmation and no card/deposit requirement. This is NOT a card blocker or auto=false/manual request. However an end-to-end ordinary contract has not been established for explicit mandatoryroom plus separate required96preference and subsequent reconfirmation obligation. Missing evidence/work: user-selected room-bound availability and exact room/preference semantics, native form/serializer/readback binding, and truthful handling of later mandatory reconfirmation. Do not treat initialauto as proof future reconfirmation can be ignored or as complete fulfillment of the reservation obligation. No claim restaurant cannot be booked or is unavailable.

Preliminary findings delivered to master/32d5;32d5 supports provisional park and keeps identity isolated. No provider/shared/flag changes; no alternative dates/pax/rooms/hosts or form/nativebrowser/assets probes. No live inputs, holds, POST/submit, booking/payment, messages or receipt/capability reads. Source/rawhash/query/identity/service/requiredfield read and diffcheck only; no executable testloop. No real supplier confirmation. No selfmerge/deploy; live266 unchanged.
