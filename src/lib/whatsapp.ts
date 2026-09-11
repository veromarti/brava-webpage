// CLAUDE.md: WhatsApp +57 305 266 9509. wa.me needs the number with no
// leading "+" or spaces.
const WHATSAPP_NUMBER = "573052669509";

// General contact link — footer/social icon, no product/order context yet.
export function buildWhatsAppContactLink(): string {
  const message = "Hola BRAVA, quiero saber más sobre sus productos.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// "Pedir por WhatsApp" (product page, combo page, wishlist page), sent only
// after WhatsAppOrderButton has actually created the Pendiente order via
// POST /api/orders — so the message includes the real order number and the
// contact details already on file, instead of the customer retyping them
// into the chat. One line per item, a total, then the contact block.
export function buildWhatsAppOrderConfirmationLink(params: {
  orderNumber: string;
  lines: string[];
  totalLabel: string;
  name: string;
  phone: string;
  address: string;
}): string {
  const numbered = params.lines.map((line, i) => `${i + 1}. ${line}`).join("\n");
  const message =
    `Hola BRAVA, quiero confirmar mi pedido ${params.orderNumber}:\n${numbered}\n\n` +
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

// A gift-giver messaging BRAVA to buy from someone's shared list — same
// wa.me-to-BRAVA deep link as the order builders. itemLabel is one line
// ("Labial Mate (Rojo) x1") when they picked a single item, or null to ask
// about the whole list.
export function buildWhatsAppGiftLink(params: {
  ownerName: string;
  itemLabel: string | null;
  url: string;
}): string {
  const what = params.itemLabel
    ? `quiero regalar esto de la lista de deseos de ${params.ownerName}: ${params.itemLabel}.`
    : `quiero regalar algo de la lista de deseos de ${params.ownerName}.`;
  const message = `Hola BRAVA, ${what}\nLista: ${params.url}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
