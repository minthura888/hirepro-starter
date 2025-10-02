// lib/phone.ts
import { parsePhoneNumberFromString } from "libphonenumber-js";

/** Convert any user/Telegram phone to strict E.164 like "+918610080339". */
export function toE164(raw: string, countryIso?: string): string | null {
  if (!raw) return null;
  // keep + and digits; drop spaces, dashes, brackets
  const s = String(raw).trim().replace(/[^\d+]/g, "");
  const guess = countryIso?.toUpperCase();
  const pn = parsePhoneNumberFromString(s, guess);
  if (!pn || !pn.isValid()) return null;
  return pn.number; // E.164
}

/** Compare by last 10 digits (helps when formats differ) */
export function last10(raw: string): string {
  return String(raw || "").replace(/\D/g, "").slice(-10);
}
