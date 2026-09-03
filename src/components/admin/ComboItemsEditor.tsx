"use client";

import { useEffect, useState } from "react";
import {
  adminGetProducts,
  getProductForAdmin,
  type AdminProductListItemDto,
  type AdminVariantDto,
} from "@/lib/api-admin";
import { variantLabel, formatCop } from "@/lib/format";
import { Select } from "@/components/Select";

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
  const [productVariants, setProductVariants] = useState<AdminVariantDto[]>([]);
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
      setProductVariants(detail.variants.filter((v) => v.sellPrice !== null));
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
          <Select
            ariaLabel="Producto"
            placeholder="Selecciona un producto"
            value={selectedProductSlug}
            onValueChange={handleProductChange}
            wrapperClassName="mt-1 inline-block"
            className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            options={products.map((p) => ({ value: p.slug, label: `${p.name} (${p.brandName})` }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brava-ink">Variante</label>
          <Select
            ariaLabel="Variante"
            placeholder="Selecciona una variante"
            value={selectedVariantId}
            onValueChange={setSelectedVariantId}
            disabled={productVariants.length === 0}
            wrapperClassName="mt-1 inline-block"
            className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            options={productVariants.map((v) => ({
              value: v.id,
              label: `${variantLabel(v)} — ${formatCop(v.sellPrice!)}`,
            }))}
          />
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
