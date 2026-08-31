import Image from "next/image";
import Link from "next/link";
import type { ComboListItemDto } from "@/lib/api";
import { formatCop } from "@/lib/format";

export function ComboCard({ combo }: { combo: ComboListItemDto }) {
  const hasDiscount = combo.finalPrice !== combo.originalPrice;

  return (
    <Link
      href={`/combos/${combo.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brava-pink-light bg-white transition-shadow hover:shadow-lg hover:shadow-brava-pink-light"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-brava-pink-light text-brava-ink">
        <span className="absolute left-2 top-2 rounded-full bg-brava-pink px-2 py-0.5 text-xs font-medium text-white">
          Kit
        </span>
        {combo.imageUrl ? (
          <Image
            src={combo.imageUrl}
            alt={combo.name}
            width={300}
            height={300}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm">{combo.name}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium text-brava-ink group-hover:text-brava-pink-dark">{combo.name}</h3>
        <div className="mt-auto flex items-center gap-2 pt-2">
          {hasDiscount && (
            <span className="text-sm text-brava-muted line-through">{formatCop(combo.originalPrice)}</span>
          )}
          <span className="font-semibold text-brava-pink-dark">{formatCop(combo.finalPrice)}</span>
        </div>
      </div>
    </Link>
  );
}
