import Link from "next/link";
import type { BrandListItemDto } from "@/lib/api";

// No brand logos exist as assets yet — plain text links, same reasoning as
// Hero's lack of campaign photography. Each deep-links into /catalogo with
// that brand pre-applied, same ?brand= param <Catalog> reads on mount.
export function BrandStrip({ brands }: { brands: BrandListItemDto[] }) {
  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="font-display text-2xl text-brava-ink">Nuestras marcas</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/catalogo?brand=${brand.slug}`}
            className="rounded-full border border-brava-pink-light px-4 py-2 text-sm font-medium text-brava-ink transition-colors hover:border-brava-pink hover:text-brava-pink-dark"
          >
            {brand.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
