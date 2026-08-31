import { notFound } from "next/navigation";
import Image from "next/image";
import { getComboBySlug } from "@/lib/api";
import { formatCop, variantLabel } from "@/lib/format";
import { ComboOrderForm } from "@/components/ComboOrderForm";

// See the same directive on the home page (src/app/page.tsx) for why.
export const dynamic = "force-dynamic";

export default async function ComboDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const combo = await getComboBySlug(slug);

  if (!combo || !combo.isActive || combo.items.length === 0) {
    notFound();
  }

  const hasDiscount = combo.finalPrice !== combo.originalPrice;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-brava-pink-light">
          <span className="absolute left-3 top-3 rounded-full bg-brava-pink px-3 py-1 text-xs font-medium text-white">
            Kit
          </span>
          {combo.imageUrl ? (
            <Image
              src={combo.imageUrl}
              alt={combo.name}
              width={600}
              height={600}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-brava-ink">{combo.name}</span>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-brava-muted">Kit</p>
          <h1 className="mt-1 font-display text-2xl text-brava-ink">{combo.name}</h1>
          <p className="mt-3 text-brava-ink/80">{combo.description}</p>

          <div className="mt-4 flex items-baseline gap-3">
            {hasDiscount && (
              <span className="text-lg text-brava-muted line-through">{formatCop(combo.originalPrice)}</span>
            )}
            <span className="text-2xl font-bold text-brava-pink-dark">{formatCop(combo.finalPrice)}</span>
          </div>

          <h2 className="mt-6 text-sm font-medium text-brava-ink">Incluye</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {combo.items.map((item) => (
              <li
                key={item.variantId}
                className="flex items-center justify-between rounded-xl border border-brava-pink-light p-3 text-sm"
              >
                <span className="text-brava-ink">
                  {item.productName} — {variantLabel(item)}
                </span>
                <span className="text-brava-muted">{formatCop(item.sellPrice)}</span>
              </li>
            ))}
          </ul>

          <ComboOrderForm comboSlug={combo.slug} comboName={combo.name} finalPrice={combo.finalPrice} />
        </div>
      </div>
    </div>
  );
}
