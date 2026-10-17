# Restaurang Hantverket ordinary Lunch

Reviewed2026-10-18 on main `2619a92064f784d8d80a58010422efcdbe515631` (release223). Owner32d5 checked absence and reserved `curated-STO-hantverket`. Official identity Restaurang Hantverket, Sturegatan15,11436 Stockholm; exact provider name `Restaurang Hantverket`.

## Official entry and supported Swedish rendering

[Official English reservations page](https://restauranghantverket.se/en/reservations) links `https://app.bokabord.se/reservation/?hash=f7f00569986df77ef5d7b4abe98b9bed&version=new&lang=en`. Keep this exact official entry as provenance. Existing mirror/receipt logic is Swedish, so do not silently point it at English and expect Swedish headings.

Actual English initial HTML publishes a Swedish anchor `/reservation/?&app_type=&lang=sw&{{getWidgetQueryUrl()}}`. Its line151 qs contains hash,version=new and default date, without lang. Common client954–972 returns that query (adjusting selected meal/date when appropriate); reloadLanguage982–984 separately implements the same hash+lang switch. Thus lang=sw is a source-supported native language choice, not a guessed parameter. A bounded public GET at same hash/version with lang=sw verified Kontaktuppgifter (909/946), Kontrollera din bokning (1653/1969) and Slutför bokningen (2009–2011). The default current date in initial qs is not a booking offer and must not become a fixed runtime date.

32d5 should preserve official English entry and use this verified Swedish language mode for the existing adapter, including response/receipt navigation. No English receipt exception is added. If actual final receipt is English or has unrecognized copy, the existing verifier remains unknown.

## Exact ordinary Lunch scope

HANTVERKET_LUNCH_RECEIPT_POLICY: hash `f7f00569986df77ef5d7b4abe98b9bed`, Lunch7097/type2, maxParty2. Native must_pay_directly=false,mandatory_products=false,bullets={}, max7/min0unset; date0/dateto0; weekends disabled;11:30–14:00. Policy conservatively allows weekdays11:30 inclusive–14:00 exclusive for1–2; exact tuple required. Actual slots remain provider supplied and unobserved. Sunday closed on the official site agrees with the narrower native weekday lunch scope.

Exclude dinner7098/type3 (paymentflagtrue; its description includes dining-room/kitchen-bar alternatives) and Spritbordet7103/type0 (paymentflagtrue, explicit card, communal cocktail menu). Lunch description makes no guaranteed room claim, so do not infer matsal or kitchen-bar allocation. No fallback to another operation or arrangement.

Official online limit7 and larger-group direct contact remain outside initial1–2 scope. Official instructions require guests to notify stroller/dog when booking. Native comment=true supports the existing comment field: surface this instruction, let the guest include the information, display it in review and bind/transmit that exact approved comment. Do not fabricate additional provider fields or send an extra message. This policy does not independently collect or infer whether a guest has a dog/stroller.

## Guest boundary and retained protections

canUseAuthFeature=true,testPhone=true,_allow_temp=false,confirm_in_widget=false,custom_request=false,group_bookings=false,linked_meals=[],separated=true,widget_end_time=true,autoplacing_labels=true,idle_reload_time0. Use existing Agnes/Italiano unauthenticated provider-review route, preserve actual placement labels and native meal choice. Common2360–2369 sends unauthenticated Next to auth; authenticated Next can submit directly. Guest continuation returns triggerCompleteY and final confirm invokes saveBooking. Keep code/contact interception and the authenticated direct-submit guard; no contact/code probe was performed.

Native .phoneField/guestPhone is copied via validated iti.getNumber only on Next (common2268,2306–2316,2391–2400). Preserve phone projection/re-read, exact comment/details approval, fresh consent, durable journal locking, matching submission and independent receipt. No confirmation from2xx/status1/redirect/events alone; later card/no-show/product/group/waitlist/temp stays unknown.

## Evidence and validation

English initial SHA256 `c0fae0926f0130b50965705a35b8d5e2a06abfc5bf8b7379775cf29b23d83792`; verified Swedish initial SHA256 `0dcf49f2a1f6722885f31115cd116dc3369d8f401a81a724d552b867cbd5029c`. Common v6.0.3 source captured2026-10-17 SHA256 `ac75bf9af7515871475d57d09b4ba962fa854613fe01d8d635c751e1b5ffead5` supplies cited flow. All42 receipt tests pass: scoped tuple/party/day/time/excluded-meal checks, later requirements/replay/phone/receipt, and explicit approved stroller/dog comment survives submission while dropping it yields unknown. Existing policies remain passing. Positive receipts are synthetic fixtures. git diff --check passes.

Only bounded public official/initial/language GETs. No contacts,codes,holds,bookings,payments,capability reads or restaurant messages. Zero new real final bookings. Actual interactive Hantverket flow/availability remain unobserved. Owner32d5 owns catalog/registry/server/UI/release and must verify Swedish route, comment visibility/binding and full provider-review app/journal/receipt harness before activation. Sole candidate, no new engine/shared runtime edits.
