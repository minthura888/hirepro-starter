// app/api/lead/route.ts
import 'dotenv/config';
import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------- SQLite setup (Vercel uses /tmp; local uses ./data/app.db) ----------
const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL ? '/tmp/app.db' : path.join(process.cwd(), 'data', 'app.db'));

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

// Create table + unique indexes (one row per phone; codes unique)
function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT,
      email        TEXT,
      phone_raw    TEXT,
      phone_e164   TEXT,
      age          INTEGER,
      gender       TEXT,
      note         TEXT,
      dial         TEXT,
      country_iso  TEXT,
      ip           TEXT,
      work_code    TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_phone    ON leads(phone_e164);`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_workcode ON leads(work_code);`);

  // Backfill column if very old DB exists without work_code
  try {
    const cols = db.prepare(`PRAGMA table_info(leads)`).all() as any[];
    if (!cols.some((c: any) => c.name === 'work_code')) {
      db.exec(`ALTER TABLE leads ADD COLUMN work_code TEXT;`);
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_workcode ON leads(work_code);`);
    }
  } catch {}
}
ensureSchema();

// ---------- CORS ----------
const WEB_ORIGIN = process.env.WEB_ORIGIN || '*';
const ADMIN_KEY  = process.env.ADMIN_KEY || null;

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

// ---------- helpers ----------
function gen8(): string {
  // 8 uppercase [A-Z0-9]
  while (true) {
    const s = crypto.randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length >= 8) return s.slice(0, 8);
  }
}
function createUniqueWorkCode(): string {
  for (let i = 0; i < 10; i++) {
    const code = gen8();
    const exists = db.prepare(`SELECT 1 FROM leads WHERE work_code = ?`).get(code);
    if (!exists) return code;
  }
  // Practically unreachable fallback
  return crypto.randomBytes(8).toString('hex').slice(0, 8).toUpperCase();
}

// ---------- GET /api/lead?limit=10&key=ADMIN_KEY (admin view) ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Require admin key if set
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

    // Include work_code & ip so you can verify
    const rows = db
      .prepare(`SELECT id, name, email, phone_e164, gender, age, work_code, ip, created_at
               FROM leads
               ORDER BY id DESC
               LIMIT ?`)
      .all(limit);

    const countRow = db.prepare('SELECT COUNT(*) AS c FROM leads').get();

    return NextResponse.json(
      { ok: true, count: Number((countRow as any)?.c || 0), rows },
      { headers: corsHeaders() as any }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to read' },
      { status: 500, headers: corsHeaders() as any }
    );
  }
}

// ---------- POST /api/lead (idempotent by phone_e164) ----------
const BodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email().trim(),
  countryIso: z.string().trim(),
  dial: z.string().trim(),
  phone: z.string().trim(),                         // local digits only
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

    // If this phone already exists -> update fields, keep same work_code
    const existing = db.prepare(`SELECT id, work_code FROM leads WHERE phone_e164 = ?`).get(e164) as
      | { id: number; work_code?: string | null }
      | undefined;

    if (existing) {
      let code = existing.work_code ?? null;
      if (!code) {
        code = createUniqueWorkCode();
        db.prepare(`UPDATE leads SET work_code = ? WHERE id = ?`).run(code, existing.id);
      }

      db.prepare(
        `UPDATE leads
            SET name = ?, email = ?, phone_raw = ?, age = ?, gender = ?, note = ?,
                dial = ?, country_iso = ?, ip = ?, created_at = datetime('now')
          WHERE id = ?`
      ).run(
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

      // Do NOT expose the code; just confirm id
      return NextResponse.json(
        { ok: true, inserted: { id: existing.id } },
        { headers: corsHeaders() as any }
      );
    }

    // New phone -> generate unique code & insert
    const workCode = createUniqueWorkCode();

    const info = db
      .prepare(
        `INSERT INTO leads
          (name, email, phone_raw, phone_e164, age, gender, note, dial, country_iso, ip, work_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
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
      { ok: true, inserted: { id: Number((info as any).lastInsertRowid) } },
      { headers: corsHeaders() as any }
    );
  } catch (err: any) {
    console.error('Lead save error:', err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to save' },
      { status: 500, headers: corsHeaders() as any }
    );
  }
}
