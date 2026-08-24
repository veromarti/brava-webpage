// Server-only: every call here runs in a Server Component, never the
// browser (ADR-0005: server-rendered pages). That's also why this is
// API_URL, not NEXT_PUBLIC_API_URL — it's never shipped to the client.
const API_URL = process.env.API_URL ?? "http://localhost:5299";

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
