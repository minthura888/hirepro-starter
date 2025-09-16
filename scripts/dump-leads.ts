// scripts/dump-leads.ts
// Run: npx ts-node -T scripts/dump-leads.ts

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

function digits(s: any) { return String(s ?? '').replace(/\D+/g, ''); }

const rows = db.prepare(`
  SELECT id, name, email, age, gender,
         phone_e164, phone_raw, dial, country_iso,
         tg_id, created_at
  FROM leads
  ORDER BY id DESC
  LIMIT 10
`).all();

console.log('Last 10 leads:');
for (const r of rows) {
  const dRaw = digits(r.phone_raw);
  const dE164 = digits(r.phone_e164);
  const dDial = digits(r.dial) + dRaw;
  console.log({
    id: r.id,
    name: r.name,
    phone_e164: r.phone_e164,
    phone_raw: r.phone_raw,
    dial: r.dial,
    country_iso: r.country_iso,
    norm_digits_raw: dRaw,
    norm_digits_e164: dE164,
    norm_digits_dial_plus_raw: dDial
  });
}
