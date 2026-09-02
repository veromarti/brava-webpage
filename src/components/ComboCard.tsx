import Link from "next/link";
import type { ComboListItemWithImagesDto } from "@/lib/api";
import { formatCop } from "@/lib/format";
import { KitCollage } from "@/components/KitCollage";

export function ComboCard({ combo }: { combo: ComboListItemWithImagesDto }) {
  const hasDiscount = combo.finalPrice !== combo.originalPrice;
  // Kit's own photo first (if it has one), then its products' main images.
  // Deduped: combo.imageUrl is often the API's fallback to the first
  // product's image, already present in productImageUrls.
  const images = [
    ...new Set([...(combo.imageUrl ? [combo.imageUrl] : []), ...combo.productImageUrls]),
  ];

  return (
    <Link
      href={`/combos/${combo.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brava-pink-light bg-white transition-shadow hover:shadow-lg hover:shadow-brava-pink-light"
    >
      <div className="relative aspect-square overflow-hidden bg-brava-pink-light">
        <span className="absolute left-2 top-2 z-10 rounded-full bg-brava-pink px-2 py-0.5 text-xs font-medium text-white">
          Kit
        </span>
        <KitCollage images={images} name={combo.name} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium leading-snug text-brava-ink group-hover:text-brava-pink-dark">
          {combo.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
          {hasDiscount && (
            <span className="text-sm text-brava-muted line-through">
              {formatCop(combo.originalPrice)}
            </span>
          )}
          <span className="text-base font-semibold text-brava-pink-dark">
            {formatCop(combo.finalPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
