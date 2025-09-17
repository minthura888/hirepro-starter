// bot/index.ts
import 'dotenv/config';
import { Telegraf, Markup, Context } from 'telegraf';
import Database from 'better-sqlite3';
import path from 'node:path';

/** ---------- ENV ---------- */
const BOT_TOKEN = process.env.BOT_TOKEN!;
const GROUP_ID = Number(process.env.GROUP_ID);
const OWNER_ID = Number(process.env.OWNER_ID);
const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), 'data', 'app.db');

if (!BOT_TOKEN) throw new Error('BOT_TOKEN missing');
if (!GROUP_ID) throw new Error('GROUP_ID missing');
if (!OWNER_ID) throw new Error('OWNER_ID missing');

/** ---------- DB ---------- */
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Leads table is created by the web app. Make sure the extra fields exist:
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone_raw TEXT,
    phone_e164 TEXT UNIQUE,
    age INTEGER,
    gender TEXT,
    note TEXT,
    dial TEXT,
    country_iso TEXT,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);
const ensureCol = (col: string, def: string) => {
  try { db.prepare(`SELECT ${col} FROM leads LIMIT 1`).get(); }
  catch {
    db.exec(`ALTER TABLE leads ADD COLUMN ${col} ${def}`);
  }
};
ensureCol('work_code', 'TEXT');
ensureCol('group_posted', "INTEGER NOT NULL DEFAULT 0");
ensureCol('posted_at', 'TEXT');

db.exec(`
  CREATE TABLE IF NOT EXISTS exec_assignments (
    phone_e164 TEXT PRIMARY KEY,
    exec_username TEXT NOT NULL,
    added_by INTEGER,
    added_at TEXT DEFAULT (datetime('now'))
  );
`);

/** ---------- helpers ---------- */
const esc = (s: string) =>
  s.replace(/[<>&"]/g, (m) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[m]!));

function toE164(anyPhone: string): string | null {
  if (!anyPhone) return null;
  let digits = anyPhone.replace(/[^\d]/g, '');    // keep numbers
  if (!digits) return null;
  // Telegram contact is usually intl without "+"; accept "00.." too
  if (digits.startsWith('00')) digits = digits.slice(2);
  return '+' + digits;
}

function randomWorkCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily-confused chars
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random()*alphabet.length)];
  return out;
}

type Lead = {
  id: number;
  name: string | null;
  email: string | null;
  phone_e164: string;
  phone_raw: string | null;
  age: number | null;
  gender: string | null;
  note: string | null;
  ip: string | null;
  work_code: string | null;
  group_posted: number;
  posted_at: string | null;
};

const getLeadByPhone = db.prepare<unknown[], Lead>(
  `SELECT * FROM leads WHERE phone_e164 = ?`
);

const setWorkCodeStmt = db.prepare(`UPDATE leads SET work_code = ? WHERE id = ?`);
const markPostedStmt = db.prepare(`UPDATE leads SET group_posted = 1, posted_at = datetime('now') WHERE id = ?`);

const getAssignmentStmt = db.prepare<{p: string}, {exec_username: string} | undefined>(
  `SELECT exec_username FROM exec_assignments WHERE phone_e164 = :p`
);
const upsertAssignmentStmt = db.prepare(
  `INSERT INTO exec_assignments(phone_e164, exec_username, added_by)
   VALUES (?, ?, ?)
   ON CONFLICT(phone_e164) DO UPDATE SET exec_username=excluded.exec_username, added_by=excluded.added_by, added_at=datetime('now')`
);
const removeAssignmentStmt = db.prepare(`DELETE FROM exec_assignments WHERE phone_e164 = ?`);
const statusByExecStmt = db.prepare(`SELECT exec_username, COUNT(*) AS c FROM exec_assignments GROUP BY exec_username ORDER BY c DESC`);

function ensureWorkCode(lead: Lead): string {
  if (lead.work_code && lead.work_code.length >= 6) return lead.work_code;
  const code = randomWorkCode();
  setWorkCodeStmt.run(code, lead.id);
  return code;
}

/** ---------- bot ---------- */
const bot = new Telegraf(BOT_TOKEN);

// Common keyboards
const shareKeyboard = Markup.keyboard([
  Markup.button.contactRequest('📲 Click Accept Job Code.')
]).oneTime().resize();

const linksText =
  'Use /info to view your account information\n' +
  'Use /share to share your contact details\n' +
  'Use /help to get instructions';

bot.start(async (ctx) => {
  const name = esc(ctx.from?.first_name ?? 'there');
  await ctx.reply(
    `Hello ${name}!\n\n${linksText}\n\nPlease click the button below to share your contact information`,
    shareKeyboard
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    'You need to enter the same mobile phone number as your Telegram number and submit the website form before you can get the job.\n\n' +
    linksText
  );
});

bot.command('share', async (ctx) => {
  await ctx.reply('Tap the button to send your Telegram phone number:', shareKeyboard);
});

bot.command('info', async (ctx) => {
  const phone = ctx.from?.phone_number; // (bots don’t see this unless user is a Business; fallback via DB on username)
  // If user already verified before, we can look them up by ID we stored later; for now we ask them to /share.
  await ctx.reply('Please use /share and press the contact button so I can match your phone with our form.');
});

// Handle contact share
bot.on('contact', async (ctx) => {
  const contact = ctx.message?.contact;
  if (!contact || contact.user_id !== ctx.from.id) {
    return ctx.reply('Please press the button to share **your own** contact.', { parse_mode: 'Markdown' });
  }

  const tgE164 = toE164(contact.phone_number);
  if (!tgE164) return ctx.reply('Cannot read your phone number. Please try again.');

  const lead = getLeadByPhone.get(tgE164);
  if (!lead) {
    return ctx.reply(
      'Mobile phone number verification failed.\n' +
      'It is different from the mobile phone number you submitted in the form.\n\n' +
      'Please fill the form again with the exact same phone as your Telegram number.'
    );
  }

  const workCode = ensureWorkCode(lead);
  const assign = getAssignmentStmt.get({ p: lead.phone_e164 });
  const execUsername = assign?.exec_username;

  // Send code to user (with optional Executive DM button)
  const buttons = [];
  if (execUsername) {
    buttons.push([Markup.button.url(`Contact ${execUsername}`, `https://t.me/${execUsername.replace(/^@/, '')}`)]);
  }
  await ctx.reply(
    [
      'Your work code is used to verify your identity.',
      '',
      '*Verify successfully!*',
      `Job code: \`${workCode}\``,
      execUsername ? `Executive: @${execUsername.replace(/^@/, '')}` : '',
    ].filter(Boolean).join('\n'),
    { parse_mode: 'Markdown', ...(buttons.length ? Markup.inlineKeyboard(buttons) : {}) }
  );

  // Post once to group
  if (!lead.group_posted) {
    const lines = [
      `<b>Applying Job</b>`,
      `Name: ${esc(lead.name ?? ctx.from.first_name ?? '-')}`,
      `Age: ${lead.age ?? '-'}`,
      `Phone: ${esc(lead.phone_e164)}`,
      `IP: ${esc(lead.ip ?? '-')}`,
      `Code: <code>${workCode}</code>`
    ].join('\n');
    await ctx.telegram.sendMessage(GROUP_ID, lines, { parse_mode: 'HTML' });
    markPostedStmt.run(lead.id);
  }
});

/** ---------- Owner / Group commands ---------- */
function ownerOnly(ctx: Context): boolean {
  if (ctx.from?.id !== OWNER_ID) {
    ctx.reply('Owner only.');
    return false;
  }
  return true;
}

bot.command('add', async (ctx) => {
  if (!ownerOnly(ctx)) return;
  const text = ctx.message?.text ?? '';
  const parts = text.split(/\s+/).slice(1); // after /add
  // Expect: /add <phone> <username>
  if (parts.length < 2) return ctx.reply('Usage: /add <phone> <username>');
  const phone = toE164(parts[0]);
  const user = parts[1].replace(/^@/, '');
  if (!phone) return ctx.reply('Invalid phone');

  upsertAssignmentStmt.run(phone, user, ctx.from!.id);
  // Small status card
  ctx.replyWithHTML(
    [
      `<b>Added/updated executive:</b>`,
      `• Phone: ${esc(phone)}`,
      `• Username: @${esc(user)}`,
    ].join('\n')
  );
});

bot.command('remove', async (ctx) => {
  if (!ownerOnly(ctx)) return;
  const phone = toE164((ctx.message?.text ?? '').split(/\s+/)[1] || '');
  if (!phone) return ctx.reply('Usage: /remove <phone>');

  const info = removeAssignmentStmt.run(phone);
  ctx.reply(info.changes ? `Removed mapping for ${phone}` : `Nothing to remove for ${phone}`);
});

bot.command('status', async (ctx) => {
  if (!ownerOnly(ctx)) return;
  const rows = statusByExecStmt.all() as { exec_username: string; c: number }[];
  if (!rows.length) return ctx.reply('No executive assignments yet.');
  const lines = rows.map(r => `• @${r.exec_username} — assigned: ${r.c} ✅`);
  ctx.reply(lines.join('\n'));
});

/** ---------- fallback ---------- */
bot.on('message', async (ctx) => {
  // Encourage the user towards /share
  await ctx.reply('Please click the button below to share your contact information.', shareKeyboard);
});

/** ---------- start ---------- */
bot.launch().then(() => {
  console.log('Bot is up.');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
