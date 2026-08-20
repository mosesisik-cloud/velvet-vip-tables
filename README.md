# VELVET — VIP-bord. Delad lyx. 🥂

**Boka VIP-bord, cabanas och daybeds på världens främsta klubbar och beach clubs — och dela kostnaden med ditt sällskap.**

Första version (V1) byggd på datasetet *Luxury Experience Venue Master V1*:
30 destinationer · 120 handplockade lyxställen (Hï Ibiza, Scorpios Mykonos, Nammos, Nikki Beach Dubai …).

## Funktioner (V1)

- **Destinationsutforskare** — 30 marknader med tier, säsong och lyx-score
- **Ställe-browser** — sök + filtrera på destination, kategori, verifieringsstatus; sortera på prioritet/lyx
- **Klickbar lista** — direktlänkar till varje ställes hemsida och Instagram
- **Bokningsflöde** — välj datum, paket (daybed / cabana / VIP-bord / front row) och sällskapsstorlek
- **Kostnadsdelning** — priset splittas automatiskt per person i realtid
- **Mina bokningar** — sparas lokalt (localStorage), med avbokning

## Kör lokalt

Ingen build behövs — ren statisk sajt:

```bash
npx serve .
```

eller öppna med valfri statisk server (filerna läser JSON via `fetch`, så `file://` fungerar inte direkt).

## Struktur

```
index.html          # Skal + nav
css/app.css         # Premium dark/gold-tema
js/app.js           # SPA: router, vyer, bokningslogik
data/destinations.json  # 30 destinationer (från Excel-master)
data/venues.json        # 120 venues enligt App Import Schema
```

## Datamodell

Följer `App Import Schema` från Excel-mastern: `venue_id`, `destination_code`, `category`,
`vip_table_potential`, `shareable_format`, scores (luxury/party/shareability/booking),
`research_status`, `priority_score` m.m.

## Roadmap

- [ ] Riktig backend (bokningar, konton, betalning/split via t.ex. Swish/Stripe)
- [ ] Inbjudningar till sällskapet (dela bokning via länk)
- [ ] Venue-partnerportal (inventarie i realtid)
- [ ] iOS/Android-app

---

*V1 research-dataset: priser är indikativa mockar beräknade från venue-scores — inte riktiga priser.*
