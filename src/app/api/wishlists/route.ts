import { forwardWishlistSave, readJsonBody } from "@/lib/wishlist-save";

// POST /api/wishlists — create a shareable gift list.
// Body: { ownerName, note?, items: [{ type, slug, variantId?, name,
//         variantLabel?, imageUrl?, unitPrice, quantity }] }
// Response: 201 { code } | 400 "<mensaje>"
export async function POST(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  return forwardWishlistSave("POST", "/api/wishlists", parsed.body);
}
