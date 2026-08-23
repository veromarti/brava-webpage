import Link from "next/link";
import type { ProductListItemDto } from "@/lib/api";
import { formatPriceRange } from "@/lib/format";

export function ProductCard({ product }: { product: ProductListItemDto }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brava-pink-light bg-white transition-shadow hover:shadow-lg hover:shadow-brava-pink-light"
    >
      <div className="flex aspect-square items-center justify-center bg-brava-pink-light text-brava-pink">
        {/* Product images come from R2 (Cloudflare) once uploaded — placeholder
            until GET /api/products/{slug} images are wired to the listing endpoint. */}
        <span className="text-sm">{product.name}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-wide text-brava-muted">{product.brandName}</p>
        <h3 className="font-medium text-brava-ink group-hover:text-brava-pink-dark">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-brava-pink-dark">
            {formatPriceRange(product.priceFrom, product.priceTo)}
          </span>
          {!product.inStock && (
            <span className="text-xs font-medium text-brava-muted">Agotado</span>
          )}
        </div>
      </div>
    </Link>
  );
}
