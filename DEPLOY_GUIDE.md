# Deploy Guide (GitHub → Vercel)

This repo is a Next.js 14 app (App Router) with a small API route for capturing leads.
It can also run a Telegram bot (optional) from the `/bot` folder.

## What I changed
- **API Lead Route** now defaults to `DATABASE_PATH=/tmp/app.db` when running on Vercel. That path is writable, but **ephemeral**. Use a real DB (Postgres / Turso / etc.) for production, or deploy on a VPS where you control the disk.
- Standardized `.env.example` keys and added comments.
- Added `vercel.json` and a `.gitignore` entry for `data/*.db`.
- Created `data/.gitkeep` so the folder exists in Git.

## 1) Local dev (optional)
```bash
npm install
npm run dev
# open http://localhost:3000
```

## 2) Prepare a GitHub repo
1. Create a new empty repo on GitHub.
2. In this project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

## 3) Configure env vars (GitHub → Vercel)
Add these in **Vercel → Project → Settings → Environment Variables**:
- `WEB_ORIGIN` = your site origin (e.g., `https://<your-app>.vercel.app`)
- (Optional) `DATABASE_PATH` (omit on Vercel to use `/tmp/app.db`)
- (Optional) `NEXT_PUBLIC_BOT_USERNAME`
- (Bot-only) `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_ID`, `TELEGRAM_GROUP_ID`

> **Note:** The Telegram bot is not deployed on Vercel. Run it on your computer or VPS with:
> ```bash
> npm run dev:bot
> ```

## 4) Import on Vercel
1. Go to Vercel → **New Project** → **Import Git Repository**.
2. Select your GitHub repo.
3. Framework is detected as **Next.js** → click **Deploy**.
4. After the first deployment, set your Environment Variables and **Redeploy**.

## 5) Forms (lead capture)
The API route `POST /api/lead` stores the data in a SQLite DB at `DATABASE_PATH`.
- On Vercel, default is `/tmp/app.db` (**resets on cold start**). Use a persistent DB for production.
- On a VPS, set `DATABASE_PATH` to an absolute path like `/srv/hirepro/data/app.db` and ensure the folder is writable.

**Example request (if you need to test):**
```bash
curl -X POST https://<your-app>.vercel.app/api/lead   -H "content-type: application/json"   -d '{"name":"John","phone":"09xxxxxxx","email":"test@example.com"}'
```

## 6) VPS (optional)
You can run everything (web + API + bot) on a VPS:
```bash
# on the server
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
cp .env.example .env   # edit values
npm install
npm run build
npm run start          # or use pm2 / systemd

# run the telegram bot in a separate process
npm run dev:bot
```
