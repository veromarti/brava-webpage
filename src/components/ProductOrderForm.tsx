"use client";

import { useState } from "react";
import type { ProductVariantDto } from "@/lib/api";
import { formatCop, variantLabel, stockStatus } from "@/lib/format";
import { buildWhatsAppOrderLink } from "@/lib/whatsapp";

// One variant picker + one quantity field + one WhatsApp button, instead of
// a "Pedir por WhatsApp" repeated on every variant row — the customer picks
// what they want first, then the preset message reflects that one choice.
export function ProductOrderForm({
  productName,
  variants,
}: {
  productName: string;
  variants: ProductVariantDto[];
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((v) => v.id === variantId) ?? variants[0];
  if (!selected) {
    return null;
  }

  const status = stockStatus(selected);
  const statusClassName =
    status.tone === "in-stock"
      ? "text-sm text-emerald-700"
      : status.tone === "on-demand"
        ? "text-sm text-amber-700"
        : "text-sm text-brava-muted";

  return (
    <div className="mt-6 flex flex-col gap-4">
      {variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-brava-ink">Tono/talla</label>
          <select
            value={selected.id}
            onChange={(e) => setVariantId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brava-pink-light bg-white px-3 py-2 outline-none focus:border-brava-pink"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {variantLabel(v)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <p className="text-xl font-semibold text-brava-pink-dark">{formatCop(selected.sellPrice!)}</p>
        <p className={statusClassName}>{status.label}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brava-ink">Cantidad</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="mt-1 w-24 rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
        />
      </div>

      {status.tone === "out-of-stock" ? (
        <p className="text-sm text-brava-muted">Este tono/talla está agotado.</p>
      ) : (
        <a
          href={buildWhatsAppOrderLink({
            productName,
            variantLabel: variantLabel(selected),
            quantity,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
        >
          Pedir por WhatsApp
        </a>
      )}
    </div>
  );
}
