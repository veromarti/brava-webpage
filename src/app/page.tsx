import { getProducts, getBrands, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
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
  const [products, brands, categories] = await Promise.all([
    getProducts({ brand, category }),
    getBrands(),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold text-brava-ink">Catálogo</h1>
      <p className="mt-1 text-brava-muted">
        {products.length} producto{products.length === 1 ? "" : "s"} disponible
        {products.length === 1 ? "" : "s"}
      </p>

      <CatalogFilters brands={brands} categories={categories} />

      {products.length === 0 ? (
        <p className="mt-10 text-brava-muted">
          No hay productos disponibles con estos filtros.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
