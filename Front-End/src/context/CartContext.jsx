import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { CartContext } from './cart-context';
import { useAuth } from '../hooks/useAuth';
import {
  fetchCart,
  syncCartApi,
  addToCartApi,
  updateCartQtyApi,
  removeCartItemApi,
} from '../services/cartApi';

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
    id: product._id || product.id || product.product,
    name: product.name,
    price: product.price,
    image: product.image,
    variant: product.brand || product.category || product.variant || 'Beautify Collection',
    quantity,
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(getStoredCartItems);
  const { token, isAuthenticated } = useAuth();
  const initialSyncDone = useRef(false);

  useEffect(() => {
    let active = true;

    async function handleAuthCartSync() {
      if (isAuthenticated && token) {
        try {
          const localItems = getStoredCartItems();
          let serverCart = [];

          if (localItems.length > 0 && !initialSyncDone.current) {
            serverCart = await syncCartApi(token, localItems);
          } else {
            serverCart = await fetchCart(token);
          }

          if (active) {
            // Map MongoDB schema formats back into standard format
            const mappedCart = serverCart.map((item) => mapProductToCartItem(item, item.quantity));
            setCartItems(mappedCart);
            initialSyncDone.current = true;
          }
        } catch (e) {
          console.error('Failed to sync with server cart:', e);
        }
      } else {
        // If they explicitly logged out in this session, clear their cart for privacy
        if (initialSyncDone.current && active) {
          setCartItems([]);
          localStorage.removeItem(CART_STORAGE_KEY);
          initialSyncDone.current = false;
        }
      }
    }

    handleAuthCartSync();

    return () => {
      active = false;
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = useCallback(
    (product, quantity = 1) => {
      const productId = product?._id || product?.id || product?.product;
      if (!productId || quantity < 1) return;

      setCartItems((prev) => {
        const existingItem = prev.find((item) => item.id === productId);
        if (existingItem) {
          return prev.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, mapProductToCartItem(product, quantity)];
      });

      if (isAuthenticated && token) {
        addToCartApi(token, {
          product: productId,
          name: product.name,
          price: product.price,
          image: product.image,
          variant: product.brand || product.category || 'Beautify Collection',
          quantity,
        }).catch((e) => console.error('Add to Cart API Error', e));
      }
    },
    [isAuthenticated, token]
  );

  const updateQuantity = useCallback(
    (id, quantity) => {
      setCartItems((prev) => {
        if (quantity < 1) return prev.filter((item) => item.id !== id);
        return prev.map((item) => (item.id === id ? { ...item, quantity } : item));
      });

      if (isAuthenticated && token) {
        if (quantity < 1) {
          removeCartItemApi(token, id).catch((e) => console.error(e));
        } else {
          updateCartQtyApi(token, id, quantity).catch((e) => console.error(e));
        }
      }
    },
    [isAuthenticated, token]
  );

  const removeItem = useCallback(
    (id) => {
      setCartItems((prev) => prev.filter((item) => item.id !== id));

      if (isAuthenticated && token) {
        removeCartItemApi(token, id).catch((e) => console.error(e));
      }
    },
    [isAuthenticated, token]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [
    cartItems,
  ]);

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
