"use client";

import { useState } from "react";
import { useWishlist } from "@/components/WishlistProvider";
import { WhatsAppOrderButton } from "@/components/WhatsAppOrderButton";

export function ComboOrderForm({
  comboId,
  comboSlug,
  comboName,
  finalPrice,
  imageUrl,
}: {
  comboId: string;
  comboSlug: string;
  comboName: string;
  finalPrice: number;
  imageUrl: string | null;
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
        <WhatsAppOrderButton
          items={[{ comboId, quantity, label: `${comboName} (kit)` }]}
          total={finalPrice * quantity}
        />
        <button
          type="button"
          onClick={() => {
            addItem(
              {
                key: `combo:${comboSlug}`,
                type: "combo",
                slug: comboSlug,
                comboId,
                name: comboName,
                variantLabel: null,
                imageUrl,
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
