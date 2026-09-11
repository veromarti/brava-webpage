import { forwardJson, readJsonBody } from "@/lib/server-proxy";

// POST /api/orders — the storefront's "Pedir por WhatsApp": creates a
// Pendiente order from the small contact form (WhatsAppOrderButton), forwarded
// to the anonymous POST /api/orders/storefront on the API.
// Body: { contactName, contactPhone, deliveryAddress, items: [{ productVariantId?, comboId?, quantity }], notes? }
// Response: 201 { number, total } | 400 "<mensaje>"
export async function POST(request: Request): Promise<Response> {
  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return parsed.error;
  }
  return forwardJson("POST", "/api/orders/storefront", parsed.body);
}
