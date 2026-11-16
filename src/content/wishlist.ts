// Wishlist copy. The list lives in the visitor's browser, so no sign in is needed.
export const wishlist = {
  title: "Your wishlist",
  intro: "Plants and pots you have saved. They are kept in this browser.",
  empty: "Nothing saved yet. Tap the heart on any product to keep it here.",
  browse: "Browse the marketplace",
  add: (name: string) => `Save ${name} to wishlist`,
  remove: (name: string) => `Remove ${name} from wishlist`,
  loading: "Loading your wishlist",
};
