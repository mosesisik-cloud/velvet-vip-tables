// Read-only supplier evidence; this module grants no booking capability.
export function interpretZenchefPolicy(shift, party) {
  if (!Number.isInteger(party) || party < 1) throw new TypeError('invalid_party');
  const confirmation = shift?.confirmation;
  let confirmationMode = 'unknown';
  if (confirmation?.is_auto === true) confirmationMode = 'automatic';
  else if (confirmation?.is_auto === false) {
    const limit = confirmation.is_auto_until;
    if (limit === null || limit === 0) confirmationMode = 'manual';
    else if (Number.isInteger(limit) && limit > 0) {
      confirmationMode = party <= limit ? 'automatic' : 'manual';
    }
  }
  const applies = policy => {
    if (policy?.is_web_booking_askable === false) return false;
    if (policy?.is_web_booking_askable !== true ||
        !Number.isInteger(policy.min_guests) || policy.min_guests < 1) return null;
    return party >= policy.min_guests;
  };
  return {
    confirmationMode,
    cardGuaranteeApplies: applies(shift?.charge_param),
    prepaymentApplies: applies(shift?.prepayment_param),
    bookingConfirmed: false,
    formInspected: false,
  };
}
