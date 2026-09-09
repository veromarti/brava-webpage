"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaChevronDown, FaPencil } from "react-icons/fa6";
import {
  adminGetCatalogueMetrics,
  adminGetCatalogueHealthDetails,
  adminGetOrderMetrics,
  ApiError,
  type CatalogueMetricsDto,
  type CatalogueHealthDetailsDto,
  type OrderMetricsDto,
  type ProductHealthItemDto,
  type VariantHealthItemDto,
} from "@/lib/api-admin";
import { formatCop, variantLabel } from "@/lib/format";

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

// A Stat whose number is a count of *problem* rows: the card is a button, and
// clicking it expands the list of exactly which products/variants are behind
// the number so the admin can jump straight to fixing them. Non-expandable
// (and not a button) when the count is 0 — nothing to drill into — or while
// the detail list is still loading.
function HealthCard({
  label,
  count,
  note,
  ready,
  open,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  note?: string;
  ready: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const expandable = count > 0 && ready;
  return (
    <div className="rounded-2xl border border-brava-pink-light">
      <button
        type="button"
        onClick={onToggle}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        className="flex w-full items-start justify-between gap-3 rounded-2xl p-4 text-left transition-colors enabled:hover:bg-brava-pink-light/10 disabled:cursor-default"
      >
        <span>
          <span className="block text-sm text-brava-muted">{label}</span>
          <span className="mt-1 block text-2xl font-bold text-brava-ink">{count}</span>
          {note && <span className="mt-1 block text-xs text-brava-muted">{note}</span>}
        </span>
        {expandable && (
          <FaChevronDown
            aria-hidden
            className={`mt-1 shrink-0 text-brava-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {expandable && open && (
        <div className="border-t border-brava-pink-light px-4 py-1">{children}</div>
      )}
    </div>
  );
}

function ProductLinkList({ items }: { items: ProductHealthItemDto[] }) {
  return (
    <ul className="divide-y divide-brava-pink-light/60">
      {items.map((it) => (
        <li key={it.productId}>
          <Link
            href={`/admin/products/${it.slug}/edit`}
            className="flex items-center justify-between gap-2 py-2 text-sm text-brava-ink hover:text-brava-pink-dark"
          >
            <span>{it.name}</span>
            <FaPencil aria-hidden className="shrink-0 text-brava-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function VariantLinkList({ items }: { items: VariantHealthItemDto[] }) {
  return (
    <ul className="divide-y divide-brava-pink-light/60">
      {items.map((it) => (
        <li key={it.variantId}>
          <Link
            href={`/admin/products/${it.productSlug}/edit#variant-${it.variantId}`}
            className="flex items-center justify-between gap-2 py-2 text-sm text-brava-ink hover:text-brava-pink-dark"
          >
            <span>
              {it.productName}
              <span className="text-brava-muted"> · {variantLabel(it)}</span>
            </span>
            <FaPencil aria-hidden className="shrink-0 text-brava-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AdminMetricsPage() {
  const [catalogue, setCatalogue] = useState<CatalogueMetricsDto | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [healthDetails, setHealthDetails] = useState<CatalogueHealthDetailsDto | null>(null);
  const [healthDetailsError, setHealthDetailsError] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});

  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(toDateInputValue(new Date()));
  const [orderMetrics, setOrderMetrics] = useState<OrderMetricsDto | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Summary and drill-down details load independently — a details failure
  // shouldn't blank the numbers, and vice versa.
  useEffect(() => {
    adminGetCatalogueMetrics()
      .then(setCatalogue)
      .catch((err) => setCatalogueError(err instanceof ApiError ? err.message : "Error al cargar el catálogo."));
    adminGetCatalogueHealthDetails()
      .then(setHealthDetails)
      .catch(() => setHealthDetailsError("No se pudieron cargar los detalles para revisar."));
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

  const toggleCard = (key: string) => setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brava-ink">Métricas</h1>

      <section className="mt-8">
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

      <section className="mt-10 border-t border-brava-pink-light pt-8">
        <h2 className="text-lg font-semibold text-brava-ink">Catálogo</h2>
        <p className="mt-1 text-sm text-brava-muted">Estado actual — no depende de un rango de fechas.</p>

        {catalogueError && <p className="mt-4 text-sm text-red-600">{catalogueError}</p>}

        {!catalogue ? (
          <p className="mt-6 text-brava-muted">Cargando…</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Productos"
                value={String(catalogue.totalProducts)}
                note={`${catalogue.activeProducts} activos · ${catalogue.inactiveProducts} inactivos`}
              />
              <Stat label="Variantes activas" value={String(catalogue.totalActiveVariants)} />
              <Stat
                label="Margen promedio"
                value={
                  catalogue.averageMarginPercent !== null
                    ? `${catalogue.averageMarginPercent.toFixed(1)}%`
                    : "—"
                }
                note={
                  catalogue.variantsMissingCost > 0
                    ? "cifra parcial — hay variantes sin costo"
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

            <div className="mt-8 flex items-baseline gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brava-muted">Para revisar</h3>
              <p className="text-xs text-brava-muted">Toca una tarjeta para ver cuáles y editarlas.</p>
            </div>
            {healthDetailsError && <p className="mt-2 text-sm text-red-600">{healthDetailsError}</p>}

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HealthCard
                label="Sin imágenes"
                count={catalogue.productsWithoutImages}
                note="productos sin ninguna foto"
                ready={healthDetails !== null}
                open={!!openCards.images}
                onToggle={() => toggleCard("images")}
              >
                {healthDetails && <ProductLinkList items={healthDetails.productsWithoutImages} />}
              </HealthCard>

              <HealthCard
                label="Sin nada que vender"
                count={catalogue.productsWithoutSellableVariant}
                note="sin variante activa con precio"
                ready={healthDetails !== null}
                open={!!openCards.sellable}
                onToggle={() => toggleCard("sellable")}
              >
                {healthDetails && <ProductLinkList items={healthDetails.productsWithoutSellableVariant} />}
              </HealthCard>

              <HealthCard
                label="Variantes agotadas"
                count={catalogue.outOfStockActiveVariants}
                note="activas, sin stock y sin venta bajo pedido"
                ready={healthDetails !== null}
                open={!!openCards.outOfStock}
                onToggle={() => toggleCard("outOfStock")}
              >
                {healthDetails && <VariantLinkList items={healthDetails.outOfStockActiveVariants} />}
              </HealthCard>

              <HealthCard
                label="Variantes sin costo"
                count={catalogue.variantsMissingCost}
                note="activas y con precio, pero sin costo interno"
                ready={healthDetails !== null}
                open={!!openCards.missingCost}
                onToggle={() => toggleCard("missingCost")}
              >
                {healthDetails && <VariantLinkList items={healthDetails.variantsMissingCost} />}
              </HealthCard>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
