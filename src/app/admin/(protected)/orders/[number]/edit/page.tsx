"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  adminGetOrder,
  adminUpdateOrder,
  adminGetDeliveryZones,
  adminGetPackagingOptions,
  ApiError,
  type DeliveryZoneDto,
  type PackagingOptionDto,
} from "@/lib/api-admin";
import { OrderItemsEditor, toOrderItemPayloads, type OrderItemRow } from "@/components/admin/OrderItemsEditor";
import { formatCop } from "@/lib/format";
import { Select } from "@/components/Select";

// Same form as "Nuevo pedido", minus the admin picker (that's
// adminAssignOrder's job — see the order detail page) — pre-filled from the
// existing order so an admin can add/remove products, fix the address, or
// pick a delivery zone/packaging once they've followed up with the customer
// over WhatsApp. The API refuses this once the order is Entregado/Cancelado.
export default function EditOrderPage() {
  const { number } = useParams<{ number: string }>();
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [zones, setZones] = useState<DeliveryZoneDto[]>([]);
  const [packagingOptionId, setPackagingOptionId] = useState("");
  const [packagingOptions, setPackagingOptions] = useState<PackagingOptionDto[]>([]);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetOrder(number)
      .then((order) => {
        if (cancelled) return;
        setContactName(order.contactName);
        setContactPhone(order.contactPhone);
        setDeliveryAddress(order.deliveryAddress);
        setDeliveryZoneId(order.deliveryZoneId ?? "");
        setPackagingOptionId(order.packagingOptionId ?? "");
        setNotes(order.notes ?? "");
        setItems(
          order.items.map((i) => ({
            key: i.id,
            productVariantId: i.productVariantId,
            comboId: i.comboId,
            label: i.description,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
        );
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Error al cargar el pedido.");
      });
    adminGetDeliveryZones()
      .then((data) => setZones(data.filter((z) => z.isActive)))
      .catch(() => setError("No se pudieron cargar las zonas de envío."));
    adminGetPackagingOptions()
      .then((data) => setPackagingOptions(data.filter((p) => p.isActive)))
      .catch(() => setError("No se pudieron cargar los empaques."));
    return () => {
      cancelled = true;
    };
  }, [number]);

  const zone = zones.find((z) => z.id === deliveryZoneId);
  const deliveryFee = zone?.price ?? 0;
  const packagingOption = packagingOptions.find((p) => p.id === packagingOptionId);
  const packagingCost = packagingOption?.price ?? 0;
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
      await adminUpdateOrder(number, {
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryZoneId: deliveryZoneId || null,
        packagingOptionId: packagingOptionId || null,
        items: toOrderItemPayloads(items),
        notes: notes.trim() || null,
      });
      router.push(`/admin/orders/${number}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar los cambios.");
      setSubmitting(false);
    }
  }

  if (error && !loaded) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-600">{error}</p>
        <Link href={`/admin/orders/${number}`} className="mt-4 inline-block text-brava-pink-dark hover:underline">
          Volver al pedido
        </Link>
      </div>
    );
  }

  if (!loaded) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-brava-muted">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Editar pedido {number}</h1>
      <p className="mt-1 text-sm text-brava-muted">
        Agrega o quita productos, o corrige los datos del cliente si cambiaron por WhatsApp.
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
          <label className="block text-sm font-medium text-brava-ink">Empaque</label>
          <Select
            ariaLabel="Empaque"
            placeholder="Sin empaque"
            value={packagingOptionId}
            onValueChange={setPackagingOptionId}
            wrapperClassName="mt-1 inline-block"
            className="rounded-lg border border-brava-pink-light px-3 py-2 text-sm"
            options={packagingOptions.map((p) => ({ value: p.id, label: `${p.name} — ${formatCop(p.price)}` }))}
          />
          <p className="mt-1 text-xs text-brava-muted">
            Costo interno{packagingOption ? `: ${formatCop(packagingCost)}` : ""} — no se suma al total del
            cliente, solo se usa para el margen en Métricas.
          </p>
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

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-full bg-brava-pink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
          >
            {submitting ? "Guardando…" : "Guardar cambios"}
          </button>
          <Link href={`/admin/orders/${number}`} className="text-sm text-brava-muted hover:text-red-600">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
