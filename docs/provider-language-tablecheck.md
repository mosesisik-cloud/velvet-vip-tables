# TableCheck language audit — 2026-10-16

Velvet exposes sv, en, es and fr (`js/i18n.js`). Read-only Chromium audit of the actual Sazón provider page, with every non-GET/HEAD request blocked, opened the provider welcome screen, continued to its empty search form, opened its side navigation and selected languages in the provider's own language selector. No dates/times were selected, no carts or reservations created.

## Observed evidence

Original: https://www.tablecheck.com/en/regent-bali-canggu-sazon/reserve

- English: `2 Guests`, `Select a time`, `Find availability`.
- Selecting Español in the real selector navigated to https://www.tablecheck.com/es/regent-bali-canggu-sazon/reserve/landing and displayed `2 Invitados`, `Selecciona una hora`, `Buscar mesa`.
- Selecting Français navigated to https://www.tablecheck.com/fr/regent-bali-canggu-sazon/reserve/landing and displayed `2 Utilisateurs`, `Sélectionnez une heure`, `Trouver une table`.
- Swedish is absent from the provider's language selector. Fall back to English with an explicit user-visible explanation; do not claim that the provider form is Swedish.

Provider version displayed: v1.236.2. Selector also lists Indonesian, Chinese simplified/traditional, Japanese, Korean, German, Italian, Malay, Portuguese, Russian, Filipino, Thai, Lao, Vietnamese, Arabic, Hebrew, Hindi, Khmer, Dutch and Turkish. Those languages are not Velvet options and were not individually verified.

## Integration

New pure helper `tableCheckBookingLanguage(url, selectedLanguage)` in `js/booking-language-tablecheck.js` returns `{url, language, requestedLanguage, fallback}`, or null for unsupported/unsafe route forms. Apply only after the existing canonical booking registry validation. Preserve canonical registry URL for identity checks and use returned URL only for navigation. The helper preserves venue, reserve suffix, query and fragment; it rejects foreign hosts, HTTP, credentials and custom ports.

`en/es/fr` locale prefixes are supported. Swedish falls back to `en`. Legacy `/shops/florilege/reserve` returns null: its language contract has not been observed, so it must retain its original URL pending a separate audit. Do not fabricate `/sv/` or a language query parameter.

Only Sazón's actual new-widget controls were tested. The other new-style registry entries share the route shape but their restaurant-authored welcome messages/policies may remain in their original language. This audit does not establish translated legal terms, guest checkout, payment or confirmation. Changing language after entering booking data can reload the form; integration should use the selected language before opening it.

Validation: `node scripts/test-booking-language-tablecheck.mjs` passes language mapping, explicit fallback, query/fragment preservation and rejection of unsafe/unknown routes. Shared UI files were not modified.
