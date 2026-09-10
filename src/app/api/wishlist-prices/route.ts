import { currentWishlistPrice } from "@/lib/api";

// The wishlist lives in the browser's localStorage and stores each line's
// unitPrice as it was when the item was added (WishlistProvider). This
// endpoint lets the wishlist page re-check the current price of every line
// against the real API so the on-screen total and the "Total estimado" sent
// over WhatsApp aren't stale. lib/api.ts is server-only (API_URL isn't
// public), so the lookup has to happen here rather than from the client.
//
// Request:  { items: [{ key, type: "product" | "combo", slug }] }
// Response: { prices: { [key]: number | null } }
//           null = the item/variant no longer exists or is inactive.

interface RequestItem {
  key: string;
  type: "product" | "combo";
  slug: string;
}

const PRODUCT_KEY_PREFIX = "product:";

function parseItems(body: unknown): RequestItem[] {
  if (typeof body !== "object" || body === null || !Array.isArray((body as { items?: unknown }).items)) {
    return [];
  }
  return (body as { items: unknown[] }).items.flatMap((raw) => {
    if (typeof raw !== "object" || raw === null) return [];
    const it = raw as Record<string, unknown>;
    if (
      typeof it.key === "string" &&
      typeof it.slug === "string" &&
      (it.type === "product" || it.type === "combo")
    ) {
      return [{ key: it.key, type: it.type, slug: it.slug }];
    }
    return [];
  });
}

// The line's variant id is carried inside its key ("product:{variantId}");
// combo lines are keyed by slug and have none. currentWishlistPrice does the
// actual catalog lookup.
function currentPrice(item: RequestItem): Promise<number | null> {
  const variantId =
    item.type === "product" && item.key.startsWith(PRODUCT_KEY_PREFIX)
      ? item.key.slice(PRODUCT_KEY_PREFIX.length)
      : null;
  return currentWishlistPrice(item.type, item.slug, variantId);
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const items = parseItems(body);
  const prices: Record<string, number | null> = {};
  await Promise.all(
    items.map(async (item) => {
      try {
        prices[item.key] = await currentPrice(item);
      } catch {
        // A single failed lookup shouldn't sink the whole response — omit
        // the key and the client keeps that line's stored price.
      }
    }),
  );

  return Response.json({ prices });
}
