// app/api/lead/lookup/route.ts
import Database from "better-sqlite3";
import { NextResponse } from "next/server";

function getDb() {
  const path = process.env.DATABASE_PATH || "/tmp/app.db";
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const e164 = url.searchParams.get("e164") || "";
    const key  = url.searchParams.get("key")  || "";

    if (!e164 || !key) {
      return NextResponse.json({ ok: false, error: "Missing params" }, { status: 400 });
    }

    if (key !== (process.env.ADMIN_KEY || "")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const row = db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(e164) as any;

    if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
