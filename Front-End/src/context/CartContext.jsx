import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { CartContext } from './cart-context';
import { useAuth } from '../hooks/useAuth';
import {
  fetchCart,
  syncCartApi,
  addToCartApi,
  updateCartQtyApi,
  removeCartItemApi,
  clearCartApi,
} from '../services/cartApi';
import {
  getStoredCartItems,
  clearStoredCartItems,
  persistGuestCartItems,
  mapProductToCartItem,
  mapServerCartItems,
  buildServerCartPayload,
} from './cartStateUtils';

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
            setCartItems(mapServerCartItems(serverCart));
            initialSyncDone.current = true;
            clearStoredCartItems();
          }
        } catch (e) {
          console.error('Failed to sync with server cart:', e);
        }
      } else {
        // If they explicitly logged out in this session, clear their cart for privacy
        if (initialSyncDone.current && active) {
          setCartItems([]);
          clearStoredCartItems();
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
    if (isAuthenticated) {
      clearStoredCartItems();
      return;
    }

    persistGuestCartItems(cartItems);
  }, [cartItems, isAuthenticated]);

  const addItem = useCallback(
    (product, quantity = 1) => {
      const productId = product?._id || product?.id || product?.product;
      if (!productId || quantity < 1) return;

      if (isAuthenticated && token) {
        const payload = buildServerCartPayload(product, quantity);

        addToCartApi(token, payload)
          .then((serverCart) => setCartItems(mapServerCartItems(serverCart)))
          .catch((error) => console.error('Add to cart API error:', error));

        return;
      }

      setCartItems((prev) => {
        const existingItem = prev.find((item) => item.id === productId);
        if (existingItem) {
          return prev.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, mapProductToCartItem(product, quantity)];
      });
    },
    [isAuthenticated, token]
  );

  const updateQuantity = useCallback(
    (id, quantity) => {
      if (isAuthenticated && token) {
        const request = quantity < 1
          ? removeCartItemApi(token, id)
          : updateCartQtyApi(token, id, quantity);

        request
          .then((serverCart) => setCartItems(mapServerCartItems(serverCart)))
          .catch((error) => console.error('Update cart API error:', error));

        return;
      }

      setCartItems((prev) => {
        if (quantity < 1) return prev.filter((item) => item.id !== id);
        return prev.map((item) => (item.id === id ? { ...item, quantity } : item));
      });
    },
    [isAuthenticated, token]
  );

  const removeItem = useCallback(
    (id) => {
      if (isAuthenticated && token) {
        removeCartItemApi(token, id)
          .then((serverCart) => setCartItems(mapServerCartItems(serverCart)))
          .catch((error) => console.error('Remove cart item API error:', error));

        return;
      }

      setCartItems((prev) => prev.filter((item) => item.id !== id));
    },
    [isAuthenticated, token]
  );

  const clearCart = useCallback(() => {
    if (isAuthenticated && token) {
      clearCartApi(token)
        .then((serverCart) => setCartItems(mapServerCartItems(serverCart)))
        .catch((error) => console.error('Clear cart API error:', error));

      return;
    }

    setCartItems([]);
    clearStoredCartItems();
  }, [isAuthenticated, token]);

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
