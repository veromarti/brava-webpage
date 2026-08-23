import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold text-brava-ink">Catálogo</h1>
      <p className="mt-1 text-brava-muted">
        {products.length} producto{products.length === 1 ? "" : "s"} disponible
        {products.length === 1 ? "" : "s"}
      </p>

      {products.length === 0 ? (
        <p className="mt-10 text-brava-muted">
          No hay productos disponibles en este momento.
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
