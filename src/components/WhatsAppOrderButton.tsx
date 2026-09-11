"use client";

import { useState, type FormEvent } from "react";
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
// Pendiente order first (POST /api/orders — see api/orders/route.ts), so it
// shows up in the admin panel immediately, then hands off to WhatsApp with
// the order number and the customer's own contact details already in the
// message. One component, used on the product page, the combo page, and the
// wishlist page — only `items`/`total` change per call site.
export function WhatsAppOrderButton({
  items,
  total,
  className,
}: {
  items: WhatsAppOrderLine[];
  total: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ number: string; url: string } | null>(null);

  const buttonClassName =
    className ?? "w-fit rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark";

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
          notes: null,
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
      });
      setResult({ number, url });
    } catch {
      setError("No hay conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state: a plain <a target="_blank"> link (not window.open) so the
  // customer clicks through themselves — no popup-blocker surprises, and the
  // same pattern as every other WhatsApp CTA in the app.
  if (result) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-brava-ink">
          Pedido {result.number} creado ✓ Continúa en WhatsApp para confirmarlo.
        </p>
        <a href={result.url} target="_blank" rel="noopener noreferrer" className={buttonClassName}>
          Continuar en WhatsApp
        </a>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName}>
        Pedir por WhatsApp
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-brava-pink-light bg-white p-4"
    >
      <p className="text-sm font-medium text-brava-ink">Datos para tu pedido</p>
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
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brava-pink px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Confirmar pedido"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-brava-muted hover:text-red-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
