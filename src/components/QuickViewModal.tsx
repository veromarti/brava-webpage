"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import type { ProductDetailDto, ComboDetailDto } from "@/lib/api";
import { fetchCatalogItem } from "@/lib/catalogItemClient";
import { pickMainImage } from "@/lib/format";
import { ProductOrderForm } from "@/components/ProductOrderForm";
import { ComboOrderForm } from "@/components/ComboOrderForm";

type Target =
  | { type: "product"; slug: string }
  | { type: "combo"; slug: string };

// The catalog-glance modal a card's "quick view" (eye icon) opens — same
// portal/backdrop pattern as WhatsAppOrderButton's modal, so only one
// overlay can ever be open at a time. Deliberately thin: it fetches the full
// detail on open (the catalog grid only has the thin list DTOs) and then
// just renders the exact same ProductOrderForm/ComboOrderForm the detail
// page uses, so "add to cart"/"pedir por WhatsApp" behave identically
// wherever they're triggered from — no separate quick-view-only logic to
// keep in sync.
export function QuickViewModal({ target, onClose }: { target: Target; onClose: () => void }) {
  const [detail, setDetail] = useState<ProductDetailDto | ComboDetailDto | "error" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result =
        target.type === "product"
          ? await fetchCatalogItem("product", target.slug)
          : await fetchCatalogItem("combo", target.slug);
      if (!cancelled) setDetail(result ?? "error");
    })();
    return () => {
      cancelled = true;
    };
  }, [target.type, target.slug]);

  const detailHref = target.type === "product" ? `/products/${target.slug}` : `/combos/${target.slug}`;
  const imageUrl =
    detail && detail !== "error"
      ? target.type === "product"
        ? pickMainImage((detail as ProductDetailDto).images)
        : (detail as ComboDetailDto).imageUrl
      : null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-medium text-brava-ink">Vista rápida</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-brava-muted hover:text-brava-ink"
          >
            ✕
          </button>
        </div>

        {detail === null && <p className="mt-6 text-sm text-brava-muted">Cargando…</p>}

        {detail === "error" && (
          <div className="mt-6">
            <p className="text-sm text-brava-muted">
              Ya no está disponible. Puede que se haya agotado o dejado de venderse.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 text-sm font-medium text-brava-pink-dark hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {detail !== null && detail !== "error" && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brava-pink-light">
                {imageUrl ? (
                  <Image src={imageUrl} alt={detail.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] text-brava-ink">
                    {detail.name}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                {target.type === "product" && (
                  <p className="text-xs uppercase tracking-wide text-brava-muted">
                    {(detail as ProductDetailDto).brandName}
                  </p>
                )}
                <h2 className="font-medium leading-snug text-brava-ink">{detail.name}</h2>
                {target.type === "product" && (
                  <p className="text-xs text-brava-muted">{(detail as ProductDetailDto).categoryName}</p>
                )}
              </div>
            </div>

            {target.type === "product" ? (
              <ProductOrderForm
                productSlug={target.slug}
                productName={detail.name}
                imageUrl={imageUrl}
                variants={(detail as ProductDetailDto).variants}
              />
            ) : (
              <ComboOrderForm
                comboId={(detail as ComboDetailDto).id}
                comboSlug={target.slug}
                comboName={detail.name}
                finalPrice={(detail as ComboDetailDto).finalPrice}
                imageUrl={imageUrl}
              />
            )}

            <Link href={detailHref} onClick={onClose} className="text-sm text-brava-pink-dark hover:underline">
              Ver todos los detalles →
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
