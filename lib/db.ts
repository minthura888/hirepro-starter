// lib/db.ts
import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_PATH || "/tmp/app.db";
export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Ensure the leads table & indexes exist
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
CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_phone ON leads(phone_e164);
CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_code  ON leads(work_code);
`);

// Soft migrations in case columns are missing (safe if already exist)
try { db.exec(`ALTER TABLE leads ADD COLUMN code_sent INTEGER NOT NULL DEFAULT 0;`); } catch {}
try { db.exec(`ALTER TABLE leads ADD COLUMN tg_user_id INTEGER;`); } catch {}
try { db.exec(`ALTER TABLE leads ADD COLUMN work_code TEXT;`); } catch {}
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_phone ON leads(phone_e164);`); } catch {}
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_code  ON leads(work_code);`); } catch {}

function genCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid 0/O/I/1
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function generateUniqueCode(): string {
  let code = genCode();
  while (db.prepare(`SELECT 1 FROM leads WHERE work_code = ?`).get(code)) {
    code = genCode();
  }
  return code;
}

/** Insert or update by phone_e164; guarantee one work_code per phone. */
export function upsertLead(input: {
  name?: string; email?: string; phone_e164: string;
  gender?: string; age?: number; note?: string; ip?: string;
}) {
  const { name, email, phone_e164, gender, age, note, ip } = input;

  const existing = db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(phone_e164) as any | undefined;
  if (existing) {
    if (!existing.work_code) {
      const code = generateUniqueCode();
      db.prepare(`UPDATE leads SET work_code=? WHERE id=?`).run(code, existing.id);
    }
    db.prepare(`
      UPDATE leads
         SET name=COALESCE(?,name),
             email=COALESCE(?,email),
             gender=COALESCE(?,gender),
             age=COALESCE(?,age),
             note=COALESCE(?,note),
             ip=COALESCE(?,ip)
       WHERE id=?
    `).run(name, email, gender, age, note, ip, existing.id);

    return db.prepare(`SELECT * FROM leads WHERE id=?`).get(existing.id);
  }

  const code = generateUniqueCode();
  db.prepare(`
    INSERT INTO leads (name,email,phone_e164,gender,age,note,work_code,ip,code_sent)
    VALUES (?,?,?,?,?,?,?,?,0)
  `).run(name ?? null, email ?? null, phone_e164, gender ?? null, age ?? null, note ?? null, code, ip ?? null);

  return db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(phone_e164);
}

export function findLeadByE164(e164: string) {
  return db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(e164) as any | undefined;
}

export function listLeads(limit = 100) {
  return db.prepare(`SELECT * FROM leads ORDER BY id DESC LIMIT ?`).all(limit);
}

export function markCodeSent(e164: string, tgUserId: number) {
  db.prepare(`UPDATE leads SET code_sent=1, tg_user_id=? WHERE phone_e164=?`).run(tgUserId, e164);
}
