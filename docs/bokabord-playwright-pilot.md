# Bokabord speglat i Velvet

Velvet visar originalformuläret från en isolerad Chromium-session. Klick, scroll och kontaktinmatning går genom Playwright. Bilder överförs som förlustfri PNG och klienten verifierar SHA-256 före visning. Uppdateringen sker efter varje åtgärd, med nätverksfördröjning.

## Körlägen

API-serverns `VELVET_BOKABORD_MIRROR=inspect` är fortfarande en inspektionspilot för inloggade operatörer. Den stoppar vid kontaktuppgifter. Utan flaggan används tidigare bokningsflöde. Live-läget beskrivs nedan.

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

## Produktionsläge för Stockholm

`VELVET_BOKABORD_MIRROR=live` aktiverar kontaktinmatning och skarp inlämning utan krav på Velvet-konto. Restaurangerna kommer från `api/bokabord-restaurants.json`, med bokningshash och officiell källa. Klienten visar originalbilden och kräver ett nytt villkorsgodkännande innan varje inlämningssteg. Det som godkänns binds till aktuell bildrevision och leverantörens formulärmodell. Ingen generell godkännandefil används i produktion.

`api/mirror-attempts/` är en privat, beständig volym: varje bokningsförsök reserveras atomiskt före sändning, inklusive efter omstart. Bokningshistoriken läser dessa poster. Inget okänt försök skickas automatiskt igen. Gäster får en slumpmässig HttpOnly/Secure/SameSite-cookie. Servern kontrollerar sessionsägaren vid varje åtgärd och visar endast gästens egen historik i samma webbläsare. Inloggade användare behåller kontobunden historik.

22 Stockholmrestauranger har verifierade Bokabord-widgetar. Frantzén visade enbart väntelista på det kontrollerade datumet. Kortgaranti, obligatoriska tillval och väntelista behöver slutföras i leverantörens säkra formulär; Velvet visar en tydlig länk och skickar ingen reservation för dessa val. Vanliga bokningar utan dessa krav genomförs i Velvet. Övriga bokningsleverantörer omfattas inte av adaptern.

Driftbilden byggs med `deploy/Dockerfile.bokabord` från projektets låsta Playwright-version. Chromium ingår; API-data och försöksjournal måste ligga på beständiga volymer. Frontendens service worker är uppdaterad till version 164. Den lokala förhandsvisningsservern ska fortfarande aldrig publiceras.


### Formulärprestanda

Servern återanvänder publikt cachebara JavaScript-, CSS- och typsnittsfiler i minnet, högst 10 MiB och 15 minuter (aldrig längre än leverantörens max-age). HTML, API-svar, tillgänglighet, kontaktuppgifter och bokningar cachas inte. Privata svar och svar med Set-Cookie undantas. Sessionsbilder skapas fortfarande från den aktuella leverantörsvyn och verifieras med SHA-256.

Väntan mellan steg följer Angulars pågående anrop och webbläsarens rendering. Kontaktfälten behåller fokus och kan redigeras under synkning; senaste ändringen köas. Inlämning spärras tills alla ändringar är synkade, även vid nätverksfel. Kör `node scripts/test-bokabord-ui.mjs` med installerad Playwright Chromium för att kontrollera långsamma svar, fokus, senaste inmatning och felhantering utan provideranrop.


Version 167 öppnar eller återupptar gästens session med ett anrop. Kontaktändringar samlas i ett validerat fältpaket; hela paketet valideras före inmatning. Fältgeometri läses tillsammans från leverantörens DOM. Klick återkopplas omedelbart med en diskret markör, utan att förutsäga tider eller visa en påhittad bekräftelse. Restaurangsidan har en lugnare layout och ett tydligt Bokabord-märkt formulär. Bokningsstatus och samtycke fungerar som tidigare.
