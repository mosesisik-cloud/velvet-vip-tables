# VELVET — VIP-bord. Delad lyx. 🥂

**Gabbes app.** Skicka en förfrågan om VIP-bord, cabanas och daybeds på världens främsta klubbar — VELVET-teamet tar förfrågan mot klubben — sällskapet kan dela kostnaden om bordet blir bekräftat.

Concierge-förhandsversion. Inte en automatisk bokningsmotor. Knappen ljuger inte.

30 publika destinationer · 120 verifierade lyxställen. Fler städer och klubbar är sökbara när du valt stad — de är ej verifierade och inte i den publika katalogen.

**Live:** https://mosesisik-cloud.github.io/velvet-vip-tables/

Ren statisk SPA — HTML/CSS/vanilla JS, inga ramverk, ingen build-step. Svensk UI, premium dark/gold.

## Vad som är på riktigt i V4

- **V162: Velvet Concierge för Zink.** När live-API:t inte är aktiverat kan gästen välja en tydligt märkt önsketid direkt i Velvet. Servern skapar en riktig, spårbar bokningsförfrågan med referens-ID. Gabbe/Moses ser kontaktuppgifterna i bokningsvyn och kan markera mottagen, bekräftad eller avböjd. En önsketid visas aldrig som ledig och blir aldrig “bokad” innan Zink har bekräftat.
- **V161: enbart native bokning.** Zink-piloten öppnar aldrig BokaBords webbplats, en ny flik eller en inbäddad leverantörssida. Datum, lediga tider, gästuppgifter och bekräftelse får endast visas i VELVETs egna komponenter. Om den officiella WaiterAid-anslutningen inte är aktiv visas ett ärligt anslutningsfel i stället för en extern fallback eller påhittade tider.
- **V157: riktig pilotinloggning.** En godkänd passkey skapar en 180-dagars, återkallelig HttpOnly-session på VELVET-domänen. API:t litar inte längre på ett lokalt användar-id för restaurangbokningar, och sessionen återställs automatiskt efter omladdning eller om appen öppnas igen.
- **V157: Zink live webbridge.** VELVETs server synkar tillgänglighet och slutlig bokningsbekräftelse med Zinks WaiterAid/BokaBord-system. Webbläsaren visar endast VELVETs eget gränssnitt.

- **Förfrågan, inte fake-bokning.** Ni fyller i värd, datum, paket och sällskap. Förfrågan går till VELVET-teamet (Gabbe) via e-post. Bekräftelsen säger *förfrågan skickad* — aldrig att bordet är reserverat.
- **Inga påhittade paketpriser.** Appen visar inte fejkade EUR-paket. Pris kommer från klubbens sajt eller deras svar. Evenemang hämtas från officiella kalendrar.
- **Google-recensioner.** Betyget på stället är Google (stjärnor + antal) när profilen är matchad. Recensionerna öppnas på Google Maps — vi visar inte en siffra om kanalen inte stämmer. VELVET-research är intern och märkt som inte Google.
- **Fakta från klubbsajten.** Firecrawl hämtar adress, tider, klädsel, ålder, VIP-väg och hur man tar sig dit — bara det som står på den officiella sajten.
- **Daglig Firecrawl.** `velvet-api` kollar ställenas sajter en gång per dygn (VIP-kalendrar via Firecrawl, övriga via JSON-LD/HTML). Appen hämtar `/velvet-api/events` live — ingen omdeploy. Gabbe/Moses kan klistra in `FIRECRAWL_API_KEY` under Konto och köra crawl nu.
- **Katalog.** 120 webbverifierade ställen i den publika listan. Ytterligare klubbar per stad (Amnesia, Berghain, Hakkasan …) är **ej verifierade** och syns bara när du söker på staden. Inga påhittade IG-konton på dem.
- **PWA.** Installerbar från Chrome, offline-skal, VELVET-offline-sida.
- **Delning.** Inbjudningslänk, kopiera chatt-text, `.ics` till kalendern, favoritlista som länk.
- **Karta, geo, onboarding, sök (`/`).**

## Funktioner

### V3 — karta, PWA, favoriter, sök, kalender (slut-QA 2026-09-07)
- **Interaktiv karta** (`#/map`): Leaflet lazy-laddad från CDN (SRI-verifierad), OpenStreetMap-tiles med CSS-mörkfilter i appens tema (CARTO dark_all kräver numera API-nyckel), 38 guldnålar med mörka popups, "Nära mig"-geolocation, tangentbordsnåbara markörer och ett list-läge ("Lista istället för karta") för skärmläsare — valet minns. Mini-karta på destinationsdetaljen med venues i ring (ungefärliga positioner, sägs rakt ut).
- **PWA**: installerbar från Chrome (manifest + ikoner + stabil `id`), service worker med shell-/runtime-cache och offline-sida.
- **Favoriter**: hjärta på kort och detaljvy (aria-pressed), favoritvyn `#/favorites`, delbar lista `#/list/<data>` med personligt listnamn.
- **Delbara filter**: pris/stad/kategori/sort speglas i hashen (`#/venues?dest=Ibiza&pris=4`) — bakåt/framåt vandrar mellan filterlägen.
- **Global snabbsök**: `/` eller förstoringsglaset, combobox med piltangenter, aria-live-träffräknare, fullskärm på mobil, fokusretur vid Escape.
- **Bokningsmodal i 3 steg** (1 Datum · 2 Paket · 3 Sällskap): klickbar stegindikator med progressbar, live-sammanfattning ("VIP-bord · 21 sep · 4 pers · …"), datumvalidering.
- **Kalender & delning**: RFC 5545-korrekt `.ics` (radvikning, escaping, GEO, delningslänk), kopiera inbjudningstext med kopierad-feedback, mailto.
- **Social-CTA**: stort Instagram-kort med @handle på detaljvyn, TikTok/Facebook som sekundära kort — IG-URL:erna är live-verifierade och rörs aldrig.
- **Från-pris-kalkylator** på detaljvyn när ett officiellt prissatt paket finns — annars ärlig "Pris enligt klubben".

### Utforska
- Onboarding land → destination, platstjänster, destinationsväljare
- Destinationsvyer + interaktiv Leaflet-karta (`#/map`)
- Ställe-browser med sök, filter, prisklasser och delbar hash (`#/venues?dest=Ibiza`)
- Global snabbsök (`/` eller förstoringsglaset)
- Venue-detalj med IG-skyltfönster, från-pris-kalkylator och hjärta
- Direkt till varje ställe egen bokningssajt (`#/book-site/…`) — officiell VIP-path där den finns, annars hemsidan. Inbäddning + ny flik. VELVET tar inte betalt där.
- **Kontakt i appen.** Varje ställe visar allt som finns i katalogen: officiell bokning, hemsida, Instagram (119/120), TikTok, Facebook, Google/Apple Maps på namn+stad, dela-länk och promoter-chat. Inga påhittade telefonnummer — klubben publicerar dem på sin sajt.
- Sällskap per bord (`#/table/…`): öppna stolar så andra kan hoppa in. Varje deltagare är en social profil (Facebook/Instagram/TikTok/Snapchat). Passverifierade syns som verified. Betald/ej betald syns för alla.
- Betalning till internationellt Revolut-konto (`#/pay/…`). Kort, Apple Pay, Google Pay, Revolut Pay, PayPal, Klarna, SEPA och SWIFT. Pengarna landar på Revolut Business. Stripe/Revolut Merchant/PayPal-nycklar + IBAN läggs in av Gabbe/Moses under Konto — hemligheter ligger i `pay.json` på servern, inte på GitHub. Betald markeras när providern bekräftar (webhook) eller efter banköverföring med referens.

### Concierge
- Förfrågan med värdens namn + e-post (obligatoriskt)
- Gästlista, indikativ split per person
- Förfrågningar sparas lokalt och skickas till teamet
- Dela länk `#/join/…`, kopiera inbjudningstext, lägg i kalendern

### Resten
- Favoriter + delbar lista `#/list/…`
- Villkor `#/villkor` · Integritet `#/integritet`
- A11y, mobil, 404, defensiv localStorage, service worker

### Skarp inloggning och verifiering

- **Face ID / Touch ID / skärmlås** använder WebAuthn-passkeys. Servern skapar en engångsutmaning och verifierar enhetens signatur; biometrisk data lämnar aldrig telefonen.
- **Google, Apple, Facebook, Instagram, TikTok och Snapchat** går genom respektive leverantörs riktiga OAuth-flöde. Det finns ingen simulerad login eller verifieringsbadge.
- OAuth-callback är `https://b2b.bakemyday.se/velvet-api/auth/callback/<provider>`. Den måste läggas in som godkänd redirect-URL hos varje leverantör.
- Leverantörens klient-ID och secret läggs på servern via operatörsvyn under Konto. Apple använder ett Services ID och en signerad client-secret-JWT.
- Om en leverantör ännu saknar serverkonfiguration går knappen tillbaka till kontosidan med ett tydligt fel; den skapar aldrig ett falskt konto.
- Passkey/OAuth skapar en signerad serveridentitet via en `HttpOnly; Secure; SameSite=Lax`-cookie. Den råa sessionsnyckeln sparas aldrig i databasen, bara SHA-256-hashen.

### V159 · Zink WebBridge

- Zinks tillgänglighet hämtas server-till-server från restaurangens publika BokaBord-widget.
- Datum, tider, kontaktuppgifter och slutlig bekräftelse visas i VELVETs eget gränssnitt. Ingen leverantörssida eller iframe öppnas.
- En bokning markeras aldrig som bekräftad förrän BokaBord har svarat med `success: true`.
- Zinks verifierade 2026-meny finns direkt i VELVET från `data/restaurant-menus.json`.
- Testerna validerar flödet men skapar aldrig en reservation. En skarp bokning kräver att en inloggad gäst själv trycker **Bekräfta riktig bokning**.

### Produktionskrav för V157–V159-piloten

Frontend **och** API måste deployas samtidigt till `https://b2b.bakemyday.se`: statiska filer under `/velvet/` och `api/server.mjs` bakom `/velvet-api/`. GitHub Pages visar gränssnittet men kan inte själv köra WebBridge-anropen. Face ID kan inte testas skarpt på GitHub Pages eftersom en passkey alltid är bunden till domänen där den skapades. Efter deploy testar Gabriel och Moses var sin telefon genom att skapa varsin passkey på VELVET-domänen och genomföra en kontrollerad Zink-bokning med riktiga kontaktuppgifter.

## Kör lokalt

```bash
npx serve -l 4173 .
node api/test-rails.mjs
# daglig crawl (samma jobb som på servern)
node api/crawl-events.mjs
```

Öppna `http://localhost:4173`. `file://` fungerar inte (JSON via `fetch`).

## Team

| Person | Roll | GitHub |
|---|---|---|
| Gabriel (Gabbe) | Produktägare | [gabrielhadodo9602](https://github.com/gabrielhadodo9602) (maintain) |
| Moses | Bygg | [mosesisik-cloud](https://github.com/mosesisik-cloud) (admin) |
| Dan Grant | Inbjuden | [dangrant29](https://github.com/dangrant29) — inbjudan skickad 2026-08-21, väntar på svar |

## Hur Gabbe bidrar via GitHub

Repot är [mosesisik-cloud/velvet-vip-tables](https://github.com/mosesisik-cloud/velvet-vip-tables). Gabbe är inlagd som collaborator.

1. Logga in på https://github.com/login som **gabrielhadodo9602** (inte ett annat konto).
2. Öppna repot. Du ska se knappen **Fork** och kunna redigera filer.
3. Enklast: öppna en fil → pennan → spara till en **ny gren** → **Create pull request**.
4. På MacBook, så GitHub kopplar dina commits till kontot:

```bash
git config --global user.name "Gabriel Hadodo"
git config --global user.email "gabrielhadodo@gmail.com"
```

Om `user.email` är `…MacBook-Air….local` syns inte inloggningen på GitHub.

5. Pusha till en gren (`feature/…`) och öppna PR mot `main`. Mergad `main` är källan Moses deployar till https://b2b.bakemyday.se/velvet/ — en push syns på GitHub direkt, live efter deploy.

## Datamodell

`App Import Schema` från Luxury Experience Venue Master: `venue_id`, `destination_code`, scores, sociala länkar. Destinationer har `lat`/`lng`. Venues saknar egna koordinater — mini-kartan säger rakt ut att nålarna är ungefärliga.

## Roadmap mot riktig drift

- [x] Ärlig förfrågan i stället för fake-bekräftelse
- [x] PWA, karta, favoriter, sök, kalender, villkor
- [ ] Gabbe klickar FormSubmit-bekräftelsen i mejlen (första förfrågan)
- [ ] 5–8 klubbar med manuellt ja (Ibiza / Mykonos först)
- [ ] Stripe/Swish-deposition när första klubben tar emot
- [x] Passkey-konton och serverlagrad Zink-bokningshistorik som överlever byte av vy/enhet
- [ ] Bildlicenser / egna foton — sluta hotlänka klubbsajter i kommersiell drift
- [ ] iOS/Android när concierge-flödet tar betalt

*Bilder och video tillhör respektive ställe/fotograf (Pexels för hero). Förhandsvisning, inte kommersiell licens.*
