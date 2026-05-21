/**
 * Lookbook image catalog.
 *
 * All shots are 1202×1602 (3:4 portrait), so `ratio` stays at 1.333 —
 * the masonry will read as a uniform editorial grid rather than a
 * staggered one. Drop replacements into /public/lookbook/ to swap.
 */

export type LookbookImage = {
  id: string;
  src: string;
  alt: string;
  /** Aspect ratio (height / width). Drives the masonry layout. */
  ratio: number;
};

export const LOOKBOOK: LookbookImage[] = [
  {
    id: "01",
    src: "/lookbook/gothic-flame-cross-silver.webp",
    alt: "Silver gothic flame cross on a box chain",
    ratio: 1.333,
  },
  {
    id: "02",
    src: "/lookbook/filigree-heart-red.webp",
    alt: "Filigree silver heart pendant with a deep red stone",
    ratio: 1.333,
  },
  {
    id: "03",
    src: "/lookbook/rhinestone-cross-pink-black.webp",
    alt: "Silver cross set with pink and black rhinestones",
    ratio: 1.333,
  },
  {
    id: "04",
    src: "/lookbook/fleur-cross-pink.webp",
    alt: "Fleur-de-lis cross with a hot pink centre stone",
    ratio: 1.333,
  },
  {
    id: "05",
    src: "/lookbook/red-flame-cross.webp",
    alt: "Red enamel flame cross on a silver snake chain",
    ratio: 1.333,
  },
];

export const LOOKBOOK_PREVIEW = LOOKBOOK.slice(0, 4);
