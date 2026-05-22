/**
 * About-page narrative beats.
 *
 * Each beat pins for the duration of one viewport height in the About page,
 * with its atmospheric image fixed behind the text scrubbing past.
 */

export type Beat = {
  eyebrow: string;
  heading: string;
  body: string;
  image: string;
};

const ph = (seed: string) => `https://picsum.photos/seed/mc-about-${seed}/1600/2000`;

export const STORY: Beat[] = [
  {
    eyebrow: "I · Origin",
    heading: "Born of late hours.",
    body:
      "Midnight Chhaya began at the unsocial end of evenings — at a small wooden bench, under a single warm bulb, in a room that smelled of solder and beeswax. The first piece was a ring nobody had asked for. It has been the same ever since.",
    image: ph("01"),
  },
  {
    eyebrow: "II · Process",
    heading: "Slow, by hand, by candle.",
    body:
      "Every piece is forged, filed, oxidised and finished by hand. Nothing is mass-cast. We hammer until the silver remembers the shape; we let the patina settle for days. It is impatient work that demands patience.",
    image: ph("02"),
  },
  {
    eyebrow: "III · Material",
    heading: "Stones with memory.",
    body:
      "Black onyx, garnet, obsidian, antique jet — stones chosen for the way they hold light without giving it back. Set into oxidised sterling, brass aged with vinegar, velvet from old mills.",
    image: ph("03"),
  },
  {
    eyebrow: "IV · Worn",
    heading: "Adornments forged in shadow.",
    body:
      "Made for those who keep their own counsel. For evening more than morning. For ceremonies — formal, private, imagined. Pieces meant to be lived in, scratched a little, passed on.",
    image: ph("04"),
  },
  {
    eyebrow: "V · The hand behind",
    heading: "Sixteen, and stubborn.",
    body:
      "My name is Siddharth Singla. I am sixteen, and Midnight Chhaya is the first thing I have built end-to-end. It started in the back of school notebooks — sketches I could not stand to leave flat on paper. So I taught myself how to make them. Ideas arrive faster than I can finish the last batch, which is why drops are small and a piece is rarely repeated. I started this because I wanted to actually serve someone — not as a brand exercise, but to put something real on a real shoulder. If you are wearing something of mine, thank you. You are wearing the notebook.",
    image: "/brand/atelier-pieces.webp",
  },
];
