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
  const productId =
    product.productId ||
    product._id ||
    product.id ||
    (typeof product.product === 'object' ? product.product?._id : product.product);

  return {
    id: productId,
    productId,
    cartItemId: product.cartItemId || product._id || null,
    name: product.name,
    price: product.price,
    image: product.image,
    variant: product.brand || product.category || product.variant || 'Beautify Collection',
    quantity,
  };
}

export function mapServerCartItems(serverCart = []) {
  return serverCart.map((item) => ({
    id: item.productId || (typeof item.product === 'object' ? item.product?._id : item.product) || item.id || item._id,
    productId: item.productId || (typeof item.product === 'object' ? item.product?._id : item.product) || item.id || item._id,
    cartItemId: item._id || item.cartItemId || null,
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
