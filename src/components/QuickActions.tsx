"use client";

import { useState, type MouseEvent } from "react";
import { FaCartPlus, FaCheck, FaEye } from "react-icons/fa6";
import { useWishlist } from "@/components/WishlistProvider";
import { fetchCatalogItem } from "@/lib/catalogItemClient";
import { pickMainImage, variantLabel } from "@/lib/format";
import { QuickViewModal } from "@/components/QuickViewModal";

// Overlaid on every catalog card (ProductCard/ComboCard), so the customer
// doesn't have to open each product just to add it or glance at it. Both
// cards are otherwise a single <Link> to the detail page — every handler
// here stops propagation so a click lands on the button, not the card's nav.
//
// Quick-add always takes the product's first variant (same default
// ProductOrderForm's picker opens on) regardless of stock, matching that
// form's own "Agregar al carrito" — wishlisting/carting an out-of-stock line
// to check back later is already normal behavior there.
export function QuickActions({
  type,
  slug,
  name,
}: {
  type: "product" | "combo";
  slug: string;
  name: string;
}) {
  const { addItem } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  function stop(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleQuickAdd(e: MouseEvent) {
    stop(e);
    if (adding) return;
    setAdding(true);
    try {
      if (type === "product") {
        const product = await fetchCatalogItem("product", slug);
        const variant = product?.variants[0];
        if (!product || !variant) return;
        addItem(
          {
            key: `product:${variant.id}`,
            type: "product",
            slug,
            name: product.name,
            variantLabel: variantLabel(variant),
            imageUrl: pickMainImage(product.images),
            unitPrice: variant.sellPrice ?? 0,
          },
          1,
        );
      } else {
        const combo = await fetchCatalogItem("combo", slug);
        if (!combo) return;
        addItem(
          {
            key: `combo:${slug}`,
            type: "combo",
            slug,
            comboId: combo.id,
            name: combo.name,
            variantLabel: null,
            imageUrl: combo.imageUrl,
            unitPrice: combo.finalPrice,
          },
          1,
        );
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  }

  function handleOpenQuickView(e: MouseEvent) {
    stop(e);
    setQuickViewOpen(true);
  }

  const buttonClassName =
    "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brava-ink shadow transition-colors hover:bg-brava-pink hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <div className="absolute bottom-2 right-2 z-10 flex gap-1.5">
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={adding}
          aria-label={`Agregar ${name} al carrito`}
          title="Agregar al carrito"
          className={buttonClassName}
        >
          {added ? <FaCheck aria-hidden className="text-emerald-600" /> : <FaCartPlus aria-hidden />}
        </button>
        <button
          type="button"
          onClick={handleOpenQuickView}
          aria-label={`Vista rápida de ${name}`}
          title="Vista rápida"
          className={buttonClassName}
        >
          <FaEye aria-hidden />
        </button>
      </div>

      {quickViewOpen && (
        <QuickViewModal target={{ type, slug }} onClose={() => setQuickViewOpen(false)} />
      )}
    </>
  );
}
