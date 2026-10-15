import {tableCheckBookingLanguage} from './booking-language-tablecheck.js';
// Call only after the restaurant destination has passed canonical registry guards.
export function bookingLanguage(booking, requested = 'en') {
  requested = ['sv','en','es','fr'].includes(requested) ? requested : 'en';
  const url = new URL(booking.url);
  let language = null, notice = 'languageUnknown';
  if (booking.provider === 'TableCheck') {
    const result = tableCheckBookingLanguage(url.href, requested);
    if (result) return {...result, notice: result.fallback ? 'languageEnglishFallback' : 'languageVenueDependent'};
  } else if (booking.provider === 'SevenRooms' && !url.pathname.startsWith('/experiences/')) {
    url.searchParams.set('lang', requested);
    notice = 'languageVenueDependent'; // Venue configuration can override the request.
  } else if (booking.provider === 'Meitre') {
    language = requested === 'sv' ? 'en' : requested;
    url.searchParams.set('mt_lang', language);
    notice = language === requested ? 'languageVenueDependent' : 'languageEnglishFallback';
  } else if (booking.provider === 'Elyra') {
    language = ['sv','en'].includes(requested) ? requested : 'en';
    url.searchParams.set('lang', language);
    notice = language === requested ? 'languageVenueDependent' : 'languageEnglishFallback';
  } else if (booking.provider === 'Dineplan' && booking.restaurantId === 'curated-CPT-salsify-at-the-roundhouse') {
    language = 'en'; notice = requested === 'en' ? 'languageVenueDependent' : 'languageEnglishFallback';
  }
  return {url:url.href, requestedLanguage:requested, language, fallback:language !== null && language !== requested, notice};
}
