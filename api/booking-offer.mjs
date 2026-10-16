// Reviewed non-personal menu selection only; never arbitrary provider payloads.
const keys = ['offerId','count','name','description','currency','mealPrice','priceStatus','menuSource','depositApplies','depositMinGuests','selectionSource','submissionSupported','version'];
export function cleanBookingOffer(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value,key))
    || value.offerId !== 118785 || value.count !== 2 || value.name !== 'Lunch'
    || typeof value.description !== 'string' || !value.description.trim() || value.description.length > 16000
    || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value.description)
    || value.currency !== 'EUR' || value.mealPrice !== null || value.priceStatus !== 'not_provided_by_booking_form'
    || value.menuSource !== 'https://restaurantdekas.com/eng/menu'
    || value.depositApplies !== false || value.depositMinGuests !== 7
    || value.selectionSource !== 'native_offer' || value.submissionSupported !== true
    || typeof value.version !== 'string' || !/^[a-f0-9]{64}$/.test(value.version)) return null;
  return structuredClone(value);
}
export function sameBookingOffer(left, right) {
  if (left === undefined && right === undefined) return true;
  const a=cleanBookingOffer(left), b=cleanBookingOffer(right);
  return !!a && !!b && keys.every(key => a[key] === b[key]);
}
