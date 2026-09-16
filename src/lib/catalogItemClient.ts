import type { ProductDetailDto, ComboDetailDto } from "@/lib/api";

// Client-side counterpart to getProductBySlug/getComboBySlug (which are
// server-only — lib/api.ts throws if imported at runtime outside a Server
// Component). Backs the catalog cards' quick-add/quick-view, which only have
// the thin list DTOs to start from. Returns null on any failure (not found,
// inactive, offline) — callers treat that as "can't quick-add right now".
export async function fetchCatalogItem(type: "product", slug: string): Promise<ProductDetailDto | null>;
export async function fetchCatalogItem(type: "combo", slug: string): Promise<ComboDetailDto | null>;
export async function fetchCatalogItem(
  type: "product" | "combo",
  slug: string,
): Promise<ProductDetailDto | ComboDetailDto | null> {
  try {
    const res = await fetch("/api/catalog-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug }),
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}
