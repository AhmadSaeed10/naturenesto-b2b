import type { PhotoKey } from "./photos";

// Shop by Space: curated product lists per room or site. Handles that do not exist in the
// catalogue are skipped at render time. (inferred) Client to confirm the pairings.
export interface Space {
  slug: string;
  title: string;
  blurb: string;
  photo: PhotoKey;
  photoAlt: string;
  handles: string[];
}

export const spacesPage = {
  eyebrow: "SHOP BY SPACE",
  title: "Find Something Beautiful for Every Space.",
  intro:
    "Every space has the potential to become something extraordinary. Discover products and inspiration designed around the way you live.",
  empty: "Products for this space are being added. Message the studio for a recommendation.",
  help: "Not sure what suits your space? Ask the studio.",
};

export const spaces: Space[] = [
  {
    slug: "home-living",
    title: "Home & Living",
    blurb: "Easy, beautiful plants and pots for living rooms, bedrooms and shelves.",
    photo: "room-plants-a",
    photoAlt: "A living room with plants on a shelf and floor",
    handles: [
      "monstera",
      "snake-plant",
      "zz-plant",
      "golden-pothos",
      "peace-lily",
      "ceramic-bowl",
      "terracotta-classic",
    ],
  },
  {
    slug: "balconies-terraces",
    title: "Balconies & Terraces",
    blurb: "Sun loving flowers and herbs that thrive in outdoor corners.",
    photo: "bougain-a",
    photoAlt: "Flowering bougainvillea on a terrace",
    handles: [
      "bougainvillea",
      "hibiscus",
      "motia-jasmine",
      "lavender",
      "herb-duo",
      "terracotta-classic",
      "tall-floor-planter",
    ],
  },
  {
    slug: "gardens-lawns",
    title: "Gardens & Lawns",
    blurb: "Trees, shrubs and the soil, feed and tools to keep them healthy.",
    photo: "olive-a",
    photoAlt: "An olive tree in a garden",
    handles: [
      "olive-tree",
      "bougainvillea",
      "hibiscus",
      "lavender",
      "potting-mix",
      "organic-feed",
      "pruning-shears",
      "watering-can",
    ],
  },
  {
    slug: "rooftops",
    title: "Rooftops",
    blurb: "Tough, sun ready plants and large planters for exposed roofs.",
    photo: "bird-a",
    photoAlt: "A bird of paradise plant in strong light",
    handles: [
      "olive-tree",
      "bird-of-paradise",
      "bougainvillea",
      "tall-floor-planter",
      "cactus-collection",
      "aloe-vera",
    ],
  },
  {
    slug: "offices-workspaces",
    title: "Offices & Workspaces",
    blurb: "Low maintenance greenery that makes a workplace calmer.",
    photo: "office",
    photoAlt: "Plants beside a desk in an office",
    handles: [
      "zz-plant",
      "snake-plant",
      "rubber-plant",
      "areca-palm",
      "charcoal-cylinder",
      "succulent-table-set",
    ],
  },
  {
    slug: "cafes-restaurants",
    title: "Cafés & Restaurants",
    blurb: "Statement plants and planters that set the mood for guests.",
    photo: "table-plants",
    photoAlt: "Plants grouped on a wooden table",
    handles: [
      "fiddle-leaf-fig",
      "monstera",
      "areca-palm",
      "tall-floor-planter",
      "herb-duo",
      "ceramic-planter-white",
    ],
  },
  {
    slug: "hotels-commercial",
    title: "Hotels & Commercial Spaces",
    blurb: "Large format plants and planters for lobbies and public areas.",
    photo: "floor-room",
    photoAlt: "A tall plant in a bright, spacious room",
    handles: [
      "fiddle-leaf-fig",
      "areca-palm",
      "bird-of-paradise",
      "rubber-plant",
      "tall-floor-planter",
      "olive-tree",
    ],
  },
];
