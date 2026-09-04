"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  adminGetOrder,
  adminUpdateOrderStatus,
  adminMarkOrderPaid,
  ApiError,
  type OrderDetailDto,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/api-admin";
import { formatCop, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/format";
import { Select } from "@/components/Select";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Confirmado", label: "Confirmado" },
  { value: "EnPreparacion", label: "En preparación" },
  { value: "EnCamino", label: "En camino" },
  { value: "Entregado", label: "Entregado" },
  { value: "Cancelado", label: "Cancelado" },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "Efectivo", label: "Efectivo" },
  { value: "Transferencia", label: "Transferencia" },
];

export default function OrderDetailPage() {
  const { number } = useParams<{ number: string }>();

  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Efectivo");
  const [markingPaid, setMarkingPaid] = useState(false);

  async function reload() {
    setOrder(await adminGetOrder(number));
  }

  useEffect(() => {
    let cancelled = false;
    adminGetOrder(number)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar el pedido.");
      });
    return () => {
      cancelled = true;
    };
  }, [number]);

  async function handleStatusChange(status: string) {
    setSavingStatus(true);
    setError(null);
    try {
      await adminUpdateOrderStatus(number, status as OrderStatus);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cambiar el estado.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleMarkPaid() {
    setMarkingPaid(true);
    setError(null);
    try {
      await adminMarkOrderPaid(number, paymentMethod);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrar el pago.");
    } finally {
      setMarkingPaid(false);
    }
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-600">{error}</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-brava-pink-dark hover:underline">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-brava-muted">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brava-ink">Pedido {order.number}</h1>
        <span className="text-sm text-brava-muted">
          {new Date(order.createdAt).toLocaleString("es-CO")}
        </span>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-brava-pink-light p-4">
          <h2 className="font-medium text-brava-ink">Cliente</h2>
          <p className="mt-2 text-sm text-brava-ink">{order.contactName}</p>
          <p className="text-sm text-brava-muted">{order.contactPhone}</p>
          <p className="mt-2 text-sm text-brava-muted">{order.deliveryAddress}</p>
          {order.deliveryZoneName && (
            <p className="text-sm text-brava-muted">
              Zona: {order.deliveryZoneName} ({formatCop(order.deliveryFee)})
            </p>
          )}
          {order.customerId && (
            <p className="mt-2 text-xs text-brava-muted">Vinculado a un cliente registrado.</p>
          )}
          {order.notes && <p className="mt-2 text-sm text-brava-muted">Notas: {order.notes}</p>}
        </div>

        <div className="rounded-2xl border border-brava-pink-light p-4">
          <h2 className="font-medium text-brava-ink">Estado</h2>
          <div className="mt-2">
            <Select
              ariaLabel="Estado del pedido"
              value={order.status}
              onValueChange={handleStatusChange}
              disabled={savingStatus}
              wrapperClassName="inline-block"
              className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
              options={STATUS_OPTIONS}
            />
          </div>

          <h2 className="mt-4 font-medium text-brava-ink">Pago</h2>
          {order.paymentStatus === "Pagado" ? (
            <p className="mt-2 text-sm text-emerald-700">
              Pagado — {order.paymentMethod && PAYMENT_METHOD_LABELS[order.paymentMethod]}
              {order.paidAt && ` · ${new Date(order.paidAt).toLocaleDateString("es-CO")}`}
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <Select
                ariaLabel="Método de pago"
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                wrapperClassName="inline-block"
                className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
                options={PAYMENT_METHOD_OPTIONS}
              />
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={markingPaid}
                className="rounded-lg bg-brava-pink px-4 py-2 text-sm font-medium text-white hover:bg-brava-pink-dark disabled:opacity-50"
              >
                {markingPaid ? "Guardando…" : "Marcar como pagado"}
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-brava-muted">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
        </div>
      </div>

      <h2 className="mt-6 font-medium text-brava-ink">Productos</h2>
      <table className="mt-2 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brava-pink-light text-brava-muted">
            <th className="py-2 font-medium">Descripción</th>
            <th className="py-2 font-medium">Cant.</th>
            <th className="py-2 font-medium">Precio unit.</th>
            <th className="py-2 font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-brava-pink-light/50">
              <td className="py-2 text-brava-ink">{item.description}</td>
              <td className="py-2 text-brava-muted">{item.quantity}</td>
              <td className="py-2 text-brava-muted">{formatCop(item.unitPrice)}</td>
              <td className="py-2 text-brava-ink">{formatCop(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-full max-w-xs rounded-2xl border border-brava-pink-light p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-brava-muted">Subtotal</span>
          <span className="text-brava-ink">{formatCop(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brava-muted">Envío</span>
          <span className="text-brava-ink">{formatCop(order.deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-brava-pink-light pt-2 font-semibold">
          <span className="text-brava-ink">Total</span>
          <span className="text-brava-pink-dark">{formatCop(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
