import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Database from "better-sqlite3";

const DB_PATH = "/var/lib/hirepro/app.db";

function ok(data: any) {
  return NextResponse.json({ ok: true, ...data }, { status: 200 });
}
function err(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function safeString(v: any): string {
  return typeof v === "string" ? v.trim() : "";
}

function clientIpFromHeaders(req: NextRequest): string | null {
  // Prefer X-Forwarded-For chain, then X-Real-IP, then req.ip-like sources.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  // As a last resort, NextRequest doesn't expose raw socket IP reliably here.
  return null;
}

export async function OPTIONS() {
  // Let Nginx handle CORS headers, just return 204 here.
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  let db: Database.Database | null = null;
  try {
    const body = await req.json();

    const name = safeString(body?.name);
    const email = safeString(body?.email);
    const countryIso = safeString(body?.countryIso);
    const dial = safeString(body?.dial);
    const phone = safeString(body?.phone);
    const phoneE164 = safeString(body?.phoneE164);
    const gender = safeString(body?.gender);
    const note = body?.note ? safeString(body.note) : null;

    // 1) Prefer browser-captured IP, else fall back to headers
    const ipFromBrowser = safeString(body?.ip);
    const ip =
      ipFromBrowser ||
      clientIpFromHeaders(req) ||
      null; // store null if unknown, but we do our best

    if (!phoneE164) return err("phoneE164 is required", 400);

    db = new Database(DB_PATH, { fileMustExist: true });

    // If the phone already exists, reuse its work_code
    const getStmt = db.prepare(
      "SELECT id, work_code FROM leads WHERE phone_e164 = ? ORDER BY id DESC LIMIT 1"
    );
    const existing = getStmt.get(phoneE164) as { id: number; work_code: string } | undefined;

    let workCode: string;
    if (existing) {
      workCode = existing.work_code;
    } else {
      workCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g., "FA1B22"

      db.prepare(
        `INSERT INTO leads
          (phone_e164, work_code, name, email, gender, age, country_iso, dial, note, ip, created_at)
         VALUES
          (?,          ?,         ?,    ?,     ?,      ?,   ?,           ?,    ?,   ?,  datetime('now'))`
      ).run(
        phoneE164,
        workCode,
        name || null,
        email || null,
        gender || null,
        body?.age ?? null,
        countryIso || null,
        dial || null,
        note,
        ip || null
      );
    }

    return ok({ workCode });
  } catch (e: any) {
    return err(e?.message || "Server error");
  } finally {
    if (db) db.close();
  }
}
