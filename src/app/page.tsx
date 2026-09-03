import { getProducts, getBrands, getCategories, getCombos, getCombosWithImages } from "@/lib/api";
import { CatalogFilters } from "@/components/CatalogFilters";
import { CatalogGrid } from "@/components/CatalogGrid";

// Without this, `next build` tries to statically prerender this page —
// fetching from the API from inside the build container, which isn't
// guaranteed network access on every host (broke the Railway build).
// Forcing per-request rendering also fits ADR-0005 better: prices/stock
// should be fresh on every request, not baked in at build time.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; category?: string; view?: string }>;
}) {
  const { brand, category, view } = await searchParams;
  const kitsOnly = view === "kits";
  const hasProductFilters = Boolean(brand || category);

  // Combos span brands/categories by design (that's the point of a kit), so
  // a brand/category filter hides them — but the "Kits" pill (?view=kits) is
  // their own view, showing every kit and no standalone products.
  const showCombos = kitsOnly || !hasProductFilters;

  const [products, brands, categories, allCombos, combos] = await Promise.all([
    kitsOnly ? Promise.resolve([]) : getProducts({ brand, category }),
    getBrands(),
    getCategories(),
    getCombos(), // cheap + cached; just to know whether to show the Kits pill
    showCombos ? getCombosWithImages() : Promise.resolve([]),
  ]);

  const totalCount = products.length + combos.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl text-brava-ink">Catálogo</h1>
      <p className="mt-1 text-brava-muted">Maquillaje y skincare · pedidos por WhatsApp</p>

      <CatalogFilters brands={brands} categories={categories} hasKits={allCombos.length > 0} />

      {totalCount === 0 ? (
        <p className="mt-10 text-brava-muted">No hay resultados con estos filtros.</p>
      ) : (
        <CatalogGrid products={products} combos={combos} />
      )}
    </div>
  );
}
