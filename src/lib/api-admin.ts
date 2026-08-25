"use client";

import { getToken } from "@/lib/auth-client";
import type { BrandListItemDto, CategoryListItemDto } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5299";

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

export async function getProductForAdmin(slug: string) {
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new ApiError("Producto no encontrado.", res.status);
  return res.json();
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
