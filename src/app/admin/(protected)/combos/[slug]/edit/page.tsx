"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminGetCombo, adminUpdateCombo, ApiError } from "@/lib/api-admin";
import { ComboItemsEditor, type ComboItemRow } from "@/components/admin/ComboItemsEditor";
import { formatCop, variantLabel } from "@/lib/format";

export default function EditComboPage() {
  const { slug } = useParams<{ slug: string }>();

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ComboItemRow[]>([]);
  const [useManualPrice, setUseManualPrice] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetCombo(slug)
      .then((combo) => {
        if (cancelled) return;
        setName(combo.name);
        setDescription(combo.description);
        setItems(
          combo.items.map((item) => ({
            variantId: item.variantId,
            label: `${item.productName} — ${variantLabel(item)}`,
            price: item.sellPrice,
          })),
        );
        setUseManualPrice(combo.manualPrice !== null);
        setManualPrice(combo.manualPrice !== null ? String(combo.manualPrice) : "");
        setIsActive(combo.isActive);
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar el kit.");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sum = items.reduce((total, item) => total + item.price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (items.length === 0) {
      setError("El kit necesita al menos un producto.");
      return;
    }
    setSaving(true);
    try {
      await adminUpdateCombo(slug, {
        name,
        description,
        variantIds: items.map((i) => i.variantId),
        manualPrice: useManualPrice && manualPrice ? Number(manualPrice) : null,
        isActive,
      });
      setMessage("Kit guardado.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar el kit.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return <div className="mx-auto max-w-2xl px-6 py-10 text-brava-muted">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Editar kit</h1>
      <p className="mt-1 text-sm text-brava-muted">/combos/{slug}</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-brava-ink">Nombre</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Descripción / condiciones</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brava-ink">Productos del kit</label>
          <div className="mt-1 rounded-2xl border border-brava-pink-light p-4">
            <ComboItemsEditor items={items} onChange={setItems} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-brava-ink">
          <input
            type="checkbox"
            checked={useManualPrice}
            onChange={(e) => setUseManualPrice(e.target.checked)}
          />
          Fijar un precio distinto a la suma ({formatCop(sum)})
        </label>
        {useManualPrice && (
          <div>
            <label className="block text-sm font-medium text-brava-ink">Precio final (COP)</label>
            <input
              type="number"
              min={0}
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-brava-ink">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Activo (visible en el catálogo público)
        </label>

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full bg-brava-pink px-5 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
