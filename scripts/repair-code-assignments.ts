// scripts/repair-code-assignments.ts
// Run once:  npx ts-node -T scripts/repair-code-assignments.ts

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
console.log(`[repair] Using database at: ${dbPath}`);

const db = new Database(dbPath);

function tableExists(name: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  return !!row;
}
function columnExists(table: string, col: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === col);
}
function indexExists(name: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(name);
  return !!row;
}
function genCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

db.transaction(() => {
  if (!tableExists('code_assignments')) {
    console.log('[repair] Creating table code_assignments');
    db.exec(`
      CREATE TABLE code_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER NOT NULL UNIQUE,
        code TEXT UNIQUE,
        lead_id INTEGER,
        issued_by_exec_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } else {
    if (!columnExists('code_assignments', 'code')) {
      console.log('[repair] Adding column code_assignments.code');
      // add column (no NOT NULL constraint here)
      db.exec(`ALTER TABLE code_assignments ADD COLUMN code TEXT;`);
    }
  }

  // Backfill any missing/empty codes with unique values
  const missing = db
    .prepare(`SELECT id FROM code_assignments WHERE code IS NULL OR TRIM(code) = ''`)
    .all() as Array<{ id: number }>;

  if (missing.length) {
    console.log(`[repair] Backfilling ${missing.length} missing codes...`);
    const existsStmt = db.prepare(`SELECT 1 FROM code_assignments WHERE code = ?`);
    const updateStmt = db.prepare(`UPDATE code_assignments SET code = ? WHERE id = ?`);
    for (const row of missing) {
      let code = '';
      for (;;) {
        code = genCode();
        const exists = existsStmt.get(code);
        if (!exists) break;
      }
      updateStmt.run(code, row.id);
    }
  }

  // Create unique index for code (allows null/empty)
  if (!indexExists('idx_code_assignments_code')) {
    console.log('[repair] Creating unique index idx_code_assignments_code on code_assignments(code)');
    db.exec(
      `CREATE UNIQUE INDEX idx_code_assignments_code
         ON code_assignments(code)
       WHERE code IS NOT NULL AND TRIM(code) <> '';`
    );
  }
})();

console.log('[repair] Done ✅');
db.close();
