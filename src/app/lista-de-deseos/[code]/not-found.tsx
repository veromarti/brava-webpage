import Link from "next/link";

export default function SharedWishlistNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl text-brava-ink">Esta lista no existe</h1>
      <p className="mt-3 text-brava-muted">
        El enlace puede estar mal escrito o la lista ya no está disponible.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
      >
        Ver el catálogo
      </Link>
    </div>
  );
}
