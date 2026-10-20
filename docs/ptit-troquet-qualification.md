# Le P’tit Troquet: availability with manual confirmation

Refs #129. Worker `codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939`, chat `01a141e3-6cf0-7ef1-8908-41a5840b1b4e`. Master assigned this candidate after L’Ami Jean; 32d5 retains shared integration and release. Inspected 20 October 2026, 23:27–23:28 Europe/Stockholm. Source evidence only, no activation.

## Identity and ordinary route

The own [website](https://www.leptittroquet.fr/) identifies Le P’tit Troquet, 28 rue de l’Exposition, 75007 Paris, +33 1 47 05 80 39. Normalized name/domain/address/phone search across data, docs and API at main `256572e7ecea022023e5850fc08c6c32e747238f` found no duplicate. No canonical restaurantId was assigned.

One root GET returned 200. The visible booking buttons use `data-zc-action="open"`; the page also declares a Zenchef SDK configuration for restaurant `348471`, language `fr`. No SDK was fetched or executed, and its derived parameters were not guessed.

Instead, the same page explicitly provides the ordinary structured `ReserveAction` target `https://www.leptittroquet.fr/reserver-une-table/?rid=348471&lang=fr`. One GET of that exact target returned 301 with this Location:

```text
https://bookings.zenchef.com/results?rid=348471&fullscreen&lang=fr&withCloseButton=1
```

One results GET preserved that exact query and appended only `day=2026-10-21&pax=2`. It returned 200 without redirect. The provider name and telephone match the own website; the address comes from the own website. The separate privatisation link was not used.

## Observed availability and blocker

Lunch shift `5620` has seven available quarter-hour slots for two: 12:00 through 13:30 on 21 October. The 13:45 slot has no available guest counts. This is an observed availability snapshot, not a completed or held reservation.

The blocker is `confirmation: {is_auto:false,is_auto_until:null}`. No automatic confirmation is established. Dinner `41271` has false/until-one confirmation, which does not qualify the requested two guests either; no dinner substitution or additional date query was made.

Lunch charge and prepayment are null. Cancellation is 3,600 seconds relative to the shift. The booking window begins 21 September at 12:00 and ends at each slot time; the shift ends at 13:45. Lunch text describes two- or three-course menus, but `is_offer_required` is false and the wish has no selected offer. Do not infer a price or selected menu from this prose.

The original French restaurant notice says that tables above four require direct contact, a table is no longer guaranteed after 15 minutes’ delay, and the restaurant reserves the right to cancel up to two hours before when the guest has not reconfirmed. The English text includes the group and lateness conditions but omits that reconfirmation clause. Both originals are retained; the French clause must not disappear through language fallback.

Room selection and mandatory-room flags are false and wish room is null, while the availability objects still carry room IDs `3516` and `16967`. Preserve the distinction between capacity metadata and guest-selected rooms. Complete room, capacity, turn-time, voucher, field and policy objects are preserved in the source projection.

## Evidence, validation and boundary

[`evidence/ptit-troquet-source.json`](evidence/ptit-troquet-source.json) contains the exact query, build `2b18f39ef7`, source metadata/hashes, full daily policy and offers, notices, field requirements and relevant state. Authentication/payment keys are excluded. Raw byte captures are retained in this chat’s `evidence/ptit-troquet` directory outside the repository.

Results SHA-256: `5ba1bb90b352960ce6b94609066ae771f28688fe6e51c4aacaa66f5c4b93323f`. Raw hash, full availability projection equality, exact query, seven two-person lunch slots and false/null confirmation assertions passed. Exactly three GETs were performed; no browser, SDK, form, slot selection, submission, personal data, hold, reservation, payment or restaurant contact.

Status: blocked for the current automatic-confirmation contract. A separately designed pending-request and guest-reconfirmation flow would need explicit integration approval; none was implemented. No runtime or canonical registry changes, no publication. Existing release 284 is unaffected. Do not describe this restaurant as generally unavailable, and do not probe more dates to evade a confirmation-policy constraint.
