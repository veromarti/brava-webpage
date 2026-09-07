"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FaSpinner } from "react-icons/fa6";

// Compact icon-only action button for the admin tables/forms. The visible
// affordance is the icon; `label` is the accessible name and the hover
// tooltip, so nothing relies on sighted users guessing what the glyph means.
export function IconButton({
  icon,
  label,
  onClick,
  href,
  type = "button",
  tone = "neutral",
  disabled = false,
  busy = false,
  size = "md",
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  /** Renders as a nav Link instead of a button — for row actions like
   *  "Editar" that go to another page rather than mutate in place. */
  href?: string;
  type?: "button" | "submit";
  tone?: "neutral" | "primary" | "danger";
  disabled?: boolean;
  busy?: boolean;
  size?: "sm" | "md";
}) {
  const toneClass =
    tone === "primary"
      ? "border-transparent bg-brava-pink text-white hover:bg-brava-pink-dark"
      : tone === "danger"
        ? "border-brava-pink-light text-brava-muted hover:border-red-300 hover:text-red-600"
        : "border-brava-pink-light text-brava-ink hover:border-brava-pink hover:text-brava-pink-dark";
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const className = `inline-flex shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${sizeClass}`;

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={label}
      title={label}
      className={className}
    >
      {busy ? <FaSpinner className="animate-spin" aria-hidden /> : icon}
    </button>
  );
}
