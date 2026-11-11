import Link from "next/link";
import type { CategoryListItemDto } from "@/lib/api";

// Quick jump-in pills for the landing page — deep-link straight into
// /catalogo with the category already applied, same ?category= param
// <Catalog> already reads from the URL on mount.
export function CategoryStrip({ categories }: { categories: CategoryListItemDto[] }) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/catalogo?category=${category.slug}`}
            className="shrink-0 rounded-full border border-brava-pink-light bg-white px-5 py-2 text-sm font-medium text-brava-ink transition-colors hover:border-brava-pink hover:text-brava-pink-dark"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
