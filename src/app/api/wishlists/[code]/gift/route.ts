import { forwardJson, readJsonBody } from "@/lib/server-proxy";

// PUT /api/wishlists/[code]/gift — called by WhatsAppOrderButton right after
// it creates a real order for one or more gift-list lines, so a later
// visitor to the same link sees those as already taken.
// Body: { itemIds: string[] }
// Response: 200 <wishlist> | 404 "<mensaje>"
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;
  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  return forwardJson("PUT", `/api/wishlists/${encodeURIComponent(code)}/gift`, parsed.body);
}
