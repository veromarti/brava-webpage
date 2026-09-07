"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn, clearToken } from "@/lib/auth-client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Starts "checking" rather than assuming logged-in/out, so a logged-in
  // admin doesn't flash a redirect before localStorage is read (this only
  // runs client-side — SSR has no access to it).
  const [status, setStatus] = useState<"checking" | "authed">("checking");

  useEffect(() => {
    // localStorage is a synchronous, client-only read — there's no await to
    // put between mount and this setState the way the data-fetching pages'
    // effects have. This is the "sync with an external store after mount"
    // case the lint rule's data-fetching guidance doesn't fit.
    if (isLoggedIn()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("authed");
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  if (status === "checking") {
    return <div className="mx-auto max-w-6xl px-6 py-10 text-brava-muted">Cargando…</div>;
  }

  return (
    <div>
      <div className="border-b border-brava-pink-light bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          {/* flex-wrap (not a scroll rail) — six short labels read fine
              across two lines on a phone, and nothing stays hidden off-screen. */}
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-brava-ink">
            <Link href="/admin/products" className="hover:text-brava-pink-dark">
              Productos
            </Link>
            <Link href="/admin/products/new" className="hover:text-brava-pink-dark">
              Nuevo producto
            </Link>
            <Link href="/admin/combos" className="hover:text-brava-pink-dark">
              Kits
            </Link>
            <Link href="/admin/combos/new" className="hover:text-brava-pink-dark">
              Nuevo kit
            </Link>
            <Link href="/admin/delivery-zones" className="hover:text-brava-pink-dark">
              Zonas de envío
            </Link>
            <Link href="/admin/orders" className="hover:text-brava-pink-dark">
              Pedidos
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.push("/admin/login");
            }}
            className="self-start text-sm text-brava-muted hover:text-brava-pink-dark sm:self-auto"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
