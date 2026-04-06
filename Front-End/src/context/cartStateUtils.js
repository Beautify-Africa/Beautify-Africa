export const CART_STORAGE_KEY = 'beautify-cart-items';

export function getStoredCartItems() {
  try {
    const storedItems = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedItems) return [];

    const parsedItems = JSON.parse(storedItems);
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch {
    return [];
  }
}

export function clearStoredCartItems() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function persistGuestCartItems(cartItems) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

export function mapProductToCartItem(product, quantity = 1) {
  return {
    id: product._id || product.id || product.product,
    name: product.name,
    price: product.price,
    image: product.image,
    variant: product.brand || product.category || product.variant || 'Beautify Collection',
    quantity,
  };
}

export function mapServerCartItems(serverCart = []) {
  return serverCart.map((item) => ({
    id: item._id || item.id || item.product,
    name: item.name,
    price: item.price,
    image: item.image,
    variant: item.variant,
    quantity: item.quantity,
  }));
}

export function buildServerCartPayload(product, quantity = 1) {
  return {
    product: product._id || product.id || product.product,
    variant: product.variant || product.brand || product.category || 'Beautify Collection',
    quantity,
  };
}
