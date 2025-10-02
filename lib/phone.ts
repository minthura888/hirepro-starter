import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function toE164(raw: string, countryIso?: string): string | null {
  // Accept “8610080339”, “+91 861 008 0339”, etc.
  const s = (raw || '').replace(/[^\d+]/g, '');
  let pn = parsePhoneNumberFromString(s, countryIso?.toUpperCase());
  if (!pn || !pn.isValid()) return null;
  return pn.number; // E.164 like “+918610080339”
}
