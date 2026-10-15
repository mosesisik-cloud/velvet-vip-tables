# Bokabord speglat i Velvet

Velvet visar originalformuläret från en isolerad Chromium-session. Klick, scroll och kontaktinmatning går genom Playwright. Bilder överförs som förlustfri PNG och klienten verifierar SHA-256 före visning. Uppdateringen sker efter varje åtgärd, med nätverksfördröjning.

## Körlägen

API-serverns `VELVET_BOKABORD_MIRROR=inspect` är fortfarande en inspektionspilot för inloggade operatörer. Den stoppar vid kontaktuppgifter. Utan flaggan används tidigare bokningsflöde. Ingen produktion har driftsatts med dessa ändringar.

Den lokala förhandsvisningen stöder `MIRROR_MODE=prepare`: kontaktfält placeras över originalbilden och synkas till leverantörens formulär. Båda marknadsföringsvalen avmarkeras. `/current` återupptar en befintlig session.

Skarp inlämning kräver dessutom `MIRROR_APPROVAL_FILE`, en absolut sökväg till privat JSON med `date` (YYYY-MM-DD), `time` (HH:mm), `party` (tal), `firstname`, `lastname`, `email`, `phone` och `terms: true`. Skapa filen först efter uttryckligt godkännande av uppgifter och villkor. Kontaktuppgifter och bekräftelselänkar får aldrig läggas i Git.

Endast exakt saveBooking-endpoint kan tillåtas under en explicit submit-åtgärd. Begärans uppgifter måste matcha godkännandet, med tom produktlista, ingen väntelista och ingen marknadsföring. En atomiskt skapad `.attempt`-fil bredvid godkännandefilen reserverar försöket före sändning och blockerar upprepning även efter omstart. Radera inte filen för att försöka igen vid osäkert resultat: kontrollera först hos leverantören.

Avbrott efter inlämning innebär okänd status, utan automatisk ombokning. Lyckat leverantörssvar med boknings-ID ger bekräftelse; betalningskrav har separat status. Piloten genomför inga betalningar. Kontoinloggning och kodutskick stöds inte. Det verifierade flödet använder ”Fortsätt utan konto”, ”Kontrollera din bokning” och ”Slutför bokningen”.

## Kör lokalt

Node 22 eller senare:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:rails
node scripts/preview-bokabord-mirror.mjs
```

Öppna http://127.0.0.1:4174. Förhandsvisningen binder endast till loopback, har värd-/origin-/cookie-skydd och använder inga Velvet-konton. Publicera inte denna server. Sätt miljövariablerna ovan före start för förberedelse eller godkänd engångsbokning.

API-serverns inspektionspilot behöver Chromium på API-värden. Linux behöver även `npx playwright install --with-deps chromium`. GitHub Pages kan endast servera frontend. Produktionsaktivering är ett separat steg.

## Skydd och begränsningar

Varje operatör har separat BrowserContext, med ägarskaps- och revisionskontroll. Högst fyra sessioner, en per operatör, tio minuters inaktivitet. Motorbilder och cookies sparas inte på disk; godkännandefilen innehåller däremot privata kontaktuppgifter. Sparade testbilder hålls också utanför Git.

Endast restauranger i fast register stöds. Okända mutationer, betalningar och ändring/avbokning är blockerade. Produktionspilotens gräns på 30 POST/minut gäller även speglingen.

Tillgänglighet, autofyllning, mobilinmatning, snabb redigering av flera fält, beständig bokningshistorik och återhämtning efter serveravbrott behöver fortsatt arbete före kundlansering. Andra restauranger behöver verifieras separat eftersom måltider, tillval och villkor kan skilja sig.

## Verifierat 2026-10-15

Ett godkänt skarpt test genomfördes via Velvet: Middag → 1 gäst → datum/tid → kontaktuppgifter → fortsätt utan konto → kontrollera → slutför → bekräftelse. Leverantörens svar matchade godkända kontaktuppgifter, datum, tid och antal. Bekräftelsesidan uppgav att mejl skickats. Velvet-bildens SHA-256 matchade originalets PNG. Privata bilder och bokningsreferens hålls utanför repot.

`npm test` testar nätverksspärrar, sessionsägarskap, revisioner, godkända detaljer, slutknappen, avbruten inlämning och skydd mot upprepning utan bokningar. `npm run test:rails` kör befintliga tester. `npm run test:zink:live -- YYYY-MM-DD` är separat inspektion som stannar vid kontaktuppgifter.
