"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  adminUpdateProduct,
  adminCreateVariant,
  adminActivateVariant,
  adminDeactivateVariant,
  adminUpdateStock,
  adminUploadImage,
  adminLinkImage,
  adminDeleteImage,
  getBrandsForAdmin,
  getCategoriesForAdmin,
  getProductForAdmin,
  ApiError,
} from "@/lib/api-admin";
import type { BrandListItemDto, CategoryListItemDto, ProductVariantDto, ImageDto } from "@/lib/api";
import { BrandPicker } from "@/components/admin/BrandPicker";
import { Select } from "@/components/Select";
import { variantLabel } from "@/lib/format";

interface ProductForEdit {
  id: string;
  slug: string;
  name: string;
  description: string;
  brandName: string;
  categoryName: string;
  isActive: boolean;
  variants: ProductVariantDto[];
  images: ImageDto[];
}

// Not every variant is a tone — Milagros Perfume Capilar is $8.000/30ml vs
// $27.000/120ml, no tone involved at all. Units/volumeMl/massG cover size
// variants; a variant can mix a tone with a size too (both sets of fields
// are independent, not either/or).
const emptyVariantForm = {
  toneCode: "",
  toneName: "",
  units: "",
  volumeMl: "",
  massG: "",
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
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<"upload" | "link">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [imageVariantId, setImageVariantId] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function applyLoadedProduct(p: ProductForEdit, b: BrandListItemDto[], c: CategoryListItemDto[]) {
    setProduct(p);
    setBrands(b);
    setCategories(c);
    setName(p.name);
    setDescription(p.description);
    setIsActive(p.isActive);
    setBrandId(b.find((x) => x.name === p.brandName)?.id ?? "");
    setCategoryId(c.find((x) => x.name === p.categoryName)?.id ?? "");
  }

  // Used by mutation handlers below (not inside an effect, so the
  // set-state-in-effect lint rule doesn't apply to these call sites).
  async function reload() {
    const [p, b, c] = await Promise.all([
      getProductForAdmin(slug),
      getBrandsForAdmin(),
      getCategoriesForAdmin(),
    ]);
    applyLoadedProduct(p, b, c);
  }

  // Inlined rather than calling reload() — see the comment on the same
  // pattern in admin/products/page.tsx.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getProductForAdmin(slug), getBrandsForAdmin(), getCategoriesForAdmin()])
      .then(([p, b, c]) => {
        if (!cancelled) applyLoadedProduct(p, b, c);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar.");
      });
    return () => {
      cancelled = true;
    };
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
        units: variantForm.units ? Number(variantForm.units) : null,
        volumeMl: variantForm.volumeMl ? Number(variantForm.volumeMl) : null,
        massG: variantForm.massG ? Number(variantForm.massG) : null,
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

  // Reactivating a product alone isn't enough to bring it back into the
  // public catalog if its variants are still inactive (ADR-0003) — this is
  // the piece that was missing before, so a product could sit "Activo" in
  // the admin table and still never show up on the site.
  async function handleActivateVariant(variantId: string) {
    try {
      await adminActivateVariant(slug, variantId);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al activar la variante.");
    }
  }

  async function handleSaveStock(variantId: string) {
    const raw = stockEdits[variantId];
    const value = Number(raw);
    if (raw === undefined || !Number.isInteger(value) || value < 0) {
      setError("El stock debe ser un número entero mayor o igual a 0.");
      return;
    }
    setSavingStockId(variantId);
    setError(null);
    setMessage(null);
    try {
      await adminUpdateStock(variantId, value);
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      setMessage("Stock actualizado.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el stock.");
    } finally {
      setSavingStockId(null);
    }
  }

  async function handleAddImage(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (imageSource === "upload" && !imageFile) {
      setError("Selecciona un archivo.");
      return;
    }
    if (imageSource === "link" && !imageUrl) {
      setError("Pega el link de Cloudflare.");
      return;
    }

    setUploadingImage(true);
    try {
      if (imageSource === "upload") {
        await adminUploadImage(slug, imageFile!, imageAltText, product?.images.length ?? 0, imageVariantId || null);
      } else {
        await adminLinkImage(slug, imageUrl, imageAltText, product?.images.length ?? 0, imageVariantId || null);
      }
      setImageFile(null);
      setImageUrl("");
      setImageAltText("");
      setImageVariantId("");
      setMessage(imageSource === "upload" ? "Imagen subida." : "Imagen vinculada.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al agregar la imagen.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm("¿Eliminar esta imagen?")) return;
    try {
      await adminDeleteImage(slug, imageId);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar la imagen.");
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
            rows={5}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
          <p className="mt-1 text-xs text-brava-muted">
            Los saltos de línea se conservan tal cual en la página del producto.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <BrandPicker
            brands={brands}
            value={brandId}
            onChange={setBrandId}
            onBrandCreated={(brand) => setBrands((prev) => [...prev, brand])}
          />
          <div>
            <label className="block text-sm font-medium text-brava-ink">Categoría</label>
            <Select
              required
              ariaLabel="Categoría"
              placeholder="Selecciona una categoría"
              value={categoryId}
              onValueChange={setCategoryId}
              wrapperClassName="mt-1 block w-full"
              className="rounded-lg border border-brava-pink-light px-3 py-2"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
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

      <h2 className="mt-10 text-xl font-bold text-brava-ink">Imágenes</h2>
      {product.images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4">
          {product.images.map((img) => (
            <div key={img.id} className="relative overflow-hidden rounded-xl border border-brava-pink-light">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, not worth next/image's remotePatterns overhead here */}
              <img src={img.url} alt={img.altText} className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => handleDeleteImage(img.id)}
                className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs text-red-600 hover:bg-white"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleAddImage}
        className="mt-4 flex flex-col gap-4 rounded-2xl border border-brava-pink-light p-6"
      >
        <h3 className="font-medium text-brava-ink">Agregar imagen</h3>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5 text-brava-ink">
            <input
              type="radio"
              name="imageSource"
              checked={imageSource === "upload"}
              onChange={() => setImageSource("upload")}
            />
            Subir archivo
          </label>
          <label className="flex items-center gap-1.5 text-brava-ink">
            <input
              type="radio"
              name="imageSource"
              checked={imageSource === "link"}
              onChange={() => setImageSource("link")}
            />
            Link de Cloudflare
          </label>
        </div>
        {imageSource === "upload" ? (
          <div>
            <label className="block text-sm font-medium text-brava-ink">Archivo (JPEG, PNG o WebP, máx. 5 MB)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-brava-ink">URL de la imagen en Cloudflare</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://pub-....r2.dev/products/..."
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
            <p className="mt-1 text-xs text-brava-muted">
              Debe ser un link del mismo bucket de R2 del proyecto — no cualquier URL externa.
            </p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-brava-ink">Texto alternativo</label>
          <input
            required
            value={imageAltText}
            onChange={(e) => setImageAltText(e.target.value)}
            placeholder="Describe la imagen"
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        {product.variants.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-brava-ink">Variante (opcional)</label>
            <Select
              ariaLabel="Variante de la imagen"
              value={imageVariantId}
              onValueChange={setImageVariantId}
              wrapperClassName="mt-1 block w-full"
              className="rounded-lg border border-brava-pink-light px-3 py-2"
              options={[
                { value: "", label: "General del producto" },
                ...product.variants.map((v) => ({ value: v.id, label: variantLabel(v) })),
              ]}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={uploadingImage}
          className="self-start rounded-full bg-brava-pink px-5 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {uploadingImage ? "Guardando…" : imageSource === "upload" ? "Subir imagen" : "Vincular imagen"}
        </button>
      </form>

      <h2 className="mt-10 text-xl font-bold text-brava-ink">Variantes</h2>
      {product.variants.length === 0 ? (
        <p className="mt-2 text-sm text-brava-muted">
          Sin variantes todavía — el producto no aparecerá en el catálogo público hasta que tenga
          al menos una variante activa con precio.
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
                <td className="py-2 text-brava-ink">{variantLabel(v)}</td>
                <td className="py-2 text-brava-muted">
                  {v.sellPrice !== null ? `$${v.sellPrice.toLocaleString("es-CO")}` : "—"}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={stockEdits[v.id] ?? String(v.physicalStock)}
                      onChange={(e) => setStockEdits((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      className="w-20 rounded-lg border border-brava-pink-light px-2 py-1 text-brava-muted outline-none focus:border-brava-pink"
                    />
                    {stockEdits[v.id] !== undefined && stockEdits[v.id] !== String(v.physicalStock) && (
                      <button
                        type="button"
                        onClick={() => handleSaveStock(v.id)}
                        disabled={savingStockId === v.id}
                        className="text-xs text-brava-pink-dark hover:underline disabled:opacity-50"
                      >
                        {savingStockId === v.id ? "…" : "Guardar"}
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-2">
                  {v.isActive ? (
                    <span className="text-emerald-700">Activa</span>
                  ) : (
                    <span className="text-brava-muted">Inactiva</span>
                  )}
                </td>
                <td className="py-2">
                  {v.isActive ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivateVariant(v.id)}
                      className="text-brava-muted hover:text-red-600"
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivateVariant(v.id)}
                      className="text-brava-pink-dark hover:underline"
                    >
                      Activar
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
        <p className="-mt-2 text-xs text-brava-muted">
          Todos estos campos son opcionales e independientes — un producto puede variar por tono,
          por tamaño, por ambos, o por ninguno.
        </p>
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
            <label className="block text-sm font-medium text-brava-ink">Unidades</label>
            <input
              type="number"
              min={0}
              value={variantForm.units}
              onChange={(e) => setVariantForm({ ...variantForm, units: e.target.value })}
              placeholder='p. ej. "180 unidades"'
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Volumen (ml)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={variantForm.volumeMl}
              onChange={(e) => setVariantForm({ ...variantForm, volumeMl: e.target.value })}
              placeholder="p. ej. 30 o 120"
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Peso/masa (g)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={variantForm.massG}
              onChange={(e) => setVariantForm({ ...variantForm, massG: e.target.value })}
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
          Activa (requiere precio)
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
