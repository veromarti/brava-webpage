"use client";

import { useEffect, useState } from "react";
import { FaFloppyDisk } from "react-icons/fa6";
import {
  adminGetDeliveryZones,
  adminCreateDeliveryZone,
  adminUpdateDeliveryZone,
  ApiError,
  type DeliveryZoneDto,
} from "@/lib/api-admin";
import { IconButton } from "@/components/admin/IconButton";
import { formatCop } from "@/lib/format";

interface ZoneDraft {
  name: string;
  price: string;
  isActive: boolean;
}

function toDraft(z: DeliveryZoneDto): ZoneDraft {
  return { name: z.name, price: String(z.price), isActive: z.isActive };
}

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZoneDto[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ZoneDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [creating, setCreating] = useState(false);

  function applyZones(data: DeliveryZoneDto[]) {
    setZones(data);
    setDrafts(Object.fromEntries(data.map((z) => [z.id, toDraft(z)])));
  }

  async function reload() {
    applyZones(await adminGetDeliveryZones());
  }

  // Same inlined-effect pattern as the other admin list pages.
  useEffect(() => {
    let cancelled = false;
    adminGetDeliveryZones()
      .then((data) => {
        if (!cancelled) applyZones(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar las zonas.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function isDirty(z: DeliveryZoneDto): boolean {
    const d = drafts[z.id];
    if (!d) return false;
    return d.name.trim() !== z.name || Number(d.price) !== z.price || d.isActive !== z.isActive;
  }

  function patchDraft(id: string, patch: Partial<ZoneDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleSaveZone(z: DeliveryZoneDto) {
    const d = drafts[z.id];
    const price = Number(d.price);
    if (!d.name.trim()) {
      setError("El nombre de la zona es obligatorio.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("El precio debe ser un número mayor o igual a 0.");
      return;
    }
    setError(null);
    setMessage(null);
    setSavingId(z.id);
    try {
      await adminUpdateDeliveryZone(z.id, { name: d.name.trim(), price, isActive: d.isActive });
      setMessage(`Zona "${d.name.trim()}" guardada.`);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar la zona.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreateZone(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(newPrice || 0);
    if (!newName.trim()) {
      setError("Escribe el nombre de la zona.");
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
      await adminCreateDeliveryZone(newName.trim(), price);
      setNewName("");
      setNewPrice("");
      setMessage("Zona agregada.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear la zona.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Zonas de envío</h1>
      <p className="mt-1 text-sm text-brava-muted">
        Precio de domicilio por comuna de Medellín. Se usa al crear un pedido; por ahora la zona se
        elige a mano.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}

      {!zones ? (
        <p className="mt-6 text-brava-muted">Cargando…</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brava-pink-light text-brava-muted">
              <th className="py-2 font-medium">Zona</th>
              <th className="py-2 font-medium">Precio (COP)</th>
              <th className="py-2 font-medium">Activa</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => {
              const d = drafts[z.id] ?? toDraft(z);
              return (
                <tr key={z.id} className="border-b border-brava-pink-light/50">
                  <td className="py-2 pr-3">
                    <input
                      value={d.name}
                      onChange={(e) => patchDraft(z.id, { name: e.target.value })}
                      className="w-full rounded-lg border border-brava-pink-light px-2 py-1 text-brava-ink outline-none focus:border-brava-pink"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={d.price}
                        onChange={(e) => patchDraft(z.id, { price: e.target.value })}
                        className="w-28 rounded-lg border border-brava-pink-light px-2 py-1 text-brava-muted outline-none focus:border-brava-pink"
                      />
                      <span className="text-xs text-brava-muted">{formatCop(Number(d.price) || 0)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={d.isActive}
                      onChange={(e) => patchDraft(z.id, { isActive: e.target.checked })}
                    />
                  </td>
                  <td className="py-2">
                    {isDirty(z) && (
                      <IconButton
                        size="sm"
                        tone="primary"
                        icon={<FaFloppyDisk aria-hidden />}
                        label={`Guardar ${z.name}`}
                        busy={savingId === z.id}
                        onClick={() => handleSaveZone(z)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <form
        onSubmit={handleCreateZone}
        className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-brava-pink-light p-6"
      >
        <h2 className="w-full font-medium text-brava-ink">Agregar zona</h2>
        <p className="-mt-2 w-full text-xs text-brava-muted">
          Para municipios cercanos (Envigado, Sabaneta, Itagüí…) o corregimientos que no están en la
          lista de comunas.
        </p>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Nombre</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mt-1 w-56 rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Precio (COP)</label>
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
          {creating ? "Agregando…" : "Agregar zona"}
        </button>
      </form>
    </div>
  );
}
