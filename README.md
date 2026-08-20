# VELVET — VIP-bord. Delad lyx. 🥂

**Boka VIP-bord, cabanas och daybeds på världens främsta klubbar och beach clubs — och dela kostnaden med ditt sällskap.**

Första version (V1) byggd på datasetet *Luxury Experience Venue Master V1*:
30 destinationer · 120 handplockade lyxställen (Hï Ibiza, Scorpios Mykonos, Nammos, Nikki Beach Dubai …).

Ren statisk SPA — HTML/CSS/vanilla JS (ES modules), inga ramverk, ingen build-step. Svensk UI, premium dark/gold-design (Playfair Display + Inter).

## Funktioner (V1)

### Utforska
- **Destinationsutforskare** — 30 marknader med tier, säsong och lyx-score, sorterade efter tier + lyxnivå
- **Destinationsdetaljvy** (`#/destination/<code>`) — hero med gradient-emblem, score-mätare (lyx/party/delbarhet), use case-taggar, strategisk not och alla ställen på destinationen; "Visa i listan" förifiltrerar ställe-listan
- **Ställe-browser** — sök + filtrera på destination, kategori och verifieringsstatus; sortera på prioritet/lyx/A–Ö; live-räknare med `aria-live`
- **Ställe-detaljvy** (`#/venue/<id>`) — guldmätare för alla scores, fakta, direktlänkar (hemsida/Instagram/källa) och boknings-CTA med "från-pris"

### Boka & dela
- **Bokningsflöde** — datum (ej bakåt i tiden), paket (daybed / cabana / VIP-bord / front row, deterministiska mock-priser från venue-scores) och sällskapsstorlek (1–20)
- **Gästinbjudningar** — bjud in sällskapet med namn + e-post (validerad), chips-lista, synkas mot antal personer; mock i V1, inga mejl skickas
- **Kostnadsdelning** — priset splittas automatiskt per person i realtid
- **Dela bokning** — kopiera inbjudningslänk (`#/join/<base64url>`, ingen backend); mottagaren ser en inbjudningsvy och kan gå med via "Jag är med"
- **Mina bokningar** — sparas lokalt (`localStorage`), med per person-andel, gästlista, delning och avbokning; badge i nav visar antal

### Robusthet & kvalitet
- **Router** — hash-baserad med parametriserade rutter, trasiga `%`-sekvenser kraschar inte, okänd rutt → 404-vy
- **Laddning/fel** — spinner vid start, felvy med "Försök igen" vid fetch-fel, defensiv localStorage (korrupt data filtreras, quota-fel → toast)
- **Tillgänglighet** — skip-link, fokus-fälla + fokusåterställning i modaler, radiogroup med piltangenter, guld-fokusringar, `aria-live` för dynamiskt innehåll, AA-kontrast, `prefers-reduced-motion`
- **Mobil** (<720 px) — hamburgermeny, horisontellt scrollbar filterrad, 1-kolumns grid, fullskärmsmodaler, 44 px touchytor

## Kör lokalt

Ingen build behövs — ren statisk sajt:

```bash
npx serve .
```

eller valfri statisk server (filerna läser JSON via `fetch`, så `file://` fungerar inte direkt). Standardadress i utveckling: `http://localhost:4173`.

## Struktur

```
index.html              # Skal: nav, main, footer, modal-root
css/app.css             # Premium dark/gold-tema + responsivt + a11y
js/app.js               # SPA: router, vyer, bokning, delning, localStorage
data/destinations.json  # 30 destinationer (från Excel-master)
data/venues.json        # 120 venues enligt App Import Schema
```

## Rutter

| Rutt | Vy |
|---|---|
| `#/` | Start (hero, stats, launch-destinationer, toppställen) |
| `#/destinations` | Alla destinationer |
| `#/destination/<code>` | Destinationsdetalj |
| `#/venues` | Ställe-browser med filter |
| `#/venue/<id>` | Ställe-detalj |
| `#/bookings` | Mina bokningar |
| `#/join/<payload>` | Inbjudningsvy (delad bokning) |
| övrigt | 404-vy |

## Datamodell

Följer `App Import Schema` från Excel-mastern: `venue_id`, `destination_code`, `category`,
`vip_table_potential`, `shareable_format`, scores (luxury/party/shareability/booking),
`research_status`, `priority_score` m.m.

## Roadmap

- [x] Inbjudningar till sällskapet (dela bokning via länk) — V1, lokal/mock
- [ ] Riktig backend (bokningar, konton, betalning/split via t.ex. Swish/Stripe)
- [ ] Riktiga e-postinbjudningar till gäster
- [ ] Venue-partnerportal (inventarie i realtid)
- [ ] iOS/Android-app

---

*V1 research-dataset: priser är indikativa mockar beräknade från venue-scores — inte riktiga priser.*
