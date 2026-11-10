TURKEY FRONTEND UPGRADE - STEP 1 ONLY
Domain: https://www.hirepr0.com

PIXEL MAPPING
/      -> 1027659769983185 (homepage; Vercel NEXT_PUBLIC_META_PIXEL_ID should stay/set to this)
/Tr002 -> 2116887169708075
/Tr003 -> 1034374378987277
/Tr004 -> 2054700951850488 (temporary placeholder)

ADD NEW FILES
- components/TikTokPixel.tsx
- lib/tiktok.ts
- lib/landing-config.ts
- app/[landing]/page.tsx

REPLACE EXISTING FILES
- app/page.tsx
- app/layout.tsx
- app/globals.css
- app/components/ApplicationForm.tsx
- components/MetaPixel.tsx
- lib/pixel.ts

KEEP EXISTING TURKEY FILE
- app/api/lead/route.ts (included in this ZIP only for reference/safe replacement; it keeps hirepr0.com origin)

DO NOT DELETE YET
- bot/
- scripts/
- app/admin/
- lib/db.ts
- lib/code.ts
- lib/phone.ts
- lib/fbq.ts
- app/components/MetaPixel.tsx
- app/components/PixelRouteTracker.tsx
These can be cleaned only after VPS/backend migration is complete.

VERCEL ENV TO KEEP/SET
API_BASE=<your existing Turkey API base; do not change yet>
NEXT_PUBLIC_BOT_USERNAME=<your existing Turkey bot username>
NEXT_PUBLIC_META_PIXEL_ID=1027659769983185
NEXT_PUBLIC_TIKTOK_PIXEL_ID=<leave empty until you create the Turkey TikTok Pixel>

NOTES
- Browser Meta PageView is path-specific using trackSingle.
- Meta Lead fires when the user chooses to continue in Telegram.
- CompleteRegistration fires on Telegram continue only when the API says isNew=true.
- TikTok is safe to deploy before a Pixel exists; it does nothing until NEXT_PUBLIC_TIKTOK_PIXEL_ID is set.
- This Step 1 package deliberately does NOT require the old Turkey VPS to support /api/lead/continue yet. We will add the LATAM-style backend event recording later during the VPS migration.
