# VELVET — VIP-bord. Delad lyx. 🥂

**Gabbes app.** Skicka en förfrågan om VIP-bord, cabanas och daybeds på världens främsta klubbar — VELVET-teamet tar förfrågan mot klubben — sällskapet kan dela kostnaden om bordet blir bekräftat.

Concierge-förhandsversion. Inte en automatisk bokningsmotor. Knappen ljuger inte.

30 publika destinationer · 120 verifierade lyxställen. Fler städer och klubbar är sökbara när du valt stad — de är ej verifierade och inte i den publika katalogen.

**Live:** https://mosesisik-cloud.github.io/velvet-vip-tables/

Ren statisk SPA — HTML/CSS/vanilla JS, inga ramverk, ingen build-step. Svensk UI, premium dark/gold.

## Vad som är på riktigt i V4

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
| Gabriel (Gabbe) | Produktägare | [gabrielhadodo9602](https://github.com/gabrielhadodo9602) (write) |
| Moses | Bygg | [mosesisik-cloud](https://github.com/mosesisik-cloud) (admin) |
| Dan Grant | Inbjuden | [dangrant29](https://github.com/dangrant29) — inbjudan skickad 2026-08-21, väntar på svar |

## Datamodell

`App Import Schema` från Luxury Experience Venue Master: `venue_id`, `destination_code`, scores, sociala länkar. Destinationer har `lat`/`lng`. Venues saknar egna koordinater — mini-kartan säger rakt ut att nålarna är ungefärliga.

## Roadmap mot riktig drift

- [x] Ärlig förfrågan i stället för fake-bekräftelse
- [x] PWA, karta, favoriter, sök, kalender, villkor
- [ ] Gabbe klickar FormSubmit-bekräftelsen i mejlen (första förfrågan)
- [ ] 5–8 klubbar med manuellt ja (Ibiza / Mykonos först)
- [ ] Stripe/Swish-deposition när första klubben tar emot
- [ ] Konton så förfrågningar överlever byta av telefon
- [ ] Bildlicenser / egna foton — sluta hotlänka klubbsajter i kommersiell drift
- [ ] iOS/Android när concierge-flödet tar betalt

*Bilder och video tillhör respektive ställe/fotograf (Pexels för hero). Förhandsvisning, inte kommersiell licens.*
