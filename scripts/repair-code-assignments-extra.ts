// scripts/repair-code-assignments-extra.ts
// Run once:  npx ts-node -T scripts/repair-code-assignments-extra.ts

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
console.log(`[repair-extra] Using database at: ${dbPath}`);

const db = new Database(dbPath);

function tableExists(name: string): boolean {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
}
function columnExists(table: string, col: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === col);
}

db.transaction(() => {
  if (!tableExists('code_assignments')) {
    console.log('[repair-extra] Creating table code_assignments');
    db.exec(`
      CREATE TABLE code_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER,
        code TEXT,
        lead_id INTEGER,
        issued_by_exec_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } else {
    if (!columnExists('code_assignments', 'lead_id')) {
      console.log('[repair-extra] Adding column code_assignments.lead_id');
      db.exec(`ALTER TABLE code_assignments ADD COLUMN lead_id INTEGER;`);
    }
    if (!columnExists('code_assignments', 'issued_by_exec_id')) {
      console.log('[repair-extra] Adding column code_assignments.issued_by_exec_id');
      db.exec(`ALTER TABLE code_assignments ADD COLUMN issued_by_exec_id INTEGER;`);
    }
  }
})();

console.log('[repair-extra] Done ✅');
db.close();
