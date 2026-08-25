"use client";

import { useState } from "react";
import { buildWhatsAppComboOrderLink } from "@/lib/whatsapp";
import { useWishlist } from "@/components/WishlistProvider";

export function ComboOrderForm({
  comboSlug,
  comboName,
  finalPrice,
}: {
  comboSlug: string;
  comboName: string;
  finalPrice: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useWishlist();
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-6 flex flex-col gap-4">
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

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={buildWhatsAppComboOrderLink({ comboName, quantity })}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
        >
          Pedir por WhatsApp
        </a>
        <button
          type="button"
          onClick={() => {
            addItem(
              {
                key: `combo:${comboSlug}`,
                type: "combo",
                slug: comboSlug,
                name: comboName,
                variantLabel: null,
                unitPrice: finalPrice,
              },
              quantity,
            );
            setAdded(true);
          }}
          className="text-sm font-medium text-brava-pink-dark hover:underline"
        >
          {added ? "Agregado ✓" : "Agregar a lista de deseos"}
        </button>
      </div>
    </div>
  );
}
