"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPencil, FaEyeSlash } from "react-icons/fa6";
import { adminGetCombos, adminDeactivateCombo, type AdminComboListItemDto, ApiError } from "@/lib/api-admin";
import { formatCop } from "@/lib/format";
import { IconButton } from "@/components/admin/IconButton";

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<AdminComboListItemDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingSlug, setDeactivatingSlug] = useState<string | null>(null);

  async function reload() {
    try {
      setCombos(await adminGetCombos());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar los kits.");
    }
  }

  // Same inlined-effect pattern as admin/products/page.tsx — see its comment.
  useEffect(() => {
    let cancelled = false;
    adminGetCombos()
      .then((data) => {
        if (!cancelled) setCombos(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar los kits.");
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
      await adminDeactivateCombo(slug);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al desactivar.");
    } finally {
      setDeactivatingSlug(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Kits</h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!combos ? (
        <p className="mt-6 text-brava-muted">Cargando…</p>
      ) : combos.length === 0 ? (
        <p className="mt-6 text-brava-muted">
          Sin kits todavía —{" "}
          <Link href="/admin/combos/new" className="text-brava-pink-dark hover:underline">
            crea el primero
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brava-pink-light text-brava-muted">
                <th className="py-2 font-medium">Nombre</th>
                <th className="py-2 font-medium">Items</th>
                <th className="py-2 font-medium">Suma</th>
                <th className="py-2 font-medium">Precio final</th>
                <th className="py-2 font-medium">Estado</th>
                <th className="py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((c) => (
                <tr key={c.id} className="border-b border-brava-pink-light/50">
                  <td className="py-2 text-brava-ink">{c.name}</td>
                  <td className="py-2 text-brava-muted">{c.itemCount}</td>
                  <td className="py-2 text-brava-muted">{formatCop(c.originalPrice)}</td>
                  <td className="py-2 font-medium text-brava-pink-dark">{formatCop(c.finalPrice)}</td>
                  <td className="py-2">
                    {c.isActive ? (
                      <span className="text-emerald-700">Activo</span>
                    ) : (
                      <span className="text-brava-muted">Inactivo</span>
                    )}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <IconButton
                        href={`/admin/combos/${c.slug}/edit`}
                        icon={<FaPencil aria-hidden />}
                        label={`Editar ${c.name}`}
                      />
                      {c.isActive && (
                        <IconButton
                          icon={<FaEyeSlash aria-hidden />}
                          label={`Desactivar ${c.name}`}
                          tone="danger"
                          busy={deactivatingSlug === c.slug}
                          onClick={() => handleDeactivate(c.slug)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
