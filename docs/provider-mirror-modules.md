# Playwright-spegelmoduler för bokningsleverantörer — genom Velvet

Velvet visar varje leverantörs riktiga bokningsformulär från en isolerad Chromium-session. Klick och scroll går genom Playwright; bilden verifieras med SHA-256 före visning. Alla moduler delar kärnan `api/mirror-base.mjs` (sessionsägarskap, revisioner, kapacitet, TTL, nätverksvakt, armerat inlämningsprotokoll) — samma modell som Bokabord-piloten.

## Moduler och status 2026-10-24

| Leverantör | Modul | Register | Renderar i spegeln | Skarp inlämning |
|---|---|---|---|---|
| SevenRooms | `api/sevenrooms-mirror.mjs` | 2 krogar (La Sponda, Plénitude) | ✅ verifierat | ✅ byggd med fulla vakter (ej testkörd mot leverantör) |
| Zenchef | `api/zenchef-mirror.mjs` | 13 krogar | ✅ verifierat (Septime) | ✅ kontrakt observerat 2026-10-24 (avbrutna anrop, inget nådde Zenchef utom identitetslös quotation-preview) — fulla vakter aktiverade |
| CoverManager | `api/covermanager-mirror.mjs` | 8 krogar | ✅ verifierat (Lío Ibiza) | ⛔ reCAPTCHA-gateat bokningssteg — kringgås aldrig |
| TableCheck | `api/tablecheck-mirror.mjs` | 5 krogar | ✅ verifierat (Sazón Bali) | ✅ kontrakt observerat 2026-10-24 (cart-anrop avbrutet innan det lämnade webbläsaren) — fulla vakter aktiverade |
| OpenTable | `api/opentable-mirror.mjs` | 8 granskade krogar | ⛔ Akamai blockerade testmiljön (kringgås inte) | ⛔ avstängd |
| Tock | `api/tock-mirror.mjs` | 7 krogar | ⛔ Cloudflare-utmaning i testmiljön (kringgås inte) | ⛔ avstängd |
| TheFork | `api/thefork-mirror.mjs` | 6 krogar | ⛔ DataDome 403 i testmiljön (kringgås inte) | ⛔ avstängd |

Registerfilerna (`api/<leverantör>-mirror-restaurants.json`) är kopior av redan granskade mappningar ur `data/booking-providers.json` respektive `api/providers/opentable-restaurants.json`. Inga delade filer ändras.

## Skydd i alla moduler

- Endast register-URL:er — aldrig gästangivna adresser.
- GET/HEAD mot leverantören och GET mot kända tillgångsvärdar; allt annat misslyckas stängt.
- Leverantörs-POST tillåts aldrig utanför ett armerat godkänt steg; inom det måste varje POST matcha godkännandet fält för fält. Undantag: uttryckligt granskade sessions-scopade läsanrop (`allowReadPosts`, dokumenterade per modul).
- Gästuppgiftssteget stoppar interaktion (`contact_stop`) i inspect-läge.
- Kortgaranti lämnas alltid till leverantörens eget formulär (`card_required`).
- För CoverManager tillåts `update_people`/`update_hours`/`update_hour_people`/`update_extra`/`update_extra_message`/`ibox2`/`highlight`/`interactiveMap` som läs-POST:ar — de speglar val i widgetsessionen och skapar ingen reservation (observerat 2026-10-24). Bokningsgaten `/reservs/avaible_reserv_module` är reCAPTCHA-skyddad och passerar aldrig.
- För TableCheck tillåts `calendar`/`menu_items`/`meals_v2`-läsningar (datum+antal, ingen identitet). Boknings-cart skapas aldrig i testläge.

## Kör lokalt

```sh
npm ci
npx playwright install chromium
node --test api/test-sevenrooms-mirror.mjs api/test-provider-mirrors.mjs
node scripts/check-provider-mirror.mjs zenchef curated-PAR-septime "SEPTIME"
PROVIDER=zenchef node scripts/preview-provider-mirror.mjs   # http://127.0.0.1:4176
```

Kontraktsfångst (metod): `scripts/capture-zenchef-contract.mjs` — alla leverantörs-POST:ar avbryts i webbläsaren innan de lämnar sidan; payloadar loggas bara.

## Vidare arbete (separata samordningsbehov)

1. Första godkända skarpa körningen per leverantör (SevenRooms/Zenchef/TableCheck) med uttryckligt godkännande per bokning, som i Bokabord-piloten.
2. CoverManager kräver leverantörens medverkan (reCAPTCHA).
3. OpenTable/Tock/TheFork kräver en nätverksmiljö utan anti-bot-blockering eller leverantörssanktionerad testaccess. Blockering är inte bevis på stängd restaurang.
4. Produktionswiring (server.mjs, ledger, gäst-cookie, historik) tillhör integratören/releaseägaren.
