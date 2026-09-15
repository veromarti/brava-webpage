"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductListItemDto, ComboListItemWithImagesDto, BrandListItemDto, CategoryListItemDto } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { Select } from "@/components/Select";
import { BrandMultiSelect } from "@/components/BrandMultiSelect";

type SortKey = "suggested" | "price-asc" | "price-desc" | "name";

const PAGE_SIZE = 24;

// The catalogue is small enough (a few hundred items) to fetch once and do
// every refinement — category, brand(s), search, sort, pagination — in the
// browser. Category/brand/kits/page stay URL params (shareable, bookmarkable
// link, per ADR-0005); search/sort are local since they're meant to be
// instant and don't need to survive a reload.
function isGiftCard(p: ProductListItemDto): boolean {
  return p.slug.includes("bono-de-regalo") || p.name.toLowerCase().includes("bono de regalo");
}

type DisplayItem =
  | { kind: "combo"; data: ComboListItemWithImagesDto }
  | { kind: "product"; data: ProductListItemDto };

export function Catalog({
  products,
  combos,
  brands,
  categories,
}: {
  products: ProductListItemDto[];
  combos: ComboListItemWithImagesDto[];
  brands: BrandListItemDto[];
  categories: CategoryListItemDto[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentBrands = useMemo(() => {
    const raw = searchParams.get("brand");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams]);
  const kitsOnly = searchParams.get("view") === "kits";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("suggested");

  // Resetting to page 1 on a URL-param change (category/brand/kits) is
  // handled inline where those params are pushed. query/sort are local
  // state, so they need their own reset — skipping the first render keeps
  // this from firing (and clobbering a deep-linked ?page=) on mount.
  const skipFirstReset = useRef(true);
  useEffect(() => {
    if (skipFirstReset.current) {
      skipFirstReset.current = false;
      return;
    }
    if (page !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      router.replace(params.toString() ? `/?${params.toString()}` : "/", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort]);

  function pushParams(params: URLSearchParams) {
    params.delete("page");
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  function setCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    if (slug) params.set("category", slug);
    else params.delete("category");
    pushParams(params);
  }

  function showKitsOnly() {
    router.push("/?view=kits");
  }

  function toggleBrand(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    const next = currentBrands.includes(slug)
      ? currentBrands.filter((b) => b !== slug)
      : [...currentBrands, slug];
    if (next.length) params.set("brand", next.join(","));
    else params.delete("brand");
    pushParams(params);
  }

  function clearBrands() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    pushParams(params);
  }

  function clearFilters() {
    router.push("/");
  }

  function goToPage(n: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (n <= 1) params.delete("page");
    else params.set("page", String(n));
    router.push(params.toString() ? `/?${params.toString()}` : "/", { scroll: false });
  }

  const hasFilters = Boolean(currentCategory) || currentBrands.length > 0 || kitsOnly;
  // Gift cards/kits only jump the queue on the true default view — no filter,
  // no explicit sort. The moment the visitor filters or picks a sort, results
  // should order strictly by that criteria instead.
  const isDefaultView = sort === "suggested" && !hasFilters;
  const orderedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  const currentCategoryName = categories.find((c) => c.slug === currentCategory)?.name ?? null;
  const currentBrandNames = useMemo(
    () => new Set(brands.filter((b) => currentBrands.includes(b.slug)).map((b) => b.name)),
    [brands, currentBrands],
  );

  // Combos span brands/categories by design, so any brand/category filter
  // hides them — "Kits" (?view=kits) is their own view instead.
  const showCombos = kitsOnly || (!currentCategoryName && currentBrandNames.size === 0);

  const q = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (kitsOnly) return [];
    return products.filter(
      (p) =>
        (!currentCategoryName || p.categoryName === currentCategoryName) &&
        (currentBrandNames.size === 0 || currentBrandNames.has(p.brandName)) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.brandName.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)),
    );
  }, [products, kitsOnly, currentCategoryName, currentBrandNames, q]);

  const filteredCombos = useMemo(() => {
    if (!showCombos) return [];
    return combos.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [combos, showCombos, q]);

  const displayItems = useMemo((): DisplayItem[] => {
    if (isDefaultView) {
      // Gift cards and kits are the "what should I get" answer for someone
      // just browsing with nothing narrowed down yet — surface them before
      // the rest of the grid. The instant a filter or sort is applied, this
      // stops (see the branch below) so results order strictly by that
      // criteria instead.
      const giftCards = filteredProducts.filter(isGiftCard);
      const rest = filteredProducts.filter((p) => !isGiftCard(p));
      return [
        ...giftCards.map((data): DisplayItem => ({ kind: "product", data })),
        ...filteredCombos.map((data): DisplayItem => ({ kind: "combo", data })),
        ...rest.map((data): DisplayItem => ({ kind: "product", data })),
      ];
    }

    const sortedCombos = [...filteredCombos];
    const sortedProducts = [...filteredProducts];
    if (sort === "price-asc") {
      sortedCombos.sort((a, b) => a.finalPrice - b.finalPrice);
      sortedProducts.sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sort === "price-desc") {
      sortedCombos.sort((a, b) => b.finalPrice - a.finalPrice);
      sortedProducts.sort((a, b) => b.priceFrom - a.priceFrom);
    } else if (sort === "name") {
      sortedCombos.sort((a, b) => a.name.localeCompare(b.name, "es"));
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return [
      ...sortedCombos.map((data): DisplayItem => ({ kind: "combo", data })),
      ...sortedProducts.map((data): DisplayItem => ({ kind: "product", data })),
    ];
  }, [filteredProducts, filteredCombos, sort, isDefaultView]);

  const total = displayItems.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageItems = displayItems.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

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
        <button type="button" onClick={() => setCategory("")} className={chipClass(!currentCategory && !kitsOnly)}>
          Todas
        </button>
        {combos.length > 0 && (
          <button type="button" onClick={showKitsOnly} className={chipClass(kitsOnly)}>
            Kits
          </button>
        )}
        {orderedCategories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={chipClass(currentCategory === c.slug && !kitsOnly)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <BrandMultiSelect
          brands={brands}
          selected={currentBrands}
          onToggle={toggleBrand}
          onClear={clearBrands}
          className="sm:max-w-xs sm:flex-1"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o marca…"
          className="w-full rounded-full border border-brava-pink-light bg-white px-4 py-2.5 text-sm outline-none focus:border-brava-pink sm:max-w-xs sm:flex-1"
        />
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-brava-muted hover:text-brava-pink-dark"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brava-muted">
          {total} resultado{total === 1 ? "" : "s"}
        </p>
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

      {total === 0 ? (
        <p className="mt-10 text-brava-muted">No encontramos nada con esa búsqueda.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((item) =>
              item.kind === "combo" ? (
                <ComboCard key={`combo-${item.data.slug}`} combo={item.data} />
              ) : (
                <ProductCard key={item.data.slug} product={item.data} />
              ),
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => goToPage(clampedPage - 1)}
                disabled={clampedPage <= 1}
                className="rounded-full border border-brava-pink-light px-4 py-2 text-sm text-brava-ink hover:border-brava-pink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-brava-muted">
                Página {clampedPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(clampedPage + 1)}
                disabled={clampedPage >= totalPages}
                className="rounded-full border border-brava-pink-light px-4 py-2 text-sm text-brava-ink hover:border-brava-pink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
