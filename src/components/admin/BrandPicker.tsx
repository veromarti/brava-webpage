"use client";

import { useState } from "react";
import { adminCreateBrand, ApiError } from "@/lib/api-admin";
import type { BrandListItemDto } from "@/lib/api";
import { Select } from "@/components/Select";

// Shared by the create and edit product forms — a brand select plus an
// inline "create a new one" toggle, so adding a brand that isn't in the
// list yet doesn't mean leaving the form to do it somewhere else first.
export function BrandPicker({
  brands,
  value,
  onChange,
  onBrandCreated,
}: {
  brands: BrandListItemDto[];
  value: string;
  onChange: (brandId: string) => void;
  onBrandCreated: (brand: BrandListItemDto) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const brand = await adminCreateBrand(newName);
      onBrandCreated(brand);
      onChange(brand.id);
      setNewName("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear la marca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-brava-ink">Marca</label>
      {!creating ? (
        <div className="mt-1 flex items-center gap-3">
          <Select
            required
            ariaLabel="Marca"
            placeholder="Selecciona una marca"
            value={value}
            onValueChange={onChange}
            wrapperClassName="flex-1"
            className="rounded-lg border border-brava-pink-light px-3 py-2"
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 whitespace-nowrap text-sm text-brava-pink-dark hover:underline"
          >
            + Nueva marca
          </button>
        </div>
      ) : (
        // A <form> here would nest inside the page's own <form> — invalid
        // HTML, and it silently broke submission entirely (confirmed via a
        // "form cannot be a descendant of form" hydration error; the click
        // just did nothing). Plain buttons + a keydown handler instead.
        <div className="mt-1 flex items-center gap-2">
          <input
            required
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Nombre de la marca"
            className="w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="shrink-0 rounded-lg bg-brava-pink px-3 py-2 text-sm font-medium text-white hover:bg-brava-pink-dark disabled:opacity-50"
          >
            {saving ? "…" : "Crear"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setError(null);
              setNewName("");
            }}
            className="shrink-0 text-sm text-brava-muted hover:underline"
          >
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
