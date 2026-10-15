# Bokabord speglat i Velvet

## Vad som är byggt

En valbar inspektionspilot i Zinks befintliga restaurangvy. Velvet visar bilder av det verkliga Bokabord-formuläret från en dold Chromium-session på servern. Klick och scroll skickas till Playwright, som returnerar en ny bild och formulärets text. Det är originalets renderade gränssnitt, inte en ombyggnad av deras HTML och inte en iframe till leverantören.

Varje inloggad operatör får en separat BrowserContext. Sessions-ID kontrolleras mot serverns användaridentitet vid varje åtgärd. Max fyra samtidiga sessioner, en per operatör, tio minuters inaktivitet. Gamla bildrevisioner kan inte användas för nya klick. Bilder/cookies sparas inte på disk. Chromium kör med normala säkerhetsinställningar.

Piloten är **endast inspektion**: gästens kontaktuppgifter kan inte matas in, inga tangenter skickas och alla klick stoppas när Kontaktuppgifter syns. Nätverksfiltret blockerar bokningsinlämning och okända POST-anrop. Det gamla webbridge/book-anropet spärras också när inspektionsläget är aktivt. Inga testbokningar har skapats.

## Kör

Node 22 eller senare:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:rails
node scripts/preview-bokabord-mirror.mjs
```

Öppna http://127.0.0.1:4174. Förhandsvisningsservern binder endast till loopback och är inte en produktionsserver. Den har eget värd-/origin-/cookie-skydd och använder inga Velvet-konton.

För den befintliga Velvet-servern: installera beroenden och Chromium på API-värden, sätt `VELVET_BOKABORD_MIRROR=inspect`, starta om API:t och publicera frontend tillsammans med `js/bokabord-mirror.js`. Logga in som befintlig Velvet-operatör. Utan flaggan behålls det tidigare bokningsflödet. På Linux behövs även Playwrights systemberoenden (`npx playwright install --with-deps chromium`). GitHub Pages kan bara servera frontend; Chromium måste köras på API-servern. Ingen ändring av produktionen har gjorts.

## Verifierat 2026-10-15

`npm run test:zink:live -- 2026-10-19` går genom det riktiga gränssnittet: Middag → två gäster → måndag 19 oktober → tillgänglig tid → Kontaktuppgifter. Scriptet anropar samma speglingsmotor som Velvet och verifierar att nästa klick stoppas. Vid kontrollen visades 17.00, 17.30, 18.00, 18.30, 19.00, 19.30, 20.00, 20.30 och 21.00. Tillgängligheten ändras; detta är inga reservationer.

Kontaktsteget innehåller förnamn, efternamn, mobilnummer, e-post och önskemål. Restaurangens nyhetsbrev är förvalt; Bokabords nyhetsbrev är inte förvalt. Knappen heter Nästa och sidan länkar till leverantörens villkor och integritetspolicy. Stegen efter Nästa och den slutliga bekräftelsen är **inte verifierade**; inga kontaktuppgifter har skickats för att ta oss vidare.

## Kvar innan skarp bokning

Fastställ antal gäster, tid och kontaktuppgifter. Kartlägg därefter resterande steg med dessa uppgifter, hantera uttryckliga villkor och eventuella betalningar, avmarkera marknadsföring om gästen inte väljer den, och implementera en separat slutlig bekräftelse. Behåll nätverksspärren tills detta är verifierat. En omstart eller timeout efter inlämning måste ge okänd status, inte automatiskt nytt försök. Ingen live-flagga finns i den här piloten.

Bildspegling är visuellt trogen men ännu inte likvärdig med ett vanligt formulär för tangentbord, skärmläsare, autofyllning eller mobilens tangentbord. Textversion och scrollknappar finns för inspektion. Fullständig tillgänglighet, textinmatning, återanslutning och bokningshistorik återstår före kundlansering. Befintlig 30 POST/minut-gräns gäller även piloten.

Andra Bokabord-restauranger kan läggas i serverns fasta register och använda samma motor. Ändra startverifieringen till respektive restaurangs namn och testa deras variant; bokningsvillkor, måltider, tillval och betalning kan skilja sig. Webbläsaren får aldrig godtyckliga mål-URL:er från klienten.
