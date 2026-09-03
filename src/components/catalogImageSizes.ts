// Responsive `sizes` for the catalog grid images, derived from CatalogGrid's
// column classes: grid-cols-1 -> min-[480px]:2 -> md:3 -> xl:4, inside a
// max-w-6xl (72rem) px-6 container, gap-5 (1.25rem) between cells. At the xl
// breakpoint the container is capped, so each of the 4 cells is a fixed
// ~260px; below that the cells scale with the viewport.
//
// Getting this right lets the browser pick the smallest srcset candidate
// that still covers the rendered size instead of always pulling the
// width-based default (~2x DPR of 400px) for every card, on- or off-screen.
export const CATALOG_CARD_SIZES =
  "(min-width: 1280px) 260px, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw";

// A kit card fills the same cell but the collage splits it into halves or
// quarters, so each tile never renders wider than half the card.
export const CATALOG_COLLAGE_TILE_SIZES =
  "(min-width: 1280px) 130px, (min-width: 768px) 17vw, (min-width: 480px) 25vw, 50vw";
