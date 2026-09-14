import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSharedWishlist, currentWishlistPrice, type SharedWishlistItemDto } from "@/lib/api";
import { formatCop } from "@/lib/format";
import { buildWhatsAppGiftLink } from "@/lib/whatsapp";

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

async function absoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

function detailHref(item: SharedWishlistItemDto): string {
  return item.type === "product" ? `/products/${item.slug}` : `/combos/${item.slug}`;
}

function giftLabel(item: SharedWishlistItemDto): string {
  const variant = item.variantLabel ? ` (${item.variantLabel})` : "";
  return `${item.name}${item.type === "combo" ? " (kit)" : ""}${variant} x${item.quantity}`;
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
      const livePrice = await currentWishlistPrice(item.type, item.slug, item.variantId).catch(
        () => item.unitPrice,
      );
      return { ...item, price: livePrice ?? item.unitPrice, unavailable: livePrice === null };
    }),
  );

  const available = lines.filter((l) => !l.unavailable);
  const total = available.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const hasUnavailable = lines.some((l) => l.unavailable);

  const listUrl = await absoluteUrl(`/lista-de-deseos/${wishlist.code}`);

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

      {hasUnavailable && (
        <p className="mt-6 rounded-xl border border-brava-pink-light bg-white px-4 py-3 text-sm text-brava-muted">
          Los productos marcados como no disponibles no se incluyen en el total.
        </p>
      )}

      {/* Grid, not a stacked list: every card gets the same footprint (grid
          rows stretch items to equal height) regardless of how long a name
          runs, and "Regalar esto" always lands in the same spot at the
          bottom (mt-auto), below the image and info — never squeezed beside
          them like a long name used to do in a single row. */}
      <ul className="mt-8 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3">
        {lines.map((line) => (
          <li
            key={`${line.slug}:${line.variantId ?? ""}`}
            className={`flex flex-col overflow-hidden rounded-2xl border border-brava-pink-light bg-white ${
              line.unavailable ? "opacity-60" : ""
            }`}
          >
            <Link
              href={detailHref(line)}
              className="relative aspect-square overflow-hidden bg-brava-pink-light"
            >
              {line.imageUrl ? (
                <Image
                  src={line.imageUrl}
                  alt={line.name}
                  fill
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm text-brava-ink">
                  {line.name}
                </div>
              )}
            </Link>

            <div className="flex flex-1 flex-col gap-1 p-4">
              <Link
                href={detailHref(line)}
                className="line-clamp-2 font-medium leading-snug text-brava-ink hover:text-brava-pink-dark"
              >
                {line.name}
                {line.type === "combo" && " (kit)"}
              </Link>
              {line.variantLabel && (
                <p className="line-clamp-1 text-sm text-brava-muted">{line.variantLabel}</p>
              )}
              <p className="text-sm font-semibold text-brava-pink-dark">{formatCop(line.price)}</p>
              <p className="text-xs text-brava-muted">Cantidad: {line.quantity}</p>
              {line.unavailable && (
                <p className="text-xs font-medium text-red-600">Ya no disponible</p>
              )}

              {!line.unavailable && (
                <a
                  href={buildWhatsAppGiftLink({
                    ownerName: wishlist.ownerName,
                    itemLabel: giftLabel(line),
                    url: listUrl,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto block rounded-full border border-brava-pink px-4 py-2 text-center text-sm font-medium text-brava-pink-dark transition-colors hover:bg-brava-pink hover:text-white"
                >
                  Regalar esto
                </a>
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
          <a
            href={buildWhatsAppGiftLink({
              ownerName: wishlist.ownerName,
              itemLabel: null,
              url: listUrl,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
          >
            Regalar por WhatsApp
          </a>
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
