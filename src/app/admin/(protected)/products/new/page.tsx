"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateProduct, getBrandsForAdmin, getCategoriesForAdmin, ApiError } from "@/lib/api-admin";
import type { BrandListItemDto, CategoryListItemDto } from "@/lib/api";
import { BrandPicker } from "@/components/admin/BrandPicker";

export default function NewProductPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandListItemDto[]>([]);
  const [categories, setCategories] = useState<CategoryListItemDto[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBrandsForAdmin().then(setBrands).catch(() => setError("No se pudieron cargar las marcas."));
    getCategoriesForAdmin().then(setCategories).catch(() => setError("No se pudieron cargar las categorías."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const product = await adminCreateProduct({ name, description, brandId, categoryId });
      // A new product has zero variants (ADR-0008 — allowed, expected state),
      // so it won't show in the public catalog until at least one priced
      // variant exists. Send the admin straight to add one.
      router.push(`/admin/products/${product.slug}/edit`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el producto.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Nuevo producto</h1>
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
          <label className="block text-sm font-medium text-brava-ink">Descripción</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <BrandPicker
          brands={brands}
          value={brandId}
          onChange={setBrandId}
          onBrandCreated={(brand) => setBrands((prev) => [...prev, brand])}
        />
        <div>
          <label className="block text-sm font-medium text-brava-ink">Categoría</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brava-pink-light bg-white px-3 py-2 outline-none focus:border-brava-pink"
          >
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brava-pink px-5 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {saving ? "Creando…" : "Crear producto"}
        </button>
      </form>
    </div>
  );
}
