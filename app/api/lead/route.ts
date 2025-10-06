// app/api/lead/route.ts  (WEB on Vercel) — PROXY ONLY

export const runtime = "nodejs";              // not edge (we need env + headers)
export const dynamic = "force-dynamic";       // avoid caching

const API_BASE = process.env.API_BASE;        // MUST be set on Vercel

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// CORS for preflight (harmless even if same-origin)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "https://www.hirepr0.com",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization",
      "vary": "Origin",
    },
  });
}

export async function POST(req: Request) {
  try {
    if (!API_BASE) {
      return json(500, { ok: false, error: "API_BASE is not configured on the web app" });
    }

    // Body from the form
    const payload = await req.json();

    // Try to forward the real client IP
    const h = req.headers;
    // Vercel sends the real client IP in x-forwarded-for (comma-separated)
    const fwd = h.get("x-forwarded-for") || "";
    const real = h.get("x-real-ip") || "";
    const vercel = h.get("x-vercel-forwarded-for") || "";
    const clientIp = fwd.split(",")[0]?.trim() || real || vercel || "";

    const res = await fetch(`${API_BASE}/api/lead`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // pass through a clean X-Forwarded-For so the VPS can store it
        ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
        // optional: origin for your nginx allowlist (not strictly needed for S2S)
        origin: "https://www.hirepr0.com",
      },
      body: JSON.stringify(payload),
    });

    // bubble up JSON from VPS
    const data = await res.json().catch(() => ({}));

    // mirror VPS status to the browser so devtools shows green/200 when OK
    return json(res.status, data);
  } catch (err: any) {
    return json(500, { ok: false, error: err?.message || "proxy failed" });
  }
}
