"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateOrder,
  adminGetDeliveryZones,
  ApiError,
  type DeliveryZoneDto,
} from "@/lib/api-admin";
import { OrderItemsEditor, toOrderItemPayloads, type OrderItemRow } from "@/components/admin/OrderItemsEditor";
import { formatCop } from "@/lib/format";
import { Select } from "@/components/Select";

export default function NewOrderPage() {
  const router = useRouter();

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [zones, setZones] = useState<DeliveryZoneDto[]>([]);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminGetDeliveryZones()
      .then((data) => setZones(data.filter((z) => z.isActive)))
      .catch(() => setError("No se pudieron cargar las zonas de envío."));
  }, []);

  const zone = zones.find((z) => z.id === deliveryZoneId);
  const deliveryFee = zone?.price ?? 0;
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const total = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !deliveryAddress.trim()) {
      setError("Nombre, teléfono y dirección son obligatorios.");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto o kit.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const order = await adminCreateOrder({
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryZoneId: deliveryZoneId || null,
        items: toOrderItemPayloads(items),
        notes: notes.trim() || null,
      });
      router.push(`/admin/orders/${order.number}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear el pedido.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Nuevo pedido</h1>
      <p className="mt-1 text-sm text-brava-muted">
        Si el teléfono ya tiene un cliente registrado, el pedido se vincula a esa cuenta automáticamente.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-brava-ink">Nombre de contacto</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Teléfono</label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brava-ink">Dirección de entrega</label>
          <input
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brava-ink">Zona de envío</label>
          <Select
            ariaLabel="Zona de envío"
            placeholder="Sin zona (envío $0)"
            value={deliveryZoneId}
            onValueChange={setDeliveryZoneId}
            wrapperClassName="mt-1 inline-block"
            className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            options={zones.map((z) => ({ value: z.id, label: `${z.name} — ${formatCop(z.price)}` }))}
          />
        </div>

        <div>
          <h2 className="mb-2 font-medium text-brava-ink">Productos</h2>
          <OrderItemsEditor items={items} onChange={setItems} />
        </div>

        <div>
          <label className="block text-sm font-medium text-brava-ink">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>

        <div className="rounded-2xl border border-brava-pink-light p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-brava-muted">Subtotal</span>
            <span className="text-brava-ink">{formatCop(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brava-muted">Envío</span>
            <span className="text-brava-ink">{formatCop(deliveryFee)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-brava-pink-light pt-2 font-semibold">
            <span className="text-brava-ink">Total</span>
            <span className="text-brava-pink-dark">{formatCop(total)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-full bg-brava-pink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {submitting ? "Creando…" : "Crear pedido"}
        </button>
      </form>
    </div>
  );
}
