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
    if (isLoggedIn()) {
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex gap-4 text-sm font-medium text-brava-ink">
            <Link href="/admin/products" className="hover:text-brava-pink-dark">
              Productos
            </Link>
            <Link href="/admin/products/new" className="hover:text-brava-pink-dark">
              Nuevo producto
            </Link>
          </nav>
          <button
            onClick={() => {
              clearToken();
              router.push("/admin/login");
            }}
            className="text-sm text-brava-muted hover:text-brava-pink-dark"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
