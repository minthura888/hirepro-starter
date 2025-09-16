// lib/db.ts
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

/**
 * DB path:
 * - On Vercel, default to /tmp/app.db (writable but ephemeral)
 * - Else use ./data/app.db
 */
const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL ? "/tmp/app.db" : path.join(process.cwd(), "data", "app.db"));

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
export const db = new Database(DB_PATH);

/* ===========================
   Types
=========================== */

export type LeadRow = {
  id: number;
  name: string | null;
  email: string | null;
  phone_raw: string | null;
  phone_e164: string | null;
  age: number | null;
  note: string | null;
  dial: string | null;
  country_iso: string | null;
  ip: string | null;
  created_at: string; // sqlite TEXT
};

export type ExecutiveRow = {
  id: number;
  tg_id: number;
  name: string | null;
  username: string | null;
  assigned_count: number;
  created_at: string;        // sqlite TEXT
  last_assigned_at: string | null;
};

export type CodeIssuedRow = {
  id: number;
  lead_id: number;
  code: string;
  created_at: string;
};

export type CodeAssignmentRow = {
  id: number;
  issued_id: number;
  executive_id: number;
  created_at: string;
};

/* ===========================
   Schema
=========================== */

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone_raw TEXT,
      phone_e164 TEXT,
      age INTEGER,
      note TEXT,
      dial TEXT,
      country_iso TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS executives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tg_id INTEGER NOT NULL UNIQUE,
      name TEXT,
      username TEXT,
      assigned_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_assigned_at TEXT
    );

    CREATE TABLE IF NOT EXISTS code_issued (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS code_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issued_id INTEGER NOT NULL,
      executive_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (issued_id) REFERENCES code_issued(id),
      FOREIGN KEY (executive_id) REFERENCES executives(id)
    );

    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_exec_assigned ON executives(assigned_count, last_assigned_at);
    CREATE INDEX IF NOT EXISTS idx_code_issued_lead ON code_issued(lead_id);
    CREATE INDEX IF NOT EXISTS idx_code_assignments_issued ON code_assignments(issued_id);
  `);
}
ensureSchema();

/* ===========================
   Helpers
=========================== */

const digitsOnly = (s: string | null | undefined) => (s ?? "").replace(/\D+/g, "");

/** Insert a lead and return the inserted row + last N leads */
export function insertLeadAndFetch(
  lead: Partial<Omit<LeadRow, "id" | "created_at">>,
  lastCount = 10
): { inserted: LeadRow; lastN: LeadRow[] } {
  const stmt = db.prepare<
    [
      string | null, string | null, string | null, string | null,
      number | null, string | null, string | null, string | null, string | null
    ]
  >(`
    INSERT INTO leads (name, email, phone_raw, phone_e164, age, note, dial, country_iso, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const name = (lead.name ?? null) as string | null;
  const email = (lead.email ?? null) as string | null;
  const phone_raw = (lead.phone_raw ?? null) as string | null;
  const phone_e164 = (lead.phone_e164 ?? null) as string | null;
  const age = (lead.age ?? null) as number | null;
  const note = (lead.note ?? null) as string | null;
  const dial = (lead.dial ?? null) as string | null;
  const country_iso = (lead.country_iso ?? null) as string | null;
  const ip = (lead.ip ?? null) as string | null;

  const info = stmt.run(name, email, phone_raw, phone_e164, age, note, dial, country_iso, ip);
  const insertedId = Number(info.lastInsertRowid);

  const inserted = db
    .prepare<[number], LeadRow>("SELECT * FROM leads WHERE id = ?")
    .get(insertedId)!;

  const lastN = db
    .prepare<[number], LeadRow>("SELECT * FROM leads ORDER BY id DESC LIMIT ?")
    .all(lastCount);

  return { inserted, lastN };
}

/** Get the most recent N leads */
export function getLastLeads(n = 10): LeadRow[] {
  return db
    .prepare<[number], LeadRow>("SELECT * FROM leads ORDER BY id DESC LIMIT ?")
    .all(n);
}

/** Ensure an executive exists for a given Telegram user id */
export function upsertExecutive(tgId: number, name?: string, username?: string): ExecutiveRow {
  const existing = db
    .prepare<[number], ExecutiveRow>("SELECT * FROM executives WHERE tg_id = ?")
    .get(tgId);

  if (existing) return existing;

  const info = db
    .prepare<[number, string | null, string | null]>(
      "INSERT INTO executives (tg_id, name, username) VALUES (?, ?, ?)"
    )
    .run(tgId, name ?? null, username ?? null);

  const id = Number(info.lastInsertRowid);
  return db
    .prepare<[number], ExecutiveRow>("SELECT * FROM executives WHERE id = ?")
    .get(id)!;
}

/** Pick the next executive: fewest assignments, oldest last_assigned_at */
export function pickNextExecutive(): ExecutiveRow | undefined {
  return db
    .prepare<[], ExecutiveRow>(`
      SELECT * FROM executives
      ORDER BY assigned_count ASC, IFNULL(last_assigned_at, '1970-01-01T00:00:00') ASC, id ASC
      LIMIT 1
    `)
    .get();
}

/** Create an issued code row */
export function createIssuedCode(leadId: number, code: string): CodeIssuedRow {
  const info = db
    .prepare<[number, string]>("INSERT INTO code_issued (lead_id, code) VALUES (?, ?)")
    .run(leadId, code);

  const id = Number(info.lastInsertRowid);
  return db
    .prepare<[number], CodeIssuedRow>("SELECT * FROM code_issued WHERE id = ?")
    .get(id)!;
}

/** Assign an issued code to an executive (transaction) and bump counters */
export function assignExecutiveToIssued(issuedId: number, exec: ExecutiveRow): CodeAssignmentRow {
  const tx = db.transaction((eid: number, ex: ExecutiveRow) => {
    db.prepare<[number, number]>(
      "INSERT INTO code_assignments (issued_id, executive_id) VALUES (?, ?)"
    ).run(eid, ex.id);

    db.prepare<[number]>(
      "UPDATE executives SET assigned_count = assigned_count + 1, last_assigned_at = datetime('now') WHERE id = ?"
    ).run(ex.id);
  });

  tx(issuedId, exec);

  return db
    .prepare<[number], CodeAssignmentRow>(
      "SELECT * FROM code_assignments WHERE issued_id = ? ORDER BY id DESC LIMIT 1"
    )
    .get(issuedId)!;
}

/** Look up assigned executive for an issued record */
export function getExecutiveForIssued(issuedId: number): ExecutiveRow | undefined {
  return db
    .prepare<[number], ExecutiveRow>(`
      SELECT e.* FROM executives e
      JOIN code_assignments ca ON ca.executive_id = e.id
      WHERE ca.issued_id = ?
      ORDER BY ca.id DESC
      LIMIT 1
    `)
    .get(issuedId);
}

/** Utility if needed elsewhere */
export function toDigits(phone: string | null | undefined) {
  return digitsOnly(phone);
}
