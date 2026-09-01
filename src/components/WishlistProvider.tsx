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
  unitPrice: number;
  quantity: number;
}

interface WishlistContextValue {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "quantity">, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "brava_wishlist";

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
      if (raw) setItems(JSON.parse(raw));
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

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear }}>
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
