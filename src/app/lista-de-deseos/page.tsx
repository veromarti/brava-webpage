"use client";

import Link from "next/link";
import { useWishlist } from "@/components/WishlistProvider";
import { formatCop } from "@/lib/format";
import { buildWhatsAppWishlistLink } from "@/lib/whatsapp";

export default function WishlistPage() {
  const { items, removeItem, updateQuantity, clear } = useWishlist();
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl text-brava-ink">Lista de deseos</h1>
      <p className="mt-1 text-brava-muted">
        Guarda lo que te gusta y pide todo junto por WhatsApp cuando estés lista.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 text-brava-muted">
          <p>Tu lista de deseos está vacía.</p>
          <Link href="/" className="mt-2 inline-block text-brava-pink-dark hover:underline">
            Ver el catálogo
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-brava-pink-light p-4"
              >
                <div>
                  <Link
                    href={item.type === "product" ? `/products/${item.slug}` : `/combos/${item.slug}`}
                    className="font-medium text-brava-ink hover:text-brava-pink-dark"
                  >
                    {item.name}
                    {item.type === "combo" && " (kit)"}
                  </Link>
                  {item.variantLabel && <p className="text-sm text-brava-muted">{item.variantLabel}</p>}
                  <p className="text-sm font-semibold text-brava-pink-dark">{formatCop(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.key, Number(e.target.value) || 1)}
                    className="w-16 rounded-lg border border-brava-pink-light px-2 py-1 text-center outline-none focus:border-brava-pink"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-sm text-brava-muted hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between border-t border-brava-pink-light pt-4">
            <span className="font-medium text-brava-ink">Total estimado</span>
            <span className="text-xl font-bold text-brava-pink-dark">{formatCop(total)}</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href={buildWhatsAppWishlistLink({
                lines: items.map(
                  (item) =>
                    `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} x${item.quantity}`,
                ),
                totalLabel: formatCop(total),
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
            >
              Pedir por WhatsApp
            </a>
            <button type="button" onClick={clear} className="text-sm text-brava-muted hover:text-red-600">
              Vaciar lista
            </button>
          </div>
        </>
      )}
    </div>
  );
}
