import { notFound } from "next/navigation";
import { getProductBySlug, mainImageUrl } from "@/lib/api";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductOrderForm } from "@/components/ProductOrderForm";

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
          <h1 className="mt-1 font-display text-2xl text-brava-ink">{product.name}</h1>
          <p className="mt-3 whitespace-pre-line text-brava-ink/80">{product.description}</p>

          <ProductOrderForm
            productSlug={product.slug}
            productName={product.name}
            imageUrl={mainImageUrl(product)}
            variants={activeVariants}
          />
        </div>
      </div>
    </div>
  );
}
