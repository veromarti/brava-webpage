"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { BrandListItemDto, CategoryListItemDto } from "@/lib/api";
import { Select } from "@/components/Select";

// URL-driven (not local state) so a filtered view is a real, shareable,
// bookmarkable link — matches ADR-0005's server-rendered-pages intent.
// Category is a chip row (few, ordered, worth showing at a glance); brand
// stays a dropdown since a store can carry many. "Kits" is a chip too but
// its own view (?view=kits): kits span brands/categories, so it's mutually
// exclusive with those filters rather than another category.
export function CatalogFilters({
  brands,
  categories,
  hasKits,
}: {
  brands: BrandListItemDto[];
  categories: CategoryListItemDto[];
  hasKits: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBrand = searchParams.get("brand") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const kitsOnly = searchParams.get("view") === "kits";

  function updateFilter(key: "brand" | "category", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    // Picking a brand/category is a products view — leave the kits-only one.
    params.delete("view");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  function showKitsOnly() {
    // Kits ignore brand/category, so this view drops every other param.
    router.push("/?view=kits");
  }

  const hasFilters = currentBrand || currentCategory || kitsOnly;
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
          className={chipClass(!currentCategory && !kitsOnly)}
        >
          Todas
        </button>
        {hasKits && (
          <button type="button" onClick={showKitsOnly} className={chipClass(kitsOnly)}>
            Kits
          </button>
        )}
        {orderedCategories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => updateFilter("category", c.slug)}
            className={chipClass(currentCategory === c.slug && !kitsOnly)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          ariaLabel="Filtrar por marca"
          value={currentBrand}
          onValueChange={(v) => updateFilter("brand", v)}
          wrapperClassName="inline-block"
          className="rounded-full border border-brava-pink-light px-4 py-2 text-sm"
          options={[
            { value: "", label: "Todas las marcas" },
            ...brands.map((b) => ({ value: b.slug, label: b.name })),
          ]}
        />

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
