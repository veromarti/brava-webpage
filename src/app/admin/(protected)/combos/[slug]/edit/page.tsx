"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  adminGetCombo,
  adminUpdateCombo,
  adminUploadComboImage,
  adminLinkComboImage,
  adminRemoveComboImage,
  ApiError,
} from "@/lib/api-admin";
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

  // Image is managed on its own — the endpoints act immediately, not on the
  // main "Guardar cambios" submit.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hasOwnImage, setHasOwnImage] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "link">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLinkUrl, setImageLinkUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

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
        setImageUrl(combo.imageUrl);
        setHasOwnImage(combo.hasOwnImage);
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

  async function handleSaveImage(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (imageMode === "upload" && !imageFile) {
      setError("Selecciona un archivo de imagen.");
      return;
    }
    if (imageMode === "link" && !imageLinkUrl.trim()) {
      setError("Pega el link de la imagen en Cloudflare.");
      return;
    }

    setImageBusy(true);
    try {
      const result =
        imageMode === "upload"
          ? await adminUploadComboImage(slug, imageFile!)
          : await adminLinkComboImage(slug, imageLinkUrl.trim());
      setImageUrl(result.imageUrl);
      setHasOwnImage(true);
      setImageFile(null);
      setImageLinkUrl("");
      setMessage("Imagen del kit guardada.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar la imagen.");
    } finally {
      setImageBusy(false);
    }
  }

  async function handleRemoveImage() {
    setError(null);
    setMessage(null);
    setImageBusy(true);
    try {
      await adminRemoveComboImage(slug);
      // Refetch so the preview falls back to the first product's image (if any).
      const combo = await adminGetCombo(slug);
      setImageUrl(combo.imageUrl);
      setHasOwnImage(combo.hasOwnImage);
      setMessage("Imagen del kit eliminada.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar la imagen.");
    } finally {
      setImageBusy(false);
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

      <section className="mt-10 border-t border-brava-pink-light pt-8">
        <h2 className="text-lg font-semibold text-brava-ink">Imagen del kit</h2>
        <p className="mt-1 text-sm text-brava-muted">
          Si el kit no tiene imagen propia, se usa la del primer producto que lo compone.
        </p>

        <div className="mt-4 flex items-start gap-4">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-brava-pink-light">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail, not worth next/image's remotePatterns overhead here
              <img src={imageUrl} alt="Imagen del kit" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-brava-ink">
                Sin imagen
              </span>
            )}
          </div>
          <div className="text-sm">
            <p className="text-brava-ink">
              {hasOwnImage
                ? "Imagen propia del kit."
                : imageUrl
                  ? "Usando la imagen del primer producto del kit."
                  : "Este kit no tiene imagen."}
            </p>
            {hasOwnImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={imageBusy}
                className="mt-2 text-brava-muted hover:text-red-600 disabled:opacity-50"
              >
                Quitar imagen del kit
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveImage} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-4 text-sm text-brava-ink">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="comboImageMode"
                checked={imageMode === "upload"}
                onChange={() => setImageMode("upload")}
              />
              Subir archivo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="comboImageMode"
                checked={imageMode === "link"}
                onChange={() => setImageMode("link")}
              />
              Pegar link de Cloudflare
            </label>
          </div>

          {imageMode === "upload" ? (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-sm text-brava-ink file:mr-3 file:rounded-full file:border-0 file:bg-brava-pink file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brava-pink-dark"
            />
          ) : (
            <input
              type="url"
              value={imageLinkUrl}
              onChange={(e) => setImageLinkUrl(e.target.value)}
              placeholder="https://…r2.dev/…"
              className="w-full rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
            />
          )}

          <button
            type="submit"
            disabled={imageBusy}
            className="self-start rounded-full bg-brava-pink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
          >
            {imageBusy ? "Guardando…" : hasOwnImage ? "Reemplazar imagen" : "Guardar imagen"}
          </button>
        </form>
      </section>
    </div>
  );
}
