import Image from "next/image";
import type { CSSProperties } from "react";

export interface StickerImage {
  src: string;
  alt: string;
}

// Catalogue-only decoration (see AGENTS.md / route usage): imported by
// src/app/page.tsx alone, not src/app/layout.tsx, so it never renders on
// other routes.
export function StickerBanner({
  images,
  durationSeconds = 30,
}: {
  /** Exactly the 9 stickers to loop, in order — not hardcoded here so the
   *  set can change without touching this component. */
  images: StickerImage[];
  /** Seconds for one full loop of the (single) sticker set. Exposed as the
   *  --sticker-banner-duration CSS variable consumed in globals.css. */
  durationSeconds?: number;
}) {
  // Two back-to-back copies of the same set: the track's keyframes slide
  // exactly 50% (one set-width) left, so the loop point is pixel-identical
  // to the start — no visible jump, no scroll-position bookkeeping in JS.
  const track = [...images, ...images];

  return (
    <div
      className="sticker-banner overflow-hidden py-4"
      style={{ "--sticker-banner-duration": `${durationSeconds}s` } as CSSProperties}
    >
      <div className="sticker-banner-track flex w-max gap-4 sm:gap-6 md:gap-8">
        {track.map((sticker, i) => (
          <Image
            key={`${sticker.src}-${i}`}
            src={sticker.src}
            alt={sticker.alt}
            width={512}
            height={512}
            // Every sticker is decorative in a repeating strip — the second
            // copy is a straight duplicate, so hide it from assistive tech
            // to avoid announcing the same 9 images twice.
            aria-hidden={i >= images.length}
            loading={i < images.length ? "eager" : "lazy"}
            className="h-16 w-16 shrink-0 select-none object-contain sm:h-20 sm:w-20 md:h-24 md:w-24"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
