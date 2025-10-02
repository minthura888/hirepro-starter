// app/api/lead/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { findLeadByE164 } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key") || "";
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const e164 = req.nextUrl.searchParams.get("e164") || "";
    if (!e164) {
      return NextResponse.json({ ok: false, error: "Missing e164" }, { status: 400 });
    }

    const row = findLeadByE164(e164);
    if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
