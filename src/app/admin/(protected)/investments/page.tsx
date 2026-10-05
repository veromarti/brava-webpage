"use client";

import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa6";
import {
  adminGetInvestments,
  adminCreateInvestment,
  adminDeleteInvestment,
  ApiError,
  type InvestmentDto,
} from "@/lib/api-admin";
import { IconButton } from "@/components/admin/IconButton";
import { formatCop } from "@/lib/format";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

// Admin-entered business costs not tied to any order — marketing, equipment,
// supplies, rent, subscriptions. Simple log (add/delete, no edit): a typo is
// cheap to fix by deleting and re-adding, so there's no inline-edit table
// like Packaging/DeliveryZone have for their reused, referenced rows.
export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<InvestmentDto[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [date, setDate] = useState(todayInputValue());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [creating, setCreating] = useState(false);

  async function reload() {
    setInvestments(await adminGetInvestments());
  }

  // Same inlined-effect pattern as the other admin list pages.
  useEffect(() => {
    let cancelled = false;
    adminGetInvestments()
      .then((data) => {
        if (!cancelled) setInvestments(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar las inversiones.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = (investments ?? []).reduce((sum, i) => sum + i.amount, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim()) {
      setError("Escribe una descripción.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    if (!date) {
      setError("Selecciona una fecha.");
      return;
    }
    setError(null);
    setMessage(null);
    setCreating(true);
    try {
      await adminCreateInvestment({ description: description.trim(), amount: parsedAmount, date });
      setDescription("");
      setAmount("");
      setMessage("Inversión agregada.");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al agregar la inversión.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(investment: InvestmentDto) {
    if (!confirm(`¿Eliminar "${investment.description}" (${formatCop(investment.amount)})?`)) {
      return;
    }
    setError(null);
    setMessage(null);
    setDeletingId(investment.id);
    try {
      await adminDeleteInvestment(investment.id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al eliminar la inversión.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Inversiones</h1>
      <p className="mt-1 text-sm text-brava-muted">
        Costos del negocio que no vienen de un pedido — publicidad, equipos, insumos comprados al por
        mayor, arriendo, suscripciones. Se restan de la utilidad bruta en Métricas para un balance más
        realista.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}

      <form
        onSubmit={handleCreate}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-brava-pink-light p-6"
      >
        <h2 className="w-full font-medium text-brava-ink">Agregar inversión</h2>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="block text-sm font-medium text-brava-ink">Descripción</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Publicidad Instagram, compra de empaques…"
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Monto (COP)</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-36 rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-full bg-brava-pink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {creating ? "Agregando…" : "Agregar inversión"}
        </button>
      </form>

      {!investments ? (
        <p className="mt-6 text-brava-muted">Cargando…</p>
      ) : investments.length === 0 ? (
        <p className="mt-6 text-brava-muted">Todavía no hay inversiones registradas.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-brava-pink-light text-brava-muted">
                <th className="py-2 font-medium">Fecha</th>
                <th className="py-2 font-medium">Descripción</th>
                <th className="py-2 font-medium">Monto</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {investments.map((i) => (
                <tr key={i.id} className="border-b border-brava-pink-light/50">
                  <td className="py-2 text-brava-muted">
                    {new Date(i.date).toLocaleDateString("es-CO", { timeZone: "UTC" })}
                  </td>
                  <td className="py-2 text-brava-ink">{i.description}</td>
                  <td className="py-2 text-brava-ink">{formatCop(i.amount)}</td>
                  <td className="py-2">
                    <IconButton
                      size="sm"
                      tone="danger"
                      icon={<FaTrash aria-hidden />}
                      label={`Eliminar ${i.description}`}
                      busy={deletingId === i.id}
                      onClick={() => handleDelete(i)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 text-sm font-medium text-brava-ink" colSpan={2}>
                  Total
                </td>
                <td className="pt-3 text-sm font-medium text-brava-ink" colSpan={2}>
                  {formatCop(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
