"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login, ApiError } from "@/lib/api-admin";
import { saveToken, isLoggedIn } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, expiresAtUtc } = await login(email, password);
      saveToken(token, expiresAtUtc);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/admin/products");
    }
  }, [router]);

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 py-20">
      {/* Lockup expresivo (brandbook p.9): reserved for campaign-style,
          emotionally-charged pieces — a standalone login screen counts
          as a "portada", unlike the persistent nav header. */}
      <Image
        src="/logo-brava-lockup.png"
        alt="Atrévete a ser BRAVA"
        width={1698}
        height={906}
        className="mx-auto h-28 w-auto"
      />
      <h1 className="mt-6 text-center text-2xl font-bold text-brava-ink">Acceso administradores</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-brava-ink">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brava-ink">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brava-pink px-5 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:opacity-50"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
