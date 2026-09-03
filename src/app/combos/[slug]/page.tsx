import { notFound } from "next/navigation";
import { getComboBySlugWithImages } from "@/lib/api";
import { formatCop, variantLabel } from "@/lib/format";
import { ComboOrderForm } from "@/components/ComboOrderForm";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";

// See the same directive on the home page (src/app/page.tsx) for why.
export const dynamic = "force-dynamic";

export default async function ComboDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const combo = await getComboBySlugWithImages(slug);

  if (!combo || !combo.isActive || combo.items.length === 0) {
    notFound();
  }

  const hasDiscount = combo.finalPrice !== combo.originalPrice;

  // A kit rarely has its own photos, so the carousel is built from the main
  // image of each product it contains (see getComboBySlugWithImages). Shaped
  // as ImageDto so ProductImageCarousel can render it unchanged.
  const carouselImages = combo.galleryImages.map((img, i) => ({
    id: `kit-img-${i}`,
    url: img.url,
    altText: img.altText,
    displayOrder: i,
    productVariantId: null,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative">
          <span className="absolute left-3 top-3 z-10 rounded-full bg-brava-pink px-3 py-1 text-xs font-medium text-white">
            Kit
          </span>
          <ProductImageCarousel key={combo.slug} images={carouselImages} productName={combo.name} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-brava-muted">Kit</p>
          <h1 className="mt-1 font-display text-2xl text-brava-ink">{combo.name}</h1>
          <p className="mt-3 whitespace-pre-line text-brava-ink/80">{combo.description}</p>

          <div className="mt-4 flex items-baseline gap-3">
            {hasDiscount && (
              <span className="text-lg text-brava-muted line-through">{formatCop(combo.originalPrice)}</span>
            )}
            <span className="text-2xl font-bold text-brava-pink-dark">{formatCop(combo.finalPrice)}</span>
          </div>

          <h2 className="mt-6 text-sm font-medium text-brava-ink">
            Incluye <span className="text-brava-muted">({combo.items.length})</span>
          </h2>
          {/* Compact list — a kit can bundle many products, so each one is a
              thin row inside a single frame, not a full bordered card like a
              standalone product. */}
          <ul className="mt-2 divide-y divide-brava-pink-light rounded-xl border border-brava-pink-light text-sm">
            {combo.items.map((item) => (
              <li key={item.variantId} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-brava-ink">
                  {item.productName} — {variantLabel(item)}
                </span>
                <span className="shrink-0 text-brava-muted">{formatCop(item.sellPrice)}</span>
              </li>
            ))}
          </ul>

          <ComboOrderForm
            comboSlug={combo.slug}
            comboName={combo.name}
            finalPrice={combo.finalPrice}
            imageUrl={combo.galleryImages[0]?.url ?? null}
          />
        </div>
      </div>
    </div>
  );
}
