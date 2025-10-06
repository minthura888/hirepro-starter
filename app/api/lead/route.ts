// app/api/lead/route.ts
import crypto from "crypto";
import Database from "better-sqlite3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "https://www.hirepr0.com",
  "https://hirepr0.com",
]);

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

// ---------- CORS preflight ----------
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ---------- POST /api/lead ----------
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  try {
    const body = await req.json();

    const db = new Database("/var/lib/hirepro/app.db");
    db.pragma("journal_mode = WAL");

    // ensure columns exist (idempotent)
    db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_e164 TEXT UNIQUE,
        work_code TEXT,
        name TEXT,
        email TEXT,
        gender TEXT,
        age INTEGER,
        country_iso TEXT,
        dial TEXT,
        note TEXT,
        ip TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone_e164);
    `);

    const {
      phoneE164,
      name = "",
      email = "",
      gender = "",
      age = 0,
      countryIso = "",
      dial = "",
      note = "",
    } = body || {};

    if (!phoneE164) {
      return new Response(
        JSON.stringify({ ok: false, error: "phoneE164 required" }),
        { status: 400, headers: { "content-type": "application/json", ...corsHeaders(origin) } }
      );
    }

    // client IP (from proxy) → nginx sets X-Real-IP
    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "";

    // upsert & work code
    const found = db
      .prepare("SELECT work_code FROM leads WHERE phone_e164 = ?")
      .get(phoneE164) as { work_code?: string } | undefined;

    let workCode = found?.work_code;
    if (!workCode) {
      workCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      db.prepare(
        `INSERT INTO leads(phone_e164,work_code,name,email,gender,age,country_iso,dial,note,ip)
         VALUES(?,?,?,?,?,?,?,?,?,?)`
      ).run(
        phoneE164,
        workCode,
        name,
        email,
        gender,
        Number(age) || 0,
        countryIso,
        dial,
        note ?? "",
        ip
      );
    } else {
      db.prepare(
        `UPDATE leads
         SET name=?, email=?, gender=?, age=?, country_iso=?, dial=?, note=?, ip=?
         WHERE phone_e164=?`
      ).run(
        name,
        email,
        gender,
        Number(age) || 0,
        countryIso,
        dial,
        note ?? "",
        ip,
        phoneE164
      );
    }

    return new Response(
      JSON.stringify({ ok: true, workCode }),
      { status: 200, headers: { "content-type": "application/json", ...corsHeaders(origin) } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "server error" }),
      { status: 500, headers: { "content-type": "application/json", ...corsHeaders(req.headers.get("origin")) } }
    );
  }
}
