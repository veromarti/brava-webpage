import Image from "next/image";
import Link from "next/link";
import type { ProductListItemDto } from "@/lib/api";
import { formatPriceRange } from "@/lib/format";

export function ProductCard({ product }: { product: ProductListItemDto }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brava-pink-light bg-white transition-shadow hover:shadow-lg hover:shadow-brava-pink-light"
    >
      <div className="relative aspect-square overflow-hidden bg-brava-pink-light">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-brava-ink">
            {product.name}
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
            product.inStock ? "bg-white/90 text-brava-pink-dark" : "bg-brava-ink/70 text-white"
          }`}
        >
          {product.inStock ? "Disponible" : "Agotado"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-wide text-brava-muted">{product.brandName}</p>
        <h3 className="font-medium leading-snug text-brava-ink group-hover:text-brava-pink-dark">
          {product.name}
        </h3>
        <p className="text-xs text-brava-muted">{product.categoryName}</p>
        <span className="mt-auto pt-2 text-base font-semibold text-brava-pink-dark">
          {formatPriceRange(product.priceFrom, product.priceTo)}
        </span>
      </div>
    </Link>
  );
}
