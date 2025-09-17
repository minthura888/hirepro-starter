// app/api/lead/route.ts
import 'dotenv/config';
import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import Database from 'better-sqlite3';

// Make sure we run on Node, not the edge runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Use a writable path on Vercel by default
const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL ? '/tmp/app.db' : path.join(process.cwd(), 'data', 'app.db'));

// Ensure the folder exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// One process-wide connection (better-sqlite3 is sync)
const db = new Database(DB_PATH);

// Create tables if they don't exist
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

// Simple CORS (useful if you later call this from a different origin)
const WEB_ORIGIN = process.env.WEB_ORIGIN || '*';
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': WEB_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() as any });
}

// Input validation
const BodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email().trim(),
  countryIso: z.string().trim(), // e.g. 'us'
  dial: z.string().trim(),       // e.g. '+1'
  phone: z.string().trim(),      // digits only (local part)
  gender: z.enum(['male', 'female']).optional(),
  age: z.coerce.number().int().min(16).max(99).optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = BodySchema.parse(json);

    // Build values to store
    const ip =
      (req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '')
        .split(',')[0]
        .trim();

    const phoneRaw = data.phone.replace(/\D+/g, '');
    const e164 = `${data.dial}${phoneRaw}`; // e.g. +1 415...

    // Insert lead
    const info = db
      .prepare<
        [
          string | null, // name
          string | null, // email
          string | null, // phone_raw
          string | null, // phone_e164
          number | null, // age
          string | null, // gender
          string | null, // note
          string | null, // dial
          string | null, // country_iso
          string | null  // ip
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

    const insertedId = Number(info.lastInsertRowid);

    const inserted = db
      .prepare<[number], any>('SELECT * FROM leads WHERE id = ?')
      .get(insertedId);

    const last10 = db
      .prepare<[number], any>('SELECT * FROM leads ORDER BY id DESC LIMIT ?')
      .all(10);

    return NextResponse.json(
      { ok: true, inserted, last10 },
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
