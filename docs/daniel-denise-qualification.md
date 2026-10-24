# Daniel & Denise: separate branch qualification

Owner codex-worker-cbfe5665-79ca-415d-91ac-5c184e516939,24October2026. Refs #129. No runtime/provider/catalog changes.

Own https://danieletdenise.fr/reserver/ returned200,109315bytes,SHA256b2b46a38fa265c0654a9053faf9d2e19ca0b579a7c84d7939f67bb201b232b21. Each named heading has its own address, telephone and exact booking link. The nearby L'Épicerie block is not used. Sequential checks followed the assigned order, advancing only after each branch's own blocker was established. One27October2026/pax2 results request per branch; no empty form or transaction.

| Branch | Own identity | Exact own entry | Result |
|---|---|---|---|
| Créqui |156 rue de Créqui,69003 Lyon,+33478606653|https://bookings.zenchef.com/results?rid=353715&pid=1001|Card guarantee from1guest at25EUR/guest; lunch30731 and dinner30735 both confirmationfalse/null.|
| Saint-Jean |36 rue Tramassac,69005 Lyon,+33478422462|https://bookings.zenchef.com/results?rid=353717&pid=1001|Returned dinner35085 is automatictrue/null but card guarantee still applies from1guest at25EUR/guest. No lunch shift in this response.|
| Croix-Rousse |8 rue Cuire,69004 Lyon,+33478282744|https://bookings.zenchef.com/results?rid=353716&pid=1001|Returned dinner30728 is automatictrue/null but card guarantee still applies from1guest at25EUR/guest. No lunch shift in this response.|

All three own notices explicitly explain the card imprint/no-show guarantee. It is not described as an upfront payment; prepayment is null. The two-person request is above each card threshold. This is outside the assigned no-card scope. Créqui also has the independent manual-confirmation blocker. No shared policy was inferred between branches.

Créqui lunch cancellation86400seconds references booking; its dinner cancellation references shift. Saint-Jean and Croix-Rousse cancellation86400seconds references shift. All full slot policies and original notices are preserved, including Créqui's19:00/19:15 tables vacated by21:00, Saint-Jean's Saturday19:00 tables vacated by21:00, and Croix-Rousse's Friday/Saturday19:00/19:30 tables vacated by21:15. None is borrowed for another service or branch. Saint-Jean's full offer catalogue remains unselected and retained without assuming its menu contract applies elsewhere.

Result SHA256:

- Créqui158572bytes:7032be38995da90670a80bacb195bec980a37769501c0d79d115ff09f184d2c7.
- Saint-Jean252986bytes:30ad259d41581765a90d74cb79fde2b3ccf4a3ec365fa391664299602a7e8ebd.
- Croix-Rousse153571bytes:2c15e29ca96c3b1d7f793e726be536d78e7db3b6e2a39968c330a6ba94877cad.

Exact URLs/timestamps and separate safe full state projections are in docs/evidence/daniel-denise-source.json. Raw source files remain under workspace evidence/daniel-denise, with branch subdirectories. No authentication state is included. No contact, real booking, hold, payment, or attempted bypass. These are documented blockers, not completed integrations; no further duplicate probes are needed without changed primary evidence.
