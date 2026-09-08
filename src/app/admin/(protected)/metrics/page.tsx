"use client";

import { useEffect, useState } from "react";
import {
  adminGetCatalogueMetrics,
  adminGetOrderMetrics,
  ApiError,
  type CatalogueMetricsDto,
  type OrderMetricsDto,
} from "@/lib/api-admin";
import { formatCop } from "@/lib/format";

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toDateInputValue(d);
}

// Small stat card shared by both sections — a label, a big value, and an
// optional muted note underneath (used for percentages/counts that need a
// caveat, like "costo incompleto").
function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-brava-pink-light p-4">
      <p className="text-sm text-brava-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brava-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-brava-muted">{note}</p>}
    </div>
  );
}

export default function AdminMetricsPage() {
  const [catalogue, setCatalogue] = useState<CatalogueMetricsDto | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(toDateInputValue(new Date()));
  const [orderMetrics, setOrderMetrics] = useState<OrderMetricsDto | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    adminGetCatalogueMetrics()
      .then(setCatalogue)
      .catch((err) => setCatalogueError(err instanceof ApiError ? err.message : "Error al cargar el catálogo."));
  }, []);

  // Re-fetches whenever the range changes — same "small admin panel, a fresh
  // request beats client-side caching" reasoning as the orders list filters.
  useEffect(() => {
    let cancelled = false;
    adminGetOrderMetrics({ from: from || undefined, to: to || undefined })
      .then((data) => {
        if (!cancelled) setOrderMetrics(data);
      })
      .catch((err) => {
        if (!cancelled) setOrderError(err instanceof ApiError ? err.message : "Error al cargar los pedidos.");
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Métricas</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-brava-ink">Catálogo</h2>
        <p className="mt-1 text-sm text-brava-muted">Estado actual — no depende de un rango de fechas.</p>

        {catalogueError && <p className="mt-4 text-sm text-red-600">{catalogueError}</p>}

        {!catalogue ? (
          <p className="mt-6 text-brava-muted">Cargando…</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Productos"
              value={String(catalogue.totalProducts)}
              note={`${catalogue.activeProducts} activos · ${catalogue.inactiveProducts} inactivos`}
            />
            <Stat
              label="Sin imágenes"
              value={String(catalogue.productsWithoutImages)}
              note="productos sin ninguna foto"
            />
            <Stat
              label="Sin nada que vender"
              value={String(catalogue.productsWithoutSellableVariant)}
              note="sin variante activa con precio"
            />
            <Stat
              label="Variantes activas"
              value={String(catalogue.totalActiveVariants)}
              note={`${catalogue.outOfStockActiveVariants} agotadas`}
            />
            <Stat
              label="Margen promedio"
              value={
                catalogue.averageMarginPercent !== null
                  ? `${catalogue.averageMarginPercent.toFixed(1)}%`
                  : "—"
              }
              note={
                catalogue.variantsMissingCost > 0
                  ? `${catalogue.variantsMissingCost} variantes sin costo (costo incompleto)`
                  : "sobre variantes con costo y precio"
              }
            />
            <Stat
              label="Kits"
              value={String(catalogue.totalCombos)}
              note={`${catalogue.activeCombos} activos`}
            />
            <Stat
              label="Kits con costo incompleto"
              value={String(catalogue.combosWithIncompleteCost)}
              note="algún producto del kit sin costo"
            />
          </div>
        )}
      </section>

      <section className="mt-10 border-t border-brava-pink-light pt-8">
        <h2 className="text-lg font-semibold text-brava-ink">Financiero</h2>
        <p className="mt-1 text-sm text-brava-muted">
          Solo cuenta pedidos <span className="font-medium text-brava-ink">Entregado</span> — un pedido
          pendiente o cancelado no se refleja aquí todavía.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-brava-ink">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brava-ink">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 rounded-lg border border-brava-pink-light px-3 py-2 text-sm outline-none focus:border-brava-pink"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            className="text-sm text-brava-muted hover:text-brava-pink-dark"
          >
            Ver todo
          </button>
        </div>

        {orderError && <p className="mt-4 text-sm text-red-600">{orderError}</p>}

        {!orderMetrics ? (
          <p className="mt-6 text-brava-muted">Cargando…</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Pedidos completados" value={String(orderMetrics.completedOrdersCount)} />
            <Stat label="Ingresos por productos" value={formatCop(orderMetrics.revenue)} />
            <Stat label="Ingresos por envío" value={formatCop(orderMetrics.deliveryIncome)} />
            <Stat label="Ingreso total" value={formatCop(orderMetrics.totalIncome)} />
            <Stat
              label="Costo de productos vendidos"
              value={formatCop(orderMetrics.cogs)}
              note={orderMetrics.hasIncompleteCost ? "costo incompleto — algún producto sin costo" : undefined}
            />
            <Stat label="Costo de empaque" value={formatCop(orderMetrics.packagingCost)} note="bolsas/cajas usadas" />
            <Stat
              label="Utilidad bruta"
              value={formatCop(orderMetrics.grossProfit)}
              note={
                orderMetrics.hasIncompleteCost
                  ? "costo incompleto — cifra parcial"
                  : "ingresos por productos − costo de productos − empaque"
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
