# Café du Jura: manual confirmation

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939,24October2026. Refs #129. No runtime, catalogue or provider changes.

Own https://cafedujura.fr/reservations/ directly embeds exactly https://bookings.zenchef.com/results?rid=387082, with no pid. Own page lists Tuesday-Saturday lunch12:00–13:45 and dinner19:30–21:30. Fresh root200,56741bytes,SHA2566b1ed0eac4effd5109f5f84cc15be2f2e91d51156035185ae9d0376a7da2c825. This differs from the earlier master HTML hash, so the fresh worker source is retained separately.

ONE future Tuesday27October2026/pax2 query returned200,154613bytes,SHA2568f5b760573d5bac27be887d5d69116debd11789aad64dce933bab2d24688cb72. Provider identity is Café du Jura,25 rue Tupin,69002 Lyon,phone33478422057, matching the own source. No matching catalogue/rid/provider entry found.

Lunch505393/Déjeuner has six normal two-person starts12:00–13:15 among eight raw slots;13:30/13:45 are empty. Its confirmation is explicitly `is_auto:false,is_auto_until:null`. Dinner505394 has the same manual-confirmation policy. This blocks the assigned automatically confirmed scope, even though charge and prepayment are null. No empty form or further provider query was made.

Lunch closes for booking at11:45, opening null; cancellation10800seconds relative to shift. Global and shift French notices direct parties above12 to telephone/email; no contact was made. Provider dinner window19:00–21:45 differs from the own-site dinner wording and is retained as observed, not reconciled by assumption. No room selection, offers or custom fields. Full raw slot and shift policy, multilingual name translations, all notices, room metadata and exact query are retained in docs/evidence/cafe-du-jura-source.json without authentication state. Raw originals reside in the workspace evidence/cafe-du-jura directory.

No real reservation, hold, payment or restaurant message. Do not reinterpret manual confirmation as automatic or repeat this probe without changed primary evidence. The result is a documented qualification blocker, not a new in-app booking integration.
