# Aktivera Google, Apple och Facebook i Velvet

## Status

Publika API:t kontrollerades 2026-10-15 (Europe/Stockholm): Google, Apple och Facebook rapporterade alla `false` i `/velvet-api/pay/config`. Det betyder att driftservern saknar fullständig konfiguration, inte att utvecklarkonton saknas.

Denna ändring förstärker befintliga OAuth-flöden. Google/Apple ID-token verifieras med jose mot respektive leverantörs officiella signeringsnycklar, utfärdare, mottagare, utgångstid och nonce. Callback binds till en HttpOnly-cookie i den webbläsare som startade inloggningen. State är engångsbruk, även vid avbruten inloggning. Apple POST stöds med SameSite=None; Secure. Sessioner lämnas endast i HttpOnly-cookie, aldrig som bearer-token i retur-URL. Inga konton slås ihop baserat på e-postadress.

OAuth bekräftar tillgång till ett konto. Det verifierar inte juridisk identitet, namn eller ålder. Befintlig pass- och ålderskontroll är separat och har inte säkerhetsgranskats i denna ändring. Befintliga passkeys kopplas inte automatiskt till ett nytt socialt konto.

## Google

1. Använd ett företagsägt Google Cloud-projekt. Konfigurera Google Auth Platform: branding, kontaktperson, målgrupp och testanvändare.
2. Skapa OAuth-klient av typen Web application.
3. Registrera exakt redirect URI: `https://b2b.bakemyday.se/velvet-api/auth/callback/google`.
4. Använd endast `openid email profile` för inloggning.
5. Lägg klient-ID och hemlighet i serverns skyddade miljö eller befintliga skyddade operatörskonfiguration. Testa innan projektets produktionspublicering; slutför eventuell branding-/domängranskning som Google begär.

## Apple

1. Använd organisationens Apple Developer-konto och aktivera Sign in with Apple för relevant primärt App ID.
2. Skapa ett Services ID för webben, koppla det till primära App ID:t och registrera domänen `b2b.bakemyday.se`.
3. Registrera returadressen `https://b2b.bakemyday.se/velvet-api/auth/callback/apple`.
4. Skapa en Sign in with Apple-nyckel. En behörig administratör skapar en ES256-signerad client-secret-JWT enligt Apple-dokumentationen; använd Services ID som client ID. Spara privatnyckeln i organisationens hemlighetshantering.
5. Servern accepterar den signerade JWT:n som client secret. Den roteras före utgångsdatum; automatisk signering/rotation ingår inte här.
6. Testa första och upprepad inloggning samt Hide My Email. Namn kommer endast vid första godkännandet; tidigare namn behålls vid återinloggning.

## Facebook

1. Använd organisationens Meta-app och konfigurera Facebook Login för webb.
2. Registrera returadressen `https://b2b.bakemyday.se/velvet-api/auth/callback/facebook`.
3. Lägg App ID och App Secret på servern. Kontrollera integritetsinformation och instruktion/URL för dataradering.
4. Slutför de åtkomst-, gransknings- och publiceringssteg som den aktuella Meta-dashboarden kräver. Exakta Meta-krav har inte kunnat verifieras i denna körning.
5. Testa både ett app-testkonto och ett vanligt konto efter publicering. Facebook-flödet är befintligt; denna ändring lägger till browser-bindning och avvisar ogiltiga profil-ID:n. Dess API-version behöver kontrolleras mot Meta före aktivering.

## Serverkonfiguration

Stöd finns för följande miljövariabler; ingen hemlighet ska checkas in i Git eller skickas i chatten:

```
VELVET_GOOGLE_CLIENT_ID=
VELVET_GOOGLE_CLIENT_SECRET=
VELVET_APPLE_CLIENT_ID=
VELVET_APPLE_CLIENT_SECRET=
VELVET_FACEBOOK_CLIENT_ID=
VELVET_FACEBOOK_CLIENT_SECRET=
```

Miljövariabler har företräde framför befintlig `pay.json`-konfiguration. `PUBLIC_URL` ska i denna installation vara `https://b2b.bakemyday.se/velvet`. Klientuppgifter från Google Places är inte OAuth-klientuppgifter.

Frontend och API måste användas på produktionsdomänen. GitHub Pages är ingen inloggningsmiljö för denna lösning: tredjepartscookies kan blockeras och callback återgår till produktionsdomänen.

Installera låsta beroenden med `npm ci --omit=dev` i API-runtime innan servern startas, alternativt bygg om `deploy/Dockerfile.bokabord`. Både `api/oauth-security.mjs` och uppdaterad `api/server.mjs` måste deployas. Befintliga påbörjade OAuth-flöden måste startas om efter uppdateringen. Befintliga vanliga sessionscookies påverkas inte av att gamla token-URL:er slutar accepteras.

## Test och kvarvarande aktivering

Lokalt: `npm run test:auth`, `npm test`, `npm run test:rails`. Auth-testet använder lokala signeringsnycklar och en isolerad HTTP-server; inga riktiga användare eller bokningar skapas.

Efter deploy och konfiguration: kontrollera att `/velvet-api/pay/config` visar förväntade provider-flaggor. Genomför en riktig inloggning med varje aktiverad leverantör, avbryt en inloggning, ladda om sidan, logga ut och kontrollera att sessionen är avslutad. Prova Safari/iPhone, Apple Hide My Email och återinloggning. Bekräfta att den inloggade identiteten alltid följer leverantörens unika ID, även om e-postadressen ändras.

Fullständig inloggning mot riktiga leverantörer återstår tills klientuppgifter och utvecklarkonton är tillgängliga. Kontoradering och eventuell kontolänkning måste planeras mot Velvets befintliga boknings-, identitets- och betaldata; denna ändring gör ingen automatisk sammanslagning eller radering av dessa data.

Källor: https://developers.google.com/identity/openid-connect/openid-connect och https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/ samt https://github.com/panva/jose.
