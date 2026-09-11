// Shared by every Route Handler that proxies a browser write to the .NET API.
// API_URL is server-only (see lib/api.ts) so the browser can't call it
// directly — this is the one place that forwarding happens. Used by the
// wishlist-share endpoints and the storefront order-creation endpoint.

const API_URL = process.env.API_URL;

export async function readJsonBody(request: Request): Promise<{ body: unknown } | { error: Response }> {
  try {
    return { body: await request.json() };
  } catch {
    return { error: Response.json({ error: "Cuerpo inválido." }, { status: 400 }) };
  }
}

export async function forwardJson(method: "POST" | "PUT", path: string, body: unknown): Promise<Response> {
  if (!API_URL) {
    return Response.json({ error: "API no configurada." }, { status: 500 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "No se pudo conectar con el servidor." }, { status: 502 });
  }

  // The API returns JSON on success and a plain string on validation errors —
  // pass the body straight through with its own status/content type so the
  // client can surface the message.
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
