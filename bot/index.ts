// bot/index.ts
// Run with:  npm run dev:bot
import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import Database from 'better-sqlite3';
import path from 'node:path';

/* ========= ENV ========= */
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || process.env.TOKEN || process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN in env');

const OWNER_ID = Number(process.env.TELEGRAM_OWNER_ID || 0); // who can use /add /remove /status in groups
const GROUP_ID = Number(process.env.TELEGRAM_GROUP_ID || 0);

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
const db = new Database(DB_PATH);

/* ========= DB INIT (with auto-migrations) ========= */
db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, email TEXT, gender TEXT, age INTEGER,
  phone_e164 TEXT, phone_raw TEXT, dial TEXT, country_iso TEXT
);

CREATE TABLE IF NOT EXISTS executives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_digits TEXT NOT NULL DEFAULT '',
  username TEXT,
  display_name TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS code_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  tg_id INTEGER,
  code TEXT
);
`);

function ensureColumn(table: string, defSql: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((r:any)=>r.name);
  const name = defSql.split(/\s+/)[0];
  if (!cols.includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${defSql}`);
}
ensureColumn('code_assignments', "exec_id INTEGER");
ensureColumn('code_assignments', "group_posted INTEGER NOT NULL DEFAULT 0");
ensureColumn('code_assignments', "created_at TEXT NOT NULL DEFAULT (datetime('now'))");
ensureColumn('executives', "created_at TEXT NOT NULL DEFAULT (datetime('now'))");
ensureColumn('executives', "last_assigned_at TEXT");   // for round-robin tiebreaker
ensureColumn('leads', "ip TEXT");

/* ========= helpers ========= */
const digitsOnly = (s: string) => (s || '').replace(/\D+/g, '');
const at = (u?: string|null) => u ? (u.startsWith('@') ? u : '@' + u) : '(none)';
const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function ensurePlus(num: string | null | undefined) {
  if (!num) return '';
  const d = digitsOnly(num);
  return d ? `+${d}` : '';
}

function findLeadByPhoneAny(raw: string) {
  const d = digitsOnly(raw);
  const last7 = d.slice(-7);

  // exact E.164 match
  let r = db.prepare(`SELECT * FROM leads WHERE phone_e164 = ? ORDER BY id DESC LIMIT 1`).get('+'+d) as any;
  if (r) return r;

  // partial match
  r = db.prepare(`
    SELECT * FROM leads
    WHERE REPLACE(REPLACE(IFNULL(phone_raw,''), ' ', ''), '-', '') LIKE '%' || ?
       OR REPLACE(REPLACE(REPLACE(IFNULL(phone_e164,''), '+',''), ' ', ''), '-', '') LIKE '%' || ?
    ORDER BY id DESC LIMIT 1
  `).get(last7, last7) as any;
  if (r) return r;

  return null;
}

function getIssuedByTelegramId(tgId: number) {
  return db.prepare(`
    SELECT ca.*, e.username AS exec_username, COALESCE(e.display_name,'') AS exec_display
    FROM code_assignments ca
    LEFT JOIN executives e ON e.id = ca.exec_id
    WHERE ca.tg_id = ?
    ORDER BY ca.id DESC LIMIT 1
  `).get(tgId) as any;
}

function makeCode(len = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

function getOrCreateCodeFor(leadId: number, tgId: number) {
  const exists = db.prepare(`SELECT * FROM code_assignments WHERE lead_id = ? OR tg_id = ? ORDER BY id DESC LIMIT 1`).get(leadId, tgId) as any;
  if (exists) return exists;
  const code = makeCode(10);
  const info = db.prepare(`INSERT INTO code_assignments (lead_id, tg_id, code) VALUES (?,?,?)`).run(leadId, tgId, code);
  return db.prepare(`SELECT * FROM code_assignments WHERE id = ?`).get(Number(info.lastInsertRowid)) as any;
}

function countAssigned(execId: number) {
  const r = db.prepare(`SELECT COUNT(*) AS c FROM code_assignments WHERE exec_id = ?`).get(execId) as any;
  return r?.c || 0;
}

// ---- ROUND-ROBIN PICK ----
// choose active executive with the fewest assignments; tie → oldest last_assigned_at; then lowest id
function chooseExecutive(): any | null {
  const row = db.prepare(`
    SELECT e.*,
      COALESCE( (SELECT COUNT(*) FROM code_assignments ca WHERE ca.exec_id = e.id), 0 ) AS assigned_count
    FROM executives e
    WHERE e.is_active = 1 AND (e.username IS NOT NULL AND e.username <> '')
    ORDER BY assigned_count ASC, COALESCE(e.last_assigned_at, '') ASC, e.id ASC
    LIMIT 1
  `).get() as any;
  return row || null;
}

function assignExecutiveToIssued(issuedId: number) {
  const exec = chooseExecutive();
  if (!exec) return null;
  db.prepare(`UPDATE code_assignments SET exec_id = ? WHERE id = ?`).run(exec.id, issuedId);
  db.prepare(`UPDATE executives SET last_assigned_at = datetime('now') WHERE id = ?`).run(exec.id);
  return { id: exec.id, username: exec.username, display: exec.display_name };
}

function markGroupPosted(tgId: number) {
  db.prepare(`UPDATE code_assignments SET group_posted = 1 WHERE tg_id = ?`).run(tgId);
}

/* ========= KEYBOARD ========= */
function contactKb() {
  return Markup.keyboard([[Markup.button.contactRequest('📇 Click Accept Job Code.')]]).resize();
}

/* ========= BOT ========= */
const bot = new Telegraf(BOT_TOKEN);

/* ----- HELP ----- */
bot.help(async (ctx) => {
  await ctx.reply(
`1) Fill the application form on our website
2) Come back here and tap /share to send your Telegram contact
3) If your phone matches the form, I'll issue your job code`
  );
});

/* ----- START / SHARE / INFO (DM) ----- */
bot.start(async (ctx) => {
  const name = `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || 'there';
  await ctx.reply(
    `Hello ${name}!\n\n` +
      `Use /info to view your account information\n` +
      `Use /share to share your contact details\n` +
      `Use /help to get instructions`
  );
  await ctx.reply('Please click the button below to share your contact information', contactKb());
});

bot.command('share', async (ctx) => {
  await ctx.reply('Please click the button below to share your contact information', contactKb());
});

bot.command('info', async (ctx) => {
  const issued = getIssuedByTelegramId(ctx.from!.id);
  if (!issued) {
    await ctx.reply(`No code issued yet. Tap /share and accept to continue.`, contactKb());
    return;
  }
  const label = issued.exec_username ? at(issued.exec_username) : '(pending)';
  await ctx.replyWithHTML(
    `Verify successfully!\n` +
      `Job code: <code>${esc(issued.code)}</code>\n` +
      `Executive service: ${esc(label)}`,
    issued.exec_username ? Markup.inlineKeyboard([Markup.button.url(`Message ${label}`, `https://t.me/${issued.exec_username}`)]) : undefined
  );
});

/* ----- CONTACT FLOW ----- */
bot.on('contact', async (ctx) => {
  try {
    const contact = (ctx.message as any)?.contact;
    if (!contact?.phone_number) {
      await ctx.reply('Could not read your phone. Please tap /share again.');
      return;
    }
    const tgId = ctx.from!.id;

    // re-send if exists
    const already = getIssuedByTelegramId(tgId);
    if (already) {
      const label = already.exec_username ? at(already.exec_username) : '(pending)';
      await ctx.replyWithHTML(
        `Verify successfully!\n` +
          `Job code: <code>${esc(already.code)}</code>\n` +
          `Executive service: ${esc(label)}`,
        already.exec_username ? Markup.inlineKeyboard([Markup.button.url(`Message ${label}`, `https://t.me/${already.exec_username}`)]) : undefined
      );
      return;
    }

    // find matching lead
    const lead = findLeadByPhoneAny(contact.phone_number);
    if (!lead) {
      await ctx.reply(
        `Mobile phone number verification failed\n\n` +
          `Please submit the form again using this same phone number, then tap /share.`
      );
      return;
    }

    const issued = getOrCreateCodeFor(lead.id, tgId);
    const exec = assignExecutiveToIssued(issued.id);

    // DM to user
    const label = exec?.username ? at(exec.username) : '(pending)';
    await ctx.replyWithHTML(
      `Verify successfully!\n` +
        `Job code: <code>${esc(issued.code)}</code>\n` +
        `Executive service: ${esc(label)}`,
      exec?.username ? Markup.inlineKeyboard([Markup.button.url(`Message ${label}`, `https://t.me/${exec.username}`)]) : undefined
    );

    // ===== Group notification — single block; IP is monospace via <code> =====
    if (GROUP_ID) {
      const fullName = `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || '(no name)';
      const username = ctx.from?.username ? '@' + ctx.from.username : '(none)';

      const phoneFromLead =
        (lead.phone_e164 && lead.phone_e164.trim()) ? lead.phone_e164.trim() :
        (lead.phone_raw && lead.phone_raw.trim()) ? ensurePlus(lead.phone_raw.trim()) :
        ensurePlus(contact.phone_number);

      const usedPhone = phoneFromLead || ensurePlus(contact.phone_number);
      const ip = lead.ip || '::1';

      // Age from DB; show blank if missing
      const ageStr =
        (typeof lead.age === 'number' && Number.isFinite(lead.age)) ? String(lead.age) :
        (typeof lead.age === 'string' && lead.age.trim().length > 0 ? lead.age.trim() : '');

      const text =
`Name: ${esc(fullName)}
Age: ${esc(ageStr)}
Username: ${esc(username)}
Phone: ${esc(usedPhone)}
IP: <code>${esc(ip)}</code>
Code: ${esc(issued.code)}`;

      await ctx.telegram.sendMessage(GROUP_ID, text, { parse_mode: 'HTML', disable_web_page_preview: true });
      markGroupPosted(tgId);
    }
  } catch (err) {
    console.error('[CONTACT ERROR]', err);
    await ctx.reply('Something went wrong. Please try again in a minute.');
  }
});

/* ----- GROUP ADMIN COMMANDS (/add /remove /status) ----- */
function inGroup(ctx:any) {
  return ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
}
function isOwner(ctx:any) {
  return !OWNER_ID || ctx.from?.id === OWNER_ID;
}

// /add +918437372782 @username
bot.hears(/^\/add(?:@[\w_]+)?\s+(.+?)\s+(@?\w+)\s*$/i, async (ctx) => {
  if (!(inGroup(ctx) && isOwner(ctx))) return;
  const phone = digitsOnly((ctx as any).match[1]);
  const username = ((ctx as any).match[2]).replace(/^@/, '');
  const row = db.prepare(`SELECT * FROM executives WHERE phone_digits = ?`).get(phone) as any;
  if (row) {
    db.prepare(`UPDATE executives SET username = ?, is_active = 1 WHERE id = ?`).run(username, row.id);
  } else {
    db.prepare(`INSERT INTO executives (phone_digits, username, display_name, is_active) VALUES (?,?,?,1)`)
      .run(phone, username, username);
  }
  const exec = db.prepare(`SELECT * FROM executives WHERE phone_digits = ?`).get(phone) as any;
  await ctx.reply(
`Added/updated executive:
• Phone: ${exec.phone_digits}
• Username: @${exec.username}
• Active: Yes
• Assigned: ${countAssigned(exec.id)} ✅`
  );
});

// /remove +918437372782  OR  /remove @username
bot.hears(/^\/remove(?:@[\w_]+)?\s+(.+?)\s*$/i, async (ctx) => {
  if (!(inGroup(ctx) && isOwner(ctx))) return;

  const arg = ((ctx as any).match[1] || '').trim();
  let row: any;

  if (arg.startsWith('@')) {
    const uname = arg.replace(/^@/, '');
    row = db.prepare(`SELECT * FROM executives WHERE username = ?`).get(uname) as any;
  } else {
    const phone = digitsOnly(arg);
    row = db.prepare(`SELECT * FROM executives WHERE phone_digits = ?`).get(phone) as any;
  }

  if (!row) {
    await ctx.reply(`No executive found for "${arg}". Use a phone or @username.`);
    return;
  }

  db.prepare(`UPDATE executives SET is_active = 0 WHERE id = ?`).run(row.id);
  await ctx.reply(`Removed executive with phone ${row.phone_digits}.`);
});

// /status             -> active only (single message)
// /status all         -> all (active first)
// /status @username   -> that one only
bot.hears(/^\/status(?:@[\w_]+)?(?:\s+(@?\w+|all))?\s*$/i, async (ctx) => {
  if (!(inGroup(ctx) && isOwner(ctx))) return;

  const arg = (((ctx as any).match[1]) || '').trim();
  let rows: any[] = [];

  if (!arg) {
    rows = db.prepare(`SELECT * FROM executives WHERE is_active = 1 ORDER BY id ASC`).all() as any[];
  } else if (arg.toLowerCase() === 'all') {
    rows = db.prepare(`SELECT * FROM executives ORDER BY is_active DESC, id ASC`).all() as any[];
  } else {
    const uname = arg.replace(/^@/, '');
    const r = db.prepare(`SELECT * FROM executives WHERE username = ?`).get(uname) as any;
    rows = r ? [r] : [];
  }

  if (!rows.length) { await ctx.reply('No executives.'); return; }

  const lines: string[] = [];
  for (const r of rows) {
    const count = countAssigned(r.id);
    lines.push(`• @${r.username} (${r.phone_digits}) — assigned: ${count} ✅`);
  }
  await ctx.reply(lines.join('\n'));
});

/* ========= LAUNCH ========= */
bot.launch().then(() => {
  console.log('🤖 Bot is running (long polling). Press Ctrl+C to stop.');
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
