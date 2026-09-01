"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { BrandListItemDto, CategoryListItemDto } from "@/lib/api";

// URL-driven (not local state) so a filtered view is a real, shareable,
// bookmarkable link — matches ADR-0005's server-rendered-pages intent.
// Category is a chip row (few, ordered, worth showing at a glance); brand
// stays a dropdown since a store can carry many.
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
  const orderedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  function chipClass(active: boolean) {
    return `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active
        ? "border-brava-pink bg-brava-pink text-white"
        : "border-brava-pink-light bg-white text-brava-ink hover:border-brava-pink"
    }`;
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => updateFilter("category", "")}
          className={chipClass(!currentCategory)}
        >
          Todas
        </button>
        {orderedCategories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => updateFilter("category", c.slug)}
            className={chipClass(currentCategory === c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentBrand}
          onChange={(e) => updateFilter("brand", e.target.value)}
          className="rounded-full border border-brava-pink-light bg-white px-4 py-2 text-sm outline-none focus:border-brava-pink"
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm text-brava-muted hover:text-brava-pink-dark"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
