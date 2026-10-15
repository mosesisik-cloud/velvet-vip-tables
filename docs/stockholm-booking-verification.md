# Stockholm: kontroll av 22 Bokabord-restauranger

Kontrollerat 15 oktober 2026 av tre parallella granskare. Alla 22 publika sidor öppnar bokningsdelen utan Velvet-inloggning och pekar på rätt registrerat Bokabord-formulär. Kontrollerna gäller de provade måltiderna och datumen; tillgänglighet och villkor kan ändras. Inga nya riktiga bokningar skapades.

| Restaurang | Verifierat flöde | Avgränsning |
|---|---|---|
| Ciccio’s | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Zink – Italian Cuisine | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Frantzén | Reservation / väntelista hos Bokabord | Tidsval kan initiera en temporär reservation före kontakt. Velvet stoppar anropet och visar överlämning. |
| Beirut Café | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Noema | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Boqueria | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Sperling & Co | Kontaktflöde och fältsynkning verifierade | Fredagslunch: vanligt kontaktflöde. Middag: tillval hos Bokabord. |
| Animo | Kortgaranti – fortsätt hos Bokabord | Det testade måltidsvalet kräver kort. Ingen betalning testad. |
| OLLI Ristorante | Kortgaranti – fortsätt hos Bokabord | Det testade måltidsvalet kräver kort. Ingen betalning testad. |
| Brasserie Astrid | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Vau de Ville | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Sturehof | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Paraden | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Riche | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Villa Dagmar | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Kommendören | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Ekstedt | Kortgaranti – fortsätt hos Bokabord | Det testade måltidsvalet kräver kort. Ingen betalning testad. |
| Tête | Kontaktflöde och fältsynkning verifierade | Middag i baren: vanligt kontaktflöde. Middag: tillval hos Bokabord. |
| AIRA | Kortgaranti – fortsätt hos Bokabord | Det testade måltidsvalet kräver kort. Ingen betalning testad. |
| Brasserie Balzac | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |
| Copine | Kortgaranti – fortsätt hos Bokabord | Det testade måltidsvalet kräver kort. Ingen betalning testad. |
| Italiano | Kontaktflöde och fältsynkning verifierade | Ingen skarp bokning skickad. |

## Gemensamma rättningar

- Separata anropsbudgetar för läsning, bokningsuppdateringar och övriga skrivningar.
- Inväntar Bokabords egen AJAX-flagga och synliga laddningsindikator, även efter renderingsramarna.
- Inväntar telefonkomponentens initialisering innan kontaktvyn används. Tomt godkänt telefonnummer kan inte passera slutkontrollen.
- Blockerad automatisk reservation får explicit överlämning i stället för en tom vy.
- Read-only getOffDays tillåts; saveBooking förblir spärrad utan godkänd exakt payload.

## Validering

11 enhetstester, rails-sviten, test för långsamma fältsvar och browserregression för AJAX/telefoninitiering. Zinks kontakt → granskning → slutkontroll testas med finalnätverksanropet blockerat. Kommendören, Balzac, Italiano och Têtebaren testades till granskning med rätt telefonnummer. Övriga vanliga flöden testades till kontakt och fältsynkning. Ingen ny slutförd bokning är bekräftad.
