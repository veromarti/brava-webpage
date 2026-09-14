"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { buildWhatsAppOrderConfirmationLink } from "@/lib/whatsapp";
import { formatCop } from "@/lib/format";

export interface WhatsAppOrderLine {
  productVariantId?: string | null;
  comboId?: string | null;
  quantity: number;
  // For the WhatsApp message, e.g. "Labial Mate (Rojo) x2".
  label: string;
}

// Replaces the old plain wa.me link: "Pedir por WhatsApp" now creates a real
// Pendiente order first (POST /api/orders — see api/orders/route.ts), then
// hands off to WhatsApp with the order number and the customer's own contact
// details already in the message. One component, used on the product page,
// the combo page, the wishlist page, and the shared gift-list page ("Regalar
// esto"/"Regalar todo") — only `items`/`total`/`label` (and `giftFor`/`notes`
// for the gift page) change per call site.
//
// The form is a modal (via createPortal to document.body), not inline in the
// card: on a page listing several items (the wishlist, the gift list) an
// inline form let every card open its own at once. A portal always renders
// as a fixed, full-viewport overlay regardless of where in the tree this
// component sits, and its backdrop blocks clicks on every other button while
// open — so only one can ever be open at a time, with no extra state needed
// to enforce it.
export function WhatsAppOrderButton({
  items,
  total,
  label,
  giftFor,
  notes,
  className,
}: {
  items: WhatsAppOrderLine[];
  total: number;
  // Idle button text — defaults to "Pedir por WhatsApp".
  label?: string;
  // Wishlist owner's name, when this order comes from someone else's shared
  // gift list — included in the WhatsApp message so BRAVA knows it's a gift
  // before asking about delivery.
  giftFor?: string;
  notes?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonClassName =
    className ?? "w-fit rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark";

  function closeModal() {
    if (submitting) return; // an in-flight submit shouldn't be cancellable by a stray backdrop click
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName || !trimmedPhone || !trimmedAddress) {
      setError("Nombre, teléfono y dirección son obligatorios.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: trimmedName,
          contactPhone: trimmedPhone,
          deliveryAddress: trimmedAddress,
          items: items.map((i) => ({
            productVariantId: i.productVariantId ?? null,
            comboId: i.comboId ?? null,
            quantity: i.quantity,
          })),
          notes: notes ?? null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed?.error) message = parsed.error;
        } catch {
          // plain-string error body from the API — use as-is
        }
        setError(message || "No se pudo crear el pedido. Intenta de nuevo.");
        setSubmitting(false);
        return;
      }

      const { number, total: orderTotal } = (await res.json()) as { number: string; total: number };
      const url = buildWhatsAppOrderConfirmationLink({
        orderNumber: number,
        lines: items.map((i) => `${i.label} x${i.quantity}`),
        totalLabel: formatCop(orderTotal),
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        giftFor,
      });
      // Same-tab navigation, not window.open: fires immediately with no
      // popup-blocker risk (a new tab opened from inside an async
      // continuation can get silently blocked in some browsers).
      window.location.href = url;
    } catch {
      setError("No hay conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName}>
        {label ?? "Pedir por WhatsApp"}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeModal}
          >
            <form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-medium text-brava-ink">Datos para tu pedido</p>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Cerrar"
                  className="text-brava-muted hover:text-brava-ink"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-brava-muted">Total estimado: {formatCop(total)}</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre"
                className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono"
                className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
              />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección de entrega"
                className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="mt-1 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-brava-pink px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Enviando…" : "Confirmar pedido"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-brava-muted hover:text-red-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}
