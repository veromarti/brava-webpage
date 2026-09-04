"use client";

import { useEffect, useState } from "react";
import {
  adminGetProducts,
  getProductForAdmin,
  adminGetCombos,
  type AdminProductListItemDto,
  type AdminVariantDto,
  type AdminComboListItemDto,
  type CreateOrderItemPayload,
} from "@/lib/api-admin";
import { variantLabel, formatCop } from "@/lib/format";
import { Select } from "@/components/Select";

export interface OrderItemRow {
  key: string;
  productVariantId: string | null;
  comboId: string | null;
  label: string;
  unitPrice: number;
  quantity: number;
}

export function toOrderItemPayloads(items: OrderItemRow[]): CreateOrderItemPayload[] {
  return items.map((i) => ({ productVariantId: i.productVariantId, comboId: i.comboId, quantity: i.quantity }));
}

// Product -> Variant cascading picker (same shape as ComboItemsEditor) plus a
// Kit tab and a Quantity field — an order line needs both, a combo item
// doesn't. A variant or kit picked twice is two rows, same "no dedup"
// reasoning as ComboItemsEditor.
export function OrderItemsEditor({
  items,
  onChange,
}: {
  items: OrderItemRow[];
  onChange: (items: OrderItemRow[]) => void;
}) {
  const [kind, setKind] = useState<"variant" | "combo">("variant");

  const [products, setProducts] = useState<AdminProductListItemDto[]>([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState("");
  const [productVariants, setProductVariants] = useState<AdminVariantDto[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const [combos, setCombos] = useState<AdminComboListItemDto[]>([]);
  const [selectedComboId, setSelectedComboId] = useState("");

  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetProducts()
      .then(setProducts)
      .catch(() => setError("No se pudieron cargar los productos."));
    adminGetCombos()
      .then((data) => setCombos(data.filter((c) => c.isActive)))
      .catch(() => setError("No se pudieron cargar los kits."));
  }, []);

  async function handleProductChange(slug: string) {
    setSelectedProductSlug(slug);
    setSelectedVariantId("");
    setProductVariants([]);
    if (!slug) return;
    try {
      const detail = await getProductForAdmin(slug);
      setProductVariants(detail.variants.filter((v) => v.isActive && v.sellPrice !== null));
    } catch {
      setError("No se pudo cargar las variantes de ese producto.");
    }
  }

  function handleAdd() {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      setError("La cantidad debe ser al menos 1.");
      return;
    }
    setError(null);

    if (kind === "variant") {
      const variant = productVariants.find((v) => v.id === selectedVariantId);
      const product = products.find((p) => p.slug === selectedProductSlug);
      if (!variant || !product || variant.sellPrice === null) return;

      onChange([
        ...items,
        {
          key: `${variant.id}-${items.length}`,
          productVariantId: variant.id,
          comboId: null,
          label: `${product.name} — ${variantLabel(variant)}`,
          unitPrice: variant.sellPrice,
          quantity: qty,
        },
      ]);
      setSelectedVariantId("");
    } else {
      const combo = combos.find((c) => c.id === selectedComboId);
      if (!combo) return;

      onChange([
        ...items,
        {
          key: `${combo.id}-${items.length}`,
          productVariantId: null,
          comboId: combo.id,
          label: `Kit: ${combo.name}`,
          unitPrice: combo.finalPrice,
          quantity: qty,
        },
      ]);
      setSelectedComboId("");
    }
    setQuantity("1");
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const canAdd = kind === "variant" ? !!selectedVariantId : !!selectedComboId;
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {items.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {items.map((item, i) => (
            <li
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            >
              <span className="text-brava-ink">
                {item.label} × {item.quantity}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-brava-muted">{formatCop(item.unitPrice * item.quantity)}</span>
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
        <p className="mb-3 text-sm font-medium text-brava-ink">Subtotal: {formatCop(subtotal)}</p>
      )}

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setKind("variant")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            kind === "variant" ? "bg-brava-pink text-white" : "bg-brava-pink-light/40 text-brava-ink"
          }`}
        >
          Producto
        </button>
        <button
          type="button"
          onClick={() => setKind("combo")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            kind === "combo" ? "bg-brava-pink text-white" : "bg-brava-pink-light/40 text-brava-ink"
          }`}
        >
          Kit
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {kind === "variant" ? (
          <>
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
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-brava-ink">Kit</label>
            <Select
              ariaLabel="Kit"
              placeholder="Selecciona un kit"
              value={selectedComboId}
              onValueChange={setSelectedComboId}
              disabled={combos.length === 0}
              wrapperClassName="mt-1 inline-block"
              className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
              options={combos.map((c) => ({ value: c.id, label: `${c.name} — ${formatCop(c.finalPrice)}` }))}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-brava-ink">Cantidad</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-20 rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
          />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="rounded-lg bg-brava-pink px-4 py-2 text-sm font-medium text-white hover:bg-brava-pink-dark disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
