"use client";

import { getToken } from "@/lib/auth-client";
import type { BrandListItemDto, CategoryListItemDto, ComboItemDetailDto, ImageDto } from "@/lib/api";

// Must be set (same as API_URL in lib/api.ts). No localhost fallback: a
// missing var here would silently point every admin write at a local API
// in a deployed build, which is worse than failing loudly on the admin
// panel. Public pages don't import this module, so the throw can't take
// the storefront down.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está definida");
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) {
    throw new ApiError("No hay sesión activa.", 401);
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(body || `Error ${res.status}`, res.status);
  }
  return res;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ApiError("Correo o contraseña incorrectos.", res.status);
  }
  return res.json();
}

export interface AdminProductListItemDto {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  categoryName: string;
  isActive: boolean;
  imageCount: number;
}

export async function adminGetProducts(): Promise<AdminProductListItemDto[]> {
  const res = await authedFetch("/api/products/admin");
  return res.json();
}

export interface CreateProductPayload {
  name: string;
  description: string;
  brandId: string;
  categoryId: string;
}

export interface ProductDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
}

export async function adminCreateProduct(payload: CreateProductPayload): Promise<ProductDto> {
  const res = await authedFetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export interface UpdateProductPayload {
  name: string;
  description: string;
  brandId: string;
  categoryId: string;
  isActive: boolean;
}

export async function adminUpdateProduct(slug: string, payload: UpdateProductPayload): Promise<ProductDto> {
  const res = await authedFetch(`/api/products/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminDeactivateProduct(slug: string): Promise<void> {
  await authedFetch(`/api/products/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

// Reuses the bulk-stock endpoint with a single item — it only ever touches
// PhysicalStock, so unlike a full variant PUT there's no CostPrice to
// accidentally null out (same reasoning as adminActivateVariant).
export async function adminUpdateStock(variantId: string, physicalStock: number): Promise<void> {
  await authedFetch("/api/products/variants/bulk-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ variantId, physicalStock }] }),
  });
}

export interface CreateVariantPayload {
  sku: string | null;
  toneCode: string | null;
  toneName: string | null;
  units: number | null;
  volumeMl: number | null;
  massG: number | null;
  costPrice: number | null;
  sellPrice: number | null;
  physicalStock: number;
  availableOnDemand: boolean;
  isActive: boolean;
}

export async function adminCreateVariant(slug: string, payload: CreateVariantPayload) {
  const res = await authedFetch(`/api/products/${encodeURIComponent(slug)}/variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Full replace of a variant's editable fields (PUT) — same shape as create.
// Includes costPrice: the edit form loads it from GET /api/products/{slug}/admin
// (getProductForAdmin), so round-tripping it doesn't wipe the stored value.
export type UpdateVariantPayload = CreateVariantPayload;

export async function adminUpdateVariant(slug: string, variantId: string, payload: UpdateVariantPayload) {
  const res = await authedFetch(`/api/products/${encodeURIComponent(slug)}/variants/${variantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Hard delete — removes the row. The API returns 409 (surfaced here as an
// ApiError with the server's message) when the variant is still in a kit;
// adminDeactivateVariant is the soft alternative that keeps the row.
export async function adminDeleteVariantPermanently(slug: string, variantId: string): Promise<void> {
  await authedFetch(`/api/products/${encodeURIComponent(slug)}/variants/${variantId}/permanent`, {
    method: "DELETE",
  });
}

// No body — the API checks the variant's already-stored SellPrice rather
// than asking the client to resend one. The admin edit page only ever has
// the public ProductVariantDto loaded (no CostPrice on it), so a full PUT
// here would silently null CostPrice out from under whatever was there.
export async function adminActivateVariant(slug: string, variantId: string): Promise<void> {
  await authedFetch(`/api/products/${encodeURIComponent(slug)}/variants/${variantId}/activate`, {
    method: "POST",
  });
}

export async function adminDeactivateVariant(slug: string, variantId: string): Promise<void> {
  await authedFetch(`/api/products/${encodeURIComponent(slug)}/variants/${variantId}`, {
    method: "DELETE",
  });
}

export interface UploadedImageDto {
  id: string;
  url: string;
  altText: string;
  displayOrder: number;
  productVariantId: string | null;
}

// No Content-Type header — the browser sets multipart/form-data with the
// correct boundary itself; setting it manually strips the boundary and the
// API can't parse the body.
export async function adminUploadImage(
  slug: string,
  file: File,
  altText: string,
  displayOrder: number,
  variantId: string | null,
): Promise<UploadedImageDto> {
  const form = new FormData();
  form.append("File", file);
  form.append("AltText", altText);
  form.append("DisplayOrder", String(displayOrder));
  if (variantId) {
    form.append("ProductVariantId", variantId);
  }
  const res = await authedFetch(`/api/products/${encodeURIComponent(slug)}/images`, {
    method: "POST",
    body: form,
  });
  return res.json();
}

// For an image already sitting in the R2 bucket (uploaded straight through
// the Cloudflare dashboard) instead of through the file-upload form above.
// The API rejects any URL that isn't under this project's own bucket.
export async function adminLinkImage(
  slug: string,
  url: string,
  altText: string,
  displayOrder: number,
  variantId: string | null,
): Promise<UploadedImageDto> {
  const res = await authedFetch(`/api/products/${encodeURIComponent(slug)}/images/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, altText, displayOrder, productVariantId: variantId }),
  });
  return res.json();
}

export async function adminDeleteImage(slug: string, imageId: string): Promise<void> {
  await authedFetch(`/api/products/${encodeURIComponent(slug)}/images/${imageId}`, {
    method: "DELETE",
  });
}

// Brand/category lists don't need auth (public endpoints already expose Id —
// see BrandListItemDto's comment on the API side) but live here since only
// admin screens use them.
export async function getBrandsForAdmin(): Promise<BrandListItemDto[]> {
  const res = await fetch(`${API_URL}/api/brands`);
  if (!res.ok) throw new ApiError("No se pudieron cargar las marcas.", res.status);
  return res.json();
}

export async function getCategoriesForAdmin(): Promise<CategoryListItemDto[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new ApiError("No se pudieron cargar las categorías.", res.status);
  return res.json();
}

// Admin variant shape: the public ProductVariantDto in lib/api.ts, plus
// productId and costPrice.
export interface AdminVariantDto {
  id: string;
  productId: string;
  sku: string | null;
  toneCode: string | null;
  toneName: string | null;
  units: number | null;
  volumeMl: number | null;
  massG: number | null;
  costPrice: number | null;
  sellPrice: number | null;
  physicalStock: number;
  availableOnDemand: boolean;
  isActive: boolean;
}

export interface AdminProductDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  brandName: string;
  categoryName: string;
  brandId: string;
  categoryId: string;
  isActive: boolean;
  variants: AdminVariantDto[];
  images: ImageDto[];
}

// GET /api/products/{slug}/admin — authed, and unlike the public detail
// endpoint it carries CostPrice and BrandId/CategoryId.
export async function getProductForAdmin(slug: string): Promise<AdminProductDetailDto> {
  try {
    const res = await authedFetch(`/api/products/${encodeURIComponent(slug)}/admin`);
    return res.json();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new ApiError("Producto no encontrado.", 404);
    }
    throw err;
  }
}

// 409 on a duplicate name (case-insensitive) — the API's own dedup rule,
// surfaced here as whatever message it sends back.
export async function adminCreateBrand(name: string): Promise<BrandListItemDto> {
  const res = await authedFetch("/api/brands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export interface AdminComboListItemDto {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  originalPrice: number;
  manualPrice: number | null;
  finalPrice: number;
  itemCount: number;
}

export interface AdminComboDetailDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  originalPrice: number;
  manualPrice: number | null;
  finalPrice: number;
  // Resolved image: the kit's own photo if set, otherwise the API falls back
  // to the first member product's image. hasOwnImage tells the two apart.
  imageUrl: string | null;
  hasOwnImage: boolean;
  items: ComboItemDetailDto[];
}

export interface ComboDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  originalPrice: number;
  manualPrice: number | null;
  finalPrice: number;
  imageUrl: string | null;
  items: ComboItemDetailDto[];
}

export interface ComboPayload {
  name: string;
  description: string;
  variantIds: string[];
  manualPrice: number | null;
}

export async function adminGetCombos(): Promise<AdminComboListItemDto[]> {
  const res = await authedFetch("/api/combos/admin");
  return res.json();
}

export async function adminGetCombo(slug: string): Promise<AdminComboDetailDto> {
  const res = await authedFetch(`/api/combos/${encodeURIComponent(slug)}/admin`);
  return res.json();
}

export async function adminCreateCombo(payload: ComboPayload): Promise<ComboDto> {
  const res = await authedFetch("/api/combos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminUpdateCombo(
  slug: string,
  payload: ComboPayload & { isActive: boolean },
): Promise<ComboDto> {
  const res = await authedFetch(`/api/combos/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminDeactivateCombo(slug: string): Promise<void> {
  await authedFetch(`/api/combos/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

// A kit has a single image slot. Upload replaces whatever was there; the API
// cleans up the previous object when it was one we'd uploaded for this kit.
// No Content-Type header on the upload — the browser sets the multipart
// boundary itself (same reason as adminUploadImage).
export async function adminUploadComboImage(slug: string, file: File): Promise<{ imageUrl: string }> {
  const form = new FormData();
  form.append("File", file);
  const res = await authedFetch(`/api/combos/${encodeURIComponent(slug)}/image`, {
    method: "POST",
    body: form,
  });
  return res.json();
}

// For an image already in the R2 bucket (uploaded via the Cloudflare
// dashboard). The API rejects any URL outside this project's bucket.
export async function adminLinkComboImage(slug: string, url: string): Promise<{ imageUrl: string }> {
  const res = await authedFetch(`/api/combos/${encodeURIComponent(slug)}/image/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function adminRemoveComboImage(slug: string): Promise<void> {
  await authedFetch(`/api/combos/${encodeURIComponent(slug)}/image`, { method: "DELETE" });
}

// --- Delivery zones (Phase 1) ------------------------------------------------

export interface DeliveryZoneDto {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export async function adminGetDeliveryZones(): Promise<DeliveryZoneDto[]> {
  const res = await authedFetch("/api/delivery-zones");
  return res.json();
}

// 409 (ApiError with the server message) on a duplicate zone name.
export async function adminCreateDeliveryZone(name: string, price: number): Promise<DeliveryZoneDto> {
  const res = await authedFetch("/api/delivery-zones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price }),
  });
  return res.json();
}

export async function adminUpdateDeliveryZone(
  id: string,
  payload: { name: string; price: number; isActive: boolean },
): Promise<DeliveryZoneDto> {
  const res = await authedFetch(`/api/delivery-zones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
