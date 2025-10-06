// app/api/lead/route.ts
// Proxy /api/lead from the website (Vercel) to your real API on the VPS.
// This keeps the browser same-origin → no CORS headaches.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where to forward: https://api.hirepr0.com
const UPSTREAM =
  (process.env.API_BASE || "https://api.hirepr0.com").replace(/\/+$/, "");

// --- CORS preflight (browser calls OPTIONS before POST) ---
export async function OPTIONS() {
  // Because the browser is calling *this* route on the same origin (hirepr0.com),
  // we do not need to emit Access-Control-Allow-* headers here.
  // A bare 204 is enough to satisfy preflight.
  return new Response(null, { status: 204 });
}

// --- Forward POST to your real backend ---
export async function POST(req: Request) {
  try {
    // Pass the raw body so payload formatting is unchanged
    const body = await req.text();

    // Forward a minimal set of headers. Content-Type is important.
    const headers: Record<string, string> = {};
    const contentType = req.headers.get("content-type");
    if (contentType) headers["content-type"] = contentType;

    // If you ever add auth to your backend, you can pass it through:
    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const upstreamRes = await fetch(`${UPSTREAM}/api/lead`, {
      method: "POST",
      headers,
      body,
    });

    // Stream/return upstream response as-is
    const text = await upstreamRes.text();
    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        "content-type":
          upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    // Return a JSON error (still same-origin to the browser)
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Proxy error" }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}
