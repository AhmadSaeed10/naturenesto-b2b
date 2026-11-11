// Shop microcopy written for the rebuild. flag: client to review wording.
export const shop = {
  flag: "Shop labels written for the rebuild. Client to review.",
  eyebrow: "Shop",
  productCount: (n: number): string => `${n} ${n === 1 ? "product" : "products"}`,
  sampleNotice:
    "Showing sample products. Live inventory will appear here once the catalogue is connected.",
  enquire: "Enquire",
  outOfStock: "Out of stock",
  browse: "Browse categories",
  empty: "No products here yet.",
  whatsappMessage: (name: string, price: string): string =>
    `Hi Nature Nesto, I'm interested in ${name} (${price}). Is it available?`,
  // flag: card and filter wording is new, confirm with the client.
  card: {
    from: "From",
    onlyLeft: (n: number) => `Only ${n} left`,
    soldOut: "Sold out",
    sale: "Sale",
    // Short care words for the printed line under the name.
    careShort: {
      light: { low: "Low light", medium: "Medium light", bright: "Bright light" },
      pet: { safe: "Pet safe", toxic: "Pet toxic" },
      level: { easy: "Easy", moderate: "Moderate", expert: "Expert" },
    },
    quickAdd: "Quick add",
    chooseOptions: "Choose options",
    careIcons: "Care at a glance",
  },
  filters: {
    title: "Filter",
    open: (n: number) => (n > 0 ? `Filter (${n})` : "Filter"),
    sort: "Sort by",
    sorts: {
      featured: "Featured",
      "price-asc": "Price, low to high",
      "price-desc": "Price, high to low",
      name: "Name",
    },
    light: "Light",
    pets: "Pets",
    level: "Care level",
    petSafe: "Pet safe",
    inStock: "In stock only",
    clear: "Clear filters",
    noMatch: "Nothing matches those filters.",
    results: (n: number) => `${n} ${n === 1 ? "plant" : "plants"}`,
  },
  tile: {
    title: "Not sure which plant suits your space?",
    body: "Tell us about the light and the room. We will help you choose.",
    cta: "Book a consultation",
  },
  badges: {
    new: "New",
    "pet-safe": "Pet safe",
    "low-light": "Low light",
    "easy-care": "Easy care",
    bestseller: "Bestseller",
  },
} as const;
