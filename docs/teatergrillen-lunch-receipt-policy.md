# Teatergrillen Lunch — restaurant selector resolved

Reviewed 2026-10-17 on main `9e501a389fdb53fca50b56198649356ed8a7d940`. Owner32d5 reserved `curated-STO-teatergrillen`, Teatergrillen, Nybrogatan3,11434 Stockholm. Shared catalog/server/UI/release remain owned by32d5.

## Critical routing evidence: mr83 is a restaurant selector

Fresh [official booking HTML](https://teatergrillen.se/boka-bord/) links `https://app.bokabord.se/reservation/?hash=a9a751cbf9a3721964247c6b364a4fe2&version=new&mr=83`. Preserve that as the official entry, including mr83/version. Its returned HTML has NO meals object: it asks the visitor to select a restaurant. Lines186–192 explicitly publish two data-url destinations:

- Teatergrillen: `/reservation/?hash=e11fb52c16bde7a7d8f255342f6a6eaf&version=new`
- Teatergrillens bar: `/reservation/?hash=a9a751cbf9a3721964247c6b364a4fe2&version=new`

The picker title/restaurant_name says Teatergrillens bar, but this is not authority to book the bar for a Teatergrillen request. A public GET of the explicit Teatergrillen destination yields provider name `Teatergrillen`, restaurant hash `e11fb52c16bde7a7d8f255342f6a6eaf` and settings.g_id83. Common client1279–1281 uses g_id to return to a mr group selector. Thus mr83 identifies this selection context, not a room parameter to invent in saveBooking. No provider API contract for a room field is asserted.

Integration must distinguish official entry from the observed selected-restaurant destination. Use the exact published Teatergrillen target in the existing adapter; do not drop mr from the official entry and thereby select the bar. Do not append mr to the selected URL speculatively. If the existing registry cannot represent that distinction, keep activation off until its existing routing supports the two known URLs. This requires no new booking engine. Riche is also a separate venue/hash.

## Ordinary Lunch contract

TEATERGRILLEN_LUNCH_RECEIPT_POLICY uses selected restaurant hash above, Lunch6491/type2, maxParty2, exact provider name. Published must_pay_directly=false,mandatory_products=false,bullets={}, min1/max8. Native lunch is weekdays only, tstart13:00/tend15:00, date0/dateto0. Fresh official HTML says Mon–Thu11:30–15:30 and Friday11:30–17:00, weekends closed. Conservative intersection: weekdays13:00 inclusive–15:00 exclusive. approvalDigest enforces that window and exact tuple, before transport and again for receipt verification. No availability or date is fabricated.

Exclude dinner6492, Teatersittning9063, Wretmandagarna42517, Fars dag64051 and every other meal, including any future Christmas/special arrangement. Bar hash is explicitly rejected. Official up8/from9directcontact does not widen initial1–2 scope or authorize automatic contact.

## Submission/receipt boundary

Selected restaurant has canUseAuthFeature=false,_allow_temp=false,confirm_in_widget=false,custom_request=false,group_bookings=false,linked_meals=[],comment=false. Use existing Riche/Sturehof/Gondolen contact-final flow: Velvet review and consent BEFORE contactNext, because native guestCtrl2360–2369 calls completeBooking directly with feature off, then saveBooking2531–2540/5057. Keep native phone widget projection, exact approval/phone re-read, durable dispatch lock and all release218 protections. confirm_in_widget is routing, not confirmation proof. No new room or group submission fields.

Unchanged receipt guards require matching captured submission/response plus fresh independent main-frame receipt for that exact booking/navigation. Later card/no-show/group/product/waitlist/temp states stay unknown. Status1/2xx/events/redirect alone cannot confirm. No contact data or final clicks were used to inspect this flow.

## Evidence and validation

- Official-entry picker HTML SHA256 `ef4b9071de20205b01cdfdf57a4c6dfad2c2753130a72098a1a919f697fd727c`.
- Selected Teatergrillen initial HTML SHA256 `3050f377d19ced601a382388d84fa687477440bde193119dad0e8b4d7dcfd96f`.
- Same-day reviewed common app-widget.js?v6.0.3 SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5` supplies the cited native flow.
- All35 receipt tests pass, including bar-hash rejection, exact tuple, other meals, weekday/time/party boundaries, submission/phone/replay/receipt negatives. Existing policies remain passing. Positive proofs are synthetic fixtures; no real reservation is claimed. git diff --check passes.

Only public official/initial HTML reads. No holds, bookings, contacts, codes, payments, capability reads or restaurant messages. Owner32d5 must validate routing/selected identity and full app contact-final review/phone/journal/receipt behavior before activation. Native interactive flow and availability remain unobserved. Sole new handoff, no further candidate.
