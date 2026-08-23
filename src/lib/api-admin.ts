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

export async function adminDeactivateVariant(slug: string, variantId: string): Promise<void> {
  await authedFetch(`/api/products/${encodeURIComponent(slug)}/variants/${variantId}`, {
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
