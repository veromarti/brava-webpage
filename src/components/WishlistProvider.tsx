"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// "Pre version of the shopping cart" — client-only, localStorage, no
// backend. v1 has no accounts/cart (ADR-0005), so this is deliberately not
// synced anywhere; it's scoped to one browser, same as a WhatsApp draft
// message would be.
export interface WishlistItem {
  // "product:{variantId}" or "combo:{slug}" — stable and unique per line,
  // so adding the same variant/combo twice increments quantity instead of
  // creating a duplicate row.
  key: string;
  type: "product" | "combo";
  slug: string;
  name: string;
  variantLabel: string | null;
  // Main product/kit image, for the wishlist summary thumbnail. Nullable
  // (no image uploaded) and optional so lines saved before this field
  // existed still parse from localStorage.
  imageUrl?: string | null;
  // Price as of when the line was added. syncPrices() refreshes it against
  // the live API on the wishlist page. Optional/undefined-tolerant so lines
  // saved before this field parse fine.
  unitPrice: number;
  quantity: number;
  // Set by syncPrices() when the product/variant/combo behind this line is
  // gone or inactive — the line stays visible but drops out of the total.
  unavailable?: boolean;
}

interface WishlistContextValue {
  items: WishlistItem[];
  // False until localStorage has been read on the client — consumers that
  // fire one-shot work (e.g. the price refresh) should wait for this.
  loaded: boolean;
  addItem: (item: Omit<WishlistItem, "quantity">, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  // Apply fresh prices keyed by item.key: a number updates unitPrice and
  // clears `unavailable`; null flags the line unavailable; a missing key is
  // left untouched.
  syncPrices: (prices: Record<string, number | null>) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "brava_wishlist";

// localStorage can hold anything: valid JSON of the wrong shape (`{}`, a
// bare string, an array from an older schema missing fields). JSON.parse
// won't throw on those, so without a shape check a non-array would land in
// `items` and crash the first `.reduce`/`.map` downstream. Drop anything
// that isn't a usable line rather than trusting the blob.
function parseStoredItems(raw: string): WishlistItem[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((item): item is WishlistItem => {
    if (typeof item !== "object" || item === null) return false;
    const it = item as Record<string, unknown>;
    return (
      typeof it.key === "string" &&
      (it.type === "product" || it.type === "combo") &&
      typeof it.slug === "string" &&
      typeof it.name === "string" &&
      (it.variantLabel === null || typeof it.variantLabel === "string") &&
      (it.imageUrl === undefined || it.imageUrl === null || typeof it.imageUrl === "string") &&
      typeof it.unitPrice === "number" &&
      Number.isFinite(it.unitPrice) &&
      typeof it.quantity === "number" &&
      Number.isFinite(it.quantity) &&
      it.quantity >= 1 &&
      (it.unavailable === undefined || typeof it.unavailable === "boolean")
    );
  });
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Two effects, not one — the first only ever runs once (read), the second
  // only ever writes after that initial read has happened, so a fresh mount
  // doesn't immediately overwrite a populated localStorage with the empty
  // initial state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Synchronous, client-only read with no async boundary — same
      // legitimate exception as AdminGuard's localStorage check.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(parseStoredItems(raw));
    } catch {
      // Corrupted/unparseable localStorage — start empty rather than crash.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  function addItem(item: Omit<WishlistItem, "quantity">, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.key === item.key);
      if (existing) {
        return prev.map((i) => (i.key === item.key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    });
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function updateQuantity(key: string, quantity: number) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, quantity) } : i)));
  }

  function clear() {
    setItems([]);
  }

  function syncPrices(prices: Record<string, number | null>) {
    setItems((prev) =>
      prev.map((i) => {
        if (!(i.key in prices)) return i;
        const current = prices[i.key];
        if (current === null) {
          return i.unavailable ? i : { ...i, unavailable: true };
        }
        if (current === i.unitPrice && !i.unavailable) return i;
        return { ...i, unitPrice: current, unavailable: false };
      }),
    );
  }

  return (
    <WishlistContext.Provider
      value={{ items, loaded, addItem, removeItem, updateQuantity, clear, syncPrices }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}
