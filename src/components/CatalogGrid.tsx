"use client";

import { useMemo, useState } from "react";
import type { ProductListItemDto, ComboListItemWithImagesDto } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { Select } from "@/components/Select";

type SortKey = "suggested" | "price-asc" | "price-desc" | "name";

// Brand/category filtering stays server-side and URL-driven (see
// CatalogFilters). This adds the lighter-weight, instant refinements —
// free-text search and sort — over the already-fetched result set, so
// they don't need a round-trip or their own API params.
export function CatalogGrid({
  products,
  combos,
}: {
  products: ProductListItemDto[];
  combos: ComboListItemWithImagesDto[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("suggested");

  const q = query.trim().toLowerCase();

  const visibleCombos = useMemo(() => {
    const list = combos.filter((c) => !q || c.name.toLowerCase().includes(q));
    if (sort === "price-asc") return [...list].sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === "price-desc") return [...list].sort((a, b) => b.finalPrice - a.finalPrice);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [combos, q, sort]);

  const visibleProducts = useMemo(() => {
    const list = products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q),
    );
    if (sort === "price-asc") return [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === "price-desc") return [...list].sort((a, b) => b.priceFrom - a.priceFrom);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [products, q, sort]);

  const total = visibleCombos.length + visibleProducts.length;

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o marca…"
          className="w-full rounded-full border border-brava-pink-light bg-white px-4 py-2.5 text-sm outline-none focus:border-brava-pink sm:max-w-xs"
        />
        <Select
          ariaLabel="Ordenar resultados"
          value={sort}
          onValueChange={(v) => setSort(v as SortKey)}
          wrapperClassName="inline-block"
          className="rounded-full border border-brava-pink-light px-4 py-2.5 text-sm"
          options={[
            { value: "suggested", label: "Orden sugerido" },
            { value: "price-asc", label: "Precio: menor a mayor" },
            { value: "price-desc", label: "Precio: mayor a menor" },
            { value: "name", label: "Nombre (A–Z)" },
          ]}
        />
      </div>

      <p className="mt-4 text-sm text-brava-muted">
        {total} resultado{total === 1 ? "" : "s"}
      </p>

      {total === 0 ? (
        <p className="mt-10 text-brava-muted">No encontramos nada con esa búsqueda.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {visibleCombos.map((combo) => (
            <ComboCard key={`combo-${combo.slug}`} combo={combo} />
          ))}
          {visibleProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
