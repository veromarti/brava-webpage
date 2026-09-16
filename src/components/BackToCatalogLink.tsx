"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Product/combo detail pages had no visible way back to the catalogue —
// only the browser's own back button, which isn't obvious to everyone.
// Prefers router.back() when there's somewhere in this tab to go back to,
// since that preserves whatever category/brand/search/sort/scroll state the
// visitor had (a flat link to "/" would reset all of that); falls back to a
// real navigation to "/" for a directly-opened product link, and still works
// with JS disabled either way since the href is real.
export function BackToCatalogLink({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Link
      href="/"
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className={
        className ??
        "inline-flex items-center gap-1 text-sm text-brava-muted hover:text-brava-pink-dark hover:underline"
      }
    >
      <span aria-hidden="true">←</span> Volver
    </Link>
  );
}
