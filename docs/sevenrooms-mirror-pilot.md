# SevenRooms speglad i Velvet — inspektionspilot

Velvet visar originalformuläret från SevenRooms i en isolerad Chromium-session. Klick och scroll går genom Playwright; bilden verifieras med SHA-256 före visning. Samma sessions-, ägarskaps- och revisionsmodell som Bokabord-piloten.

## Gränser i den här piloten

Endast inspektion: datum, tider och gästantal kan utforskas, men adaptern stoppar före gästuppgifter och tillåter aldrig `fill` eller `submit`. Alla POST-anrop till SevenRooms misslyckas stängt, liksom alla sökvägar som skapar, håller, bekräftar, betalar eller avbokar. Endast GET/HEAD mot `www.sevenrooms.com` och GET mot kända tillgångsvärdar tillåts. Ingen bokning, hold, betalning eller kontaktuppgift skickas någonsin i detta läge.

## Registrerade restauranger

`api/sevenrooms-restaurants.json` — endast poster med verifierad officiell länk:

- `curated-AMF-la-sponda` (La Sponda, Positano) — källa sirenuse.it, verifierad 2026-10-16.
- `curated-PAR-plenitude` (Plénitude, Cheval Blanc Paris) — källa chevalblanc.com, verifierad 2026-10-16.

## Kör lokalt

Node 22 eller senare:

```sh
npm ci
npx playwright install chromium
node --test api/test-sevenrooms-mirror.mjs
node scripts/check-sevenrooms-mirror.mjs curated-AMF-la-sponda "La Sponda"
node scripts/preview-sevenrooms-mirror.mjs
```

Öppna http://127.0.0.1:4175. Förhandsvisningen binder endast till loopback med värd-/origin-/cookie-skydd. Publicera inte denna server. `SEVENROOMS_RESTAURANT=curated-PAR-plenitude` väljer restaurang.

## Observerat 2026-10-16

Båda registrerade formulären renderade i spegeln med korrekt restaurangidentitet. La Spondas widget visade observerbara lediga tider för 2026-10-30 via leverantörens skrivfria GET-endpoints (`/api-yoa/availability/*`). Plénitudes sida visar en landningsvariant med identitet, adress, telefon och öppettider (tis–lör från 19:30). Ingen interaktion bortom initial sidladdning i live-kontrollen.

## Vidare arbete (separat samordningsbehov)

Skarp inlämning (live-läge) kräver samma godkännande- och försöksjournalmönster som Bokabord-piloten och är en leverantörsbred förbättring som måste tilldelas separat — denna pilot ändrar inga delade filer och aktiverar inget i produktion.
