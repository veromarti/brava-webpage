"use client";

import { useEffect, useState } from "react";
import { adminGetProducts, getProductForAdmin, type AdminProductListItemDto } from "@/lib/api-admin";
import type { ProductVariantDto } from "@/lib/api";
import { variantLabel, formatCop } from "@/lib/format";

export interface ComboItemRow {
  variantId: string;
  label: string;
  price: number;
}

// Product -> Variant cascading picker, "Agregar" appends a row. A variant
// picked twice is two rows (matches the API's own ComboItem model — no
// quantity field, a repeat is just another line), so no dedup here either.
export function ComboItemsEditor({
  items,
  onChange,
}: {
  items: ComboItemRow[];
  onChange: (items: ComboItemRow[]) => void;
}) {
  const [products, setProducts] = useState<AdminProductListItemDto[]>([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState("");
  const [productVariants, setProductVariants] = useState<ProductVariantDto[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetProducts()
      .then(setProducts)
      .catch(() => setError("No se pudieron cargar los productos."));
  }, []);

  async function handleProductChange(slug: string) {
    setSelectedProductSlug(slug);
    setSelectedVariantId("");
    setProductVariants([]);
    if (!slug) return;
    try {
      const detail = await getProductForAdmin(slug);
      setProductVariants(detail.variants.filter((v: ProductVariantDto) => v.sellPrice !== null));
    } catch {
      setError("No se pudo cargar las variantes de ese producto.");
    }
  }

  function handleAdd() {
    const variant = productVariants.find((v) => v.id === selectedVariantId);
    const product = products.find((p) => p.slug === selectedProductSlug);
    if (!variant || !product || variant.sellPrice === null) return;

    onChange([
      ...items,
      { variantId: variant.id, label: `${product.name} — ${variantLabel(variant)}`, price: variant.sellPrice },
    ]);
    setSelectedVariantId("");
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const sum = items.reduce((total, item) => total + item.price, 0);

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {items.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {items.map((item, i) => (
            <li
              key={`${item.variantId}-${i}`}
              className="flex items-center justify-between rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            >
              <span className="text-brava-ink">{item.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-brava-muted">{formatCop(item.price)}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="text-brava-muted hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <p className="mb-3 text-sm font-medium text-brava-ink">Suma de precios: {formatCop(sum)}</p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-brava-ink">Producto</label>
          <select
            value={selectedProductSlug}
            onChange={(e) => handleProductChange(e.target.value)}
            className="mt-1 rounded-lg border border-brava-pink-light bg-white px-3 py-2 text-sm outline-none focus:border-brava-pink"
          >
            <option value="">Selecciona un producto</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.brandName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brava-ink">Variante</label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            disabled={productVariants.length === 0}
            className="mt-1 rounded-lg border border-brava-pink-light bg-white px-3 py-2 text-sm outline-none focus:border-brava-pink disabled:opacity-50"
          >
            <option value="">Selecciona una variante</option>
            {productVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {variantLabel(v)} — {formatCop(v.sellPrice!)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedVariantId}
          className="rounded-lg bg-brava-pink px-4 py-2 text-sm font-medium text-white hover:bg-brava-pink-dark disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
