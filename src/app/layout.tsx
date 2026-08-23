import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BRAVA — Maquillaje y skincare",
  description: "Atrévete a ser BRAVA. Catálogo de maquillaje y skincare, pedidos por WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-brava-pink-light bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-2xl font-bold tracking-tight text-brava-pink-dark">
              BRAVA
            </Link>
            <p className="hidden text-sm italic text-brava-muted sm:block">
              Atrévete a ser BRAVA.
            </p>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-brava-pink-light bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-brava-muted">
            <p>BRAVA · Medellín, Colombia</p>
            <p className="mt-1">
              WhatsApp: +57 305 266 9509 · Instagram/TikTok: @brava_tiendaco
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
