// app/api/lead/lookup/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // this uses your existing better-sqlite3 setup

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const e164 = searchParams.get("e164") || "";
    const key = searchParams.get("key") || "";

    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!e164) {
      return NextResponse.json({ ok: false, error: "Missing e164" }, { status: 400 });
    }

    const stmt = db.prepare("SELECT * FROM leads WHERE phone_e164 = ?");
    const row = stmt.get(e164);

    if (!row) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, row });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
