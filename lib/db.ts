// lib/db.ts
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

/* ---------- open / ensure file ---------- */
const DB_PATH =
  process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
export const db = new Database(DB_PATH);

/* ---------- utils ---------- */
const digitsOnly = (s: string | null | undefined) =>
  (s ?? "").replace(/\D+/g, "");

function tableExists(name: string) {
  const row = db
  .prepare<[number], LeadRow>("SELECT * FROM leads WHERE id = ?")
  .get(Number(info.lastInsertRowid));
}
function columnExists(table: string, column: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  return rows.some((r) => r && r.name === column);
}

/* ===========================
   leads
=========================== */
if (!tableExists("leads")) {
  db.exec(`
    CREATE TABLE leads (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT,
      email         TEXT,
      gender        TEXT,
      age           INTEGER,
      country_iso   TEXT,
      dial          TEXT,
      phone_raw     TEXT,
      phone_e164    TEXT,
      phone_digits  TEXT,
      ip            TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_e164    ON leads(phone_e164);
    CREATE INDEX IF NOT EXISTS idx_leads_digits  ON leads(phone_digits);
  `);
  console.log("[DB] Created table leads");
} else {
  for (const col of [
    "age",
    "country_iso",
    "dial",
    "phone_raw",
    "phone_e164",
    "phone_digits",
  ]) {
    if (!columnExists("leads", col)) {
      db.exec(
        `ALTER TABLE leads ADD COLUMN ${col} ${
          col === "age" ? "INTEGER" : "TEXT"
        }`
      );
      console.log(`[DB] Added column leads.${col}`);
    }
  }
}

/* ===========================
   issued_codes (job codes)
=========================== */
if (!tableExists("issued_codes")) {
  db.exec(`
    CREATE TABLE issued_codes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id       INTEGER NOT NULL,
      tg_id         INTEGER NOT NULL,
      tg_username   TEXT,
      code          TEXT UNIQUE NOT NULL,
      group_posted  INTEGER DEFAULT 0,
      issued_at     TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_codes_tg    ON issued_codes(tg_id);
    CREATE INDEX IF NOT EXISTS idx_codes_lead  ON issued_codes(lead_id);
  `);
  console.log("[DB] Created table issued_codes");
}

/* ===========================
   executives + assignments
=========================== */
if (!tableExists("executives")) {
  db.exec(`
    CREATE TABLE executives (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_digits    TEXT UNIQUE NOT NULL,
      username        TEXT,
      name            TEXT,
      active          INTEGER DEFAULT 1,
      assigned_count  INTEGER DEFAULT 0,
      last_assigned_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_exec_active ON executives(active);
  `);
  console.log("[DB] Created table executives");
}
if (!tableExists("code_assignments")) {
  db.exec(`
    CREATE TABLE code_assignments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      issued_id     INTEGER NOT NULL,
      executive_id  INTEGER NOT NULL,
      assigned_at   TEXT DEFAULT (datetime('now')),
      UNIQUE(issued_id)
    );
    CREATE INDEX IF NOT EXISTS idx_ca_executive ON code_assignments(executive_id);
  `);
  console.log("[DB] Created table code_assignments");
}

/* ---------- types ---------- */
export type SaveLeadInput = {
  name?: string | null;
  email?: string | null;
  gender?: string | null;
  age?: number | null;
  countryIso?: string | null;
  dial?: string | null; // digits without '+'
  phoneRaw?: string | null;
  phoneE164?: string | null;
  phoneDigits?: string | null;
  ip?: string | null;
};
export type LeadRow = {
  id: number;
  name: string | null;
  email: string | null;
  gender: string | null;
  age: number | null;
  country_iso: string | null;
  dial: string | null;
  phone_raw: string | null;
  phone_e164: string | null;
  phone_digits: string | null;
  ip: string | null;
  created_at: string;
};
export type ExecutiveRow = {
  id: number;
  phone_digits: string;
  username: string | null;
  name: string | null;
  active: number; // 0/1
  assigned_count: number;
  last_assigned_at: string | null;
};

/* ---------- leads API helpers ---------- */
export function saveLead(input: SaveLeadInput): LeadRow & { last10: string | null } {
  const dial = digitsOnly(input.dial);
  const phoneDigits = digitsOnly(input.phoneDigits);
  const last10 = phoneDigits ? phoneDigits.slice(-10) : null;

  const stmt = db.prepare(`
    INSERT INTO leads (name, email, gender, age, country_iso, dial, phone_raw, phone_e164, phone_digits, ip)
    VALUES (@name, @email, @gender, @age, @country_iso, @dial, @phone_raw, @phone_e164, @phone_digits, @ip)
  `);
  const info = stmt.run({
    name: input.name ?? null,
    email: input.email ?? null,
    gender: input.gender ?? null,
    age: input.age ?? null,
    country_iso: input.countryIso ?? null,
    dial: dial || null,
    phone_raw: input.phoneRaw ?? null,
    phone_e164: input.phoneE164 ?? null,
    phone_digits: phoneDigits || null,
    ip: input.ip ?? null,
  });

  const row = db
    .prepare<LeadRow>("SELECT * FROM leads WHERE id = ?")
    .get(info.lastInsertRowid as number) as LeadRow;

  return { ...row, last10 };
}

export function getLeadByPhone(e164: string) {
  return db
    .prepare("SELECT * FROM leads WHERE phone_e164 = ? ORDER BY id DESC LIMIT 1")
    .get(e164) as LeadRow | undefined;
}

export function getLeadByDigitsLoose(d: string) {
  const want = digitsOnly(d);
  if (!want) return undefined;

  const direct = db
    .prepare("SELECT * FROM leads WHERE phone_digits = ? ORDER BY id DESC LIMIT 1")
    .get(want) as LeadRow | undefined;
  if (direct) return direct;

  const last10 = db
  .prepare<[], LeadRow>("SELECT * FROM leads ORDER BY id DESC LIMIT 10")
  .all();

  return db
    .prepare(
      "SELECT * FROM leads WHERE substr(phone_digits, -10) = ? ORDER BY id DESC LIMIT 1"
    )
    .get(last10) as LeadRow | undefined;
}

/* ---------- codes ---------- */
function genCode(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[(Math.random() * alphabet.length) | 0];
  return out;
}

export function getIssuedByTelegramId(tgId: number) {
  return db
    .prepare("SELECT * FROM issued_codes WHERE tg_id = ? ORDER BY id DESC LIMIT 1")
    .get(tgId) as any;
}

export function getOrCreateCodeFor(leadId: number, tgId: number, tgUsername?: string | null) {
  const existing = getIssuedByTelegramId(tgId);
  if (existing) return existing;
  const code = genCode(10);
  db.prepare(
    "INSERT INTO issued_codes (lead_id, tg_id, tg_username, code) VALUES (?, ?, ?, ?)"
  ).run(leadId, tgId, tgUsername ?? null, code);
  return db.prepare("SELECT * FROM issued_codes WHERE code = ?").get(code) as any;
}

export function markGroupPosted(tgId: number) {
  db.prepare("UPDATE issued_codes SET group_posted = 1 WHERE tg_id = ?").run(tgId);
}

/* ---------- executives ---------- */
export function addExecutive(phone: string, username?: string | null, name?: string | null) {
  const pd = digitsOnly(phone);
  if (!pd) throw new Error("Invalid phone");

  try {
    db.prepare(
      "INSERT INTO executives (phone_digits, username, name, active) VALUES (?, ?, ?, 1)"
    ).run(pd, username ?? null, name ?? null);
  } catch (e: any) {
    // already exists → reactivate & update info
    if (String(e?.code) === "SQLITE_CONSTRAINT_UNIQUE") {
      db.prepare(
        "UPDATE executives SET active=1, username=COALESCE(?, username), name=COALESCE(?, name) WHERE phone_digits=?"
      ).run(username ?? null, name ?? null, pd);
    } else {
      throw e;
    }
  }
  return db.prepare("SELECT * FROM executives WHERE phone_digits=?").get(pd) as ExecutiveRow;
}

export function removeExecutiveByPhone(phone: string) {
  const pd = digitsOnly(phone);
  db.prepare("UPDATE executives SET active=0 WHERE phone_digits=?").run(pd);
}

export function listExecutives(includeInactive = false) {
  const sql = includeInactive
    ? "SELECT * FROM executives ORDER BY active DESC, assigned_count ASC, COALESCE(last_assigned_at,'1970-01-01') ASC"
    : "SELECT * FROM executives WHERE active=1 ORDER BY assigned_count ASC, COALESCE(last_assigned_at,'1970-01-01') ASC";
  return db.prepare(sql).all() as ExecutiveRow[];
}

export function getExecutiveForIssued(issuedId: number) {
  return db
    .prepare(
      `SELECT e.* FROM code_assignments ca
       JOIN executives e ON e.id = ca.executive_id
       WHERE ca.issued_id = ?`
    )
    .get(issuedId) as ExecutiveRow | undefined;
}

export function assignExecutiveToIssued(issuedId: number) {
  // already assigned?
  const existing = getExecutiveForIssued(issuedId);
  if (existing) return existing;

  // pick next active exec (least assigned, oldest assignment first)
  const exec = db
    .prepare(
      `SELECT * FROM executives
       WHERE active=1
       ORDER BY assigned_count ASC,
                COALESCE(last_assigned_at,'1970-01-01') ASC
       LIMIT 1`
    )
    .get() as ExecutiveRow | undefined;

  if (!exec) return undefined;

  const tx = db.transaction((eid: number, ex: ExecutiveRow) => {
    db.prepare(
      "INSERT INTO code_assignments (issued_id, executive_id) VALUES (?, ?)"
    ).run(eid, ex.id);
    db.prepare(
      "UPDATE executives SET assigned_count = assigned_count + 1, last_assigned_at = datetime('now') WHERE id=?"
    ).run(ex.id);
  });

  tx(issuedId, exec);
  return getExecutiveForIssued(issuedId)!;
}

