// Experimental pure parser. Not a live adapter or proof of final bookability.
// Boolean `closed` is deliberately required pending raw-response qualification.
export function parseDineplanTimeOptions(payload) {
  const unknown = (reason) => ({ status: 'unknown', reason, options: [] });
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return unknown('invalid_response');
  if (![Object.prototype, null].includes(Object.getPrototypeOf(payload))) return unknown('invalid_response');
  const entries = Object.entries(payload);
  if (!entries.length) return unknown('empty_response');
  const options = [];
  for (const [time, value] of entries) {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return unknown('unexpected_key');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return unknown('invalid_option');
    if (!Object.hasOwn(value, 'closed') || typeof value.closed !== 'boolean') return unknown('unknown_closed_flag');
    if (Object.hasOwn(value, 'reason') && typeof value.reason !== 'string') return unknown('invalid_reason');
    options.push({ time, enabled: !value.closed, reason: value.reason ?? null });
  }
  options.sort((a, b) => a.time.localeCompare(b.time));
  return { status: 'options_observed', options, finalBookabilityVerified: false };
}
