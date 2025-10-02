// app/api/lead/route.ts
import Database from "better-sqlite3";
import { NextResponse } from "next/server";

function getDb() {
  const path = process.env.DATABASE_PATH || "/tmp/app.db";
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  // Create table if missing (runs every request; cheap & safe)
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

function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      gender,
      age,
      countryIso,
      phone,       // raw
      phoneE164,   // like "+918610080339"
      note,
    } = body || {};

    // basic validation
    if (!phoneE164 || !email || !name) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();

    // find existing
    let row = db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(phoneE164) as any;

    if (!row) {
      const workCode = randomCode(7);
      const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0].trim();

      db.prepare(
        `INSERT INTO leads (name,email,phone_e164,gender,age,work_code,ip)
         VALUES (?,?,?,?,?,?,?)`
      ).run(name, email, phoneE164, gender ?? null, Number(age) || null, workCode, ip);

      row = db.prepare(`SELECT * FROM leads WHERE phone_e164 = ?`).get(phoneE164);
    } else if (!row.work_code) {
      // ensure code exists for older rows
      const workCode = randomCode(7);
      db.prepare(`UPDATE leads SET work_code=? WHERE id=?`).run(workCode, row.id);
      row = db.prepare(`SELECT * FROM leads WHERE id=?`).get(row.id);
    }

    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
