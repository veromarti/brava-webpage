import { getProducts, getBrands, getCategories, getCombosWithImages } from "@/lib/api";
import { Catalog } from "@/components/Catalog";
import { StickerBanner, type StickerImage } from "@/components/StickerBanner";

// Decorative only — empty alt so screen readers skip the repeating strip
// instead of announcing 18 unlabeled images.
const CATALOG_STICKERS: StickerImage[] = [
  "0b13ec99-6fc8-434f-ad31-db1f7b291fa2",
  "0e31d172-52e7-4c38-a700-a2cc797c7441",
  "82902665-d66a-48a4-818e-51950edd69d5",
  "8e7a2afe-70c4-43c3-9ae7-beda8511fa74",
  "9020addf-a41e-4cc4-86ca-ed1106f4a622",
  "dfe9ec49-fd04-489c-8d0a-e09227d8e47b",
  "e3caf9f9-37dc-4580-ae73-45a32e29e9af",
  "eb4ebfe7-4b86-4393-98f1-76d68b51fc9d",
  "ed8e1a61-1541-487e-abae-fdbef7694be2",
].map((id) => ({ src: `/stickers/${id}.webp`, alt: "" }));

// Without this, `next build` tries to statically prerender this page —
// fetching from the API from inside the build container, which isn't
// guaranteed network access on every host (broke the Railway build).
// Forcing per-request rendering also fits ADR-0005 better: prices/stock
// should be fresh on every request, not baked in at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Category/brand/search/sort/pagination all happen client-side in
  // <Catalog> — the catalogue is small enough (~150 items) that fetching it
  // once here and refining it in the browser is simpler than a filtered
  // round-trip per change, and it's what lets brand filtering support
  // multiple brands at once without extra API params.
  const [products, brands, categories, combos] = await Promise.all([
    getProducts(),
    getBrands(),
    getCategories(),
    getCombosWithImages(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl text-brava-ink">Catálogo</h1>
      <p className="mt-1 text-brava-muted">Maquillaje y skincare · pedidos por WhatsApp</p>

      <StickerBanner images={CATALOG_STICKERS} durationSeconds={28} />

      <Catalog products={products} combos={combos} brands={brands} categories={categories} />
    </div>
  );
}
