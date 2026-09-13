"use client";

import { useEffect, useRef, useState } from "react";
import type { BrandListItemDto } from "@/lib/api";

// Checkbox dropdown, not a single-select listbox (see Select.tsx) — brand
// filtering needs "2+ brands at once", which a single value can't express.
export function BrandMultiSelect({
  brands,
  selected,
  onToggle,
  onClear,
  className,
}: {
  brands: BrandListItemDto[];
  selected: string[];
  onToggle: (slug: string) => void;
  onClear: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label =
    selected.length === 0
      ? "Todas las marcas"
      : selected.length === 1
        ? (brands.find((b) => b.slug === selected[0])?.name ?? "1 marca")
        : `${selected.length} marcas seleccionadas`;

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-full border border-brava-pink-light bg-white px-4 py-2.5 text-left text-sm outline-none focus-visible:border-brava-pink focus-visible:ring-2 focus-visible:ring-brava-pink/40"
      >
        <span className={`truncate ${selected.length === 0 ? "text-brava-muted" : ""}`}>{label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className={`h-2 w-3 shrink-0 text-brava-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 max-w-[calc(100vw-3rem)] rounded-lg border border-brava-pink-light bg-white p-1 shadow-lg shadow-brava-pink-light/60">
          <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-auto">
            {brands.map((b) => {
              const checked = selected.includes(b.slug);
              return (
                <li key={b.slug}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-brava-ink hover:bg-brava-pink-light/40">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(b.slug)}
                      className="h-4 w-4 accent-brava-pink"
                    />
                    <span className="truncate">{b.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-brava-pink-dark hover:bg-brava-pink-light/40"
            >
              Limpiar marcas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
