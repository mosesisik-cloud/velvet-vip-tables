# VELVET — VIP-bord. Delad lyx. 🥂

**Boka VIP-bord, cabanas och daybeds på världens främsta klubbar och beach clubs — och dela kostnaden med ditt sällskap.**

Byggd på datasetet *Luxury Experience Venue Master*:
30 destinationer · 120 handplockade lyxställen (Hï Ibiza, Scorpios Mykonos, Nammos, Nikki Beach Dubai …).

Ren statisk SPA — HTML/CSS/vanilla JS (ES modules), inga ramverk, ingen build-step. Svensk UI, premium dark/gold-design (Playfair Display + Inter).

## Nytt i V2

- **Onboarding** — helskärms-entré i två steg (land → destination) vid första besöket; valet sparas som hem-destination, förfiltrerar utbudet och kan bytas när som helst via destinationsväljaren i navigationen ("Visa allt" hoppar över). Direktlänkar (`#/venue/…`, `#/join/…`) blockeras aldrig.
- **Platstjänster** — frivillig "Använd min plats" (Geolocation API): haversine-avstånd till närmaste destination med ett-klicks-val, och "~X km"-avstånd på destinationskort, detaljvy och i onboardingen. Positionen sparas endast per session (`sessionStorage`); nekad behörighet/timeout ger felmeddelande + manuellt val, aldrig krasch.
- **Prisklasser (€–€€€€)** — deterministiskt härledda ur billigaste paketets mock-pris, kalibrerade så alla fyra klasser förekommer i datat; guld-piller på kort/detaljvy/bokningsmodal, prisklassfilter och "Lägst från-pris"-sortering i ställe-browsern.
- **Riktiga venue-bilder** — bilder hämtade från ställenas egna officiella hemsidor (84 av 120, validerade); 16:9-toppbild på korten och 21:9-hero på detaljvyn med mörk gradient-overlay. Saknas bild (eller vid laddningsfel) visas gradient-emblemet som fallback. Kortbilder lazy-laddas; detalj-heron laddas eagert med `fetchpriority=high` (LCP).
- **Ambient hero-video** — stämningsvideo på startsidan (Pexels, fri licens), monteras efter första paint så LCP inte påverkas; `prefers-reduced-motion` ger stillbild, fel faller tillbaka till gradienten.
- **Webbverifierade sociala länkar** — alla 120 ställens Instagram-handles kontrollerade mot webben (rättade/borttagna vid behov) och visade som `@handle` i guldtonade piller; belagda TikTok- och Facebook-länkar på detaljvyn.
- **Apple-nivå-polish** — sekvenserade entré-animationer i onboardingen, hover-zoom på bildytor, guld-pin på destinationsväljaren, 44 px touchytor, safe-area-insets och `100dvh` på mobil.

*Disclaimern:* bilder och video tillhör respektive ställe/fotograf (bilder från ställenas egna hemsidor, hero-video från Pexels under fri licens) och används här som förhandsvisnings-mockup — inte i kommersiell drift.

## Funktioner (från V1)

### Utforska
- **Destinationsutforskare** — 30 marknader med tier, säsong och lyx-score, sorterade efter tier + lyxnivå
- **Destinationsdetaljvy** (`#/destination/<code>`) — hero med gradient-emblem, score-mätare (lyx/party/delbarhet), use case-taggar, strategisk not och alla ställen på destinationen; "Visa i listan" förifiltrerar ställe-listan
- **Ställe-browser** — sök + filtrera på destination, kategori, verifieringsstatus och prisklass; sortera på prioritet/lyx/från-pris/A–Ö; live-räknare med `aria-live`
- **Ställe-detaljvy** (`#/venue/<id>`) — venue-bild, guldmätare för alla scores, fakta, direktlänkar (hemsida/Instagram/TikTok/Facebook/källa) och boknings-CTA med "från-pris"

### Boka & dela
- **Bokningsflöde** — datum (ej bakåt i tiden), paket (daybed / cabana / VIP-bord / front row, deterministiska mock-priser från venue-scores) och sällskapsstorlek (1–20)
- **Gästinbjudningar** — bjud in sällskapet med namn + e-post (validerad), chips-lista, synkas mot antal personer; mock, inga mejl skickas
- **Kostnadsdelning** — priset splittas automatiskt per person i realtid
- **Dela bokning** — kopiera inbjudningslänk (`#/join/<base64url>`, ingen backend); mottagaren ser en inbjudningsvy och kan gå med via "Jag är med"
- **Mina bokningar** — sparas lokalt (`localStorage`), med per person-andel, gästlista, delning och avbokning; badge i nav visar antal

### Robusthet & kvalitet
- **Router** — hash-baserad med parametriserade rutter, trasiga `%`-sekvenser kraschar inte, okänd rutt → 404-vy
- **Laddning/fel** — spinner vid start, felvy med "Försök igen" vid fetch-fel, defensiv localStorage (korrupt data filtreras, quota-fel → toast)
- **Tillgänglighet** — skip-link, fokus-fälla + fokusåterställning i modaler och onboarding, radiogroup med piltangenter, guld-fokusringar, `aria-live` för dynamiskt innehåll (inkl. persistent live-region för geo-status), AA-kontrast, `prefers-reduced-motion`
- **Mobil** (<720 px) — hamburgermeny, horisontellt scrollbar filterrad, 1-kolumns grid, fullskärmsmodaler, 44 px touchytor

## Kör lokalt

Ingen build behövs — ren statisk sajt:

```bash
npx serve .
```

eller valfri statisk server (filerna läser JSON via `fetch`, så `file://` fungerar inte direkt). Standardadress i utveckling: `http://localhost:4173`.

## Struktur

```
index.html              # Skal: nav, main, footer, onboarding-root, modal-root
css/app.css             # Premium dark/gold-tema + responsivt + a11y
js/app.js               # SPA: router, vyer, onboarding, geo, bokning, delning, localStorage
data/destinations.json  # 30 destinationer (med lat/lng för avstånd)
data/venues.json        # 120 venues enligt App Import Schema (inkl. sociala länkar)
data/venue-images.json  # venue_id → bild-URL från ställets egen hemsida (84/120)
```

## Rutter

| Rutt | Vy |
|---|---|
| `#/` | Start (hero med video, stats, launch-destinationer, toppställen) |
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
`research_status`, `priority_score`, `instagram_url`/`tiktok_url`/`facebook_url` m.m.
Destinationer har dessutom `lat`/`lng` för avståndsberäkning.

## Roadmap

- [x] Inbjudningar till sällskapet (dela bokning via länk) — V1, lokal/mock
- [x] Onboarding med hem-destination + platstjänster — V2
- [x] Prisklasser och prisfilter — V2
- [x] Riktiga venue-bilder och verifierade sociala länkar — V2
- [ ] Riktig backend (bokningar, konton, betalning/split via t.ex. Swish/Stripe)
- [ ] Riktiga e-postinbjudningar till gäster
- [ ] Venue-partnerportal (inventarie i realtid)
- [ ] iOS/Android-app

---

*Research-dataset: priser är indikativa mockar beräknade från venue-scores — inte riktiga priser.*
