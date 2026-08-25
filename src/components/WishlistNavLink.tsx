"use client";

import Link from "next/link";
import { useWishlist } from "@/components/WishlistProvider";

export function WishlistNavLink() {
  const { items } = useWishlist();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link href="/lista-de-deseos" className="text-sm font-medium text-brava-ink hover:text-brava-pink-dark">
      Lista de deseos{count > 0 && ` (${count})`}
    </Link>
  );
}
