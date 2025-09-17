// app/api/lead/route.ts
import 'dotenv/config';
import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import Database from 'better-sqlite3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL ? '/tmp/app.db' : path.join(process.cwd(), 'data', 'app.db'));

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone_raw TEXT,
      phone_e164 TEXT,
      age INTEGER,
      gender TEXT,
      note TEXT,
      dial TEXT,
      country_iso TEXT,
      ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
  `);
}
ensureSchema();

const WEB_ORIGIN = process.env.WEB_ORIGIN || '*';
const ADMIN_KEY = process.env.ADMIN_KEY || null;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': WEB_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() as any });
}

// ------- GET /api/lead?limit=10&key=... -------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (ADMIN_KEY) {
      const key = searchParams.get('key');
      if (key !== ADMIN_KEY) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden' },
          { status: 403, headers: corsHeaders() as any }
        );
      }
    }

    const limit = Math.min(100, parseInt(searchParams.get('limit') || '10', 10) || 10);
    const rows = db
      .prepare<[number], any>(
        'SELECT id,name,email,phone_e164,gender,age,created_at FROM leads ORDER BY id DESC LIMIT ?'
      )
      .all(limit);
    const countRow = db.prepare<[], any>('SELECT COUNT(*) AS c FROM leads').get();

    return NextResponse.json(
      { ok: true, count: Number(countRow.c || 0), rows },
      { headers: corsHeaders() as any }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to read' },
      { status: 500, headers: corsHeaders() as any }
    );
  }
}

// ------- POST /api/lead -------
const BodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email().trim(),
  countryIso: z.string().trim(),
  dial: z.string().trim(),
  phone: z.string().trim(), // digits only local part
  gender: z.enum(['male', 'female']).optional(),
  age: z.coerce.number().int().min(16).max(99).optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const data = BodySchema.parse(await req.json());
    const ip =
      (req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '')
        .split(',')[0]
        .trim();

    const phoneRaw = data.phone.replace(/\D+/g, '');
    const e164 = `${data.dial}${phoneRaw}`;

    const info = db
      .prepare<
        [
          string | null, string | null, string | null, string | null,
          number | null, string | null, string | null, string | null, string | null, string | null
        ]
      >(`
        INSERT INTO leads
          (name, email, phone_raw, phone_e164, age, gender, note, dial, country_iso, ip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        data.name ?? null,
        data.email ?? null,
        phoneRaw || null,
        e164 || null,
        data.age ?? null,
        data.gender ?? null,
        data.note ?? null,
        data.dial ?? null,
        data.countryIso ?? null,
        ip || null
      );

    const inserted = db
      .prepare<[number], any>('SELECT * FROM leads WHERE id = ?')
      .get(Number(info.lastInsertRowid));

    return NextResponse.json({ ok: true, inserted }, { headers: corsHeaders() as any });
  } catch (err: any) {
    console.error('Lead save error:', err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to save' },
      { status: 500, headers: corsHeaders() as any }
    );
  }
}
