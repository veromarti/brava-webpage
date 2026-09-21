"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaPencil, FaEyeSlash } from "react-icons/fa6";
import {
  adminGetProducts,
  adminDeactivateProduct,
  adminExportCatalogue,
  adminImportCatalogue,
  AdminProductListItemDto,
  ApiError,
  type ImportCatalogueResult,
} from "@/lib/api-admin";
import { Select } from "@/components/Select";
import { IconButton } from "@/components/admin/IconButton";
import { normalizeForSearch } from "@/lib/format";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingSlug, setDeactivatingSlug] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportCatalogueResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local filtering, not a URL/backend round trip — the admin list is
  // already fully loaded (including inactive products, unlike the public
  // catalog), so there's no reason to re-fetch just to narrow the view.
  const brandNames = useMemo(
    () => [...new Set((products ?? []).map((p) => p.brandName))].sort(),
    [products],
  );
  const categoryNames = useMemo(
    () => [...new Set((products ?? []).map((p) => p.categoryName))].sort(),
    [products],
  );
  const q = normalizeForSearch(query.trim());
  const filteredProducts = (products ?? []).filter(
    (p) =>
      (!brandFilter || p.brandName === brandFilter) &&
      (!categoryFilter || p.categoryName === categoryFilter) &&
      (!q || normalizeForSearch(p.name).includes(q) || normalizeForSearch(p.brandName).includes(q)),
  );

  async function reload() {
    try {
      setProducts(await adminGetProducts());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar productos.");
    }
  }

  // Inlined rather than calling reload() — the lint rule can't trace into a
  // named function to confirm its setState calls all come after an await,
  // so it flags any call to one from inside an effect as unsafe. reload()
  // itself is still used directly by the mutation handlers below, which
  // aren't inside an effect and aren't flagged.
  useEffect(() => {
    let cancelled = false;
    adminGetProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar productos.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDeactivate(slug: string) {
    if (!confirm(`¿Desactivar "${slug}"? Dejará de verse en el catálogo público.`)) {
      return;
    }
    setDeactivatingSlug(slug);
    try {
      await adminDeactivateProduct(slug);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al desactivar.");
    } finally {
      setDeactivatingSlug(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await adminExportCatalogue();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `catalogo-brava-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al exportar el catálogo.");
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Cleared unconditionally so picking the same filename twice in a row
    // (e.g. after fixing a row and re-saving) still fires this handler.
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const result = await adminImportCatalogue(file);
      setImportResult(result);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al importar el archivo.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brava-ink">Productos</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-full border border-brava-pink-light px-4 py-2 text-sm text-brava-ink hover:border-brava-pink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? "Exportando…" : "Exportar catálogo (CSV)"}
          </button>
          <label
            className={`rounded-full border border-brava-pink-light px-4 py-2 text-sm text-brava-ink hover:border-brava-pink ${
              importing ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            }`}
          >
            {importing ? "Importando…" : "Importar catálogo (CSV)"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportFileChange}
              disabled={importing}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <p className="mt-1 text-sm text-brava-muted">
        El CSV exportado tiene una fila por variante. Solo Stock, PrecioCosto y PrecioVenta se actualizan al
        volver a subirlo — el resto de columnas son de referencia.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {importResult && (
        <div className="mt-4 rounded-xl border border-brava-pink-light bg-white p-4 text-sm">
          <p className="font-medium text-brava-ink">
            {importResult.updatedCount} variante{importResult.updatedCount === 1 ? "" : "s"} actualizada
            {importResult.updatedCount === 1 ? "" : "s"}.
          </p>
          {importResult.errors.length > 0 && (
            <>
              <p className="mt-2 font-medium text-red-600">
                {importResult.errors.length} fila{importResult.errors.length === 1 ? "" : "s"} con error:
              </p>
              <ul className="mt-1 max-h-48 list-disc space-y-1 overflow-auto pl-5 text-brava-muted">
                {importResult.errors.map((e, i) => (
                  <li key={i}>
                    Fila {e.row}
                    {e.variantId ? ` (${e.variantId})` : ""}: {e.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {!products ? (
        <p className="mt-6 text-brava-muted">Cargando…</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o marca…"
              className="w-full rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink sm:w-64"
            />
            <Select
              ariaLabel="Filtrar por marca"
              value={brandFilter}
              onValueChange={setBrandFilter}
              wrapperClassName="inline-block"
              className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
              options={[
                { value: "", label: "Todas las marcas" },
                ...brandNames.map((name) => ({ value: name, label: name })),
              ]}
            />
            <Select
              ariaLabel="Filtrar por categoría"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              wrapperClassName="inline-block"
              className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
              options={[
                { value: "", label: "Todas las categorías" },
                ...categoryNames.map((name) => ({ value: name, label: name })),
              ]}
            />
            {(brandFilter || categoryFilter || query) && (
              <button
                type="button"
                onClick={() => {
                  setBrandFilter("");
                  setCategoryFilter("");
                  setQuery("");
                }}
                className="text-sm text-brava-muted hover:text-brava-pink-dark"
              >
                Limpiar filtros
              </button>
            )}
            <span className="text-sm text-brava-muted">
              {filteredProducts.length} de {products.length}
            </span>
          </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-brava-pink-light text-brava-muted">
                <th className="py-2 font-medium">Nombre</th>
                <th className="py-2 font-medium">Marca</th>
                <th className="py-2 font-medium">Categoría</th>
                <th className="py-2 font-medium">Imágenes</th>
                <th className="py-2 font-medium">Estado</th>
                <th className="py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-brava-pink-light/50">
                  <td className="py-2 text-brava-ink">{p.name}</td>
                  <td className="py-2 text-brava-muted">{p.brandName}</td>
                  <td className="py-2 text-brava-muted">{p.categoryName}</td>
                  <td className="py-2">
                    {p.imageCount > 0 ? (
                      <span className="text-brava-muted">{p.imageCount}</span>
                    ) : (
                      <span className="font-medium text-red-600">Sin imágenes</span>
                    )}
                  </td>
                  <td className="py-2">
                    {p.isActive ? (
                      <span className="text-emerald-700">Activo</span>
                    ) : (
                      <span className="text-brava-muted">Inactivo</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <IconButton
                        href={`/admin/products/${p.slug}/edit`}
                        icon={<FaPencil aria-hidden />}
                        label={`Editar ${p.name}`}
                      />
                      {p.isActive && (
                        <IconButton
                          icon={<FaEyeSlash aria-hidden />}
                          label={`Desactivar ${p.name}`}
                          tone="danger"
                          busy={deactivatingSlug === p.slug}
                          onClick={() => handleDeactivate(p.slug)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
