/** Fired by add to cart and quantity changes so the header count updates without a reload. */
export const CART_EVENT = "nn:cart";
/** Asks the cart drawer to open, for example after an item is added. */
export const CART_OPEN_EVENT = "nn:cart-open";

export const openCart = (): void => {
  window.dispatchEvent(new Event(CART_OPEN_EVENT));
};

/** Fired when a picked variant has its own photo, so the gallery can show it. */
export const VARIANT_IMAGE_EVENT = "nn:variant-image";
