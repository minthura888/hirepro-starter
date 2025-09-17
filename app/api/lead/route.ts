// app/api/lead/route.ts
import 'dotenv/config';
import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';

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
      work_code TEXT,               -- keep code here, not returned to client
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // One row per phone, and codes are unique across all rows
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_phone ON leads(phone_e164);`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_workcode ON leads(work_code);`);

  // Backfill column if very old DB existed without work_code
  try {
    const cols = db.prepare(`PRAGMA table_info(leads)`).all() as any[];
    if (!cols.some(c => c.name === 'work_code')) {
      db.exec(`ALTER TABLE leads ADD COLUMN work_code TEXT;`);
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_workcode ON leads(work_code);`);
    }
  } catch {}
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

// -------- helpers to build an 8-char code like A26Z7EA2 --------
function gen8() {
  // produce 8 upper-case [A-Z0-9]
  while (true) {
    const c = crypto.randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length >= 8) return c.slice(0, 8);
  }
}
function createUniqueWorkCode(): string {
  // loop to avoid ultra-rare collision
  for (let i = 0; i < 10; i++) {
    const code = gen8();
    const exists = db.prepare(`SELECT 1 FROM leads WHERE work_code = ?`).get(code);
    if (!exists) return code;
  }
  // practically unreachable; still 8 chars
  return crypto.randomBytes(8).toString('hex').slice(0, 8).toUpperCase();
}

// ---------- GET /api/lead?limit=10&key=... (admin only; no code returned) ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (ADMIN_KEY) {
      const key = searchParams.get('key');
      if (key !== ADMIN_KEY) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403, headers: corsHeaders() as any });
      }
    }
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '10', 10) || 10);
    const rows = db
      .prepare<[number], any>(
        `SELECT id,name,email,phone_e164,gender,age,created_at
         FROM leads
         ORDER BY id DESC
         LIMIT ?`
      )
      .all(limit);
    const countRow = db.prepare<[], any>('SELECT COUNT(*) AS c FROM leads').get();
    return NextResponse.json({ ok: true, count: Number(countRow.c || 0), rows }, { headers: corsHeaders() as any });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to read' }, { status: 500, headers: corsHeaders() as any });
  }
}

// ---------- POST /api/lead ----------
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

    // If phone exists -> update only; keep code (or create one if missing)
    const existing = db.prepare<[string], any>('SELECT id, work_code FROM leads WHERE phone_e164 = ?').get(e164);
    if (existing) {
      let code = existing.work_code as string | null;
      if (!code) {
        code = createUniqueWorkCode();
        db.prepare('UPDATE leads SET work_code = ? WHERE id = ?').run(code, existing.id);
      }

      db.prepare(`
        UPDATE leads
           SET name = ?, email = ?, phone_raw = ?, age = ?, gender = ?, note = ?,
               dial = ?, country_iso = ?, ip = ?, created_at = datetime('now')
         WHERE id = ?
      `).run(
        data.name ?? null,
        data.email ?? null,
        phoneRaw || null,
        data.age ?? null,
        data.gender ?? null,
        data.note ?? null,
        data.dial ?? null,
        data.countryIso ?? null,
        ip || null,
        existing.id
      );

      // Return only id; NOT the work_code
      return NextResponse.json({ ok: true, inserted: { id: existing.id } }, { headers: corsHeaders() as any });
    }

    // New phone -> generate unique 8-char code once
    const workCode = createUniqueWorkCode();

    const info = db
      .prepare<
        [
          string | null, string | null, string | null, string | null,
          number | null, string | null, string | null, string | null, string | null, string | null,
          string | null
        ]
      >(`
        INSERT INTO leads
          (name, email, phone_raw, phone_e164, age, gender, note, dial, country_iso, ip, work_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        ip || null,
        workCode
      );

    return NextResponse.json(
      { ok: true, inserted: { id: Number(info.lastInsertRowid) } }, // code is not exposed
      { headers: corsHeaders() as any }
    );
  } catch (err: any) {
    console.error('Lead save error:', err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to save' }, { status: 500, headers: corsHeaders() as any });
  }
}
