# VELVET — VIP-bord. Delad lyx. 🥂

**Gabbes app.** Skicka en förfrågan om VIP-bord, cabanas och daybeds på världens främsta klubbar — VELVET-teamet tar förfrågan mot klubben — sällskapet kan dela kostnaden om bordet blir bekräftat.

Concierge-förhandsversion. Inte en automatisk bokningsmotor. Knappen ljuger inte.

30 destinationer · 120 handplockade lyxställen (Hï Ibiza, Scorpios Mykonos, Nammos, Nikki Beach Dubai …).

**Live:** https://mosesisik-cloud.github.io/velvet-vip-tables/

Ren statisk SPA — HTML/CSS/vanilla JS, inga ramverk, ingen build-step. Svensk UI, premium dark/gold.

## Vad som är på riktigt i V4

- **Förfrågan, inte fake-bokning.** Ni fyller i värd, datum, paket och sällskap. Förfrågan går till VELVET-teamet (Gabbe) via e-post. Bekräftelsen säger *förfrågan skickad* — aldrig att bordet är reserverat.
- **Indikativa priser.** Paketpriser är research-mockar från venue-scores. Klubben sätter det riktiga priset.
- **Katalog.** 120 webbverifierade ställen, 103 äkta venue-bilder från deras egna sajter, IG/TikTok/FB live-kollade.
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
```

Öppna `http://localhost:4173`. `file://` fungerar inte (JSON via `fetch`).

## Team

| Person | Roll | GitHub |
|---|---|---|
| Gabriel (Gabbe) | Produktägare | [gabrielhadodo9602](https://github.com/gabrielhadodo9602) (write) |
| Moses | Bygg | [mosesisik-cloud](https://github.com/mosesisik-cloud) (admin) |
| Dan Grant | Inbjuden | *GitHub-konto saknas för `dan.grant@appliedinvest.com` — skicka username så läggs write på direkt* |

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
