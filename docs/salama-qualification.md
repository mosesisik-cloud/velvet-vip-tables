# Salama: conflicting primary booking instructions

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939,24October2026, refs #129. Existing catalogue osm-STT-salama. No implementation or runtime changes.

https://www.salama-saint-tropez.com/ redirects301 to its own /fr/ page, which returns200. Its reservation section explicitly states `Les réservations s'effectuent uniquement par téléphone`, links +33494965293, and lists20:00/22:30. The same HTML includes the Zenchef SDK and config data-restaurant352861,data-open2000,data-langfr.

This is a current primary-source contradiction, not absence of a widget and not proof that its technical endpoint cannot work. The prior catalogue external-link entry does not establish that online booking is currently accepted. Stop without a provider query, form, telephone call or message. Do not present a completed online integration until new primary evidence resolves the telephone-only instruction. No existing provider contract was assumed.

Exact metadata is in docs/evidence/salama-source.json. Raw local files are under workspace evidence/salama/. Official page212741bytes SHA2560a9e20b572844a027cb686d45d4c78f2de4694b572676cdbf1fb10656ef1dcee. No actual reservation, hold or payment, and no new engine.
