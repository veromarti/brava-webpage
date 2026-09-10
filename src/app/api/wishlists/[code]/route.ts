import { forwardWishlistSave, readJsonBody } from "@/lib/wishlist-save";

// PUT /api/wishlists/[code] — full replace of a gift list the creating browser
// still holds the code for. Same body shape as POST /api/wishlists.
// Response: 200 <wishlist> | 400 "<mensaje>" | 404 "<mensaje>"
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  return forwardWishlistSave("PUT", `/api/wishlists/${encodeURIComponent(code)}`, parsed.body);
}
