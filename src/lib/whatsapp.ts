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
