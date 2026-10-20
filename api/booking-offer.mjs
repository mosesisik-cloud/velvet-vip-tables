// Reviewed non-personal menu selection only; never arbitrary provider payloads.
const keys = ['offerId','count','name','description','currency','mealPrice','priceStatus','menuSource','depositApplies','depositMinGuests','selectionSource','submissionSupported','version'];
export function cleanBookingOffer(value, restaurantId) {
  const christine = value?.offerId === 60971;
  const expectedRestaurant = christine ? 'curated-PAR-chez-fernand-christine' : 'curated-AMS-de-kas';
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || (restaurantId !== undefined && restaurantId !== expectedRestaurant)
    || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value,key))
    || value.offerId !== (christine ? 60971 : 118785) || value.count !== 2 || value.name !== (christine ? 'À la carte' : 'Lunch')
    || typeof value.description !== 'string' || (christine ? value.description !== '' : !value.description.trim()) || value.description.length > 16000
    || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value.description)
    || value.currency !== 'EUR' || value.mealPrice !== null || value.priceStatus !== 'not_provided_by_booking_form'
    || value.menuSource !== (christine ? 'https://www.restaurantchezfernand.fr/' : 'https://restaurantdekas.com/eng/menu')
    || value.depositApplies !== false || value.depositMinGuests !== (christine ? 4 : 7)
    || value.selectionSource !== 'native_offer' || value.submissionSupported !== true
    || typeof value.version !== 'string' || !/^[a-f0-9]{64}$/.test(value.version)) return null;
  return structuredClone(value);
}
export function sameBookingOffer(left, right) {
  if (left === undefined && right === undefined) return true;
  const a=cleanBookingOffer(left), b=cleanBookingOffer(right);
  return !!a && !!b && keys.every(key => a[key] === b[key]);
}
