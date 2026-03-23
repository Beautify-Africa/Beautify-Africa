import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './cart-context';

const CART_STORAGE_KEY = 'beautify-cart-items';

function getStoredCartItems() {
  try {
    const storedItems = localStorage.getItem(CART_STORAGE_KEY);

    if (!storedItems) return [];

    const parsedItems = JSON.parse(storedItems);
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch {
    return [];
  }
}

function mapProductToCartItem(product, quantity = 1) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    variant: product.brand || product.category || 'Beautify Collection',
    quantity,
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(getStoredCartItems);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = useCallback((product, quantity = 1) => {
    if (!product?.id || quantity < 1) return;

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, mapProductToCartItem(product, quantity)];
    });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setCartItems((prev) => {
      if (quantity < 1) {
        return prev.filter((item) => item.id !== id);
      }

      return prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [cartItems, cartCount, subtotal, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
