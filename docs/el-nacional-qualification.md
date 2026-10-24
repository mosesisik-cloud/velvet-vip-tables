# El Nacional Bordeaux — weekday lunch for two

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939;refs #129. Base public297. Sole integrator32d5 deduplicated/reserved curated-BOD-el-nacional, ZENCHEF_EL_NACIONAL_BORDEAUX, VELVET_ZENCHEF_EL_NACIONAL_BORDEAUX in existing BOD/Bordeaux. This delivery is provider/test/fixture/docs only; shared integration and release remain with32d5.

## Own source and identity

https://www.elnacional.fr/ returned200 at2026-10-24T11:00:23.922Z,85765bytes,SHA256d4e3ff68f60e08b7df3fa36f0506c76cd1de73e8cb30321761b17923d22a4046. Its main Réserver navigation explicitly links https://bookings.zenchef.com/results?rid=385074&pid=1001. The own site advertises weekday lunch12–14 and separate Saturday hours; this scope is weekdays only. Own address23bis rue Rode; provider address23 Rue Rode,33000 Bordeaux,phone+33556792276. Preserve the source distinction, not a different venue inference.

Exactly one27October2026/pax2 results GET returned200,162660bytes,SHA2567bb4175152def925913a8e639d0b57400ab69c700aed02e6a93f2fad90aca7ca. One original empty12:00form GET returned200,163526bytes,SHA256c8a1c5071423537570fda76fb0e63b35dabafdafa1eab7f888a7023944c3910a. Exact URLs/times and safe full state in scripts/fixtures/el-nacional-source.json. Raw/source/native/provider evidence under workspace evidence/el-nacional.

## Own bound contract

Exactly2guests,Monday–Friday,lunch461043 Déjeuner,eight normal available slots12:00–13:45 every15minutes. Confirmationfalse/until8 qualifies2for automatic confirmation. Charge/prepaymentnull,cancellation10800seconds relative to shift. Openingnull for shift/allslots. Each slot closes at its own start; shift closes13:45. Only proven closing-date prefixes normalize; null opening is pinned. No borrowed Bouchon policy,11:50cutoff,opening,offers or staff notices. Dinner462781 and weekends excluded.

Optional room configuration:hasRoomSelection=true,isRoomMandatory=false,wish.room_id=null. Original form reaches contact with no room field/selection. Complete room metadata pinned:130149Salle principale,1321361er étage,132137Terrasse Parvis,132249Terrasse facade,139173COPY,132257Plan de test. Only observed bookable/available-room IDs130149/132137/132249 accepted in availability maps; unknown/test-room expansion fails closed. No room is submitted or promised. Ordinary two-person availability remains dynamic; no waitlist use. Offers/customfields empty,voucherParam absent,no gift DOM. Native contact has no sitting-end label; internal capacity values do not create an invented duration promise.

Full French global notice remains before consent:groups above12contact the restaurant,and table held until15minutes after arrival time. Lunch/day commentsnull. Full metadata/shift/slot fingerprinting includes room labels,fields,notice,capacity,confirmation,cancellation and opening. Changes block before review/send. Query binds exactrid/pid/date/pax. Durable attempt plus independent receipt required;POSTecho alone cannot confirm a booking.

## Verification

node --test scripts/test-zenchef-el-nacional.mjs:5/5PASS with8synthetic browser scenarios. Own identity/Bordeaux destination,eight times,foreign query,party/shift scope,field/room/gift/card/notice/opening/capacity drift,per-slot future expiry,wrong grant,denied journal,receipt mismatch andduplicate prevention covered. The synthetic transport uses fictitious contact data and local responses only.

Original unmodified buildb59e3e3c70 replay at390/1366PASS.27exact client asset references allreused byURL/hash. Mobile screenshot inspected. Actual Velvet provider adapter reaches original empty contact and passes verifyNativeRoom;fullnotice checked in terms. All replay requests locally fulfilled or aborted. Live activity limited to ownroot,one results andone emptyformGET;no real contact filling,consent,booking,hold,payment,providerPOST,restaurant contact or bypass. Actual supplier-confirmed booking remains untested.
