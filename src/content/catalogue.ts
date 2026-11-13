import { sampleCare } from "./sample-care";
import type { CatalogSlug, ProductBadge } from "./types";
import type { PhotoKey } from "./photos";

// The shop catalogue: 41 products with stand-in photography and market range prices in PKR.
// Names are real plant and product types sold in Pakistan. Prices, sizes and descriptions are
// drafted for the rebuild, not the studio's own list, so the client confirms them in Admin.
// flag: confirm every price, size and stock level with the client before launch.

export type CatalogueKind = "plant" | "pot" | "care";

export interface CatalogueEntry {
  handle: string;
  name: string;
  kind: CatalogueKind;
  /** Whole rupees. */
  price: number;
  compareAtPrice?: number;
  size: string;
  categories: CatalogSlug[];
  badges?: ProductBadge[];
  inStock?: boolean;
  photo: PhotoKey;
  gallery?: PhotoKey[];
  /** One line under the title. */
  short: string;
  /** Markdown, up to two short paragraphs. */
  description: string;
  /** Extra rows, after the size and care rows the page derives itself. */
  specs?: [label: string, value: string][];
  /** Replaces the default "what is included" list. */
  included?: string[];
}

const PLANT_INCLUDES = ["Live plant in its nursery pot", "Care guidance for your plant"];
const POT_INCLUDES = ["One planter, as shown", "Packed to protect the finish"];

export const defaultIncluded = (kind: CatalogueKind): string[] =>
  kind === "plant" ? PLANT_INCLUDES : kind === "pot" ? POT_INCLUDES : [];

const LIGHT = {
  low: "Low light",
  medium: "Medium, indirect light",
  bright: "Bright light",
} as const;
const WATER = {
  low: "Let the soil dry between waterings",
  moderate: "Water when the top soil is dry",
  frequent: "Keep the soil lightly moist",
} as const;
const PET = { safe: "Safe for pets", toxic: "Keep away from pets" } as const;
const LEVEL = { easy: "Easy", moderate: "Moderate", expert: "Expert" } as const;

/** Specification rows for a product page: size, the care facts, then the entry's own rows. */
export function specRows(entry: CatalogueEntry): { label: string; value: string }[] {
  const care = sampleCare[entry.handle];
  const rows: [string, string | undefined][] = [
    ["Size", entry.size],
    ["Light", care?.light ? LIGHT[care.light] : undefined],
    ["Watering", care?.water ? WATER[care.water] : undefined],
    ["Pets", care?.pet ? PET[care.pet] : undefined],
    ["Care level", care?.level ? LEVEL[care.level] : undefined],
    ...(entry.specs ?? []),
  ];
  return rows.flatMap(([label, value]) => (value ? [{ label, value }] : []));
}

export const catalogue: CatalogueEntry[] = [
  // Indoor plants
  {
    handle: "monstera",
    name: "Monstera Deliciosa",
    kind: "plant",
    price: 4500,
    size: "Medium, 90 cm",
    categories: ["indoor-plants", "large-plants"],
    badges: ["bestseller"],
    photo: "monstera-pot",
    gallery: ["monstera-leaf"],
    short: "Big split leaves that make any corner look styled.",
    description:
      "The monstera is the classic statement plant. Its glossy leaves split and perforate as it matures, and it grows quickly in bright, indirect light.\n\nGive it a moss pole or a sturdy stake as it climbs, and wipe the leaves now and then so they stay glossy.",
  },
  {
    handle: "snake-plant",
    name: "Snake Plant",
    kind: "plant",
    price: 1800,
    size: "Small, 45 cm",
    categories: ["indoor-plants", "easy-care", "low-light"],
    badges: ["easy-care", "low-light"],
    photo: "snake-a",
    gallery: ["snake-b"],
    short: "Upright, tough and nearly unkillable.",
    description:
      "Snake plants cope with dim rooms, dry spells and a forgetful owner. Their upright, sword shaped leaves suit hallways, bedrooms and office desks.\n\nWater only when the soil has dried out completely, and less in winter.",
  },
  {
    handle: "zz-plant",
    name: "ZZ Plant",
    kind: "plant",
    price: 2200,
    size: "Small, 50 cm",
    categories: ["indoor-plants", "easy-care", "low-light"],
    badges: ["low-light"],
    photo: "zz-a",
    gallery: ["zz-stem"],
    short: "Glossy, patient and happy in low light.",
    description:
      "The ZZ plant stores water in its thick rhizomes, so it forgives missed waterings and thrives away from windows. A good first plant for offices and shaded rooms.\n\nLet the soil dry between drinks and keep it out of harsh afternoon sun.",
  },
  {
    handle: "golden-pothos",
    name: "Golden Pothos",
    kind: "plant",
    price: 1200,
    compareAtPrice: 1500,
    size: "Hanging, 30 cm",
    categories: ["indoor-plants", "easy-care", "low-light"],
    badges: ["easy-care"],
    photo: "pothos-a",
    gallery: ["pothos-shelf"],
    short: "Trailing vines for shelves, hooks and high cabinets.",
    description:
      "Pothos is one of the easiest trailing plants. It tolerates low light, tells you when it is thirsty by drooping slightly, and perks up quickly after watering.\n\nTrim the vines to keep it full, and root the cuttings in water to make more.",
  },
  {
    handle: "peace-lily",
    name: "Peace Lily",
    kind: "plant",
    price: 1900,
    size: "Medium, 60 cm",
    categories: ["indoor-plants", "low-light"],
    photo: "peace-lily-b",
    gallery: ["peace-lily-a"],
    short: "Dark leaves and white blooms, even in shade.",
    description:
      "Peace lilies bring white spathes and deep green foliage to rooms that do not get much sun. They tell you plainly when they are thirsty, which makes them easy to read.\n\nKeep the soil lightly moist and the plant out of direct sun.",
  },
  {
    handle: "fiddle-leaf-fig",
    name: "Fiddle Leaf Fig",
    kind: "plant",
    price: 8500,
    size: "Large, 150 cm",
    categories: ["indoor-plants", "large-plants"],
    badges: ["new"],
    photo: "fiddle-a",
    short: "A tall, sculptural plant for a bright corner.",
    description:
      "Large, violin shaped leaves make the fiddle leaf fig a favourite for living rooms. It likes bright light and a steady routine, so pick a spot and leave it there.\n\nTurn the pot a quarter every few weeks so it grows evenly.",
  },
  {
    handle: "calathea",
    name: "Calathea Orbifolia",
    kind: "plant",
    price: 3200,
    size: "Medium, 55 cm",
    categories: ["indoor-plants", "pet-friendly", "low-light"],
    badges: ["pet-safe"],
    photo: "calathea-a",
    short: "Patterned leaves that fold up at night.",
    description:
      "Calatheas are grown for their striped, patterned foliage, and their leaves move through the day. They like humidity and even moisture, and they are safe around pets.\n\nUse filtered water where you can, and keep the plant away from drafts.",
  },
  {
    handle: "spider-plant",
    name: "Spider Plant",
    kind: "plant",
    price: 950,
    size: "Small, 30 cm",
    categories: ["indoor-plants", "pet-friendly", "easy-care"],
    badges: ["pet-safe", "easy-care"],
    photo: "spider-a",
    short: "Arching striped leaves and baby plants to share.",
    description:
      "Spider plants are cheerful, forgiving and safe around cats and dogs. They send out little plantlets on long stems that you can pot up and give away.\n\nBright, indirect light keeps the stripes sharp.",
  },
  {
    handle: "boston-fern",
    name: "Boston Fern",
    kind: "plant",
    price: 1400,
    size: "Hanging, 40 cm",
    categories: ["indoor-plants", "pet-friendly"],
    badges: ["pet-safe"],
    photo: "fern-a",
    short: "Soft, feathery fronds for a hanging basket.",
    description:
      "Boston ferns fill a hanging pot with lush fronds and are safe for pets. They enjoy humidity, so a bathroom or a spot away from the air conditioner suits them.\n\nKeep the soil evenly moist and never let it dry out fully.",
  },
  {
    handle: "areca-palm",
    name: "Areca Palm",
    kind: "plant",
    price: 6500,
    size: "Large, 160 cm",
    categories: ["indoor-plants", "large-plants", "pet-friendly"],
    badges: ["pet-safe"],
    photo: "areca-a",
    short: "A full, feathery palm that softens a room.",
    description:
      "The areca palm brings a light, tropical look to living rooms and lobbies, and it is safe around pets. It likes bright, indirect light and regular watering.\n\nAvoid moving it often, as palms prefer a settled spot.",
  },
  {
    handle: "rubber-plant",
    name: "Rubber Plant",
    kind: "plant",
    price: 3800,
    size: "Medium, 80 cm",
    categories: ["indoor-plants", "large-plants"],
    photo: "rubber-a",
    gallery: ["rubber-b"],
    inStock: false,
    short: "Thick, glossy leaves on a strong upright stem.",
    description:
      "Rubber plants are bold and easy, with thick leaves that hold their shine. They grow steadily upward in bright light and need little fuss.\n\nDust the leaves with a damp cloth to keep them glossy.",
  },
  {
    handle: "chinese-money-plant",
    name: "Chinese Money Plant",
    kind: "plant",
    price: 2400,
    size: "Small, 30 cm",
    categories: ["indoor-plants", "pet-friendly", "easy-care"],
    badges: ["pet-safe", "new"],
    photo: "money-plant",
    short: "Round, coin shaped leaves on a compact plant.",
    description:
      "Pilea peperomioides is loved for its round leaves and tidy shape. It is safe for pets and easy to multiply, since it sends up baby plants around the base.\n\nTurn it regularly so it grows evenly towards the light.",
  },
  {
    handle: "heartleaf-philodendron",
    name: "Heartleaf Philodendron",
    kind: "plant",
    price: 1500,
    size: "Small, 25 cm",
    categories: ["indoor-plants", "easy-care", "low-light"],
    photo: "philodendron",
    short: "Heart shaped leaves that trail or climb.",
    description:
      "A relaxed, fast growing vine with soft, heart shaped leaves. Let it trail from a shelf or climb a small stake, and it will adapt to most indoor spots.\n\nWater when the top of the soil feels dry.",
  },
  {
    handle: "hoya-trio",
    name: "Hoya Trio",
    kind: "plant",
    price: 5200,
    size: "Three plants",
    categories: ["indoor-plants", "easy-care"],
    photo: "trio",
    short: "Three waxy hoyas, ready to display together.",
    description:
      "Hoyas have thick, waxy leaves and store water well, so they suit a bright windowsill and a relaxed watering routine. This set of three works well along a shelf or table.\n\nWater only once the soil has dried through.",
    included: ["Three live plants in nursery pots", "Care guidance for your plants"],
  },
  {
    handle: "anthurium",
    name: "Anthurium",
    kind: "plant",
    price: 3600,
    size: "Small, 35 cm",
    categories: ["indoor-plants"],
    photo: "anthurium",
    short: "Glossy red blooms that last for weeks.",
    description:
      "Anthuriums flower on and off through the year, with waxy red spathes above dark green leaves. They like bright, indirect light and a bit of humidity.\n\nKeep the plant away from pets, as the leaves can irritate if chewed.",
  },
  // Orchids
  {
    handle: "phalaenopsis-white",
    name: "White Phalaenopsis Orchid",
    kind: "plant",
    price: 4200,
    size: "Double stem",
    categories: ["orchids", "pet-friendly", "indoor-plants"],
    badges: ["pet-safe", "bestseller"],
    photo: "phal-white",
    short: "Elegant white blooms on a double stem.",
    description:
      "The moth orchid is the easiest orchid to keep at home. The flowers can last for months, and the plant often blooms again with a little patience.\n\nWater once the roots turn silvery, and give it bright light without direct sun.",
  },
  {
    handle: "phalaenopsis-blush",
    name: "Blush Phalaenopsis Orchid",
    kind: "plant",
    price: 4200,
    size: "Double stem",
    categories: ["orchids", "pet-friendly"],
    badges: ["pet-safe"],
    photo: "phal-pink",
    short: "Soft pink and white blooms, a lovely gift.",
    description:
      "A blush toned moth orchid with long lasting flowers, safe around pets. It sits well on a table or sideboard in bright, indirect light.\n\nWater lightly and let the roots dry between drinks.",
  },
  {
    handle: "dendrobium",
    name: "Dendrobium Orchid",
    kind: "plant",
    price: 3600,
    size: "Single stem",
    categories: ["orchids"],
    badges: ["new"],
    photo: "dendro-a",
    short: "Upright canes covered in small blooms.",
    description:
      "Dendrobiums carry clusters of flowers along tall canes. They enjoy bright light and a little less water in the cooler months.\n\nFeed lightly during growth for the best flowering.",
  },
  {
    handle: "orchid-trio",
    name: "Orchid Trio in Ceramic Bowl",
    kind: "plant",
    price: 11500,
    compareAtPrice: 12600,
    size: "Three plants",
    categories: ["orchids"],
    photo: "phal-pink",
    gallery: ["phal-white"],
    short: "Three orchids arranged in one glazed bowl.",
    description:
      "A gift ready arrangement of three moth orchids planted together in a glazed ceramic bowl. It makes a centrepiece for a dining table or a reception desk.\n\nKeep it in bright, indirect light and water lightly.",
    included: ["Three orchids planted in a ceramic bowl", "Care guidance for your orchids"],
  },
  // Outdoor plants
  {
    handle: "bougainvillea",
    name: "Bougainvillea",
    kind: "plant",
    price: 1600,
    size: "Medium, 70 cm",
    categories: ["outdoor-plants"],
    badges: ["bestseller"],
    photo: "bougain-a",
    short: "Papery pink bracts that colour a whole wall.",
    description:
      "Bougainvillea loves full sun and heat, and rewards a sunny balcony or boundary wall with months of bright bracts. It flowers best when kept a little dry.\n\nPrune after a flush of flowers to keep it shapely.",
  },
  {
    handle: "motia-jasmine",
    name: "Motia Jasmine",
    kind: "plant",
    price: 1100,
    size: "Small, 40 cm",
    categories: ["outdoor-plants"],
    photo: "jasmine",
    short: "Small white flowers with an evening fragrance.",
    description:
      "Motia, or Arabian jasmine, is loved across Pakistan for its fragrant white flowers. It prefers sunshine and regular water, and does well in a large pot.\n\nPick the flowers regularly to encourage more.",
  },
  {
    handle: "hibiscus",
    name: "Hibiscus",
    kind: "plant",
    price: 1300,
    size: "Medium, 60 cm",
    categories: ["outdoor-plants"],
    photo: "hibiscus-a",
    short: "Big, bold blooms for a sunny spot.",
    description:
      "Hibiscus produces large, colourful flowers in warm weather. It needs sun, regular watering and an occasional feed to keep blooming.\n\nPinch back tips in spring for a bushier plant.",
  },
  {
    handle: "olive-tree",
    name: "Olive Tree",
    kind: "plant",
    price: 9500,
    size: "Large, 140 cm",
    categories: ["outdoor-plants", "large-plants"],
    badges: ["new"],
    photo: "olive-a",
    short: "Silver green leaves and a sculptural trunk.",
    description:
      "An olive tree gives patios and terraces a calm, Mediterranean look. It wants full sun, good drainage and not too much water.\n\nUse a large pot with drainage holes and refresh the top soil each year.",
  },
  {
    handle: "aloe-vera",
    name: "Aloe Vera",
    kind: "plant",
    price: 800,
    size: "Small, 25 cm",
    categories: ["outdoor-plants", "easy-care"],
    badges: ["easy-care"],
    photo: "aloe-a",
    short: "A useful, sun loving succulent.",
    description:
      "Aloe vera thrives in bright light and needs very little water. Its thick leaves store moisture, so let the soil dry out well between waterings.\n\nA sunny window or balcony suits it best.",
  },
  {
    handle: "jade-plant",
    name: "Jade Plant",
    kind: "plant",
    price: 1500,
    size: "Small, 30 cm",
    categories: ["outdoor-plants", "easy-care"],
    photo: "jade-a",
    short: "Thick leaves on a woody, tree like stem.",
    description:
      "The jade plant is a long lived succulent that slowly becomes a small tree. It needs bright light and sparing water.\n\nAvoid overwatering, which is the one thing it dislikes.",
  },
  {
    handle: "bird-of-paradise",
    name: "Bird of Paradise",
    kind: "plant",
    price: 7800,
    size: "Large, 130 cm",
    categories: ["outdoor-plants", "large-plants"],
    photo: "bird-a",
    short: "Tall, paddle shaped leaves and tropical flowers.",
    description:
      "A showy plant with big banana like leaves and, with enough sun, striking orange and blue flowers. It suits bright patios and sunny, spacious rooms.\n\nWater regularly and give it room to grow.",
  },
  {
    handle: "lavender",
    name: "Lavender",
    kind: "plant",
    price: 1400,
    size: "Small, 30 cm",
    categories: ["outdoor-plants"],
    photo: "lavender",
    short: "Fragrant purple spikes for a sunny corner.",
    description:
      "Lavender loves sun and sharp drainage. Plant it in a terracotta pot on a bright balcony and trim after flowering to keep it compact.\n\nIt prefers to stay on the dry side.",
  },
  {
    handle: "herb-duo",
    name: "Basil & Rosemary Duo",
    kind: "plant",
    price: 1300,
    size: "Two herbs",
    categories: ["outdoor-plants", "easy-care"],
    photo: "herbs",
    short: "Two kitchen herbs, ready for a sunny windowsill.",
    description:
      "A pair of potted herbs for the kitchen. Basil likes regular water and warmth, while rosemary prefers to dry out between drinks, so give each its own pot.\n\nHarvest often from the top to keep them bushy.",
    included: ["Two live herbs in nursery pots", "Care guidance for your herbs"],
  },
  // Easy care and succulents
  {
    handle: "cactus-collection",
    name: "Cactus Collection",
    kind: "plant",
    price: 2800,
    size: "Set of five",
    categories: ["easy-care", "indoor-plants"],
    badges: ["easy-care"],
    photo: "cactus-mix",
    short: "A mixed set of small potted cacti.",
    description:
      "Five small cacti in different shapes and colours, grown in nursery pots. They like as much sun as you can give them and very little water.\n\nPlace them on a bright windowsill and water only when fully dry.",
    included: ["Five small cacti in nursery pots", "Care guidance for your cacti"],
  },
  {
    handle: "succulent-table-set",
    name: "Succulent Table Set",
    kind: "plant",
    price: 2600,
    size: "Set of four",
    categories: ["easy-care", "indoor-plants"],
    photo: "desk-succulents",
    short: "Small succulents for a desk or coffee table.",
    description:
      "A set of four small succulents in individual pots, sized for a desk, shelf or coffee table. They like bright light and a very light hand with water.\n\nTurn them now and then so they keep an even shape.",
    included: ["Four small succulents in pots", "Care guidance for your succulents"],
  },
  // Pots and planters
  {
    handle: "ceramic-bowl",
    name: "Glazed Ceramic Bowl",
    kind: "pot",
    price: 2400,
    size: "30 cm",
    categories: ["pots-and-planters"],
    badges: ["bestseller"],
    photo: "pot-bw",
    short: "A wide glazed bowl for orchids and arrangements.",
    description:
      "A wide, shallow glazed bowl that suits orchids, succulents and low arrangements. Add a layer of drainage stones, or use it as a cover for a nursery pot.",
    specs: [["Material", "Glazed ceramic"]],
  },
  {
    handle: "terracotta-classic",
    name: "Classic Terracotta Pot",
    kind: "pot",
    price: 900,
    size: "25 cm",
    categories: ["pots-and-planters"],
    photo: "terracotta-stack",
    short: "The everyday clay pot that lets roots breathe.",
    description:
      "Terracotta is porous, so soil dries evenly and roots stay healthy, which makes it a good choice for succulents, herbs and anything that dislikes wet feet.",
    specs: [["Material", "Terracotta clay"]],
  },
  {
    handle: "charcoal-cylinder",
    name: "Charcoal Cylinder Planter",
    kind: "pot",
    price: 3200,
    size: "35 cm",
    categories: ["pots-and-planters"],
    badges: ["new"],
    photo: "pot-black",
    short: "A deep charcoal planter with clean lines.",
    description:
      "A tall cylinder planter in a deep charcoal finish that makes green leaves stand out. It suits snake plants, rubber plants and palms in modern rooms.",
    specs: [["Finish", "Charcoal"]],
  },
  {
    handle: "tall-floor-planter",
    name: "Tall Floor Planter",
    kind: "pot",
    price: 5600,
    compareAtPrice: 6200,
    size: "70 cm",
    categories: ["pots-and-planters", "large-plants"],
    photo: "floor-room",
    short: "A tall planter for large plants and bright corners.",
    description:
      "A tall floor standing planter with room for large plants such as fiddle leaf figs and palms. Place it near a window and fill with a well draining mix.",
  },
  {
    handle: "terracotta-set",
    name: "Terracotta Trio Set",
    kind: "pot",
    price: 2300,
    size: "15, 20 and 25 cm",
    categories: ["pots-and-planters"],
    inStock: false,
    photo: "terracotta-stack",
    gallery: ["desk-succulents"],
    short: "Three nesting clay pots in graduated sizes.",
    description:
      "Three terracotta pots in graduated sizes, ideal for grouping on a shelf, step or windowsill. Pair them with herbs and succulents.",
    included: ["Three terracotta pots", "Packed to protect the finish"],
    specs: [["Material", "Terracotta clay"]],
  },
  {
    handle: "ceramic-planter-white",
    name: "Matte White Planter",
    kind: "pot",
    price: 2800,
    size: "28 cm",
    categories: ["pots-and-planters"],
    photo: "money-plant",
    short: "A soft matte white planter that goes with everything.",
    description:
      "A matte white ceramic planter with a quiet finish that suits any room. It pairs well with leafy plants such as pilea, pothos and ferns.",
    specs: [["Finish", "Matte white ceramic"]],
  },
  // Plant care
  {
    handle: "potting-mix",
    name: "Premium Potting Mix",
    kind: "care",
    price: 650,
    size: "5 kg",
    categories: ["plant-care"],
    badges: ["bestseller"],
    photo: "potting",
    short: "A light, well draining mix for houseplants.",
    description:
      "A ready to use potting mix for indoor and balcony plants. It holds enough moisture to feed roots while draining freely, which helps prevent soggy soil.",
    included: ["One 5 kg bag of potting mix"],
  },
  {
    handle: "neem-spray",
    name: "Neem Oil Leaf Spray",
    kind: "care",
    price: 750,
    size: "500 ml",
    categories: ["plant-care"],
    photo: "spray-bottle",
    short: "A gentle spray for leaf care and pest control.",
    description:
      "A ready to use neem oil spray for keeping leaves clean and discouraging common pests. Test on one leaf first and apply away from strong midday sun.",
    included: ["One 500 ml spray bottle"],
  },
  {
    handle: "watering-can",
    name: "Brass Spout Watering Can",
    kind: "care",
    price: 2100,
    size: "1.5 L",
    categories: ["plant-care"],
    badges: ["new"],
    photo: "watering-can",
    short: "A slim spouted can for precise watering.",
    description:
      "A small watering can with a long spout for reaching under leaves and into crowded pots. It holds enough for a shelf of plants without being heavy.",
    included: ["One watering can"],
  },
  {
    handle: "pruning-shears",
    name: "Pruning Shears",
    kind: "care",
    price: 1650,
    size: "20 cm",
    categories: ["plant-care"],
    photo: "shears",
    short: "Sharp shears for tidy cuts and healthy growth.",
    description:
      "Hand shears for trimming stems, removing spent flowers and shaping bushes. Clean the blades between plants to avoid passing on disease.",
    included: ["One pair of pruning shears"],
  },
  {
    handle: "organic-feed",
    name: "Organic Plant Feed",
    kind: "care",
    price: 850,
    size: "1 kg",
    categories: ["plant-care", "easy-care"],
    photo: "soil-bag",
    short: "A gentle feed for leafy plants and flowers.",
    description:
      "An organic feed to mix into the top soil during the growing season. Follow the instructions on the pack, and feed less in winter when plants grow slowly.",
    included: ["One 1 kg pack of plant feed"],
  },
];
