/**
 * Cart drawer content configuration
 */

export const CART_CONTENT = {
  heading: 'Your Selection',
  subtotalLabel: 'Subtotal',
  shippingNote: 'Shipping & taxes calculated at checkout.',
  checkoutLabel: 'Proceed to Checkout',
  emptyMessage: 'Your cart is empty',
  continueShopping: 'Continue Shopping',
};

// Mock cart items for development
export const MOCK_CART_ITEMS = [
  {
    id: 1,
    name: 'The Velvet Botanique',
    price: 42.0,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403ea2?q=80&w=200&auto=format&fit=crop',
    variant: 'Rose Noire',
  },
  {
    id: 2,
    name: 'Luminous Silk Serum',
    price: 85.0,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop',
    variant: '30ml',
  },
];
