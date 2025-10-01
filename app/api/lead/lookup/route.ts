// app/api/lead/lookup/route.ts
import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL ? '/tmp/app.db' : path.join(process.cwd(), 'data', 'app.db'));
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

const WEB_ORIGIN = process.env.WEB_ORIGIN || '*';
const ADMIN_KEY  = process.env.ADMIN_KEY || null;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': WEB_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  } as Record<string,string>;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// GET /api/lead/lookup?e164=+919876543210&key=ADMIN_KEY
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || '';
    if (!ADMIN_KEY || key !== ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403, headers: corsHeaders() });
    }

    const e164 = (searchParams.get('e164') || '').trim();
    if (!e164) {
      return NextResponse.json({ ok: false, error: 'Missing e164' }, { status: 400, headers: corsHeaders() });
    }

    const row = db.prepare(`
      SELECT id, name, email, phone_e164, gender, age, work_code, created_at
      FROM leads WHERE phone_e164 = ?
    `).get(e164);

    if (!row) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404, headers: corsHeaders() });
    }

    return NextResponse.json({ ok: true, row }, { headers: corsHeaders() });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Lookup failed' }, { status: 500, headers: corsHeaders() });
  }
}
