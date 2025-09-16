// scripts/repair-code-assignments-tgid.ts
// Run once:  npx ts-node -T scripts/repair-code-assignments-tgid.ts

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
console.log(`[repair-tgid] Using database at: ${dbPath}`);

const db = new Database(dbPath);

function tableExists(name: string): boolean {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
}
function columnExists(table: string, col: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === col);
}
function indexExists(name: string): boolean {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(name);
}

db.transaction(() => {
  if (!tableExists('code_assignments')) {
    console.log('[repair-tgid] Creating table code_assignments');
    db.exec(`
      CREATE TABLE code_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER,                  -- one row per Telegram user (will index below)
        code TEXT,                      -- job code (unique index exists from prior repair)
        lead_id INTEGER,
        issued_by_exec_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } else {
    if (!columnExists('code_assignments', 'tg_id')) {
      console.log('[repair-tgid] Adding column code_assignments.tg_id');
      db.exec(`ALTER TABLE code_assignments ADD COLUMN tg_id INTEGER;`);
    }
  }

  // Create UNIQUE index on tg_id (allows NULLs so old rows don't break it)
  if (!indexExists('idx_code_assignments_tg_id')) {
    console.log('[repair-tgid] Creating unique index idx_code_assignments_tg_id on code_assignments(tg_id)');
    db.exec(
      `CREATE UNIQUE INDEX idx_code_assignments_tg_id
         ON code_assignments(tg_id)
       WHERE tg_id IS NOT NULL;`
    );
  }
})();

console.log('[repair-tgid] Done ✅');
db.close();
