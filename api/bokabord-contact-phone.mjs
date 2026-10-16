// Run with page.evaluate(readRicheContactPhone). No plugin initialization,
// provider model writes, synthetic events, Next clicks or network requests.
// Based on libPhoneUtils.js?t=12 SHA d860a6780f1016797e35e5490b25aecdec6b49a600e1fb76d23dca59bb3adfd7.
export function readRicheContactPhone() {
  const inputs = [...document.querySelectorAll('input[name="phone"].phoneField')]
    .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
  if (inputs.length !== 1) return null;
  const input = inputs[0];
  const selected = input.closest('.intl-tel-input')?.querySelector('.selected-flag');
  const flag = selected?.querySelector('.iti-flag');
  const countries = window.$?.fn?.intlTelInput?.getCountryData?.();
  const utils = window.intlTelInputUtils;
  if (!flag || !Array.isArray(countries) || !utils) return null;
  const rows = countries.filter(country => flag.classList.contains(country.iso2));
  if (rows.length !== 1) return null;
  const { iso2, dialCode, name } = rows[0];
  if (!/^[a-z]{2}$/.test(iso2) || !/^\d{1,4}$/.test(dialCode)
    || selected.title !== name + ': +' + dialCode) return null;
  const raw = input.value;
  let full = raw;
  // Exact _getFullNumber special case; separateDialCode is not enabled by guestCtrl.
  if (dialCode.charAt(0) === '1' && dialCode.length === 4 && dialCode.substr(1) !== raw.substr(0, 3)) {
    full = dialCode.substr(1) + raw;
  }
  const scope = window.angular?.element(input).scope();
  if (typeof scope?.phoneValid !== 'function' || scope.phoneValid() !== true
    || utils.isValidNumber(full.trim(), iso2) !== true) return null;
  const formatted = utils.formatNumber(full, iso2);
  if (typeof formatted !== 'string') return null;
  const canonical = formatted.replace(/\s/g, '');
  if (!/^\+[1-9]\d{6,14}$/.test(canonical)) return null;
  // Bind all four in native review, re-read before dispatch. Do not log them.
  return { canonical, raw, iso2, dialCode };
}
