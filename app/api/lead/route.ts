import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import crypto from "crypto";

const dbPath = process.env.DATABASE_PATH || "/var/lib/hirepro/app.db";

// Get client IP from reverse proxy headers
function getClientIp(req: Request) {
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-client-ip") ||
    ""
  );
}

// (Optional) tiny migration to ensure 'ip' column exists
function ensureIpColumn(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(leads)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "ip")) {
    db.prepare("ALTER TABLE leads ADD COLUMN ip TEXT").run();
  }
}

type LeadRow = { work_code?: string } | undefined;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.phoneE164) {
      return NextResponse.json(
        { ok: false, error: "Missing phone number" },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);
    ensureIpColumn(db);

    const ip = getClientIp(req);

    // If this phone already has a code, reuse it
    const existing = db
      .prepare("SELECT work_code FROM leads WHERE phone_e164 = ?")
      .get(body.phoneE164) as LeadRow;

    let workCode: string;

    if (existing?.work_code) {
      workCode = existing.work_code;
    } else {
      workCode = crypto.randomBytes(3).toString("hex").toUpperCase();

      db.prepare(
        `INSERT INTO leads
         (phone_e164, work_code, name, email, gender, age, country_iso, dial, note, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        body.phoneE164,
        workCode,
        body.name || "",
        body.email || "",
        body.gender || "",
        Number(body.age) || 0,
        body.countryIso || "",
        body.dial || "",
        body.note || "",
        ip
      );
    }

    db.close();
    return NextResponse.json({ ok: true, workCode });
  } catch (err: any) {
    console.error("Lead insert error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

// CORS preflight (Nginx adds headers; 204 is enough)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
