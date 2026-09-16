<<<<<<< HEAD
import { getProductBySlug, getComboBySlug } from "@/lib/api";

// The catalog grid only has the thin list DTOs (name/price range/image) —
// no variant ids, no combo id — so a card's "quick add"/"quick view" needs
// one more lookup before it can build a cart line. lib/api.ts is server-only
// (API_URL isn't public — see its top-of-file comment), so that lookup has
// to happen here, same reasoning as /api/wishlist-prices.
//
// Request:  { type: "product" | "combo", slug }
// Response: ProductDetailDto | ComboDetailDto | { error } (404 if inactive/missing)
=======
import { getProductBySlug, getComboBySlugWithImages } from "@/lib/api";

// The catalog grid only has the thin list DTOs (name/price range/image) —
// no variant ids, no combo id, no full gallery — so a card's "quick
// add"/"quick view" needs one more lookup before it can build a cart line or
// show the same carousel the detail page has. lib/api.ts is server-only
// (API_URL isn't public — see its top-of-file comment), so that lookup has
// to happen here, same reasoning as /api/wishlist-prices.
//
// Uses the same *WithImages fetcher the combo detail page itself uses, so
// the quick-view modal's carousel gets the identical gallery (kit's own
// photo, if any, then each member product's main image).
//
// Request:  { type: "product" | "combo", slug }
// Response: ProductDetailDto | ComboDetailWithImagesDto | { error } (404 if inactive/missing)
>>>>>>> 819cc89 (feat: quick-add and quick-view on catalog cards)
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { type, slug } = (body ?? {}) as { type?: unknown; slug?: unknown };
  if ((type !== "product" && type !== "combo") || typeof slug !== "string" || slug.length === 0) {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (type === "product") {
    const product = await getProductBySlug(slug);
    if (!product || !product.isActive) {
      return Response.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    return Response.json(product);
  }

<<<<<<< HEAD
  const combo = await getComboBySlug(slug);
=======
  const combo = await getComboBySlugWithImages(slug);
>>>>>>> 819cc89 (feat: quick-add and quick-view on catalog cards)
  if (!combo || !combo.isActive) {
    return Response.json({ error: "Kit no encontrado." }, { status: 404 });
  }
  return Response.json(combo);
}
