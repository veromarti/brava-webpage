"use client";

import { useState } from "react";
import Image from "next/image";
import type { ImageDto } from "@/lib/api";

// A product's images list already mixes "general" shots (ProductVariantId
// null) and per-variant ones — the carousel doesn't distinguish, it just
// shows every image in DisplayOrder. Picking the image for whichever
// variant is selected would need a selector wired to this component; not
// built yet, so all images show together regardless of variant.
export function ProductImageCarousel({ images, productName }: { images: ImageDto[]; productName: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-brava-pink-light">
        <span className="text-brava-pink">{productName}</span>
      </div>
    );
  }

  const current = images[index];

  function goTo(i: number) {
    setIndex((i + images.length) % images.length);
  }

  return (
    <div>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-brava-pink-light">
        <Image
          key={current.id}
          src={current.url}
          alt={current.altText}
          width={600}
          height={600}
          className="h-full w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo(index - 1)}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brava-pink-dark shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="Imagen siguiente"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brava-pink-dark shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => goTo(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index ? "bg-brava-pink" : "bg-brava-pink-light"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
