"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateCombo, ApiError } from "@/lib/api-admin";
import { ComboItemsEditor, type ComboItemRow } from "@/components/admin/ComboItemsEditor";
import { formatCop } from "@/lib/format";

export default function NewComboPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ComboItemRow[]>([]);
  const [useManualPrice, setUseManualPrice] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sum = items.reduce((total, item) => total + item.price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Agrega al menos un producto al kit.");
      return;
    }
    setSaving(true);
    try {
      const combo = await adminCreateCombo({
        name,
        description,
        variantIds: items.map((i) => i.variantId),
        manualPrice: useManualPrice && manualPrice ? Number(manualPrice) : null,
      });
      router.push(`/admin/combos/${combo.slug}/edit`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el kit.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Nuevo kit</h1>
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
            placeholder="Ej: el tono de cada producto puede variar según disponibilidad."
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full bg-brava-pink px-5 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {saving ? "Creando…" : "Crear kit"}
        </button>
      </form>
    </div>
  );
}
