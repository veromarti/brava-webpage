"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useWishlist } from "@/components/WishlistProvider";
import { buildWhatsAppShareMyListLink } from "@/lib/whatsapp";

// Turns the browser-only "Lista de deseos" into a link you can send to family
// before a birthday/aniversario so they know exactly what to gift. The list is
// saved to the API under a short code; this browser remembers the code (in
// localStorage) so it can push later changes to the same link.
const SHARE_KEY = "brava_wishlist_share";
const PRODUCT_KEY_PREFIX = "product:";

interface StoredShare {
  code: string;
  ownerName: string;
  note: string;
}

function readStoredShare(): StoredShare | null {
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const d = data as Record<string, unknown>;
    if (typeof d.code !== "string" || d.code.length === 0) return null;
    return {
      code: d.code,
      ownerName: typeof d.ownerName === "string" ? d.ownerName : "",
      note: typeof d.note === "string" ? d.note : "",
    };
  } catch {
    return null;
  }
}

export function ShareWishlist() {
  const { items, loaded } = useWishlist();

  const [mounted, setMounted] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<"created" | "updated" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = readStoredShare();
    /* eslint-disable react-hooks/set-state-in-effect -- one-shot, client-only
       localStorage hydration with no async boundary; the same documented
       exception WishlistProvider makes for this rule. */
    setMounted(true);
    if (stored) {
      setCode(stored.code);
      setOwnerName(stored.ownerName);
      setNote(stored.note);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const shareUrl = mounted && code ? `${window.location.origin}/lista-de-deseos/${code}` : "";
  const canNativeShare =
    mounted && typeof navigator !== "undefined" && typeof navigator.share === "function";

  function persist(nextCode: string) {
    try {
      localStorage.setItem(
        SHARE_KEY,
        JSON.stringify({ code: nextCode, ownerName: ownerName.trim(), note: note.trim() } satisfies StoredShare),
      );
    } catch {
      // Private mode / storage disabled — the link still works this session.
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || items.length === 0 || ownerName.trim().length === 0) return;

    setBusy(true);
    setError(null);
    setSaved(null);

    const body = {
      ownerName: ownerName.trim(),
      note: note.trim() || null,
      items: items.map((i) => ({
        type: i.type,
        slug: i.slug,
        variantId:
          i.type === "product" && i.key.startsWith(PRODUCT_KEY_PREFIX)
            ? i.key.slice(PRODUCT_KEY_PREFIX.length)
            : null,
        name: i.name,
        variantLabel: i.variantLabel,
        imageUrl: i.imageUrl ?? null,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
    };

    try {
      const res = code
        ? await fetch(`/api/wishlists/${code}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/wishlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (parsed?.error) message = parsed.error;
        } catch {
          // plain-string error body from the API — use as-is
        }
        setError(message || "No se pudo guardar la lista. Intenta de nuevo.");
        return;
      }

      if (code) {
        persist(code);
        setSaved("updated");
      } else {
        const { code: newCode } = (await res.json()) as { code: string };
        setCode(newCode);
        persist(newCode);
        setSaved("created");
      }
    } catch {
      setError("No hay conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the input below is selectable as a fallback
    }
  }

  async function handleNativeShare() {
    if (!shareUrl) return;
    try {
      await navigator.share({
        title: "Mi lista de deseos de BRAVA",
        text: `Te comparto mi lista de deseos de BRAVA, ${ownerName.trim()} 💕`,
        url: shareUrl,
      });
    } catch {
      // user cancelled or unsupported — no-op
    }
  }

  // Wait for localStorage to be read so we don't flash the "create" state over
  // an existing share.
  if (!loaded || !mounted) {
    return null;
  }

  return (
    <section className="mt-10 border-t border-brava-pink-light pt-8">
      <h2 className="font-display text-xl text-brava-ink">Compártela como lista de regalos</h2>
      <p className="mt-1 text-sm text-brava-muted">
        Crea un enlace y envíalo a tu familia o amigos antes de tu cumpleaños o aniversario, así saben
        exactamente qué te gustaría.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div>
          <label htmlFor="wishlist-owner" className="block text-sm font-medium text-brava-ink">
            Tu nombre
          </label>
          <input
            id="wishlist-owner"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            maxLength={80}
            placeholder="Cómo aparecerá: «La lista de deseos de …»"
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>

        <div>
          <label htmlFor="wishlist-note" className="block text-sm font-medium text-brava-ink">
            Nota <span className="font-normal text-brava-muted">(opcional)</span>
          </label>
          <textarea
            id="wishlist-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Un mensaje para quien vea tu lista"
            className="mt-1 w-full rounded-lg border border-brava-pink-light px-3 py-2 outline-none focus:border-brava-pink"
          />
        </div>

        <button
          type="submit"
          disabled={busy || items.length === 0 || ownerName.trim().length === 0}
          className="w-fit rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Guardando…" : code ? "Actualizar enlace" : "Crear enlace para compartir"}
        </button>

        {items.length === 0 && (
          <p className="text-sm text-brava-muted">Agrega productos a tu lista para poder compartirla.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {code && shareUrl && (
        <div className="mt-5 rounded-xl border border-brava-pink-light bg-white p-4">
          {saved === "created" && (
            <p className="mb-2 text-sm text-brava-ink">¡Listo! Este es tu enlace para compartir:</p>
          )}
          {saved === "updated" && (
            <p className="mb-2 text-sm text-brava-ink">Enlace actualizado con tu lista actual.</p>
          )}
          {saved === null && (
            <p className="mb-2 text-sm text-brava-muted">
              Ya creaste este enlace. Si cambiaste tu lista, pulsa «Actualizar enlace».
            </p>
          )}

          <input
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-brava-pink-light bg-brava-cloud px-3 py-2 text-sm text-brava-ink outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-brava-pink px-4 py-2 text-sm font-medium text-brava-pink-dark transition-colors hover:bg-brava-pink hover:text-white"
            >
              {copied ? "Copiado ✓" : "Copiar enlace"}
            </button>
            <a
              href={buildWhatsAppShareMyListLink({ url: shareUrl })}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brava-pink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brava-pink-dark"
            >
              Compartir por WhatsApp
            </a>
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="rounded-full border border-brava-pink px-4 py-2 text-sm font-medium text-brava-pink-dark transition-colors hover:bg-brava-pink hover:text-white"
              >
                Compartir…
              </button>
            )}
            <Link
              href={`/lista-de-deseos/${code}`}
              target="_blank"
              className="text-sm text-brava-muted hover:text-brava-pink-dark hover:underline"
            >
              Ver cómo se verá
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
