import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { buildWhatsAppContactLink } from "@/lib/whatsapp";

const ICON_SIZE = 22;
const LINK_CLASS = "text-brava-pink transition-colors hover:text-brava-pink-dark";

// Brandbook (p.4, "Canales"): Instagram, TikTok, WhatsApp. Rosa BRAVA is the
// palette's designated color for icons/componentes destacados (p.11).
export function SocialLinks() {
  return (
    <div className="flex items-center gap-5">
      <a
        href="https://www.instagram.com/brava_tiendaco"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="BRAVA en Instagram"
        className={LINK_CLASS}
      >
        <FaInstagram size={ICON_SIZE} />
      </a>
      <a
        href="https://www.tiktok.com/@brava_tiendaco"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="BRAVA en TikTok"
        className={LINK_CLASS}
      >
        <FaTiktok size={ICON_SIZE} />
      </a>
      <a
        href={buildWhatsAppContactLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="BRAVA por WhatsApp"
        className={LINK_CLASS}
      >
        <FaWhatsapp size={ICON_SIZE} />
      </a>
    </div>
  );
}
