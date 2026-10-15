// Pure presentation rules. Provider/server evidence remains authoritative.
export function restaurantStatusKey(status) {
  return ({ 'local-pending': 'draft', request: 'requested', received: 'received',
    confirmed: 'confirmed', provider_confirmed: 'confirmed', guest_reported: 'reported',
    declined: 'declined', provider_error: 'declined', provider_rejected: 'declined',
    unknown: 'unknown', payment_required: 'paymentRequired' })[status] || 'processing';
}

export function publicationConfirmed(response, tableId) {
  return response?.table?.id === tableId && response.table.status === 'open'
    && Number(response.table.openSeats ?? response.table.openLeft) > 0;
}

export function canStartPayment(member) {
  return !!member && !member.paid && !member.paidPending;
}

export function loginReturnTo(candidate) {
  return typeof candidate === 'string' && /^#\//.test(candidate)
    && !/^#\/(?:login|auth)(?:[/?]|$)/.test(candidate) ? candidate : '';
}
