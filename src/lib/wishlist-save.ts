// The storefront wishlist page runs in the browser and can't reach API_URL
// (server-only, see lib/api.ts), so saving/updating a shared gift list is
// proxied through Route Handlers — same reason /api/wishlist-prices exists.
// This is the shared forwarder for both (POST /api/wishlists, PUT
// /api/wishlists/[code]).

const API_URL = process.env.API_URL;

export async function forwardWishlistSave(
  method: "POST" | "PUT",
  path: string,
  body: unknown,
): Promise<Response> {
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

  // The API returns JSON on success ({ code } / the wishlist) and a plain
  // string on validation errors — pass the body straight through with its own
  // status and content type so the client can surface the message.
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function readJsonBody(request: Request): Promise<{ body: unknown } | { error: Response }> {
  try {
    return { body: await request.json() };
  } catch {
    return { error: Response.json({ error: "Cuerpo inválido." }, { status: 400 }) };
  }
}
