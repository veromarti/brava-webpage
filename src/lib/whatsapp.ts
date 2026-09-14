// CLAUDE.md: WhatsApp +57 305 266 9509. wa.me needs the number with no
// leading "+" or spaces.
const WHATSAPP_NUMBER = "573052669509";

// General contact link — footer/social icon, no product/order context yet.
export function buildWhatsAppContactLink(): string {
  const message = "Hola BRAVA, quiero saber más sobre sus productos.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// "Pedir por WhatsApp" (product/combo/wishlist pages) and "Regalar esto" /
// "Regalar todo" (shared gift-list page), sent only after WhatsAppOrderButton
// has actually created the Pendiente order via POST /api/orders — so the
// message includes the real order number, every item, and the contact
// details already on file, instead of the customer retyping them into the
// chat. giftFor names the wishlist owner when this order came from someone
// else's shared list, so BRAVA knows it's a gift before asking about delivery.
export function buildWhatsAppOrderConfirmationLink(params: {
  orderNumber: string;
  lines: string[];
  totalLabel: string;
  name: string;
  phone: string;
  address: string;
  giftFor?: string;
}): string {
  const numbered = params.lines.map((line, i) => `${i + 1}. ${line}`).join("\n");
  const intro = params.giftFor
    ? `Hola BRAVA, quiero confirmar mi pedido ${params.orderNumber} — es un regalo para ${params.giftFor}:`
    : `Hola BRAVA, quiero confirmar mi pedido ${params.orderNumber}:`;
  const message =
    `${intro}\n${numbered}\n\n` +
    `Total estimado: ${params.totalLabel}\n\n` +
    `Nombre: ${params.name}\nTeléfono: ${params.phone}\nDirección: ${params.address}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// The list owner sharing their own gift list with friends/family. No number:
// wa.me with just ?text opens WhatsApp's chat picker so they choose who to send
// it to. navigator.share is preferred where available; this is the fallback and
// the explicit "compartir por WhatsApp" button.
export function buildWhatsAppShareMyListLink(params: { url: string }): string {
  const message = `Te comparto mi lista de deseos de BRAVA 💕 Así sabes qué me encantaría de regalo:\n${params.url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
