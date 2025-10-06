// app/api/lead/route.ts  (FRONTEND / VERCEL PROXY)
// This file runs on Vercel and only forwards to your VPS API.
// Do NOT put DB code here.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// If env has a trailing slash, remove it.
const UPSTREAM =
  (process.env.NEXT_PUBLIC_API_BASE || "https://api.hirepr0.com").replace(/\/+$/, "");

// --- CORS preflight (browser calls OPTIONS before POST) ---
export async function OPTIONS() {
  // We don't set CORS headers here because the request is same-origin:
  // browser -> your own domain -> proxy -> VPS. 204 is enough.
  return new Response(null, { status: 204 });
}

// --- Forward POST to your real backend ---
export async function POST(req: Request) {
  try {
    // Forward the raw body so we don’t change the payload format
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
      // Important: disable Next’s caching and ensure a real network call
      cache: "no-store",
    });

    // Stream/return upstream response as-is
    const text = await upstreamRes.text();

    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        "content-type": upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    // Keep the site responsive and return JSON error (no 502 page)
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Proxy error" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
}
