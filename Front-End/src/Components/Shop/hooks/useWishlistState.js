import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchWishlist, syncWishlistApi, toggleWishlistApi } from '../../../services/wishlistApi';

const WISHLIST_STORAGE_KEY = 'beautify-wishlist-items';

function getStoredWishlistIds() {
  try {
    const storedItems = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!storedItems) return [];

    const parsedItems = JSON.parse(storedItems);
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch {
    return [];
  }
}

export function useWishlistState({ isAuthenticated, token }) {
  const [wishlist, setWishlist] = useState(getStoredWishlistIds);
  const initialWishlistSyncDone = useRef(false);
  const wishlistSet = useMemo(() => new Set(wishlist), [wishlist]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function syncAuthenticatedWishlist() {
      if (isAuthenticated && token) {
        try {
          const localItems = getStoredWishlistIds();
          let serverWishlist = [];

          if (localItems.length > 0 && !initialWishlistSyncDone.current) {
            serverWishlist = await syncWishlistApi(token, localItems, { signal: controller.signal });
          } else {
            serverWishlist = await fetchWishlist(token, { signal: controller.signal });
          }

          if (active) {
            setWishlist(serverWishlist.map((item) => item._id));
            initialWishlistSyncDone.current = true;
            localStorage.removeItem(WISHLIST_STORAGE_KEY);
          }
        } catch (error) {
          console.error('Failed to sync wishlist:', error);
        }
      } else if (initialWishlistSyncDone.current && active) {
        // Clear account-derived wishlist on logout to avoid cross-account leakage.
        setWishlist([]);
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
        initialWishlistSyncDone.current = false;
      }
    }

    syncAuthenticatedWishlist();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      return;
    }

    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist, isAuthenticated]);

  const toggleWishlist = useCallback(
    async (productId, event) => {
      event?.stopPropagation?.();

      if (!isAuthenticated || !token) {
        setWishlist((previousWishlist) =>
          previousWishlist.includes(productId)
            ? previousWishlist.filter((itemId) => itemId !== productId)
            : [...previousWishlist, productId]
        );

        return;
      }

      try {
        const result = await toggleWishlistApi(token, productId);
        const updatedWishlist = Array.isArray(result.data)
          ? result.data.map((item) => item._id)
          : [];

        setWishlist(updatedWishlist);
      } catch (error) {
        console.error('Failed to toggle wishlist item:', error);

        try {
          const fallbackWishlist = await fetchWishlist(token);
          setWishlist(fallbackWishlist.map((item) => item._id));
        } catch (fallbackError) {
          console.error('Failed to recover wishlist state:', fallbackError);
        }
      }
    },
    [isAuthenticated, token]
  );

  return {
    wishlistSet,
    toggleWishlist,
  };
}
