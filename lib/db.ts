// lib/db.ts
import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_PATH || "/tmp/app.db";
export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Ensure table exists with correct schema
db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT,
  email        TEXT,
  phone_e164   TEXT NOT NULL UNIQUE,
  gender       TEXT,
  age          INTEGER,
  note         TEXT,
  work_code    TEXT UNIQUE,
  code_sent    INTEGER NOT NULL DEFAULT 0,
  tg_user_id   INTEGER,
  ip           TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// --- Utility to generate unique work codes ---
function genCode(len = 7) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/I/1
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function generateUniqueCode(): string {
  let code = genCode();
  let clash = db.prepare(`SELECT 1 FROM leads WHERE work_code = ?`).get(code);
  while (clash) {
    code = genCode();
    clash = db.prepare(`SELECT 1 FROM leads WHERE work_code = ?`).get(code);
  }
  return code;
}

// --- CRUD operations ---

export function insertLead(input: {
  name?: string;
  email?: string;
  phone_e164: string;
  gender?: string;
  age?: number;
  note?: string;
  ip?: string;
}) {
  const { name, email, phone_e164, gender, age, note, ip } = input;

  // If already exists, update instead of inserting new
  let existing = db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(phone_e164);
  if (existing) {
    // If no code yet, assign one
    if (!existing.work_code) {
      const code = generateUniqueCode();
      db.prepare(`UPDATE leads SET work_code=? WHERE id=?`).run(code, existing.id);
      existing.work_code = code;
    }

    db.prepare(
      `UPDATE leads
       SET name=COALESCE(?,name),
           email=COALESCE(?,email),
           gender=COALESCE(?,gender),
           age=COALESCE(?,age),
           note=COALESCE(?,note),
           ip=COALESCE(?,ip)
       WHERE id=?`
    ).run(name, email, gender, age, note, ip, existing.id);

    return db.prepare(`SELECT * FROM leads WHERE id=?`).get(existing.id);
  }

  // New insert
  const work_code = generateUniqueCode();
  db.prepare(
    `INSERT INTO leads (name,email,phone_e164,gender,age,note,work_code,ip,code_sent)
     VALUES (?,?,?,?,?,?,?,?,0)`
  ).run(name, email, phone_e164, gender, age, note, work_code, ip);

  return db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(phone_e164);
}

export function findLeadByE164(e164: string) {
  return db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(e164);
}

export function listLeads(limit = 100) {
  return db.prepare(`SELECT * FROM leads ORDER BY id DESC LIMIT ?`).all(limit);
}

export function markCodeSent(e164: string, tgUserId: number) {
  db.prepare(`UPDATE leads SET code_sent=1, tg_user_id=? WHERE phone_e164=?`).run(tgUserId, e164);
}
