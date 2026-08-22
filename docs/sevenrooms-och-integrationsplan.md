# SevenRooms — genomlysning och vad VELVET behöver

*Research 2026-08-22. Syfte: förstå SevenRooms funktionalitet så att VELVET kan matcha den —
antingen genom egen funktionalitet eller genom integration ("boka direkt in i ställenas system").*

## 1. Vad SevenRooms är

SevenRooms är **ställets operativsystem** (B2B), inte en konsumentapp. 15 000+ restauranger,
klubbar och hotell globalt — från Michelin-ställen till nattklubbar. Uppköpta av DoorDash 2025.
Kärnlöfte: "more than just reservations" — de äger gästdatan åt stället.

Viktig insikt för oss: **VELVET är inte en SevenRooms-konkurrent utan en kanal in i deras värld.**
Booking.com-modellen = vi säljer åt ställena; SevenRooms är ett av systemen vi bokar in i.

## 2. Deras funktionskarta (vad ställen får)

| Modul | Vad den gör | VELVET-behov |
|---|---|---|
| **Reservations** | Bokningswidget på ställets sajt + kanaler (Google, Instagram, Yelp, DoorDash, Deliveroo), Voice AI för telefonbokningar | Vår `#/book-site` + framtida direktbokning |
| **AI Table Management** | Smart seating, pacing, cover-prognos, waitlist-automation | Ställets interna — inte vårt problem |
| **Guest CRM** | Samlad gästprofil: preferenser, spendering, besökshistorik, taggar | Vår motsvarighet: verifierad profil + verified spend + recensioner |
| **Automated marketing** | Triggrade mejl/SMS-kampanjer, fyll svaga kvällar | Väntar — kräver volym |
| **Events & ticketing** | Biljettade event, depositioner, paket | Delvis byggt (venue-events + öppna stolar) |
| **Payments** | Deposition vid bokning, full förskottsbetalning, no-show-avgifter, tokeniserade kort (PCI) | **Kärnan i vår modell** — deposition som låses tills klubben bekräftar |
| **POS-integrationer** | 100+ integrationer; bordets konsumtion syns på gästprofilen i realtid | Fas 4 |

## 3. Så funkar deras bokningsflöde tekniskt

Gästsidan (widgeten på ställets sajt) är en öppen flödeskedja:

1. **Sök tillgänglighet** per datum → returnerar shifts med tidslots
2. Varje slot är typad: **`book`** (direktbokningsbar, bekräftas direkt) eller **`request`** (stället måste godkänna)
3. **Hold**: vald slot hålls i **300 sekunder** (5 min) medan gästen fyller i uppgifter
4. **Create reservation** → `reservation_id` + bekräftelsenummer
5. Ev. **deposition/korttokenisering** i samma flöde (minskar no-shows — deras stora säljargument)
6. **Webhooks** notifierar externa system om ändringar, ankomster, avbokningar, no-shows

Detta är exakt det flöde VELVET ska efterlikna i egen UI: sök → välj slot → hold → bekräfta → betala deposition.

## 4. API-tillgång — läget

- Officiellt REST-API finns: reservationer, gästprofiler, availability, webhooks.
- **Men:** sedan feb 2026 är dokumentationen stängd — individuellt provisionerade konton.
- Nya integratörer ansöker via deras **partnerships-formulär** (länk på api-docs.sevenrooms.com).
- Inget self-serve. Räkna med veckor av partnerdialog, inte en API-nyckel på en eftermiddag.
- Under tiden: widget-flödet är publikt och kan drivas programmatiskt (det finns tredjeparts-
  wrappers som gör exakt detta: search_availability → hold_reservation → create_reservation).

## 5. Vad VELVET bygger självt vs integrerar mot

**Bygg självt (vår differentiering — det SevenRooms aldrig kommer göra):**
- Kostnadsdelning mellan främlingar med escrow-depositioner
- Verifierade medlemmar (pass + selfie) och betygsättning
- Öppna stolar / gå med i sällskap
- Global katalog + concierge för ställen utan system

**Integrera mot (uppfinn inte hjulet):**
- Tillgänglighet och bokning via ställets befintliga system (SevenRooms, Tock, OpenTable, Resy, TableCheck, Zenchef, egen widget)
- Betalräls: Stripe/Revolut (redan påbörjat)

## 6. Adapter-strategi

Datamodellen behöver per venue: `booking_system` (sevenrooms|tock|opentable|resy|widget|email|whatsapp),
`booking_contact` och senare `booking_config` (venue-id i deras system).

Prioritet per adapter:
1. **widget/deep link** (fungerar idag, `#/book-site`) — 100 % täckning
2. **strukturerad förfrågan** (mejl/WhatsApp i klubbens format, spårnings-ID) — Fas 2
3. **SevenRooms-adapter** — ansök partnerskap + kör widget-flödet tills dess — Fas 3
4. **Tock/OpenTable/Resy** — samma mönster — Fas 3
5. Realtid + escrow + provision — Fas 4

## 7. Konkreta nästa steg

- [ ] Inventera topp-20-ställenas bokningssystem → `booking_system`-fält i venues.json
- [ ] Ansök om SevenRooms-partnerskap (partnerships-formuläret) — ta det i Gabbes namn när bolaget finns
- [ ] Bygg statusflödet: skickad → mottagen → bekräftad/avböjd (operatorpanelen)
- [ ] Deposition med hold-logik: 5-minutershold som SevenRooms, men mot sällskapets delbetalningar
