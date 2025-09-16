// scripts/migrate-db.ts
// Run with:  npx ts-node -T scripts/migrate-db.ts

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), 'data', 'app.db');

console.log(`[migrate] Using database at: ${dbPath}`);
const db = new Database(dbPath);

function tableExists(name: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  return !!row;
}

function columnExists(table: string, col: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{name:string}>;
  return cols.some(c => c.name === col);
}

function indexExists(name: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(name);
  return !!row;
}

db.transaction(() => {
  // ---------- executives ----------
  if (!tableExists('executives')) {
    console.log('[migrate] Creating table executives');
    db.exec(`
      CREATE TABLE executives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT,                      -- digits only (nullable)
        username TEXT,                   -- without @
        display_name TEXT DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } else {
    if (!columnExists('executives', 'phone')) {
      console.log('[migrate] Adding column executives.phone');
      // IMPORTANT: cannot add UNIQUE here in SQLite
      db.exec(`ALTER TABLE executives ADD COLUMN phone TEXT;`);
    }
    if (!columnExists('executives', 'username')) {
      console.log('[migrate] Adding column executives.username');
      db.exec(`ALTER TABLE executives ADD COLUMN username TEXT;`);
    }
    if (!columnExists('executives', 'display_name')) {
      console.log('[migrate] Adding column executives.display_name');
      db.exec(`ALTER TABLE executives ADD COLUMN display_name TEXT DEFAULT '';`);
    }
    if (!columnExists('executives', 'is_active')) {
      console.log('[migrate] Adding column executives.is_active');
      db.exec(`ALTER TABLE executives ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;`);
    }
  }

  // Create UNIQUE index for executives.phone (nullable allowed)
  // First check for duplicates that would break the index
  const dupPhones = db
    .prepare(`
      SELECT phone, COUNT(*) c
      FROM executives
      WHERE phone IS NOT NULL AND TRIM(phone) <> ''
      GROUP BY phone HAVING c > 1
    `)
    .all() as Array<{ phone: string; c: number }>;

  if (dupPhones.length) {
    console.log('[migrate] ⚠ Cannot create unique index executives.phone due to duplicates:');
    dupPhones.forEach(d => console.log(`  - phone=${d.phone} count=${d.c}`));
    console.log('  Please fix duplicate phones above, then re-run migration.');
  } else {
    if (!indexExists('idx_executives_phone')) {
      console.log('[migrate] Creating unique index idx_executives_phone on executives(phone)');
      // Partial index so NULL/empty values are allowed
      db.exec(`CREATE UNIQUE INDEX idx_executives_phone ON executives(phone) WHERE phone IS NOT NULL AND TRIM(phone) <> '';`);
    }
  }

  // ---------- leads ----------
  if (!tableExists('leads')) {
    console.log('[migrate] Creating table leads');
    db.exec(`
      CREATE TABLE leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        gender TEXT,
        age INTEGER,
        phone_e164 TEXT,
        country_iso TEXT,
        dial TEXT,
        phone_raw TEXT,
        tg_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } else {
    const addCols: Array<[string, string]> = [
      ['age', 'INTEGER'],
      ['country_iso', 'TEXT'],
      ['dial', 'TEXT'],
      ['phone_raw', 'TEXT'],
      ['tg_id', 'INTEGER'],
    ];
    for (const [col, ddl] of addCols) {
      if (!columnExists('leads', col)) {
        console.log(`[migrate] Adding column leads.${col}`);
        db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${ddl};`);
      }
    }
  }

  // ---------- code_assignments ----------
  if (!tableExists('code_assignments')) {
    console.log('[migrate] Creating table code_assignments');
    db.exec(`
      CREATE TABLE code_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER NOT NULL UNIQUE,    -- one code per Telegram user
        code TEXT NOT NULL UNIQUE,        -- the job code
        lead_id INTEGER,
        issued_by_exec_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
})();

console.log('[migrate] Done ✅');
db.close();
