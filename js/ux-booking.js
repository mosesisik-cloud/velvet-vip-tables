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
  if (typeof candidate !== 'string' || /[\s\\\u0000-\u001f\u007f]/.test(candidate)) return '';
  const [path] = candidate.split('?');
  // Reject malformed encoding and nested fragments before retaining query state.
  try { decodeURIComponent(candidate); } catch { return ''; }
  if (candidate.slice(1).includes('#')) return '';
  const page = /^#\/(?:destinations|venues|restaurants|availability|map|bookings|open|verify|card|account|promoters|payout|favorites|villkor|integritet)?$/.test(path);
  const detail = /^#\/(?:venue|restaurant|destination|join|list|user|promoter|book-site|table|pay)\/[^/?#]+$/.test(path)
    || /^#\/menu\/(?:restaurant|venue)\/[^/?#]+$/.test(path);
  // Authentication and payment callbacks are not user destinations. Returning
  // to them can restart a callback without its original one-time credentials.
  return page || detail ? candidate : '';
}

export function resolveAuthReturn({ explicit = '', oauthFrom = '', fallback = '#/account' } = {}) {
  return loginReturnTo(explicit) || loginReturnTo(oauthFrom) || loginReturnTo(fallback) || '#/account';
}

export function joinResponse(status, data, tableId) {
  if (status === 401) return {error:'auth'};
  if (status === 404) return {error:'missing'};
  if (status === 409) return {error:'full'};
  if (status === 403) return {error:data?.error || 'idv_required',openFor:data?.openFor,minAge:data?.minAge,ageYears:data?.ageYears};
  if (status >= 200 && status < 300 && data?.table?.id === tableId) return {table:data.table,already:!!data.already};
  return {error:'unavailable'};
}
