/* bot/index.ts
   HirePro Telegram bot (grammY + better-sqlite3)
   Features:
   - Round-robin executive assignment (/add, /remove, /status in supergroup)
   - Validate user by phone_e164 saved from the website form
   - One-time group post (Name, Age, Phone, IP, Code) — no header
   - DM includes code + executive contact + "Message now" button
*/

import { Bot, Keyboard, InlineKeyboard } from "grammy";
import type { Context } from "grammy";
import Database from "better-sqlite3";

// --------- Env ---------
const TOKEN = process.env.BOT_TOKEN!;
const GROUP_ID = Number(process.env.GROUP_ID);
const OWNER_ID = Number(process.env.OWNER_ID);
const DB_PATH = process.env.DATABASE_PATH || process.env.DATABASE || "/tmp/app.db";
const WEB_ORIGIN = process.env.WEB_ORIGIN || ""; // used only for help text link if you want

if (!TOKEN || !GROUP_ID || !OWNER_ID) {
  console.error("Missing env BOT_TOKEN, GROUP_ID, OWNER_ID");
  process.exit(1);
}

// --------- DB setup ---------
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Ensure tables/columns exist
db.exec(`
CREATE TABLE IF NOT EXISTS executives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_e164 TEXT NOT NULL UNIQUE,
  username   TEXT NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  assigned   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

function columnExists(table: string, column: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  return rows.some(r => r.name === column);
}

// The website wrote into "leads" table. Add columns if they don't exist.
if (!columnExists("leads", "work_code")) {
  try { db.exec(`ALTER TABLE leads ADD COLUMN work_code TEXT`); } catch {}
}
if (!columnExists("leads", "group_posted_at")) {
  try { db.exec(`ALTER TABLE leads ADD COLUMN group_posted_at TEXT`); } catch {}
}

// --------- Helpers ---------
const ok = (v: any) => v !== undefined && v !== null;
const toPlus = (p: string) => p.startsWith("+") ? p : `+${p}`;

// Same code generator we used for the site route
function makeCode(len = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

type LeadRow = {
  id: number;
  name: string | null;
  email: string | null;
  phone_e164: string;
  age: number | null;
  gender: string | null;
  note: string | null;
  ip: string | null;
  work_code: string | null;
  group_posted_at: string | null;
};

function getLeadByPhone(phone_e164: string): LeadRow | undefined {
  return db.prepare<LeadRow>(`SELECT * FROM leads WHERE phone_e164 = ?`).get(phone_e164) as any;
}

function ensureWorkCode(lead: LeadRow): string {
  if (lead.work_code && lead.work_code.length >= 6) return lead.work_code;
  const code = makeCode(8);
  db.prepare(`UPDATE leads SET work_code = ? WHERE id = ?`).run(code, lead.id);
  return code;
}

function markGroupPosted(leadId: number) {
  db.prepare(`UPDATE leads SET group_posted_at = datetime('now') WHERE id = ?`).run(leadId);
}

function hasGroupPosted(lead: LeadRow) {
  return ok(lead.group_posted_at);
}

type ExecRow = {
  id: number;
  phone_e164: string;
  username: string;
  active: number;
  assigned: number;
  updated_at: string;
};

function upsertExecutive(phone_e164: string, username: string) {
  const row = db.prepare<ExecRow>(`SELECT * FROM executives WHERE phone_e164 = ?`).get(phone_e164) as any;
  if (row) {
    db.prepare(`UPDATE executives SET username = ?, active = 1, updated_at = datetime('now') WHERE phone_e164 = ?`)
      .run(username, phone_e164);
  } else {
    db.prepare(`INSERT INTO executives (phone_e164, username, active) VALUES (?, ?, 1)`).run(phone_e164, username);
  }
}

function removeExecutive(phone_e164: string) {
  db.prepare(`UPDATE executives SET active = 0, updated_at = datetime('now') WHERE phone_e164 = ?`).run(phone_e164);
}

function chooseExecutiveRR(): ExecRow | undefined {
  // Lowest assigned first, then oldest updated -> fair round robin
  const row = db.prepare<ExecRow>(`
      SELECT * FROM executives
      WHERE active = 1
      ORDER BY assigned ASC, datetime(updated_at) ASC
      LIMIT 1
  `).get() as any;
  return row;
}

function bumpAssigned(execId: number) {
  db.prepare(`UPDATE executives SET assigned = assigned + 1, updated_at = datetime('now') WHERE id = ?`).run(execId);
}

// --------- Bot ---------
const bot = new Bot<Context>(TOKEN);

// --------- Middleware: restrict admin cmds ---------
function isOwner(ctx: Context) {
  return ctx.from && ctx.from.id === OWNER_ID;
}

// --------- User commands ---------
bot.command("start", async (ctx) => {
  const kb = new Keyboard().requestContact("Click Accept Job Code.").oneTime().resized();
  await ctx.reply(
    `Hello ${ctx.from?.first_name ?? ""}!\n\n` +
    `Use /info to view your account information\n` +
    `Use /share to share your contact details\n` +
    `Use /help to get instructions\n\n` +
    `Please click the button below to share your contact information`,
    { reply_markup: kb }
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `You need to enter the same mobile phone number as your Telegram number and submit it before you can get the job.\n\n` +
    `• /share – share your Telegram contact\n` +
    `• /info – show what we have for you`
  );
});

bot.command("share", async (ctx) => {
  const kb = new Keyboard().requestContact("Click Accept Job Code.").oneTime().resized();
  await ctx.reply("Tap the button to send your Telegram phone number:", { reply_markup: kb });
});

bot.command("info", async (ctx) => {
  const uid = ctx.from?.id;
  if (!uid) return;
  // We don't store user ↔ lead binding. Show generic instructions.
  await ctx.reply(
    `ID: ${uid}\n` +
    `user name: ${ctx.from?.username ? "@" + ctx.from.username : "(none)"}\n` +
    `full name: ${[ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") || "(none)"}\n\n` +
    `phone: please use the /share command to share.`
  );
});

// --------- Contact handler ---------
bot.on(":contact", async (ctx) => {
  const contact = ctx.message?.contact;
  if (!contact) return;
  const tgPhone = toPlus(contact.phone_number.replace(/\s+/g, ""));
  // Lookup by E.164
  const lead = getLeadByPhone(tgPhone);

  if (!lead) {
    await ctx.reply(
      `Mobile phone number verification failed. It is different from the mobile phone number you submitted in the form.`
    );
    return;
  }

  const code = ensureWorkCode(lead);

  // Pick an executive (round robin)
  const exec = chooseExecutiveRR();
  let execText = "";
  let execBtn: InlineKeyboard | undefined = undefined;

  if (exec) {
    bumpAssigned(exec.id);
    const at = exec.username.startsWith("@") ? exec.username : `@${exec.username}`;
    execText = `executive contact: ${at}`;
    execBtn = new InlineKeyboard().url("Message now", `https://t.me/${exec.username.replace(/^@/, "")}`);
  } else {
    execText = `executive contact: (waiting – no executive online)`;
  }

  // DM to user with code + exec contact + button
  await ctx.reply(
    `Your work code is used to verify your identity.\n` +
    `Verify successfully!\n` +
    `Job code: ${code}\n` +
    `${execText}`,
    execBtn ? { reply_markup: execBtn } : undefined
  );

  // Post to group only once
  if (!hasGroupPosted(lead)) {
    const fullName = lead.name || [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") || "(unknown)";
    const age = ok(lead.age) ? lead.age : "-";
    const ip = lead.ip || "-";

    const text =
      `Name: ${fullName}\n` +
      `Age: ${age}\n` +
      `Phone: ${lead.phone_e164}\n` +
      `IP: ${ip}\n` +
      `Code: ${code}`;

    await ctx.api.sendMessage(GROUP_ID, text, {
      // grammY doesn't have disable_web_page_preview; use link_preview_options
      link_preview_options: { is_disabled: true },
    });

    markGroupPosted(lead.id);
  }
});

// --------- Admin/group commands ---------
// Only accept these in the supergroup, and only from OWNER_ID
async function requireOwner(ctx: Context): Promise<boolean> {
  if (ctx.chat?.id !== GROUP_ID) return false;
  if (!isOwner(ctx)) return false;
  return true;
}

bot.command("status", async (ctx) => {
  if (ctx.chat?.id !== GROUP_ID) return; // status only in group
  const rows = db.prepare<ExecRow>(`SELECT * FROM executives ORDER BY active DESC, assigned DESC`).all() as any[];
  if (!rows.length) {
    await ctx.reply("No executive assignments yet.");
    return;
  }
  const lines = rows.map(r =>
    `• ${r.active ? "✅" : "❌"} ${r.phone_e164} — @${r.username} — assigned: ${r.assigned}`
  ).join("\n");
  await ctx.reply(lines);
});

bot.command("add", async (ctx) => {
  if (!(await requireOwner(ctx))) return;
  const text = ctx.message?.text || "";
  const [, phoneRaw, unameRaw] = text.trim().split(/\s+/);
  if (!phoneRaw || !unameRaw) {
    await ctx.reply("Usage: /add <phone_e164> <username>");
    return;
  }
  const phone = toPlus(phoneRaw);
  const username = unameRaw.replace(/^@/, "");
  upsertExecutive(phone, username);

  await ctx.reply(
    `Added/updated executive:\n` +
    `• Phone: ${phone}\n` +
    `• Username: @${username}\n` +
    `• Active: Yes\n` +
    `• Assigned: 0 ✅`
  );
});

bot.command("remove", async (ctx) => {
  if (!(await requireOwner(ctx))) return;
  const text = ctx.message?.text || "";
  const [, phoneRaw] = text.trim().split(/\s+/);
  if (!phoneRaw) {
    await ctx.reply("Usage: /remove <phone_e164>");
    return;
  }
  const phone = toPlus(phoneRaw);
  removeExecutive(phone);
  await ctx.reply(`Removed mapping for ${phone}`);
});

// --------- Startup ---------
bot.catch((err) => {
  console.error("Bot error:", err);
});

(async () => {
  await bot.api.sendMessage(GROUP_ID, "Bot is online ✅", {
    link_preview_options: { is_disabled: true },
  });
  await bot.start();
  console.log("Bot started");
})();
