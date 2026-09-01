// Server-only: every call here runs in a Server Component, never the
// browser (ADR-0005: server-rendered pages). That's also why this is
// API_URL, not NEXT_PUBLIC_API_URL — it's never shipped to the client.
const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error("API_URL no está definida");
}



export interface ProductListItemDto {
  slug: string;
  name: string;
  brandName: string;
  categoryName: string;
  priceFrom: number;
  priceTo: number;
  inStock: boolean;
  imageUrl: string | null;
}

export interface ProductVariantDto {
  id: string;
  sku: string | null;
  toneCode: string | null;
  toneName: string | null;
  units: number | null;
  volumeMl: number | null;
  massG: number | null;
  sellPrice: number | null;
  physicalStock: number;
  availableOnDemand: boolean;
  isActive: boolean;
}

export interface ImageDto {
  id: string;
  url: string;
  altText: string;
  displayOrder: number;
  productVariantId: string | null;
}

export interface ProductDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  brandName: string;
  categoryName: string;
  isActive: boolean;
  variants: ProductVariantDto[];
  images: ImageDto[];
}

export interface BrandListItemDto {
  id: string;
  slug: string;
  name: string;
}

export interface CategoryListItemDto {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
}

// ADR-0005: brand and category browsing. brand/category are slugs, matching
// the API's own filter params — that's also what the filter bar's URL
// (?brand=...&category=...) carries, so this is a direct passthrough.
export async function getProducts(filters?: { brand?: string; category?: string }): Promise<ProductListItemDto[]> {
  const params = new URLSearchParams();
  if (filters?.brand) params.set("brand", filters.brand);
  if (filters?.category) params.set("category", filters.category);
  const query = params.toString();

  const res = await fetch(`${API_URL}/api/products${query ? `?${query}` : ""}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`GET /api/products failed: ${res.status}`);
  }
  return res.json();
}

// Returns null on 404 so pages can call notFound() themselves rather than
// this helper throwing on the one response shape that isn't an error.
export async function getProductBySlug(slug: string): Promise<ProductDetailDto | null> {
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`GET /api/products/${slug} failed: ${res.status}`);
  }
  return res.json();
}

export async function getBrands(): Promise<BrandListItemDto[]> {
  const res = await fetch(`${API_URL}/api/brands`, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`GET /api/brands failed: ${res.status}`);
  }
  return res.json();
}

export async function getCategories(): Promise<CategoryListItemDto[]> {
  const res = await fetch(`${API_URL}/api/categories`, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`GET /api/categories failed: ${res.status}`);
  }
  return res.json();
}

export interface ComboListItemDto {
  slug: string;
  name: string;
  originalPrice: number;
  finalPrice: number;
  imageUrl: string | null;
}

export interface ComboItemDetailDto {
  variantId: string;
  productSlug: string;
  productName: string;
  toneCode: string | null;
  toneName: string | null;
  units: number | null;
  volumeMl: number | null;
  massG: number | null;
  sellPrice: number;
}

export interface ComboDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  originalPrice: number;
  finalPrice: number;
  imageUrl: string | null;
  items: ComboItemDetailDto[];
}

// Combos don't have brand/category filters — they span products by design,
// so unlike getProducts this never takes filter params.
export async function getCombos(): Promise<ComboListItemDto[]> {
  const res = await fetch(`${API_URL}/api/combos`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`GET /api/combos failed: ${res.status}`);
  }
  return res.json();
}

export async function getComboBySlug(slug: string): Promise<ComboDetailDto | null> {
  const res = await fetch(`${API_URL}/api/combos/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`GET /api/combos/${slug} failed: ${res.status}`);
  }
  return res.json();
}

// A product's "main" image is the lowest DisplayOrder one — same ordering
// ProductImageCarousel shows first. Returns null when the product has no
// images (or the product itself couldn't be loaded).
export function mainImageUrl(product: ProductDetailDto | null): string | null {
  if (!product || product.images.length === 0) {
    return null;
  }
  return [...product.images].sort((a, b) => a.displayOrder - b.displayOrder)[0].url;
}

export interface ComboListItemWithImagesDto extends ComboListItemDto {
  // Main image of each product in the kit, in item order, deduped by product.
  productImageUrls: string[];
}

// The /api/combos list only carries the kit's own imageUrl, and kits rarely
// get a dedicated photo. This enriches each kit with the main image of every
// product it contains so the catalog card can build a collage. Every fetch
// below is one of the same revalidate:60 cached GETs used elsewhere, so
// products shared across kits are deduped by Next's fetch cache.
export async function getCombosWithImages(): Promise<ComboListItemWithImagesDto[]> {
  const combos = await getCombos();
  return Promise.all(
    combos.map(async (combo) => {
      const detail = await getComboBySlug(combo.slug);
      const slugs = detail ? [...new Set(detail.items.map((i) => i.productSlug))] : [];
      const products = await Promise.all(slugs.map((slug) => getProductBySlug(slug)));
      return {
        ...combo,
        productImageUrls: products.map(mainImageUrl).filter((url): url is string => url !== null),
      };
    }),
  );
}

export interface ComboDetailWithImagesDto extends ComboDetailDto {
  // Kit's own photo (if any) first, then each product's main image — feeds
  // the detail-page carousel.
  galleryImages: { url: string; altText: string }[];
}

export async function getComboBySlugWithImages(slug: string): Promise<ComboDetailWithImagesDto | null> {
  const combo = await getComboBySlug(slug);
  if (!combo) {
    return null;
  }
  const slugs = [...new Set(combo.items.map((i) => i.productSlug))];
  const products = await Promise.all(slugs.map((s) => getProductBySlug(s)));
  const bySlug = new Map(
    products.filter((p): p is ProductDetailDto => p !== null).map((p) => [p.slug, p]),
  );

  const galleryImages: { url: string; altText: string }[] = [];
  if (combo.imageUrl) {
    galleryImages.push({ url: combo.imageUrl, altText: combo.name });
  }
  for (const s of slugs) {
    const product = bySlug.get(s) ?? null;
    const url = mainImageUrl(product);
    if (url) {
      galleryImages.push({ url, altText: product?.name ?? combo.name });
    }
  }
  return { ...combo, galleryImages };
}
