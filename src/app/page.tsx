import { getProducts, getBrands, getCategories, getCombos } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ComboCard } from "@/components/ComboCard";
import { CatalogFilters } from "@/components/CatalogFilters";

// Without this, `next build` tries to statically prerender this page —
// fetching from the API from inside the build container, which isn't
// guaranteed network access on every host (broke the Railway build).
// Forcing per-request rendering also fits ADR-0005 better: prices/stock
// should be fresh on every request, not baked in at build time.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; category?: string }>;
}) {
  const { brand, category } = await searchParams;
  const hasFilters = Boolean(brand || category);

  // Combos span brands/categories by design (that's the point of a kit), so
  // they only show on the unfiltered view — there's no coherent way to
  // decide whether a combo "belongs" to one brand/category filter.
  const [products, brands, categories, combos] = await Promise.all([
    getProducts({ brand, category }),
    getBrands(),
    getCategories(),
    hasFilters ? Promise.resolve([]) : getCombos(),
  ]);

  const totalCount = products.length + combos.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl text-brava-ink">Catálogo</h1>
      <p className="mt-1 text-brava-muted">
        {totalCount} producto{totalCount === 1 ? "" : "s"} disponible
        {totalCount === 1 ? "" : "s"}
      </p>

      <CatalogFilters brands={brands} categories={categories} />

      {totalCount === 0 ? (
        <p className="mt-10 text-brava-muted">
          No hay productos disponibles con estos filtros.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {combos.map((combo) => (
            <ComboCard key={`combo-${combo.slug}`} combo={combo} />
          ))}
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
