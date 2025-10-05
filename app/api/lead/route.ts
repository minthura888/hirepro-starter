// app/api/lead/route.ts

// Keep node runtime (Edge can have fetch/body quirks for some backends)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Change this if your API domain ever changes
const UPSTREAM = process.env.API_BASE?.replace(/\/+$/, "") 
  || process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "")
  || "https://api.hirepr0.com";

// --- CORS preflight (browser will call OPTIONS before POST) ---
export async function OPTIONS() {
  // We don’t set CORS headers here because the request is same-origin
  // (browser hits /api/lead on your own domain). Returning 204 is enough.
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
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Proxy error" }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}
