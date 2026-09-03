import Image from "next/image";
import { CATALOG_CARD_SIZES, CATALOG_COLLAGE_TILE_SIZES } from "@/components/catalogImageSizes";

// Adaptive collage for a kit's catalog card: the composing products rarely
// come in fours, so the layout changes with the count (the same pattern
// photo apps use for album covers). Fills its parent — the parent supplies
// the aspect-square box and clipping.
export function KitCollage({ images, name }: { images: string[]; name: string }) {
  const shots = images.slice(0, 4);
  const extra = images.length - shots.length;

  const root =
    "h-full w-full transition-transform duration-300 group-hover:scale-105";

  if (shots.length === 0) {
    return (
      <div className={`${root} flex items-center justify-center bg-brava-pink-light p-4 text-center text-sm text-brava-ink`}>
        {name}
      </div>
    );
  }

  // One shot fills the whole card; any split layout makes each tile at most
  // half the card wide.
  const tileSizes = shots.length === 1 ? CATALOG_CARD_SIZES : CATALOG_COLLAGE_TILE_SIZES;

  const tile = (src: string, key: number, overlay?: string) => (
    <div key={key} className="relative h-full w-full overflow-hidden bg-brava-pink-light">
      <Image src={src} alt={name} fill loading="lazy" sizes={tileSizes} className="object-cover" />
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-brava-ink/45 text-lg font-semibold text-white">
          {overlay}
        </div>
      )}
    </div>
  );

  if (shots.length === 1) {
    return <div className={root}>{tile(shots[0], 0)}</div>;
  }

  if (shots.length === 2) {
    return (
      <div className={`${root} grid grid-cols-2 gap-0.5`}>
        {shots.map((s, i) => tile(s, i))}
      </div>
    );
  }

  if (shots.length === 3) {
    return (
      <div className={`${root} grid grid-cols-2 grid-rows-2 gap-0.5`}>
        <div className="row-span-2">{tile(shots[0], 0)}</div>
        {tile(shots[1], 1)}
        {tile(shots[2], 2)}
      </div>
    );
  }

  return (
    <div className={`${root} grid grid-cols-2 grid-rows-2 gap-0.5`}>
      {shots.map((s, i) => (i === 3 && extra > 0 ? tile(s, i, `+${extra}`) : tile(s, i)))}
    </div>
  );
}
