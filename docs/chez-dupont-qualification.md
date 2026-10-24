# Chez Dupont restaurant — weekday lunch for two

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939;refs #129. Base public298. Reserved by32d5:curated-BOD-chez-dupont / ZENCHEF_CHEZ_DUPONT / VELVET_ZENCHEF_CHEZ_DUPONT. Restaurant45 rue Notre Dame,33000 Bordeaux,+33556814959,not hotel2RueCornac/+33695157737. Four provider/test/fixture/docs files only;32d5 owns shared integration/release.

Own https://www.chez-dupont.com/fr/la-table/ returned200,51747bytes,SHA2565960aa97f7e835b764f935f574975b0a93dd0b8e991ce5d1869ced282e41f82f. Exact config restaurant388882/langfr with SDKv1. Locally executing saved original SDK19582bytes/SHAf5ec269f8bb0d928001b2ef06de94b126498c88905586e3a5a328b7a491fc86c produces https://bookings.zenchef.com/results?sdk=1&withCloseButton=1&rid=388882&lang=fr&showCollapsed=1. No pid or Guestonline link inferred. SDK entry discovery blocks all external requests except locally fulfilled SDK.

One27October2026/pax2 GET of that generated entry returned200,166084bytes,SHA701cd09ddb5d1b218df2c5158fd6b1e3e31f63f96a2d0150a859fd0fb73b5585. One empty12:00form GET returned200,166950bytes,SHAb89398d5a0b481d0150f593d884daf69272d397da1b8d9c9332bd6cfee76451e. Original client buildb59e3e3c70;27exact asset references allreused byURL/hash. Raw source/native/provider/SDKentry evidence in workspace evidence/chez-dupont. Safe full state and exact source metadata in scripts/fixtures/chez-dupont-source.json.

## Bound contract

Exactly2guests,Monday–Friday,lunch557651 Déjeuner.19raw slots12:00–16:30;16available slots excluding13:00/13:15/13:30. All16explicitly represented in venue scope,with live counts still required. Own restaurant advertises continuous service Monday–Saturday12–23 and Sunday12–16; this implementation excludes weekends and dinner557652. Auto true/null,nocharge/prepayment,cancellation10800seconds relative to shift. Every slot and shift cutoff11:30local. Exact opening2026-07-29 13:00:00 pinned; no rolling-window inference. Date normalization only applies to proven same-day closing prefix.

Full restaurant metadata,shift and all19slot policies pinned. No room selection,offers,customfields,gift DOM,voucherParam or partner_id. Full French notice preserved with its CRLF line breaks:terrace preference may be requested in restaurant message and call if times do not fit. No terrace reservation is promised or message automatically supplied. Lunch/day commentsnull. Native client displays no sitting-end label; no duration invented.

The SDK starts collapsed. A dedicated own openChezDupontForm validates identity,exact query,selected date/time,entire policy,room/offer absence and original SDK state before clicking the real Réserver une table launcher. It does not force application state. Contact form revalidation,terms version,own query,payload bounds and durable attempt/independent receipt guards apply before approval/send; POSTecho is not confirmation.

## Validation

node --test scripts/test-zenchef-chez-dupont.mjs:5/5PASS including8synthetic browser scenarios with the collapsed launcher. Tests cover own identity/Bordeaux,16times,query and party bounds,full policy/opening drift,gift/room/field/notice drift,fixedcutoff across dates,wrong grant,deniedjournal,receiptmismatch andduplicateprevention.

Original unmodified client replay at390/1366PASS. Actual Velvet provider adapter against original client reaches empty contact and passes verifyNativeRoom,with complete own notice. All replay requests locally fulfilled or aborted. No live contact fill,consent,booking,hold,payment,OTP,providerPOST,restaurant contact or bypass. Fictitious contact and submissions occur only in separate local synthetic tests. Real supplier-confirmed booking remains untested.
