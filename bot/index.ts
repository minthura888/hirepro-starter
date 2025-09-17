// bot/index.ts
import 'dotenv/config';
import { Bot, Context, InlineKeyboard, Keyboard } from 'grammy';
import Database from 'better-sqlite3';

// ---------- ENV ----------
const BOT_TOKEN = process.env.BOT_TOKEN!;
const GROUP_ID = Number(process.env.GROUP_ID || 0);
const OWNER_ID = Number(process.env.OWNER_ID || 0);
const DB_PATH = process.env.DATABASE_PATH || '/opt/hirepro/data/app.db';
const WEB_ORIGIN = process.env.WEB_ORIGIN || '';

// ---------- DB ----------
const db = new Database(DB_PATH);

// basic tables (safe if already exist)
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
  work_code TEXT,
  posted_group INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS executives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT,
  username TEXT,
  active INTEGER DEFAULT 1,
  assigned INTEGER DEFAULT 0
);
`);

type LeadRow = {
  id: number;
  name: string | null;
  email: string | null;
  phone_raw: string | null;
  phone_e164: string;
  age: number | null;
  gender: string | null;
  note: string | null;
  dial: string | null;
  country_iso: string | null;
  ip: string | null;
  work_code: string;
  posted_group: number;
  created_at: string;
};

type ExecRow = { id: number; phone: string; username: string; assigned: number; active: number };

// ---------- helpers ----------

function esc(s: any) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toE164(raw: string) {
  // normalize to +digits
  const digits = raw.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}

function generateWorkCode(): string {
  // 8-char A–Z0–9
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function pickExecutive(): ExecRow | undefined {
  return db
    .prepare(
      `SELECT id, phone, username, assigned, active
       FROM executives
       WHERE active = 1 AND username IS NOT NULL AND username != ''
       ORDER BY assigned ASC, id ASC
       LIMIT 1`,
    )
    .get() as ExecRow | undefined;
}

function bumpExecutiveAssigned(id: number) {
  db.prepare(`UPDATE executives SET assigned = assigned + 1 WHERE id = ?`).run(id);
}

function formatGroupPost(p: {
  name: string;
  age?: number | null;
  phone_e164: string;
  ip?: string | null;
  work_code: string;
}) {
  const lines = [
    `Name: ${esc(p.name)}`,
    p.age ? `Age: ${p.age}` : null,
    `Phone: ${esc(p.phone_e164)}`,
    p.ip ? `IP: ${esc(p.ip)}` : null,
    `Code: ${esc(p.work_code)}`,
  ].filter(Boolean);
  return lines.join('\n');
}

function formatUserDM(code: string, exec?: { username?: string }) {
  const lines = [
    'Your work code is used to verify your identity.',
    'Verify successfully!',
    `Job code: <b>${esc(code)}</b>`,
  ];
  if (exec?.username) lines.push(`Executive contact: @${esc(exec.username)}`);
  return lines.join('\n');
}

function findLatestLeadByE164(e164: string): LeadRow | undefined {
  return db
    .prepare<unknown[]>(`SELECT * FROM leads WHERE phone_e164 = ? ORDER BY id DESC LIMIT 1`)
    .get(e164) as LeadRow | undefined;
}

function ensureWorkCodeForLead(id: number, current?: string | null) {
  if (current && current.length >= 6) return current;
  const code = generateWorkCode();
  db.prepare(`UPDATE leads SET work_code = ? WHERE id = ?`).run(code, id);
  return code;
}

function markGroupPosted(id: number) {
  db.prepare(`UPDATE leads SET posted_group = 1 WHERE id = ?`).run(id);
}

// ---------- Bot ----------
if (!BOT_TOKEN) throw new Error('BOT_TOKEN is required');

const bot = new Bot(BOT_TOKEN);

// greet to group so you see bot is alive
(async () => {
  try {
    if (GROUP_ID) {
      await bot.api.sendMessage(GROUP_ID, 'Bot is online ✅', {
        link_preview_options: { is_disabled: true },
      });
    }
  } catch {
    /* ignore */
  }
})();

// --- middlewares / guards ---
function isOwner(ctx: Context) {
  return ctx.from?.id === OWNER_ID;
}

function ownerGuard(handler: (ctx: Context) => Promise<any> | any) {
  return async (ctx: Context) => {
    if (!isOwner(ctx)) return ctx.reply('Only the owner can do that.', { reply_to_message_id: ctx.msg?.message_id });
    return handler(ctx);
  };
}

// --- commands (users) ---
bot.command('start', async (ctx) => {
  const kb = new Keyboard().requestContact('📲 Click Accept Job Code.').oneTime().resize();
  const dm = [
    `Hello ${esc(ctx.from?.first_name || '')}!`,
    '',
    'Use /info to view your account information',
    'Use /share to share your contact details',
    'Use /help to get instructions',
    '',
    'Please click the button below to share your contact information',
  ].join('\n');

  await ctx.reply(dm, { reply_markup: kb });
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'You need to enter the same mobile phone number as your Telegram number and submit it before you can get the job.\n\nUse /share to send your number.',
    { link_preview_options: { is_disabled: true } },
  );
});

bot.command('info', async (ctx) => {
  const u = ctx.from!;
  await ctx.reply(
    [
      `ID: <code>${u.id}</code>`,
      `User: @${esc(u.username || '-')}`,
      `Name: ${esc([u.first_name, u.last_name].filter(Boolean).join(' '))}`,
      'Phone: please use the /share command to share.',
    ].join('\n'),
    { parse_mode: 'HTML', link_preview_options: { is_disabled: true } },
  );
});

bot.command('share', async (ctx) => {
  const kb = new Keyboard().requestContact('📲 Click Accept Job Code.').oneTime().resize();
  await ctx.reply('Tap the button to send your Telegram phone number:', { reply_markup: kb });
});

// --- contact handler ---
bot.on('message:contact', async (ctx) => {
  try {
    const contact = ctx.message.contact;
    const tgE164 = toE164(contact.phone_number);

    // find a matching lead
    const lead = findLatestLeadByE164(tgE164);
    if (!lead) {
      await ctx.reply(
        [
          'Mobile phone number verification failed.',
          'It is different from the mobile phone number you submitted in the form.',
          '',
          'You need to enter the same mobile phone number as your Telegram number and submit it before you can get the job.',
        ].join('\n'),
        { link_preview_options: { is_disabled: true } },
      );
      return;
    }

    // make sure the lead has a code
    const code = ensureWorkCodeForLead(lead.id, lead.work_code);

    // round-robin executive
    const exec = pickExecutive();
    if (exec) bumpExecutiveAssigned(exec.id);

    // DM to user (code + exec + button)
    await ctx.reply(formatUserDM(code, exec), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      reply_markup: exec?.username
        ? new InlineKeyboard().url('Message now', `https://t.me/${exec.username}`)
        : undefined,
    });

    // post to group only once per lead
    if (!lead.posted_group && GROUP_ID) {
      const text = formatGroupPost({
        name: lead.name || ctx.from!.first_name || '—',
        age: lead.age,
        phone_e164: lead.phone_e164,
        ip: lead.ip,
        work_code: code,
      });

      await ctx.api.sendMessage(GROUP_ID, text, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      });
      markGroupPosted(lead.id);
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('Something went wrong. Please try again in a moment.');
  }
});

// --- commands (owner/admin) ---

// /add <phone> <username>
bot.command(
  'add',
  ownerGuard(async (ctx) => {
    const [phone, username] = (ctx.match as string).trim().split(/\s+/, 2);
    if (!phone || !username) {
      return ctx.reply('Usage: /add <phone_e164> <username>');
    }
    const e164 = toE164(phone);
    db.prepare(
      `INSERT INTO executives (phone, username, active, assigned)
       VALUES (?, ?, 1, COALESCE((SELECT assigned FROM executives WHERE phone = ? LIMIT 1), 0))`,
    ).run(e164, username.replace(/^@/, ''), e164);

    await ctx.reply(
      [
        'Added/updated executive:',
        `• Phone: ${e164}`,
        `• Username: @${username.replace(/^@/, '')}`,
        '• Active: Yes',
      ].join('\n'),
    );
  }),
);

// /remove <phone>
bot.command(
  'remove',
  ownerGuard(async (ctx) => {
    const phone = (ctx.match as string).trim();
    if (!phone) return ctx.reply('Usage: /remove <phone_e164>');
    const e164 = toE164(phone);
    db.prepare(`UPDATE executives SET active = 0 WHERE phone = ?`).run(e164);
    await ctx.reply(`Removed mapping for ${e164}`);
  }),
);

// /status
bot.command(
  'status',
  ownerGuard(async (ctx) => {
    const rows = db
      .prepare<unknown[]>(`SELECT phone, username, assigned, active FROM executives ORDER BY assigned ASC, id ASC`)
      .all() as Array<{ phone: string; username: string; assigned: number; active: number }>;

    if (!rows.length) return ctx.reply('No executive assignments yet.');

    const lines = rows.map(
      (r) =>
        `• @${esc(r.username || '-')}\n  Phone: ${esc(r.phone)}\n  Active: ${r.active ? 'Yes' : 'No'}\n  Assigned: ${r.assigned} ✅`,
    );
    await ctx.reply(lines.join('\n\n'), { parse_mode: 'HTML' });
  }),
);

// ---------- start ----------
bot.start();
console.log('Bot started');
