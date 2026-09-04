"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPlus } from "react-icons/fa6";
import { adminGetOrders, ApiError, type OrderListItemDto, type OrderStatus, type PaymentStatus } from "@/lib/api-admin";
import { formatCop, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/format";
import { Select } from "@/components/Select";

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "Confirmado", label: "Confirmado" },
  { value: "EnPreparacion", label: "En preparación" },
  { value: "EnCamino", label: "En camino" },
  { value: "Entregado", label: "Entregado" },
  { value: "Cancelado", label: "Cancelado" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "Pagado", label: "Pagado" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderListItemDto[] | null>(null);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [error, setError] = useState<string | null>(null);

  // Re-fetches whenever a filter changes — filters are few and the list is
  // small (single-admin panel), so a fresh request beats client-side caching.
  useEffect(() => {
    let cancelled = false;
    adminGetOrders({ status: status || undefined, paymentStatus: paymentStatus || undefined })
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar los pedidos.");
      });
    return () => {
      cancelled = true;
    };
  }, [status, paymentStatus]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brava-ink">Pedidos</h1>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 rounded-full bg-brava-pink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark"
        >
          <FaPlus aria-hidden /> Nuevo pedido
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-brava-ink">Estado</label>
          <Select
            ariaLabel="Estado"
            value={status}
            onValueChange={(v) => setStatus(v as OrderStatus | "")}
            wrapperClassName="mt-1 inline-block"
            className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            options={STATUS_OPTIONS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Pago</label>
          <Select
            ariaLabel="Pago"
            value={paymentStatus}
            onValueChange={(v) => setPaymentStatus(v as PaymentStatus | "")}
            wrapperClassName="mt-1 inline-block"
            className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            options={PAYMENT_STATUS_OPTIONS}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!orders ? (
        <p className="mt-6 text-brava-muted">Cargando…</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-brava-muted">Sin pedidos con esos filtros.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brava-pink-light text-brava-muted">
              <th className="py-2 font-medium">Número</th>
              <th className="py-2 font-medium">Cliente</th>
              <th className="py-2 font-medium">Estado</th>
              <th className="py-2 font-medium">Pago</th>
              <th className="py-2 font-medium">Total</th>
              <th className="py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-brava-pink-light/50">
                <td className="py-2">
                  <Link href={`/admin/orders/${o.number}`} className="font-medium text-brava-pink-dark hover:underline">
                    {o.number}
                  </Link>
                </td>
                <td className="py-2 text-brava-ink">
                  {o.contactName}
                  <span className="block text-xs text-brava-muted">{o.contactPhone}</span>
                </td>
                <td className="py-2 text-brava-ink">{ORDER_STATUS_LABELS[o.status]}</td>
                <td className="py-2">
                  {o.paymentStatus === "Pagado" ? (
                    <span className="text-emerald-700">{PAYMENT_STATUS_LABELS[o.paymentStatus]}</span>
                  ) : (
                    <span className="text-brava-muted">{PAYMENT_STATUS_LABELS[o.paymentStatus]}</span>
                  )}
                </td>
                <td className="py-2 font-medium text-brava-ink">{formatCop(o.total)}</td>
                <td className="py-2 text-brava-muted">{new Date(o.createdAt).toLocaleDateString("es-CO")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
