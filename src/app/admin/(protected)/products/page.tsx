"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminGetProducts, adminDeactivateProduct, AdminProductListItemDto, ApiError } from "@/lib/api-admin";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await adminDeactivateProduct(slug);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al desactivar.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Productos</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!products ? (
        <p className="mt-6 text-brava-muted">Cargando…</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
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
            {products.map((p) => (
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
                  <Link
                    href={`/admin/products/${p.slug}/edit`}
                    className="text-brava-pink-dark hover:underline"
                  >
                    Editar
                  </Link>
                  {p.isActive && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(p.slug)}
                      className="ml-4 text-brava-muted hover:text-red-600"
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
    </div>
  );
}
