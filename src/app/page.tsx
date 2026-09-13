import { getProducts, getBrands, getCategories, getCombosWithImages } from "@/lib/api";
import { Catalog } from "@/components/Catalog";
import { StickerBanner, type StickerImage } from "@/components/StickerBanner";

// Decorative only — empty alt so screen readers skip the repeating strip
// instead of announcing 18 unlabeled images. Filenames are plain
// sticker-N, not the original UUIDs: vinext-cloudflare's
// --experimental-warm-cdn-cache deploy step misread a UUID-named static
// asset as a Worker version ID and failed the deploy (100146 "version
// could not be found") — renaming sidesteps that beta-tool bug.
const CATALOG_STICKERS: StickerImage[] = Array.from({ length: 9 }, (_, i) => ({
  src: `/stickers/sticker-${i + 1}.webp`,
  alt: "",
}));

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
