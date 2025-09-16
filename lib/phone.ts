import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export function digitsOnly(s: string): string {
  return (s || '').replace(/\D/g, '');
}

export function toE164(countryOrNumber: string, input?: string): string | null {
  const raw = input ?? countryOrNumber;
  try {
    const p = parsePhoneNumberFromString(raw || '');
    if (p && p.isValid()) return p.number;
    return null;
  } catch {
    return null;
  }
}

/** forgiving: exact digits OR last 10 digits equal */
export function phonesMatch(a: string, b: string): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db) return false;
  if (da === db) return true;
  return da.slice(-10) === db.slice(-10);
}
