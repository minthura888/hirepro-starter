// app/api/lead/route.ts
import 'dotenv/config';
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = process.env.DATABASE_PATH || (process.env.VERCEL ? '/tmp/app.db' : path.join(process.cwd(), 'data', 'app.db'));
const db = new Database(DB_PATH);

const digits = (s: any) => String(s ?? '').replace(/\D+/g, '');

function toE164(raw: string, countryIso?: string | null): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { parsePhoneNumberFromString } = require('libphonenumber-js/min');
    const opt = countryIso && /^[A-Z]{2}$/.test(countryIso) ? { defaultCountry: countryIso as any } : {};
    let p = parsePhoneNumberFromString(raw, opt);
    if (!p && !raw.startsWith('+')) p = parsePhoneNumberFromString('+' + raw, opt);
    return p?.isValid() ? p.number : ('+' + digits(raw));
  } catch {
    return '+' + digits(raw);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept BOTH naming styles so the form can’t miss:
    // new: phone, dial, countryIso
    // old: phone_e164, country_dial, country_iso
    const name   = String(body.name ?? '').trim();
    const email  = String(body.email ?? '').trim();
    const gender = String(body.gender ?? '').trim();
    const age    = Number(body.age ?? 0) || null;

    const dial       = String(body.dial ?? body.country_dial ?? '').trim();      // "+62"
    const countryIso = String(body.countryIso ?? body.country_iso ?? '').trim().toUpperCase(); // "ID"
    const phoneDigits = digits(body.phone ?? '') || digits((body.phone_e164 ?? '').toString());

    const composed   = (dial || '') + phoneDigits;        // e.g. "+62" + "877..." => "+62877..."
    const phoneE164  = toE164(composed || String(body.phone_e164 ?? ''), countryIso || undefined);
    const phoneRaw   = phoneDigits; // keep digits-only too

    // store — use empty strings instead of nulls (so you never “see null”)
    const info = db.prepare(`
      INSERT INTO leads (name, email, gender, age, phone_e164, phone_raw, dial, country_iso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      email,
      gender,
      age,
      String(phoneE164 || ''),
      String(phoneRaw || ''),
      String(dial || ''),
      String(countryIso || '')
    );

    console.log('[api/lead] saved id=', Number(info.lastInsertRowid), {
      phone_e164: phoneE164, phone_raw: phoneRaw, dial, countryIso
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/lead] error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
