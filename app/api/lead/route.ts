// app/api/lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import { upsertLead } from "@/lib/db";
import { toE164 } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, gender, age, note, phone, countryIso } = body || {};

    const e164 = toE164(String(phone || ""), String(countryIso || undefined));
    if (!e164) {
      return NextResponse.json({ ok: false, error: "Invalid phone number" }, { status: 400 });
    }

    const ip =
      (req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for") ||
        "")?.split(",")[0].trim();

    const row = upsertLead({
      name: name || null,
      email: email || null,
      phone_e164: e164,
      gender: gender || null,
      age: age ? Number(age) : undefined,
      note: note || null,
      ip,
    });

    return NextResponse.json({
      ok: true,
      row: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone_e164: row.phone_e164,
        gender: row.gender,
        age: row.age,
        work_code: row.work_code,
        created_at: row.created_at,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
