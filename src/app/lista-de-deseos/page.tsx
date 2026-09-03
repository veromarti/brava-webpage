"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/components/WishlistProvider";
import { formatCop } from "@/lib/format";
import { buildWhatsAppWishlistLink } from "@/lib/whatsapp";

export default function WishlistPage() {
  const { items, loaded, removeItem, updateQuantity, clear, syncPrices } = useWishlist();

  // Stored prices are frozen at add-time. On opening the list, re-check each
  // line against the live API (via /api/wishlist-prices, since lib/api.ts is
  // server-only) so the total and the WhatsApp message reflect current
  // prices. `changed` / `unavailable` drive the on-screen flags.
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!loaded || syncedRef.current || items.length === 0) return;
    syncedRef.current = true;

    const snapshot = items.map((i) => ({
      key: i.key,
      type: i.type,
      slug: i.slug,
      unitPrice: i.unitPrice,
    }));

    (async () => {
      try {
        const res = await fetch("/api/wishlist-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: snapshot.map(({ key, type, slug }) => ({ key, type, slug })),
          }),
        });
        if (!res.ok) return;
        const { prices } = (await res.json()) as { prices: Record<string, number | null> };

        const nextChanged = new Set<string>();
        const nextUnavailable = new Set<string>();
        for (const line of snapshot) {
          if (!(line.key in prices)) continue;
          const current = prices[line.key];
          if (current === null) nextUnavailable.add(line.key);
          else if (current !== line.unitPrice) nextChanged.add(line.key);
        }
        syncPrices(prices);
        setChanged(nextChanged);
        setUnavailable(nextUnavailable);
      } catch {
        // Offline or API down — keep showing the stored prices as-is.
      }
    })();
  }, [loaded, items, syncPrices]);

  const availableItems = items.filter((item) => !unavailable.has(item.key));
  const total = availableItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const hasPriceChanges = changed.size > 0;
  const hasUnavailable = unavailable.size > 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl text-brava-ink">Lista de deseos</h1>
      <p className="mt-1 text-brava-muted">
        Guarda lo que te gusta y pide todo junto por WhatsApp cuando estés lista.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 text-brava-muted">
          <p>Tu lista de deseos está vacía.</p>
          <Link href="/" className="mt-2 inline-block text-brava-pink-dark hover:underline">
            Ver el catálogo
          </Link>
        </div>
      ) : (
        <>
          {(hasPriceChanges || hasUnavailable) && (
            <p className="mt-6 rounded-xl border border-brava-pink-light bg-white px-4 py-3 text-sm text-brava-muted">
              {hasPriceChanges && "Algunos precios se actualizaron desde que los guardaste. "}
              {hasUnavailable && "Los productos marcados como no disponibles no se incluyen en el total."}
            </p>
          )}

          <ul className="mt-8 flex flex-col gap-3">
            {items.map((item) => {
              const isUnavailable = unavailable.has(item.key);
              return (
                <li
                  key={item.key}
                  className={`flex items-center gap-4 rounded-xl border border-brava-pink-light p-4 ${
                    isUnavailable ? "opacity-60" : ""
                  }`}
                >
                  <Link
                    href={item.type === "product" ? `/products/${item.slug}` : `/combos/${item.slug}`}
                    className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brava-pink-light"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="px-1 text-center text-[10px] leading-tight text-brava-ink">
                        {item.name}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={item.type === "product" ? `/products/${item.slug}` : `/combos/${item.slug}`}
                      className="font-medium text-brava-ink hover:text-brava-pink-dark"
                    >
                      {item.name}
                      {item.type === "combo" && " (kit)"}
                    </Link>
                    {item.variantLabel && <p className="text-sm text-brava-muted">{item.variantLabel}</p>}
                    <p className="text-sm font-semibold text-brava-pink-dark">
                      {formatCop(item.unitPrice)}
                      {changed.has(item.key) && (
                        <span className="ml-2 font-normal text-brava-muted">precio actualizado</span>
                      )}
                      {isUnavailable && (
                        <span className="ml-2 font-normal text-red-600">ya no disponible</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.key, Number(e.target.value) || 1)}
                      className="w-16 rounded-lg border border-brava-pink-light px-2 py-1 text-center outline-none focus:border-brava-pink"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-sm text-brava-muted hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex items-center justify-between border-t border-brava-pink-light pt-4">
            <span className="font-medium text-brava-ink">Total estimado</span>
            <span className="text-xl font-bold text-brava-pink-dark">{formatCop(total)}</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href={buildWhatsAppWishlistLink({
                lines: availableItems.map(
                  (item) =>
                    `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} x${item.quantity}`,
                ),
                totalLabel: formatCop(total),
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
            >
              Pedir por WhatsApp
            </a>
            <button type="button" onClick={clear} className="text-sm text-brava-muted hover:text-red-600">
              Vaciar lista
            </button>
          </div>
        </>
      )}
    </div>
  );
}
