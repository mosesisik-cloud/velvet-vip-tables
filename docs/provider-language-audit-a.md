# Provider language audit: Meitre, Elyra, Dineplan

Checked 15 October 2026. Read-only live browser tests with non-GET/HEAD/OPTIONS requests blocked; no bookings, holds or payment. URL parameters below came from observed provider application code, not guessed names.

| Provider | Verified setting | Swedish | English | Limitations |
| --- | --- | --- | --- | --- |
| Meitre current Oro application | `mt_lang=en` (also code-supported `es`, `fr`, `de`, `pt`) | Not in shipped supported-language list; use explicit English fallback | Live verified | Legacy/different venue builds need separate checking; no universal Swedish claim |
| Elyra Hillenberg | `lang=sv` / `lang=en` | Live verified | Live verified | Venue `supported_languages` controls acceptance; some restaurant descriptions remain untranslated |
| Dineplan Salsify calendar | No verified language parameter or UI switch | Swedish browser locale still English | Observed English | Do not add guessed locale parameters; other two registered widget routes returned 403 in this test |

## Meitre evidence

Observed bundle: https://oro.meitre.com/assets/index-DmzPzpQU.js . The provider defines `lang:"mt_lang"`, supports `en, es, fr, de, pt`, and sets fallback `en`. Detection order is query string, local storage, navigator. A supplied query parameter takes precedence over the saved language. Browser `sv-SE` and `en-US` both rendered English without a parameter.

Live https://oro.meitre.com/?mt_lang=en displayed EN, “Welcome”, “Book a table”. Live https://oro.meitre.com/?mt_lang=pt displayed PT, “Bem-vindo”, “Fazer uma reserva”. Portuguese verifies the parameter actually changes rendered content; the code lists Swedish as unsupported. Map Velvet `en` to `mt_lang=en`; for Velvet `sv`, choose and disclose English fallback rather than implying translation. The other code-supported languages are not all individually browser-tested.

## Elyra evidence

Observed bundle: https://widget.elyrasystems.com/assets/index-CCP6N5ns.js . The provider reads `URLSearchParams(...).get("lang")`, checks it against venue `supported_languages`, then falls back to venue default, English when supported, or first supported language. Its language button updates this same `lang` query parameter.

Live https://widget.elyrasystems.com/hillenberg?lang=sv displayed selected Svenska, “Vad önskar du?”, “Middag”, “Endast nödvändiga”. Live https://widget.elyrasystems.com/hillenberg?lang=en displayed selected English, “What would you like?”, “Dinner”, “Necessary only”. Browser en-US alone still defaulted to Swedish, so URL language is needed to follow Velvet's explicit selection.

Core controls, cookie notice and several descriptions translated. Marble-room and Chef's Table descriptions remained Swedish in English mode. Do not promise complete translation of venue-authored text or terms. Verification is for Hillenberg; other Elyra venues can expose different supported languages.

## Dineplan evidence and boundary

https://calendar.dineplan.com/m0w4SxVp?type=inline rendered “Guests”, “Date”, “Time”, “How many guests?” under both fresh sv-SE and en-US browser contexts. No language selector appeared on the observed screen. No supported URL setting was found in the inspected official integration documentation; this does not prove no such capability exists.

Official integration help describes booking links and source tracking, not a verified language override: https://learn.dineplan.com/adding-dineplan-to-your-channels and https://learn.dineplan.com/adding-source-tags . Fyn's `account.dineplan.com/widget/v3/DjfvyT1k?source=direct` and La Colombe's `www.dineplan.com/widgetframe/GCPvsZBn` returned 403; no access restriction was bypassed. Keep their language state unknown rather than extrapolating Salsify's result.

## Implementation guidance

Append/replace only the verified setting using URLSearchParams, preserving restaurant identity parameters. For same-language providers, use the requested supported language. Where Swedish is unavailable/unverified, translate Velvet's surrounding interface and explicitly disclose the provider language. Cross-origin provider DOM cannot be relabelled by ordinary host-page JavaScript. Updating the language of an already-open iframe may reset its booking state, so make the choice before starting or clearly warn before restarting it.

Evidence files in parent workspace: `work/e2e-wave5-language.json` (browser locale baseline), `work/e2e-wave5-language-verified.json` (actual parameter text changes), `work/e2e-wave5-language-dineplan.json` (403 results), and matching probe scripts. No shared application code changed.
