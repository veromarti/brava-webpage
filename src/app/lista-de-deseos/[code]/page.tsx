import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSharedWishlist, getComboBySlug, currentWishlistPrice, type SharedWishlistItemDto } from "@/lib/api";
import { formatCop } from "@/lib/format";
import { WhatsAppOrderButton } from "@/components/WhatsAppOrderButton";

// Same reason as the catalog pages: prices/availability must be fresh per
// request, and there's no build-time network to the API.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const wishlist = await getSharedWishlist(code);
  if (!wishlist) {
    return { title: "Lista no encontrada — BRAVA" };
  }
  return {
    title: `La lista de deseos de ${wishlist.ownerName} — BRAVA`,
    description:
      wishlist.note ??
      `Mira qué le gustaría a ${wishlist.ownerName} de BRAVA y regálaselo. Pedidos por WhatsApp.`,
  };
}

function detailHref(item: SharedWishlistItemDto): string {
  return item.type === "product" ? `/products/${item.slug}` : `/combos/${item.slug}`;
}

// For the WhatsApp order message — WhatsAppOrderButton appends " x{quantity}"
// itself, so this deliberately leaves that off (same convention as every
// other call site of that component).
function itemLabel(item: SharedWishlistItemDto): string {
  const variant = item.variantLabel ? ` (${item.variantLabel})` : "";
  return `${item.name}${item.type === "combo" ? " (kit)" : ""}${variant}`;
}

// A shared wishlist stores a product's real variant id (needed for live
// pricing already), but only a combo's slug — this resolves its real id too,
// the one thing still missing to place an order line for it. Reuses the same
// revalidate:60 cache getComboBySlug/currentWishlistPrice already draw from,
// so this costs no extra network round trip in practice.
async function resolveComboId(slug: string): Promise<string | null> {
  const combo = await getComboBySlug(slug).catch(() => null);
  return combo?.id ?? null;
}

export default async function SharedWishlistPage({ params }: Params) {
  const { code } = await params;
  const wishlist = await getSharedWishlist(code);
  if (!wishlist) {
    notFound();
  }

  // Re-price every line against the live catalog so the gift-giver sees today's
  // price and availability, not the snapshot from when the list was saved. A
  // failed lookup falls back to the stored price rather than hiding the line.
  const lines = await Promise.all(
    wishlist.items.map(async (item) => {
      const [livePrice, comboId] = await Promise.all([
        currentWishlistPrice(item.type, item.slug, item.variantId).catch(() => item.unitPrice),
        item.type === "combo" ? resolveComboId(item.slug) : Promise.resolve(null),
      ]);
      return {
        ...item,
        price: livePrice ?? item.unitPrice,
        unavailable: livePrice === null,
        productVariantId: item.type === "product" ? item.variantId : null,
        comboId,
      };
    }),
  );

  // Already-gifted lines drop out the same way an unavailable one does — a
  // later visitor shouldn't be able to buy (or count toward the total)
  // something someone already bought.
  const available = lines.filter((l) => !l.unavailable && !l.isGifted);
  const total = available.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const hasUnavailable = lines.some((l) => l.unavailable);
  const hasGifted = lines.some((l) => l.isGifted);
  const giftNotes = `Regalo de la lista de deseos de ${wishlist.ownerName} (código ${wishlist.code}).`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-xs uppercase tracking-wide text-brava-muted">Lista de regalos</p>
      <h1 className="mt-1 font-display text-3xl text-brava-ink">
        La lista de deseos de {wishlist.ownerName}
      </h1>
      <p className="mt-1 text-brava-muted">
        Esto es lo que le encantaría de BRAVA. Puedes regalar toda la lista o solo un detalle.
      </p>

      {wishlist.note && (
        <p className="mt-6 rounded-xl border border-brava-pink-light bg-white px-4 py-3 text-brava-ink">
          <span className="mr-1">“</span>
          {wishlist.note}
          <span className="ml-1">”</span>
        </p>
      )}

      {(hasUnavailable || hasGifted) && (
        <p className="mt-6 rounded-xl border border-brava-pink-light bg-white px-4 py-3 text-sm text-brava-muted">
          {hasGifted && "Los productos ya regalados no se incluyen en el total. "}
          {hasUnavailable && "Los productos marcados como no disponibles no se incluyen en el total."}
        </p>
      )}

      {/* Two equal-size cards per row: a small thumbnail + name/price/qty on
          top, "Regalar esto" pinned below via mt-auto so it lands in the same
          spot in every card regardless of how much text is above it. */}
      <ul className="mt-8 grid grid-cols-2 gap-3">
        {lines.map((line) => (
          <li
            key={line.id}
            className={`flex h-full flex-col rounded-xl border border-brava-pink-light bg-white p-3 ${
              line.unavailable || line.isGifted ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <Link
                href={detailHref(line)}
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brava-pink-light"
              >
                {line.imageUrl ? (
                  <Image
                    src={line.imageUrl}
                    alt={line.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-1 text-center text-[9px] leading-tight text-brava-ink">
                    {line.name}
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={detailHref(line)}
                  className="line-clamp-2 text-sm font-medium leading-snug text-brava-ink hover:text-brava-pink-dark"
                >
                  {line.name}
                  {line.type === "combo" && " (kit)"}
                </Link>
                {line.variantLabel && (
                  <p className="line-clamp-1 text-xs text-brava-muted">{line.variantLabel}</p>
                )}
                <p className="text-sm font-semibold text-brava-pink-dark">{formatCop(line.price)}</p>
                <p className="text-xs text-brava-muted">Cantidad: {line.quantity}</p>
              </div>
            </div>

            <div className="mt-auto pt-3">
              {line.isGifted ? (
                <p className="text-xs font-medium text-brava-pink-dark">🎁 Ya fue regalado</p>
              ) : line.unavailable ? (
                <p className="text-xs font-medium text-red-600">Ya no disponible</p>
              ) : (
                <WhatsAppOrderButton
                  items={[
                    {
                      productVariantId: line.productVariantId,
                      comboId: line.comboId,
                      quantity: line.quantity,
                      label: itemLabel(line),
                    },
                  ]}
                  total={line.price * line.quantity}
                  label="Regalar esto"
                  giftFor={wishlist.ownerName}
                  notes={giftNotes}
                  markGiftedWishlistCode={wishlist.code}
                  markGiftedItemIds={[line.id]}
                  className="block w-full rounded-full border border-brava-pink px-4 py-2 text-center text-sm font-medium text-brava-pink-dark transition-colors hover:bg-brava-pink hover:text-white"
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-brava-pink-light pt-4">
        <span className="font-medium text-brava-ink">Total estimado</span>
        <span className="text-xl font-bold text-brava-pink-dark">{formatCop(total)}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {available.length > 0 && (
          <WhatsAppOrderButton
            items={available.map((line) => ({
              productVariantId: line.productVariantId,
              comboId: line.comboId,
              quantity: line.quantity,
              label: itemLabel(line),
            }))}
            total={total}
            label="Regalar todo"
            giftFor={wishlist.ownerName}
            notes={giftNotes}
            markGiftedWishlistCode={wishlist.code}
            markGiftedItemIds={available.map((line) => line.id)}
            className="rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
          />
        )}
        <Link href="/" className="text-sm text-brava-muted hover:text-brava-pink-dark hover:underline">
          Ver el catálogo de BRAVA
        </Link>
      </div>

      <p className="mt-10 text-sm text-brava-muted">
        ¿Quieres armar la tuya?{" "}
        <Link href="/lista-de-deseos" className="text-brava-pink-dark hover:underline">
          Crea tu lista de deseos
        </Link>
        .
      </p>
    </div>
  );
}
