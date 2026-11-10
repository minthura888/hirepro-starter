export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = process.env.API_BASE;
const WEB_ORIGIN = "https://www.hirepr0.com";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": WEB_ORIGIN,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  try {
    if (!API_BASE) {
      return json(500, { ok: false, error: "API_BASE is not configured" });
    }

    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/lead/continue`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: WEB_ORIGIN,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return json(res.status, data);
  } catch (err: any) {
    return json(500, { ok: false, error: err?.message || "Server error" });
  }
}
