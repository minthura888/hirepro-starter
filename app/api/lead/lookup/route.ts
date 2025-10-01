// app/api/lead/lookup/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- DB open (same as /api/lead) ---
const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL ? "/tmp/app.db" : path.join(process.cwd(), "data", "app.db"));
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

// Create the same schema used by POST /api/lead
function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT,
      email        TEXT,
      phone_raw    TEXT,
      phone_e164   TEXT,
      age          INTEGER,
      gender       TEXT,
      note         TEXT,
      dial         TEXT,
      country_iso  TEXT,
      ip           TEXT,
      work_code    TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_phone    ON leads(phone_e164);`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_workcode ON leads(work_code);`);
}
ensureSchema();

// --- CORS (match /api/lead) ---
const WEB_ORIGIN = process.env.WEB_ORIGIN || "*";
const ADMIN_KEY = process.env.ADMIN_KEY || null;
const cors = {
  "Access-Control-Allow-Origin": WEB_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  Vary: "Origin",
} as Record<string, string>;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

// GET /api/lead/lookup?e164=+918610080339&key=ADMIN_KEY
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    if (ADMIN_KEY) {
      const key = searchParams.get("key");
      if (key !== ADMIN_KEY) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403, headers: cors });
      }
    }

    const e164 = (searchParams.get("e164") || "").trim();
    if (!e164) {
      return NextResponse.json({ ok: false, error: "Missing e164" }, { status: 400, headers: cors });
    }

    const row = db
      .prepare(
        `SELECT id, name, email, phone_e164, gender, age, work_code, ip, created_at
         FROM leads WHERE phone_e164 = ?`
      )
      .get(e164);

    if (!row) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404, headers: cors });
    }

    return NextResponse.json({ ok: true, row }, { headers: cors });
  } catch (err: any) {
    console.error("lookup error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || "Server error" }, { status: 500, headers: cors });
  }
}
