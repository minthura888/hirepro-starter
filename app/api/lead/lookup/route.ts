// app/api/lead/lookup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getByE164 } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || "";
  const e164 = req.nextUrl.searchParams.get("e164") || "";

  if (!key || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!e164) {
    return NextResponse.json({ ok: false, error: "Missing e164" }, { status: 400 });
  }

  const row = getByE164(e164);
  if (!row) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, row });
}
