// CLAUDE.md: WhatsApp +57 305 266 9509. wa.me needs the number with no
// leading "+" or spaces.
const WHATSAPP_NUMBER = "573052669509";

// Message includes product name, tone/size, and quantity — quantity now
// comes from the product page's own picker, not a hardcoded "1".
export function buildWhatsAppOrderLink(params: {
  productName: string;
  variantLabel: string;
  quantity: number;
}): string {
  const message = `Hola BRAVA, quiero pedir: ${params.productName} (${params.variantLabel}). Cantidad: ${params.quantity}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// General contact link — footer/social icon, no product/order context yet.
export function buildWhatsAppContactLink(): string {
  const message = "Hola BRAVA, quiero saber más sobre sus productos.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppComboOrderLink(params: { comboName: string; quantity: number }): string {
  const message = `Hola BRAVA, quiero pedir el kit: ${params.comboName}. Cantidad: ${params.quantity}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Wishlist ("Lista de deseos") checkout — one line per item, a total at the
// end. This is deliberately the same wa.me deep-link pattern as the other
// two builders, just multi-line: there's no cart/checkout backend (out of
// scope per ADR-0005), so the "summary" is entirely this preset message.
export function buildWhatsAppWishlistLink(params: {
  lines: string[];
  totalLabel: string;
}): string {
  const numbered = params.lines.map((line, i) => `${i + 1}. ${line}`).join("\n");
  const message = `Hola BRAVA, quiero pedir:\n${numbered}\n\nTotal estimado: ${params.totalLabel}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
