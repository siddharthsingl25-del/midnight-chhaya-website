/**
 * Product catalog. Single source of truth for the showcase.
 *
 * Swap placeholders for real photography by:
 *   1. Dropping images into /public/products/ (e.g. crow-talon.jpg, crow-talon-2.jpg)
 *   2. Updating the `images` array below
 *   3. (Optional) Editing the rest of the fields per piece
 *
 * Currency is INR throughout (see lib/site.ts).
 */

export type Category = "rings" | "chains" | "keychains" | "bracelets";

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "chains",     label: "Chains" },
  { id: "keychains",  label: "Keychains" },
  { id: "bracelets",  label: "Bracelets" },
  { id: "rings",      label: "Rings" },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** Price in INR. Null = "Inquire for price". */
  price: number | null;
  shortDescription: string;
  description: string;
  materials: string[];
  dimensions?: string;
  /** First image is the card hero. */
  images: string[];
  /** Marks a piece for the Exclusives page (one-of-one or limited). */
  exclusive?: boolean;
};

const placeholder = (seed: string, w = 900, h = 1100) =>
  `https://picsum.photos/seed/mc-${seed}/${w}/${h}`;

export const PRODUCTS: Product[] = [
  // —— Rings ——
  {
    slug: "crow-talon-ring",
    name: "Crow Talon Ring",
    category: "rings",
    price: 4800,
    shortDescription: "Hand-forged silver, blackened.",
    description:
      "A talon coiled around the finger — cast in solid sterling silver, oxidised to deep slate, then polished only at the high points. Wear it as a relic.",
    materials: ["Oxidised sterling silver"],
    dimensions: "Adjustable, fits sizes 5–9",
    images: [placeholder("talon-1"), placeholder("talon-2"), placeholder("talon-3")],
  },
  {
    slug: "vesper-signet",
    name: "Vesper Signet",
    category: "rings",
    price: 6400,
    shortDescription: "Onyx set in antique brass.",
    description:
      "An evening-hour signet — flat onyx face on a brass band aged with patina. Heavy in the hand, quiet on the eye.",
    materials: ["Brass", "Black onyx"],
    dimensions: "Size 6 / 7 / 8",
    images: [placeholder("vesper-1"), placeholder("vesper-2")],
  },

  // —— Chains ——
  {
    slug: "red-cross-chain",
    name: "Red Cross Chain",
    category: "chains",
    price: 300,
    shortDescription: "Filigree silver cross, single red stone.",
    description:
      "A small cathedral worn at the throat — an ornate silver cross etched with filigree and curls, a single red stone set at the heart. Hangs from a fine snake chain.",
    materials: ["Silver-tone alloy", "Red crystal"],
    images: ["/products/red-cross-chain-1.jpg"],
  },
  {
    slug: "spike-red-chain",
    name: "Spike Red Chain",
    category: "chains",
    price: 300,
    shortDescription: "Heart of red set in a silver sunburst.",
    description:
      "A burning heart wreathed in silver spikes — a sacred-heart pendant crowned with flame and set with a deep red stone. Hangs from a fine snake chain.",
    materials: ["Silver-tone alloy", "Red crystal"],
    images: ["/products/spike-red-chain-1.jpg"],
  },
  {
    slug: "pinteresty-cross-charm",
    name: "Pinteresty Cross Charm",
    category: "chains",
    price: 300,
    shortDescription: "Flame-cut tribal cross on a box chain.",
    description:
      "A cross carved in tongues of flame — sharp silver tribal curves cut into the form of a gothic crucifix. Worn long on a heavy box chain.",
    materials: ["Silver-tone alloy"],
    images: ["/products/pinteresty-cross-charm-1.jpg"],
  },
  {
    slug: "chunky-red-heart-charm",
    name: "Chunky Red Heart Charm",
    category: "chains",
    price: 300,
    shortDescription: "Deep red heart bound in silver thorns.",
    description:
      "A sacred-heart relic — a heavy red glass heart wrapped in a crown of silver thorns and crowned with a small cross. Hangs from a heavy box chain.",
    materials: ["Silver-tone alloy", "Red enamel glass"],
    images: ["/products/chunky-red-heart-charm-1.jpg"],
  },
  {
    slug: "red-flame-cross",
    name: "Red Flame Cross",
    category: "chains",
    price: 300,
    shortDescription: "Crucifix wrapped in red enamel flame.",
    description:
      "A silver cross caught mid-burn — wrapped in tongues of deep red enamel that lick upward and trail down into a long flame. Worn on a fine snake chain.",
    materials: ["Silver-tone alloy", "Red enamel"],
    images: ["/products/red-flame-cross-1.jpg"],
  },
  {
    slug: "pink-cross-charm",
    name: "Pink Cross Charm",
    category: "chains",
    price: 300,
    shortDescription: "Silver cross set in pink, blue, yellow crystals.",
    description:
      "A small reliquary cross studded all over in coloured stones — pink centre, blue and yellow at the points, with a small silver heart framing the heart stone. Hangs from a fine snake chain.",
    materials: ["Silver-tone alloy", "Mixed crystals"],
    images: ["/products/pink-cross-charm-1.jpg"],
  },
  {
    slug: "pookie-cross-charm",
    name: "Pookie Cross Charm",
    category: "chains",
    price: 300,
    shortDescription: "Pink and onyx-black crystals on silver.",
    description:
      "Soft and sharp at once — a silver cross set with pink stones at the inner rim and small jet-black crystals at the cardinal points. A heart frames the centre. Hangs from a fine snake chain.",
    materials: ["Silver-tone alloy", "Pink and black crystals"],
    images: ["/products/pookie-cross-charm-1.jpg"],
  },
  {
    slug: "red-rose-cross-charm",
    name: "Red Rose Cross Charm",
    category: "chains",
    price: 300,
    shortDescription: "Silver roses framing a red heart.",
    description:
      "A cross of silver roses with a single red glass heart at the centre — three blooms at the arms and one trailing below. Hangs from a heavy box chain.",
    materials: ["Silver-tone alloy", "Red glass"],
    images: ["/products/red-rose-cross-charm-1.jpg"],
  },
  {
    slug: "red-chrome-cross",
    name: "Red Chrome Cross",
    category: "chains",
    price: 300,
    shortDescription: "Fleur-de-lis cross with a hot pink stone.",
    description:
      "A fleur-de-lis crucifix in polished silver — four lily heads tipping each arm of the cross, a single hot pink stone burning at the centre. Hangs from a fine snake chain.",
    materials: ["Silver-tone alloy", "Pink crystal"],
    images: ["/products/red-chrome-cross-1.jpg"],
  },
  {
    slug: "red-chrome-heart",
    name: "Red Chrome Heart",
    category: "chains",
    price: 300,
    shortDescription: "Filigree heart caging a red stone, cherub below.",
    description:
      "An old reliquary heart — deep red glass cradled inside a silver filigree cage, crowned with a small flame and finished with a tiny cherub at the foot. Hangs from a heavy box chain.",
    materials: ["Silver-tone alloy", "Red glass"],
    images: ["/products/red-chrome-heart-1.jpg"],
  },
  {
    slug: "gothic-butterfly",
    name: "Gothic Butterfly",
    category: "chains",
    price: 300,
    shortDescription: "White butterfly inside a red filigree heart.",
    description:
      "A pale enamel butterfly trapped inside a red glass heart — framed by a curling silver filigree edge. Hangs from a fine snake chain.",
    materials: ["Silver-tone alloy", "Red and white enamel"],
    images: ["/products/gothic-butterfly-1.jpg"],
  },
  {
    slug: "spider-charm",
    name: "Spider Charm",
    category: "chains",
    price: 250,
    shortDescription: "Stainless steel spider, polished edges.",
    description:
      "A small silver spider with long curved legs — cut from polished stainless steel, light enough to forget you're wearing it. Pairs with any of our chains.",
    materials: ["Stainless steel"],
    images: ["/products/spider-charm-1.jpg"],
  },
  {
    slug: "rose-cross",
    name: "Rose Cross",
    category: "chains",
    price: 300,
    shortDescription: "Antique silver cross wrapped in a single rose.",
    description:
      "A gothic cross in oxidised silver — fluted arms curling outward, a single full-bloom rose crowning the centre. Heavy in the hand, soft in detail.",
    materials: ["Oxidised silver-tone alloy"],
    images: ["/products/rose-cross-1.jpg"],
  },
  {
    slug: "dragon-cross",
    name: "Dragon Cross",
    category: "chains",
    price: 300,
    shortDescription: "Crucifix coiled by a silver dragon, skull at the heart.",
    description:
      "An ornate Celtic-patterned cross with a small skull medallion at the centre — a silver dragon coils around its arms, body looping behind and tail trailing down. Heavy detail, small piece.",
    materials: ["Oxidised silver-tone alloy"],
    images: [
      "/products/dragon-cross-1.jpg",
      "/products/dragon-cross-2.jpg",
    ],
  },
  {
    slug: "clover-cross",
    name: "Clover Cross",
    category: "chains",
    price: 300,
    shortDescription: "Fleur-de-lis cross with diamond-faceted tips.",
    description:
      "A heraldic silver cross — every arm capped with a clover-shaped fleur-de-lis around a faceted diamond point, a small floral medallion at the centre. Antique-finished.",
    materials: ["Oxidised silver-tone alloy"],
    images: ["/products/clover-cross-1.jpg"],
  },
  {
    slug: "black-star",
    name: "Black Star",
    category: "chains",
    price: 250,
    shortDescription: "Asymmetric jet star in a silver frame.",
    description:
      "A lopsided five-point star — deep black enamel set inside a polished silver frame with a long, drawn-out lower point. Small, sharp, distinctly off-balance.",
    materials: ["Silver-tone alloy", "Black enamel"],
    images: ["/products/black-star-1.jpg"],
  },
  {
    slug: "sword-heart-charm",
    name: "Sword Heart Charm",
    category: "chains",
    price: 280,
    shortDescription: "Red heart run through by a skull-hilt dagger.",
    description:
      "A small dagger driven straight through a deep red enamel heart — twisted silver grip, tiny skull at the pommel, blade tip exposed below. The classic tattoo motif, made small.",
    materials: ["Silver-tone alloy", "Red enamel"],
    images: ["/products/sword-heart-charm-1.jpg"],
  },
  {
    slug: "reliquary-pendant",
    name: "Reliquary Chain",
    category: "chains",
    price: 5200,
    shortDescription: "Locket of smoked glass on silver.",
    description:
      "A small reliquary on a long chain — smoked glass behind silver filigree. Carry whatever the night gives you.",
    materials: ["Sterling silver", "Smoked glass"],
    dimensions: "Pendant 28mm · chain 70cm",
    images: [placeholder("reliquary-1"), placeholder("reliquary-2")],
  },
  {
    slug: "ember-pendant",
    name: "Ember Drop Chain",
    category: "chains",
    price: 3900,
    shortDescription: "Single garnet on a hammered drop.",
    description:
      "One drop of garnet caught in a hammered silver teardrop. The stone catches candlelight like an ember.",
    materials: ["Sterling silver", "Garnet"],
    images: [placeholder("ember-1"), placeholder("ember-2")],
  },
  {
    slug: "midnight-choker",
    name: "Midnight Choker",
    category: "chains",
    price: 7200,
    shortDescription: "Velvet ribbon, antique gold clasp.",
    description:
      "Deep black velvet finished with a brass clasp inspired by Victorian mourning jewellery. A cameo of darkness at the throat.",
    materials: ["Velvet", "Brass"],
    dimensions: "Adjustable 32–40cm",
    images: [placeholder("choker-1", 900, 900), placeholder("choker-2", 900, 900)],
  },
  {
    slug: "cathedral-choker",
    name: "Cathedral Chain",
    category: "chains",
    price: null, // one-of-one
    shortDescription: "One-of-one — silver lattice, jet beads.",
    description:
      "A one-of-one piece: a fine silver lattice studded with antique jet beads. Made once, sold once. Inquire for current availability.",
    materials: ["Sterling silver", "Antique jet"],
    images: [placeholder("cathedral-1"), placeholder("cathedral-2")],
    exclusive: true,
  },

  // —— Bracelets ——
  {
    slug: "wraith-cuff",
    name: "Wraith Cuff",
    category: "bracelets",
    price: 5400,
    shortDescription: "Hand-hammered oxidised cuff.",
    description:
      "A heavy hand-hammered cuff in oxidised silver — pulled open just enough to slip on, then closes against the wrist with a soft, deliberate weight.",
    materials: ["Oxidised sterling silver"],
    dimensions: "Inner Ø 60mm, adjustable",
    images: [placeholder("wraith-1"), placeholder("wraith-2")],
  },
  {
    slug: "shadow-wrap-bracelet",
    name: "Shadow Wrap",
    category: "bracelets",
    price: 3600,
    shortDescription: "Black cord wrap with brass charm.",
    description:
      "Triple-wrap waxed cord with a small brass medallion, aged to a deep gold-brown. Slim, quiet, made for everyday.",
    materials: ["Waxed cotton cord", "Aged brass"],
    dimensions: "Wraps 3× · adjustable 14–18cm",
    images: [placeholder("shadow-w-1"), placeholder("shadow-w-2")],
  },

  // —— Keychains ——
  {
    slug: "car-keychain",
    name: "Race Car Keychain",
    category: "keychains",
    price: 50,
    shortDescription: "Mini diecast race car — random colour, sent as one.",
    description:
      "A pocket-size diecast race car on a steel split-ring. Each keychain ships in a random colour and livery — the design you receive will not be the one shown in the photo. One car per order.",
    materials: ["Diecast metal", "Steel ring"],
    images: ["/products/car-keychain-1.jpg"],
  },
  {
    slug: "iron-thorn-keychain",
    name: "Iron Thorn Keychain",
    category: "keychains",
    price: 1800,
    shortDescription: "Blackened spike on a brass ring.",
    description:
      "A single blackened spike on a heavy brass ring — small, sharp, satisfying in the pocket. Hand-finished one by one.",
    materials: ["Oxidised silver", "Brass"],
    dimensions: "Spike 40mm · ring Ø 32mm",
    images: [placeholder("thorn-k-1"), placeholder("thorn-k-2")],
  },
  {
    slug: "relic-keychain",
    name: "Relic Keychain",
    category: "keychains",
    price: 2200,
    shortDescription: "Engraved tag on antique brass.",
    description:
      "A small engraved brass tag — a single word, your choice, hand-stamped at the bench. Sold in small batches.",
    materials: ["Antique brass"],
    dimensions: "Tag 22 × 36mm",
    images: [placeholder("relic-k-1"), placeholder("relic-k-2")],
    exclusive: true,
  },
];

export const productBySlug = (slug: string) =>
  PRODUCTS.find((p) => p.slug === slug);

export const productsByCategory = (cat: Category | "all") =>
  cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);

export const exclusiveProducts = () =>
  PRODUCTS.filter((p) => p.exclusive);

/** Featured pieces (home page). */
export const FEATURED_SLUGS = [
  "crow-talon-ring",
  "reliquary-pendant",
  "midnight-choker",
  "ember-pendant",
];

export const featured = () =>
  FEATURED_SLUGS.map(productBySlug).filter((p): p is Product => Boolean(p));
