"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { BrandListItemDto, CategoryListItemDto } from "@/lib/api";

// URL-driven (not local state) so a filtered view is a real, shareable,
// bookmarkable link — matches ADR-0005's server-rendered-pages intent.
export function CatalogFilters({
  brands,
  categories,
}: {
  brands: BrandListItemDto[];
  categories: CategoryListItemDto[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBrand = searchParams.get("brand") ?? "";
  const currentCategory = searchParams.get("category") ?? "";

  function updateFilter(key: "brand" | "category", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  const hasFilters = currentBrand || currentCategory;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <select
        value={currentBrand}
        onChange={(e) => updateFilter("brand", e.target.value)}
        className="rounded-lg border border-brava-pink-light bg-white px-3 py-2 text-sm outline-none focus:border-brava-pink"
      >
        <option value="">Todas las marcas</option>
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        value={currentCategory}
        onChange={(e) => updateFilter("category", e.target.value)}
        className="rounded-lg border border-brava-pink-light bg-white px-3 py-2 text-sm outline-none focus:border-brava-pink"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push("/")}
          className="text-sm text-brava-muted hover:text-brava-pink-dark"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
