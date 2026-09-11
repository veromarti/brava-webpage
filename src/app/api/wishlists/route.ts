import { forwardJson, readJsonBody } from "@/lib/server-proxy";

// POST /api/wishlists — create a shareable gift list.
// Body: { ownerName, note?, items: [{ type, slug, variantId?, name,
//         variantLabel?, imageUrl?, unitPrice, quantity }] }
// Response: 201 { code } | 400 "<mensaje>"
export async function POST(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  return forwardJson("POST", "/api/wishlists", parsed.body);
}
