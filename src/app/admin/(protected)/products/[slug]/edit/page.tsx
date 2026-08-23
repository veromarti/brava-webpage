"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  adminUpdateProduct,
  adminCreateVariant,
  adminDeactivateVariant,
  getBrandsForAdmin,
  getCategoriesForAdmin,
  getProductForAdmin,
  ApiError,
} from "@/lib/api-admin";
import type { BrandListItemDto, CategoryListItemDto, ProductVariantDto } from "@/lib/api";

interface ProductForEdit {
  id: string;
  slug: string;
  name: string;
  description: string;
  brandName: string;
  categoryName: string;
  isActive: boolean;
  variants: ProductVariantDto[];
}

const emptyVariantForm = {
  toneCode: "",
  toneName: "",
  sellPrice: "",
  physicalStock: "0",
  availableOnDemand: false,
  isActive: true,
};

export default function EditProductPage() {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<ProductForEdit | null>(null);
  const [brands, setBrands] = useState<BrandListItemDto[]>([]);
  const [categories, setCategories] = useState<CategoryListItemDto[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [variantForm, setVariantForm] = useState(emptyVariantForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const [p, b, c] = await Promise.all([
      getProductForAdmin(slug),
      getBrandsForAdmin(),
      getCategoriesForAdmin(),
    ]);
    setProduct(p);
    setBrands(b);
    setCategories(c);
    setName(p.name);
    setDescription(p.description);
    setIsActive(p.isActive);
    setBrandId(b.find((x: BrandListItemDto) => x.name === p.brandName)?.id ?? "");
    setCategoryId(c.find((x: CategoryListItemDto) => x.name === p.categoryName)?.id ?? "");
  }

  useEffect(() => {
    reload().catch((err) => setError(err instanceof ApiError ? err.message : "Error al cargar."));
  }, [slug]);

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await adminUpdateProduct(slug, { name, description, brandId, categoryId, isActive });
      setMessage("Producto guardado.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await adminCreateVariant(slug, {
        sku: null,
        toneCode: variantForm.toneCode || null,
        toneName: variantForm.toneName || null,
        units: null,
        volumeMl: null,
        massG: null,
        costPrice: null,
        sellPrice: variantForm.sellPrice ? Number(variantForm.sellPrice) : null,
        physicalStock: Number(variantForm.physicalStock),
        availableOnDemand: variantForm.availableOnDemand,
        isActive: variantForm.isActive,
      });
      setVariantForm(emptyVariantForm);
      setMessage("Variante agregada.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al agregar la variante.");
    }
  }

  async function handleDeactivateVariant(variantId: string) {
    if (!confirm("¿Desactivar esta variante?")) return;
    try {
      await adminDeactivateVariant(slug, variantId);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al desactivar la variante.");
    }
  }

  if (!product) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-brava-muted">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Editar producto</h1>
      <p className="mt-1 text-sm text-brava-muted">/products/{product.slug}</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}

      <form onSubmit={handleSaveProduct} className="mt-6 flex flex-col gap-4 rounded-2xl border border-brava-pink-light p-6">
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brava-ink">Marca</label>
            <select
              required
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brava-pink-light bg-white px-3 py-2 outline-none focus:border-brava-pink"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Categoría</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brava-pink-light bg-white px-3 py-2 outline-none focus:border-brava-pink"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
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

      <h2 className="mt-10 text-xl font-bold text-brava-ink">Variantes</h2>
      {product.variants.length === 0 ? (
        <p className="mt-2 text-sm text-brava-muted">
          Sin variantes todavía — el producto no aparecerá en el catálogo público hasta que tenga
          al menos una variante activa con precio (ADR-0003).
        </p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brava-pink-light text-brava-muted">
              <th className="py-2 font-medium">Tono/talla</th>
              <th className="py-2 font-medium">Precio</th>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium">Estado</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <tr key={v.id} className="border-b border-brava-pink-light/50">
                <td className="py-2 text-brava-ink">{v.toneName ?? v.toneCode ?? "Único"}</td>
                <td className="py-2 text-brava-muted">
                  {v.sellPrice !== null ? `$${v.sellPrice.toLocaleString("es-CO")}` : "—"}
                </td>
                <td className="py-2 text-brava-muted">{v.physicalStock}</td>
                <td className="py-2">
                  {v.isActive ? (
                    <span className="text-emerald-700">Activa</span>
                  ) : (
                    <span className="text-brava-muted">Inactiva</span>
                  )}
                </td>
                <td className="py-2">
                  {v.isActive && (
                    <button
                      onClick={() => handleDeactivateVariant(v.id)}
                      className="text-brava-muted hover:text-red-600"
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form
        onSubmit={handleAddVariant}
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-brava-pink-light p-6"
      >
        <h3 className="font-medium text-brava-ink">Agregar variante</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brava-ink">Tono/código</label>
            <input
              value={variantForm.toneCode}
              onChange={(e) => setVariantForm({ ...variantForm, toneCode: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Nombre del tono</label>
            <input
              value={variantForm.toneName}
              onChange={(e) => setVariantForm({ ...variantForm, toneName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Precio (COP)</label>
            <input
              type="number"
              required
              min={0}
              value={variantForm.sellPrice}
              onChange={(e) => setVariantForm({ ...variantForm, sellPrice: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Stock físico</label>
            <input
              type="number"
              required
              min={0}
              value={variantForm.physicalStock}
              onChange={(e) => setVariantForm({ ...variantForm, physicalStock: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-brava-ink">
          <input
            type="checkbox"
            checked={variantForm.availableOnDemand}
            onChange={(e) => setVariantForm({ ...variantForm, availableOnDemand: e.target.checked })}
          />
          Disponible bajo pedido cuando no haya stock
        </label>
        <label className="flex items-center gap-2 text-sm text-brava-ink">
          <input
            type="checkbox"
            checked={variantForm.isActive}
            onChange={(e) => setVariantForm({ ...variantForm, isActive: e.target.checked })}
          />
          Activa (requiere precio — ADR-0003)
        </label>
        <button
          type="submit"
          className="self-start rounded-full bg-brava-pink px-5 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
        >
          Agregar variante
        </button>
      </form>
    </div>
  );
}
