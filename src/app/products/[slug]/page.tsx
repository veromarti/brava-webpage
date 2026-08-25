import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/api";
import { formatCop, variantLabel, stockStatus } from "@/lib/format";
import { buildWhatsAppOrderLink } from "@/lib/whatsapp";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";

// See the same directive on the home page (src/app/page.tsx) for why.
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // ADR-0003: a product with zero active/priced variants has nothing to show —
  // GET /api/products/{slug} still returns it (e.g. for an admin checking a
  // draft), but the public page treats "no active variants" as not found.
  if (!product || !product.isActive || !product.variants.some((v) => v.isActive && v.sellPrice !== null)) {
    notFound();
  }

  const activeVariants = product.variants.filter((v) => v.isActive && v.sellPrice !== null);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <ProductImageCarousel images={product.images} productName={product.name} />

        <div>
          <p className="text-xs uppercase tracking-wide text-brava-muted">
            {product.brandName} · {product.categoryName}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-brava-ink">{product.name}</h1>
          <p className="mt-3 text-brava-ink/80">{product.description}</p>

          <div className="mt-6 flex flex-col gap-3">
            {activeVariants.map((variant) => {
              const status = stockStatus(variant);
              return (
                <div
                  key={variant.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-brava-pink-light p-4"
                >
                  <div>
                    <p className="font-medium text-brava-ink">{variantLabel(variant)}</p>
                    <p className="text-sm font-semibold text-brava-pink-dark">
                      {formatCop(variant.sellPrice!)}
                    </p>
                    <p
                      className={
                        status.tone === "in-stock"
                          ? "text-xs text-emerald-700"
                          : status.tone === "on-demand"
                            ? "text-xs text-amber-700"
                            : "text-xs text-brava-muted"
                      }
                    >
                      {status.label}
                    </p>
                  </div>
                  {status.tone !== "out-of-stock" && (
                    <a
                      href={buildWhatsAppOrderLink({
                        productName: product.name,
                        variantLabel: variantLabel(variant),
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full bg-brava-pink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark"
                    >
                      Pedir por WhatsApp
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
