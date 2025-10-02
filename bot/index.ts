/* botindex.ts
   HirePro Telegram bot (grammY + better-sqlite3)

   - Commands: /start /help /share /info /status /add /remove
   - Verifies applicant by phone saved from the website (via API)
   - One-time group post per lead (tracked locally)
   - DM includes code + executive contact + "Message now" button
*/

import { Bot, Keyboard, InlineKeyboard } from "grammy";
import type { Context } from "grammy";
import Database from "better-sqlite3";

// ---------- ENV ----------
const TOKEN = process.env.BOT_TOKEN!;
const GROUP_ID = Number(process.env.GROUP_ID); // Telegram group/chat ID for ops posts
const ADMIN_KEY = process.env.ADMIN_KEY || ""; // must match Vercel ADMIN_KEY (read-only lookup)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://www.hirepr0.com";
if (!TOKEN) throw new Error("BOT_TOKEN env is missing");
if (!GROUP_ID) throw new Error("GROUP_ID env is missing");

// ---------- DB (local file, only for execs + 'posted' flags) ----------
const db = new Database("./execs.db");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS executives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  assigned INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS posted_leads (
  lead_id TEXT PRIMARY KEY, -- remote lead id string
  posted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

type ExecRow = {
  id: number;
  username: string;
  active: number;
  assigned: number;
  updated_at: string;
};

function addExec(username: string) {
  const u = username.replace(/^@/, "");
  db.prepare(
    `INSERT OR IGNORE INTO executives (username, active, assigned) VALUES (?, 1, 0)`
  ).run(u);
}
function removeExec(username: string) {
  const u = username.replace(/^@/, "");
  db.prepare(`DELETE FROM executives WHERE username = ?`).run(u);
}
function listExecs(): ExecRow[] {
  return db.prepare(`SELECT * FROM executives ORDER BY active DESC, assigned ASC, updated_at ASC`).all() as ExecRow[];
}
function chooseExecutiveRR(): ExecRow | undefined {
  const rows = listExecs().filter((r) => r.active);
  return rows[0];
}
function bumpAssigned(id: number) {
  db.prepare(`UPDATE executives SET assigned = assigned + 1, updated_at = datetime('now') WHERE id = ?`).run(id);
}
function markPostedOnce(leadId: string) {
  db.prepare(`INSERT OR IGNORE INTO posted_leads (lead_id) VALUES (?)`).run(leadId);
}
function hasPosted(leadId: string) {
  const row = db.prepare(`SELECT 1 FROM posted_leads WHERE lead_id = ?`).get(leadId) as any;
  return !!row;
}

// ---------- Phone helpers ----------
function normalizeE164Like(s?: string | null): string {
  if (!s) return "";
  // keep + if first, drop all non-digits elsewhere
  const withPlus = s.trim().replace(/[^\d+]/g, "");
  return withPlus.replace(/\+(?=.+\+)/g, "");
}
function last10Digits(s: string): string {
  return (s || "").replace(/\D/g, "").slice(-10);
}

// ---------- Remote lead lookup (website API) ----------
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
    const json = (await res.json()) as any;
    if (!json?.ok || !json?.row) return null;
    return json.row as LeadRow;
  } catch {
    return null;
  }
}

// ---------- Bot ----------
const bot = new Bot(TOKEN);

// /start
bot.command("start", async (ctx) => {
  const kb = new Keyboard().requestContact("Click Accept Job Code.").resized();
  await ctx.reply(
    `Hello ${ctx.from?.first_name || "there"}!\n\n` +
      `Please click the button below to share your contact information.`,
    { reply_markup: kb }
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
    `Your Telegram name: ${ctx.from?.first_name || ""} ${ctx.from?.last_name || ""}\n` +
      `Username: ${ctx.from?.username ? "@" + ctx.from?.username : "(none)"}\n` +
      `ID: ${ctx.from?.id}`
  );
});

// /share
bot.command("share", async (ctx) => {
  const kb = new Keyboard().requestContact("Share my contact 📱").resized();
  await ctx.reply(
    "Please share the phone number you use on Telegram (tap the button).",
    { reply_markup: kb }
  );
});

// /status (list execs)
bot.command("status", async (ctx) => {
  const rows = listExecs();
  if (!rows.length) {
    await ctx.reply("No executives configured.");
    return;
  }
  const lines = rows.map(
    (r) => `${r.active ? "✅" : "❌"} @${r.username} — assigned: ${r.assigned}`
  );
  await ctx.reply(lines.join("\n"));
});

// /add @username
bot.command("add", async (ctx) => {
  const m = ctx.match as unknown as string;
  const username = (m || ctx.message?.text || "").split(/\s+/)[1];
  if (!username) {
    await ctx.reply("Usage: /add @username");
    return;
  }
  addExec(username);
  await ctx.reply(`Added executive: ${username}`);
});

// /remove @username
bot.command("remove", async (ctx) => {
  const m = ctx.match as unknown as string;
  const username = (m || ctx.message?.text || "").split(/\s+/)[1];
  if (!username) {
    await ctx.reply("Usage: /remove @username");
    return;
  }
  removeExec(username);
  await ctx.reply(`Removed mapping for ${username}`);
});

// --------- Contact handler (verification + code DM) ---------
bot.on("contact", async (ctx) => {
  try {
    const contact = (ctx.message as any)?.contact;
    if (!contact?.phone_number) {
      await ctx.reply("I couldn't read your phone number. Please try /share again.");
      return;
    }

    // Normalize Telegram number
    const tgE164ish = normalizeE164Like(contact.phone_number);
    const tgLast10 = last10Digits(tgE164ish);

    // 1) Try exact lookup with +countrycode
    let lead: LeadRow | null = tgE164ish.startsWith("+")
      ? await fetchLeadByE164(tgE164ish)
      : null;

    // 2) Fallbacks (India +91 + last10)
    if (!lead && tgLast10.length === 10) {
      lead = await fetchLeadByE164("+91" + tgLast10);
    }

    if (!lead) {
      await ctx.reply(
        "I can't find your application.\n" +
          "Please ensure you submitted the form on https://www.hirepr0.com/ with the SAME phone number used on Telegram,\n" +
          "then try /share again."
      );
      return;
    }

    // Compare by last 10 digits so formats don't matter
    const dbLast10 = last10Digits(lead.phone_e164 || "");
    if (!dbLast10 || dbLast10 !== tgLast10) {
      await ctx.reply(
        "Mobile phone number verification failed. It is different from the mobile phone number you submitted in the form."
      );
      return;
    }

    // Ensure code from server (already generated on insert)
    const code = lead.work_code || "(no code yet)";

    // Choose executive (round robin) from local execs db
    const exec = chooseExecutiveRR();
    let execText = "";
    let execBtn: InlineKeyboard | undefined;

    if (exec) {
      bumpAssigned(exec.id);
      const handle = exec.username.startsWith("@") ? exec.username : `@${exec.username}`;
      execText = `executive contact: ${handle}`;
      execBtn = new InlineKeyboard().url(
        "Message now",
        `https://t.me/${exec.username.replace(/^@/, "")}`
      );
    } else {
      execText = "executive contact: (waiting – no executive online)";
    }

    // DM the user (keep copy the same as your previous bot)
    await ctx.reply(
      `Your work code is used to verify your identity.\n` +
        `Verify successfully!\n` +
        `Job code: ${code}\n` +
        `${execText}`,
      execBtn ? { reply_markup: execBtn } : undefined
    );

    // Post to ops group once per lead
    const leadKey = String(lead.id);
    if (!hasPosted(leadKey)) {
      const name =
        lead.name ||
        [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") ||
        "(unknown)";
      const age = lead.age ?? "-";
      const ip = lead.ip || "-";
      const text =
        `Name: ${name}\n` +
        `Age: ${age}\n` +
        `Phone: ${lead.phone_e164}\n` +
        `IP: ${ip}\n` +
        `Code: ${code}`;
      await bot.api.sendMessage(GROUP_ID, text, {
        link_preview_options: { is_disabled: true },
      });
      markPostedOnce(leadKey);
    }
  } catch (err) {
    console.error("contact handler error:", err);
    await ctx.reply("Sorry, something went wrong. Please try again in a moment.");
  }
});

// ---------- Startup ----------
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
