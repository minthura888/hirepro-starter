// lib/db.ts
import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_PATH || "/tmp/app.db";
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone_e164 TEXT UNIQUE,
    gender TEXT,
    age INTEGER,
    work_code TEXT,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_leads_phone_e164 ON leads(phone_e164);
`);

export type LeadInput = {
  name?: string | null;
  email?: string | null;
  phone_e164: string;
  gender?: string | null;
  age?: number | null;
  ip?: string | null;
};

export type LeadRow = {
  id: number;
  name: string | null;
  email: string | null;
  phone_e164: string;
  gender: string | null;
  age: number | null;
  work_code: string;
  ip: string | null;
  created_at: string;
};

function newWorkCode(len = 7): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid 0/O/1/I
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** Return row by E.164 (or null). */
export function getByE164(e164: string): LeadRow | null {
  const stmt = db.prepare("SELECT * FROM leads WHERE phone_e164 = ? LIMIT 1");
  const row = stmt.get(e164);
  return (row as LeadRow) ?? null;
}

/** Upsert by E.164. Do NOT regenerate work_code if a row exists. */
export function upsertLead(input: LeadInput): LeadRow {
  const existing = getByE164(input.phone_e164);
  if (existing) {
    const upd = db.prepare(`
      UPDATE leads
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          gender = COALESCE(?, gender),
          age = COALESCE(?, age),
          ip = COALESCE(?, ip)
      WHERE phone_e164 = ?
    `);
    upd.run(
      input.name ?? null,
      input.email ?? null,
      input.gender ?? null,
      input.age ?? null,
      input.ip ?? null,
      input.phone_e164
    );
    return getByE164(input.phone_e164)!;
  }

  const work_code = newWorkCode();
  const ins = db.prepare(`
    INSERT INTO leads (name, email, phone_e164, gender, age, work_code, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  ins.run(
    input.name ?? null,
    input.email ?? null,
    input.phone_e164,
    input.gender ?? null,
    input.age ?? null,
    work_code,
    input.ip ?? null
  );
  return getByE164(input.phone_e164)!;
}
