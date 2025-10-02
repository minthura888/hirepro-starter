// app/api/lead/route.ts
import { NextRequest, NextResponse } from "next/server";
import { toE164 } from "@/lib/phone";
import { upsertLead } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      name = null,
      email = null,
      gender = null,
      age = null,
      countryIso,
      phone,
      phoneE164, // client may already send computed E.164
      note,      // ignored but tolerated
    } = body || {};

    // Prefer client-provided E.164 if valid, else compute from raw + country
    const e164 =
      (typeof phoneE164 === "string" && phoneE164.startsWith("+") && phoneE164.length > 4
        ? phoneE164
        : toE164(String(phone ?? ""), countryIso)) || null;

    if (!e164) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Grab IP (works on Vercel)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.ip ||
      null;

    const normalizedAge =
      typeof age === "number"
        ? age
        : typeof age === "string"
        ? Number(age)
        : null;

    const row = upsertLead({
      name,
      email,
      phone_e164: e164,
      gender,
      age: Number.isFinite(normalizedAge) ? (normalizedAge as number) : null,
      ip,
    });

    return NextResponse.json({
      ok: true,
      e164: row.phone_e164,
      work_code: row.work_code,
      saved: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
