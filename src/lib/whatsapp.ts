// CLAUDE.md: WhatsApp +57 305 266 9509. wa.me needs the number with no
// leading "+" or spaces.
const WHATSAPP_NUMBER = "573052669509";

// ADR-0005: message includes product name, tone/size, and quantity.
// Quantity defaults to 1 since v1 has no cart/quantity input — the customer
// edits it in WhatsApp before sending, same as they'd edit a WhatsApp order
// today.
export function buildWhatsAppOrderLink(params: {
  productName: string;
  variantLabel: string;
}): string {
  const message = `Hola BRAVA, quiero pedir: ${params.productName} (${params.variantLabel}). Cantidad: 1.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
