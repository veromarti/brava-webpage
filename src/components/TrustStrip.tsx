import { FaTruck, FaMoneyBillWave, FaWhatsapp } from "react-icons/fa6";

// Stand-in for the reviews/ratings/countdown-timer trust signals a bigger
// store would show — BRAVA has none of that infrastructure (no accounts, no
// orders-count-based social proof yet, per ADR-0005), so this names the
// three things that are actually true today instead.
const ITEMS = [
  { icon: FaTruck, label: "Envíos en Medellín", detail: "costo según zona de entrega" },
  { icon: FaMoneyBillWave, label: "Pago flexible", detail: "transferencia o contraentrega" },
  { icon: FaWhatsapp, label: "Atención por WhatsApp", detail: "pide y pregunta directo" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-brava-pink-light bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon aria-hidden className="shrink-0 text-2xl text-brava-pink" />
            <div>
              <p className="font-medium text-brava-ink">{label}</p>
              <p className="text-sm text-brava-muted">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
