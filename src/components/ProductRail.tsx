import type { ProductListItemDto } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

// Shared by the landing page's "Novedades" and "Lo más vendido" sections —
// same horizontally-scrolling card strip, different data feeding it.
// Renders nothing (not even the heading) when products is empty, so a rail
// whose backing endpoint isn't live yet — or just hasn't got any matches —
// doesn't leave an empty, oddly-titled gap on the page.
export function ProductRail({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle?: string;
  products: ProductListItemDto[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl text-brava-ink">{title}</h2>
      </div>
      {subtitle && <p className="mt-1 text-sm text-brava-muted">{subtitle}</p>}

      <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.slug} className="w-48 shrink-0 sm:w-56">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
