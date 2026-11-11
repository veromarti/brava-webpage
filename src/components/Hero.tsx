import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";
import { buildWhatsAppContactLink } from "@/lib/whatsapp";

// No stock/campaign photography exists yet (brandbook p.21's "arte maestro"
// note applies here too, same reasoning as the lockup use in layout.tsx's
// footer) — the hero leans on the brand's own color system and display type
// instead of a photo it doesn't have.
export function Hero() {
  return (
    <section className="bg-gradient-to-b from-brava-cloud to-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center sm:py-20">
        <Image
          src="/logo-brava-lockup.png"
          alt="Atrévete a ser BRAVA"
          width={1698}
          height={906}
          priority
          className="h-24 w-auto sm:h-28"
        />
        <h1 className="max-w-2xl font-display text-3xl text-brava-ink sm:text-4xl">
          Todo lo que deseas y necesitas en un solo lugar
        </h1>
        <p className="max-w-xl text-brava-muted">
          Pide por WhatsApp, paga por transferencia o contraentrega, y recibe en Medellín.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/catalogo"
            className="rounded-full bg-brava-pink px-6 py-2.5 font-medium text-white transition-colors hover:bg-brava-pink-dark"
          >
            Ver catálogo
          </Link>
          <a
            href={buildWhatsAppContactLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-brava-pink px-6 py-2.5 font-medium text-brava-pink-dark transition-colors hover:bg-brava-pink-light/40"
          >
            <FaWhatsapp aria-hidden />
            Pedir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
