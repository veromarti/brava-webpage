import type { Metadata } from "next";
import { DM_Sans, Poetsen_One } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { WishlistProvider } from "@/components/WishlistProvider";
import { WishlistNavLink } from "@/components/WishlistNavLink";
import { SocialLinks } from "@/components/SocialLinks";

// Sistema tipográfico (BRAVA_Brandbook_v1.0, p.12): DM Sans is the
// "Texto" role (funcional / digital), Poetsen One is "Display" (product
// and category titles). The "Gestual" role (brandbook: Pluma Bold) isn't
// a distributable web font — the brandbook itself says "usar arte
// maestro" for that case, so it's covered by the real logo art in
// public/logo-brava-lockup.png rather than a font stand-in.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const poetsenOne = Poetsen_One({
  variable: "--font-poetsen-one",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "BRAVA — Maquillaje y skincare",
  description: "Atrévete a ser BRAVA. Catálogo de maquillaje y skincare, pedidos por WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${dmSans.variable} ${poetsenOne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <WishlistProvider>
          <header className="border-b border-brava-pink-light bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              {/* Logotipo institucional (brandbook p.9): the register for
                  nav/firma comercial, where legibility matters more than
                  the campaign-style lockup. */}
              <Link href="/" aria-label="BRAVA — Tienda Virtual">
                <Image
                  src="/logo-brava-institucional.png"
                  alt="BRAVA — Tienda Virtual"
                  width={1516}
                  height={616}
                  priority
                  className="h-9 w-auto"
                />
              </Link>
              <WishlistNavLink />
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-brava-pink-light bg-white">
            {/* Lockup expresivo again here, as in the brandbook's own back
                cover (p.21) — a closing signature, not the nav mark. The
                centered column keeps logo / icons / text symmetrical. */}
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-10 text-center text-sm text-brava-muted">
              <Image
                src="/logo-brava-lockup.png"
                alt="Atrévete a ser BRAVA"
                width={1698}
                height={906}
                className="h-20 w-auto"
              />
              <SocialLinks />
              <div>
                <p>BRAVA · Medellín, Colombia</p>
                <p className="mt-1">
                  WhatsApp: +57 305 266 9509 · Instagram/TikTok: @brava_tiendaco
                </p>
              </div>
            </div>
          </footer>
        </WishlistProvider>
      </body>
    </html>
  );
}
