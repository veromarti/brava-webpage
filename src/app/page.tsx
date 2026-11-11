import { getBrands, getCategories, getNewProducts, getBestSellers } from "@/lib/api";
import { Hero } from "@/components/Hero";
import { CategoryStrip } from "@/components/CategoryStrip";
import { ProductRail } from "@/components/ProductRail";
import { TrustStrip } from "@/components/TrustStrip";
import { BrandStrip } from "@/components/BrandStrip";

// Same reasoning as /catalogo: prices/stock and the curated rails should be
// fresh per request, not baked into a build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [brands, categories, newProducts, bestSellers] = await Promise.all([
    getBrands(),
    getCategories(),
    getNewProducts(),
    getBestSellers(),
  ]);

  return (
    <>
      <Hero />
      <CategoryStrip categories={categories} />
      <ProductRail title="Novedades" subtitle="Lo más reciente del catálogo" products={newProducts} />
      <ProductRail title="Lo más vendido" subtitle="Las favoritas de nuestras clientas" products={bestSellers} />
      <TrustStrip />
      <BrandStrip brands={brands} />
    </>
  );
}
