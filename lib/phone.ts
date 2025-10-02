// lib/phone.ts
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

/** Convert raw input into strict E.164 format (+918610080339). */
export function toE164(raw: string, countryIso?: string): string | null {
  if (!raw) return null;
  const s = String(raw).trim().replace(/[^\d+]/g, "");

  let cc: CountryCode | undefined = undefined;
  if (countryIso) {
    try {
      cc = countryIso.toUpperCase() as CountryCode;
    } catch {
      cc = undefined;
    }
  }

  const pn = parsePhoneNumberFromString(s, cc);
  if (!pn || !pn.isValid()) return null;
  return pn.number; // Always E.164
}

/** Return last 10 digits, ignoring country codes. Useful for display/filtering. */
export function last10(raw: string): string {
  return String(raw || "").replace(/\D/g, "").slice(-10);
}
