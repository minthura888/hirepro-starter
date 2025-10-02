// bot/index.ts
import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import Database from "better-sqlite3";
import { last10, toE164 } from "@/lib/phone";

// ---------- ENV ----------
const BOT_TOKEN = process.env.BOT_TOKEN!;
const GROUP_ID = Number(process.env.GROUP_ID || 0);
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.hirepr0.com";
if (!BOT_TOKEN) throw new Error("BOT_TOKEN missing");
if (!GROUP_ID) throw new Error("GROUP_ID missing");

// ---------- Execs DB (local, only for round-robin & posted flag) ----------
const execdb = new Database("./execs.db");
execdb.pragma("journal_mode = WAL");

execdb.exec(`
CREATE TABLE IF NOT EXISTS executives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  assigned INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS posted_leads (
  lead_key TEXT PRIMARY KEY,
  posted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

type ExecRow = { id:number; username:string; active:number; assigned:number; updated_at:string };
function addExec(username: string) {
  const u = username.replace(/^@/, "");
  execdb.prepare(`INSERT OR IGNORE INTO executives (username, active, assigned) VALUES (?, 1, 0)`).run(u);
}
function removeExec(username: string) {
  const u = username.replace(/^@/, "");
  execdb.prepare(`DELETE FROM executives WHERE username=?`).run(u);
}
function listExecs(): ExecRow[] {
  return execdb.prepare(`SELECT * FROM executives ORDER BY active DESC, assigned ASC, updated_at ASC`).all() as ExecRow[];
}
function chooseExecutiveRR(): ExecRow | undefined {
  return listExecs().filter(r => r.active)[0];
}
function bumpAssigned(id: number) {
  execdb.prepare(`UPDATE executives SET assigned = assigned + 1, updated_at = datetime('now') WHERE id = ?`).run(id);
}
function hasPostedOnce(leadKey: string) {
  return !!execdb.prepare(`SELECT 1 FROM posted_leads WHERE lead_key=?`).get(leadKey);
}
function markPostedOnce(leadKey: string) {
  execdb.prepare(`INSERT OR IGNORE INTO posted_leads (lead_key) VALUES (?)`).run(leadKey);
}

// ---------- Remote lookup (read from website API) ----------
type LeadRow = {
  id: number | string;
  name?: string;
  email?: string;
  phone_e164?: string;
  gender?: string;
  age?: number;
  work_code?: string;
  created_at?: string;
  ip?: string;
};

async function fetchLeadByE164(e164: string): Promise<LeadRow | null> {
  try {
    const u = new URL(`${API_BASE}/api/lead/lookup`);
    u.searchParams.set("e164", e164);
    u.searchParams.set("key", ADMIN_KEY);
    const res = await fetch(u.toString(), { method: "GET" });
    if (!res.ok) return null;
    const json = await res.json() as any;
    if (!json?.ok || !json?.row) return null;
    return json.row as LeadRow;
  } catch {
    return null;
  }
}

// ---------- Bot ----------
const bot = new Telegraf(BOT_TOKEN);

// /start
bot.start(async (ctx) => {
  const kb = Markup.keyboard([Markup.button.contactRequest("Click Accept Job Code.")]).resize();
  await ctx.reply(
    `Hello ${ctx.from.first_name || "there"}!\n\n` +
      `Use /info to view your account information\n` +
      `Use /share to share your contact details\n` +
      `Use /help to get instructions\n\n` +
      `Please click the button below to share your contact information`,
    kb
  );
});

// /help
bot.command("help", async (ctx) => {
  await ctx.reply(
    `Use /info to view your account information\n` +
      `Use /share to share your contact details\n` +
      `Use /help to get instructions\n\n` +
      `Please click the button below to share your contact information`
  );
});

// /info
bot.command("info", async (ctx) => {
  await ctx.reply(
    `Your Telegram name: ${ctx.from.first_name || ""} ${ctx.from.last_name || ""}\n` +
      `Username: ${ctx.from.username ? "@" + ctx.from.username : "(none)"}\n` +
      `ID: ${ctx.from.id}`
  );
});

// /share
bot.command("share", async (ctx) => {
  const kb = Markup.keyboard([Markup.button.contactRequest("Share my contact 📱")]).resize();
  await ctx.reply("Please share the phone number you use on Telegram (tap the button).", kb);
});

// /status (admins) – list executives
bot.command("status", async (ctx) => {
  const rows = listExecs();
  if (!rows.length) return void ctx.reply("No executives configured.");
  const lines = rows.map(r => `${r.active ? "✅" : "❌"} @${r.username} — assigned: ${r.assigned}`);
  await ctx.reply(lines.join("\n"));
});

// /add @username
bot.command("add", async (ctx) => {
  const text = ctx.message?.text || "";
  const username = text.split(/\s+/)[1];
  if (!username) return void ctx.reply("Usage: /add @username");
  addExec(username);
  await ctx.reply(`Added executive: ${username}`);
});

// /remove @username
bot.command("remove", async (ctx) => {
  const text = ctx.message?.text || "";
  const username = text.split(/\s+/)[1];
  if (!username) return void ctx.reply("Usage: /remove @username");
  removeExec(username);
  await ctx.reply(`Removed mapping for ${username}`);
});

// Contact handler — normalize, lookup, compare last 10, DM code (same text)
bot.on("contact", async (ctx) => {
  try {
    const contact = (ctx.message as any)?.contact;
    const raw = contact?.phone_number as string | undefined;
    if (!raw) {
      await ctx.reply("I couldn't read your phone number. Please try /share again.");
      return;
    }

    // Normalize to E.164 (any country)
    const e164 = toE164(raw);
    const tgL10 = last10(raw);
    if (!e164) {
      await ctx.reply("Sorry, your phone number looks invalid.");
      return;
    }

    // Fetch from website API (source of truth)
    let row = await fetchLeadByE164(e164);

    // Fallback for users whose Telegram sends local-only; try +91 + last10
    if (!row && tgL10.length === 10) {
      row = await fetchLeadByE164("+91" + tgL10);
    }

    if (!row) {
      await ctx.reply(
        "Mobile phone number verification failed. It is different from the mobile phone number you submitted in the form."
      );
      return;
    }

    // Compare by last 10 digits to ignore formatting
    const dbL10 = last10(row.phone_e164 || "");
    if (!dbL10 || dbL10 !== tgL10) {
      await ctx.reply(
        "Mobile phone number verification failed. It is different from the mobile phone number you submitted in the form."
      );
      return;
    }

    const code = row.work_code || "(no code yet)";

    // Round-robin assign executive
    const exec = chooseExecutiveRR();
    let execText = "executive contact: (waiting – no executive online)";
    let button = undefined as any;
    if (exec) {
      bumpAssigned(exec.id);
      const handle = exec.username.startsWith("@") ? exec.username : `@${exec.username}`;
      execText = `executive contact: ${handle}`;
      button = Markup.inlineKeyboard([
        Markup.button.url("Message now", `https://t.me/${exec.username.replace(/^@/, "")}`)
      ]);
    }

    // DM (same wording as yours)
    await ctx.reply(
      `Your work code is used to verify your identity.\n` +
        `Verify successfully!\n` +
        `Job code: ${code}\n` +
        `${execText}`,
      button ? button : undefined
    );

    // One-time post to group per lead id
    const leadKey = String(row.id);
    if (!hasPostedOnce(leadKey)) {
      const name = row.name || [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") || "(unknown)";
      const age = row.age ?? "-";
      const ip = row.ip || "-";
      const text =
        `Name: ${name}\n` +
        `Age: ${age}\n` +
        `Phone: ${row.phone_e164}\n` +
        `IP: ${ip}\n` +
        `Code: ${code}`;
      await ctx.telegram.sendMessage(GROUP_ID, text, { disable_web_page_preview: true });
      markPostedOnce(leadKey);
    }
  } catch (err) {
    console.error("contact handler error:", err);
    await ctx.reply("Sorry, something went wrong. Please try again in a moment.");
  }
});

// Start
bot.launch().then(() => console.log("Bot started"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
