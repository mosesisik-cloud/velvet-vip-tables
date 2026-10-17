# Tennstopet — Lunch Tennbarens Matsal, exactly two

Reviewed 2026-10-18 on main `d51ec08105706a2d4f0dd4705207b19b5dba59ee` (release221). Owner32d5 checked current identity/alias/hash and reserved `curated-STO-tennstopet`, Tennstopet, Dalagatan50,11324 Stockholm. Fresh [official HTML](https://www.tennstopet.se/) has ordinary waiteraid-widget anchors with data-hash `48b3bfcf5f5ff2974d516a5bd226850c` and Bokabord widget loader; its Christmas anchor adds mealid59733. Gift-card links are not the reservation provider. Initial native GET at [this hash](https://app.bokabord.se/reservation/?hash=48b3bfcf5f5ff2974d516a5bd226850c) names Tennstopet.

## Actual scope is two, not one or two

TENNSTOPET_LUNCH_RECEIPT_POLICY explicitly reviews meal54277/type0, full label `Lunch Tennbarens Matsal`. Native minimum2 rules out one guest; the implementation permits exactly2. This is ordinary recurring lunch in the inner dining room, half a flight of stairs down, belonging to classic Tennstopet. Preserve that description and full room/meal label in offer, approval, confirmation and history; do not shorten it to generic Lunch or equate it with Tennstopet Grill.

Native tstart12:00/tend15:00; disabled weekdays1,2,3,4,7 leave Friday/Saturday. Official opening is11:30 weekdays and12:00 weekends, so conservative supported start window is Friday/Saturday12:00 inclusive–15:00 exclusive. Native date0/dateto0 does not create a fixed event date. Actual offers must still come from the provider; no availability was requested or invented.

Swedish meal description explicitly states that ONLY Sittande Julbord2026 is served25November–23December. approvalDigest rejects that entire2026 date interval even if a stale ordinary-lunch offer is supplied. Do not substitute holiday meal59733. Native flags for54277: must_pay_directly=false,mandatory_products=false,bullets={}; min2/max9 does not widen the initial exactly-two cap.

Excluded: Lunch Odengatan54065/type5, Middag Odengatan54213/type0, Middag Tennbarens Matsal54214/type0, and paid Sittande Julbord59733/type5. Outdoors is explicitly not reservable on the official site; larger parties require direct contact. No Grill/terrace/group/contact/event fallback. One guest remains unsupported, not silently changed to two.

## Explicit type0 exception and native boundary

The exact immutable tuple includes type0Contract `tennstopet-tennbarens-lunch:54277:v1` and mealLabel. Like existing Dagmar/Klotet exceptions, this is not broad type0 support: changed tuple/marker/room/type/cap fails. Both approval and captured request/booking must bind to54277. The independent receipt must additionally contain `2 pers. (Lunch Tennbarens Matsal)`; other room labels stay unknown. This is a conservative evidence requirement, not a claim that a live receipt has been observed.

canUseAuthFeature=true,testPhone=true,_allow_temp=false,confirm_in_widget=false,custom_request=false,group_bookings=false,linked_meals=[],comment=false,widget_end_time=false,autoplacing_labels=true. Native settings also enable idle_reload_time1 and point idle_reload_url to this hash with version=new&mr=30. Treat reload/selection changes as requiring identity and approval revalidation; do not follow them into another venue or dispatch automatically. No semantics of an unobserved selector30 are invented.

Use existing Agnes/Italiano unauthenticated provider-review flow, not feature-off contact-final. Common guestCtrl2360–2369 sends unauthenticated users toward auth; authenticated Next can submit directly. Native guest continuation returns triggerCompleteY; required confirmation then precedes final confirm/saveBooking. Preserve existing code/contact interception and authenticated-state guard. No contact or code was used to inspect this path.

Initial HTML98 enables native phone;1022–1023 binds input.phoneField to guestPhone. Common client2268/2391–2400 initializes the widget and2306–2316 copies validated native getNumber into booking.phone only on Next. Keep release218 phone projection/re-read, consent, immutable approval, durable journal lock and matching submission AND independent receipt. Status1/2xx/events/redirect alone never confirm. Later card/product/group/waitlist/temp/no-show requirements remain unknown.

## Validation and handoff

Initial HTML SHA256 `79094bb9075219067d611d73128126dee12c85acc722825074911b358ef73091`; it references common app-widget.js?v6.0.3. Previously captured2026-10-17 common source SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5` supplies cited flow lines. All37 receipt tests pass, including two new scoped cases covering party/day/time/Christmas/tuple/other meals and room-label/submission/phone/payment/replay/receipt negatives; existing policies remain passing. Positive evidence is synthetic fixture proof only. git diff --check passes.

Only public official/initial GETs. No holds, reservations, contacts, codes, payments, capability reads or restaurant messages. Owner32d5 owns catalog/registry/server/UI/release: integrate exactly-two named dining room and schedule/holiday restrictions, preserve label and idle-reset guards, run the actual provider-review app/journal/phone harness before activation. Interactive native path, slots and real success remain unobserved. Sole new candidate/handoff, no engine change.
