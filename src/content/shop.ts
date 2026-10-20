// Shop microcopy written for the rebuild. flag: client to review wording.
export const shop = {
  flag: "Shop labels written for the rebuild. Client to review.",
  eyebrow: "Shop",
  productCount: (n: number): string => `${n} ${n === 1 ? "product" : "products"}`,
  sampleNotice:
    "Showing sample products. Real products will appear here once they are added in the CMS.",
  enquire: "Enquire",
  outOfStock: "Out of stock",
  browse: "Browse categories",
  empty: "No products here yet.",
  whatsappMessage: (name: string, price: string): string =>
    `Hi Nature Nesto, I'm interested in ${name} (${price}). Is it available?`,
  badges: {
    new: "New",
    "pet-safe": "Pet safe",
    "low-light": "Low light",
    "easy-care": "Easy care",
    bestseller: "Bestseller",
  },
} as const;
