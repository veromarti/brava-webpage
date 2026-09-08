"use client";

import { useEffect, useState } from "react";
import { FaFloppyDisk } from "react-icons/fa6";
import {
  adminGetPackagingOptions,
  adminCreatePackagingOption,
  adminUpdatePackagingOption,
  ApiError,
  type PackagingOptionDto,
} from "@/lib/api-admin";
import { IconButton } from "@/components/admin/IconButton";
import { formatCop } from "@/lib/format";

interface OptionDraft {
  name: string;
  price: string;
  isActive: boolean;
}

function toDraft(p: PackagingOptionDto): OptionDraft {
  return { name: p.name, price: String(p.price), isActive: p.isActive };
}

export default function PackagingPage() {
  const [options, setOptions] = useState<PackagingOptionDto[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, OptionDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [creating, setCreating] = useState(false);

  function applyOptions(data: PackagingOptionDto[]) {
    setOptions(data);
    setDrafts(Object.fromEntries(data.map((p) => [p.id, toDraft(p)])));
  }

  async function reload() {
    applyOptions(await adminGetPackagingOptions());
  }

  // Same inlined-effect pattern as the other admin list pages.
  useEffect(() => {
    let cancelled = false;
    adminGetPackagingOptions()
      .then((data) => {
        if (!cancelled) applyOptions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar los empaques.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function isDirty(p: PackagingOptionDto): boolean {
    const d = drafts[p.id];
    if (!d) return false;
    return d.name.trim() !== p.name || Number(d.price) !== p.price || d.isActive !== p.isActive;
  }

  function patchDraft(id: string, patch: Partial<OptionDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSaveOption(p: PackagingOptionDto) {
    const d = drafts[p.id];
    const price = Number(d.price);
    if (!d.name.trim()) {
      setError("El nombre del empaque es obligatorio.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    setError(null);
    setMessage(null);
    setSavingId(p.id);
    try {
      await adminUpdatePackagingOption(p.id, { name: d.name.trim(), price, isActive: d.isActive });
      setMessage(`Empaque "${d.name.trim()}" guardado.`);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar el empaque.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreateOption(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(newPrice || 0);
    if (!newName.trim()) {
      setError("Escribe el nombre del empaque.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    setError(null);
    setMessage(null);
    setCreating(true);
    try {
      await adminCreatePackagingOption(newName.trim(), price);
      setNewName("");
      setNewPrice("");
      setMessage("Empaque agregado.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el empaque.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Empaque</h1>
      <p className="mt-1 text-sm text-brava-muted">
        Bolsas y cajas usadas para armar el pedido. Es un costo interno — se usa para el margen en
        Métricas, nunca se cobra al cliente.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}

      {!options ? (
        <p className="mt-6 text-brava-muted">Cargando…</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-brava-pink-light text-brava-muted">
                <th className="py-2 font-medium">Empaque</th>
                <th className="py-2 font-medium">Costo (COP)</th>
                <th className="py-2 font-medium">Activo</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {options.map((p) => {
                const d = drafts[p.id] ?? toDraft(p);
                return (
                  <tr key={p.id} className="border-b border-brava-pink-light/50">
                    <td className="py-2 pr-3">
                      <input
                        value={d.name}
                        onChange={(e) => patchDraft(p.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-brava-pink-light px-2 py-1 text-brava-ink outline-none focus:border-brava-pink"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={d.price}
                          onChange={(e) => patchDraft(p.id, { price: e.target.value })}
                          className="w-28 rounded-lg border border-brava-pink-light px-2 py-1 text-brava-muted outline-none focus:border-brava-pink"
                        />
                        <span className="text-xs text-brava-muted">{formatCop(Number(d.price) || 0)}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={d.isActive}
                        onChange={(e) => patchDraft(p.id, { isActive: e.target.checked })}
                      />
                    </td>
                    <td className="py-2">
                      {isDirty(p) && (
                        <IconButton
                          size="sm"
                          tone="primary"
                          icon={<FaFloppyDisk aria-hidden />}
                          label={`Guardar ${p.name}`}
                          busy={savingId === p.id}
                          onClick={() => handleSaveOption(p)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={handleCreateOption}
        className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-brava-pink-light p-6"
      >
        <h2 className="w-full font-medium text-brava-ink">Agregar empaque</h2>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Nombre</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Bolsa, Caja chica, Caja grande…"
            className="mt-1 w-56 rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Costo (COP)</label>
          <input
            type="number"
            min={0}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="mt-1 w-36 rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-full bg-brava-pink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {creating ? "Agregando…" : "Agregar empaque"}
        </button>
      </form>
    </div>
  );
}
