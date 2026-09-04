// CLAUDE.md: prices are whole pesos, no cents.
const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(amount: number): string {
  return copFormatter.format(amount);
}

// ADR-0003: "Desde $X" only when a product's active variants have different
// prices; a plain "$X" when they don't. PriceFrom === PriceTo means show one.
export function formatPriceRange(priceFrom: number, priceTo: number): string {
  return priceFrom === priceTo ? formatCop(priceFrom) : `Desde ${formatCop(priceFrom)}`;
}

export function variantLabel(variant: { toneName: string | null; toneCode: string | null; volumeMl: number | null; massG: number | null; units: number | null }): string {
  const parts: string[] = [];
  if (variant.toneName) {
    parts.push(variant.toneCode ? `${variant.toneName} (${variant.toneCode})` : variant.toneName);
  } else if (variant.toneCode) {
    parts.push(variant.toneCode);
  }
  if (variant.volumeMl) parts.push(`${variant.volumeMl} ml`);
  if (variant.massG) parts.push(`${variant.massG} g`);
  if (variant.units) parts.push(`${variant.units} unidades`);
  return parts.length > 0 ? parts.join(" · ") : "Único";
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  Pendiente: "Pendiente",
  Confirmado: "Confirmado",
  EnPreparacion: "En preparación",
  EnCamino: "En camino",
  Entregado: "Entregado",
  Cancelado: "Cancelado",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  Pendiente: "Pendiente",
  Pagado: "Pagado",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Efectivo: "Efectivo",
  Transferencia: "Transferencia",
};

// ADR-0007's display rule, even though the reservation math behind
// available_stock isn't implemented — this reads PhysicalStock/AvailableOnDemand
// directly, same fields ProductVariantDto already exposes.
export function stockStatus(variant: { physicalStock: number; availableOnDemand: boolean }): {
  label: string;
  tone: "in-stock" | "on-demand" | "out-of-stock";
} {
  if (variant.physicalStock > 0) {
    return { label: "Disponible", tone: "in-stock" };
  }
  if (variant.availableOnDemand) {
    return { label: "Disponible bajo pedido · Entrega estimada: 3 días hábiles", tone: "on-demand" };
  }
  return { label: "Agotado", tone: "out-of-stock" };
}
