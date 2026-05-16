/**
 * Lookbook image catalog.
 *
 * Swap for real photography by replacing `src` with /lookbook/<file>.jpg
 * once images are dropped into /public/lookbook/.
 *
 * Heights vary on purpose — the masonry layout uses the intrinsic ratio
 * to build a Pinterest-style staggered grid.
 */

export type LookbookImage = {
  id: string;
  src: string;
  alt: string;
  /** Aspect ratio (height / width). Drives the masonry layout. */
  ratio: number;
};

const ph = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/mc-lb-${seed}/${w}/${h}`;

export const LOOKBOOK: LookbookImage[] = [
  { id: "01", src: ph("01", 800, 1100), alt: "Hand wearing the Crow Talon ring",       ratio: 1.375 },
  { id: "02", src: ph("02", 800, 800),  alt: "Vesper Signet on linen",                  ratio: 1.0   },
  { id: "03", src: ph("03", 800, 1200), alt: "Reliquary Pendant in candlelight",        ratio: 1.5   },
  { id: "04", src: ph("04", 800, 900),  alt: "Ember pendant draped across stone",       ratio: 1.125 },
  { id: "05", src: ph("05", 800, 1100), alt: "Shadow Drops worn at the throat",         ratio: 1.375 },
  { id: "06", src: ph("06", 800, 1000), alt: "Iron Thorn studs on velvet",              ratio: 1.25  },
  { id: "07", src: ph("07", 800, 1300), alt: "Midnight Choker — full editorial",        ratio: 1.625 },
  { id: "08", src: ph("08", 800, 800),  alt: "Cathedral Choker close-up",               ratio: 1.0   },
  { id: "09", src: ph("09", 800, 1150), alt: "Atelier still life — silver dust",        ratio: 1.4375},
  { id: "10", src: ph("10", 800, 1050), alt: "Hands at the bench, oxidising silver",    ratio: 1.3125},
  { id: "11", src: ph("11", 800, 1200), alt: "Reliquary detail, smoked glass",          ratio: 1.5   },
  { id: "12", src: ph("12", 800, 900),  alt: "Velvet ribbon and brass clasp",           ratio: 1.125 },
];

export const LOOKBOOK_PREVIEW = LOOKBOOK.slice(0, 4);
