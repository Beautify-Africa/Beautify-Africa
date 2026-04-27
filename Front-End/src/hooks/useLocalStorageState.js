import { useEffect, useState } from 'react';

function resolveInitialValue(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue;
}

export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    const fallbackValue = resolveInitialValue(initialValue);

    if (typeof window === 'undefined') {
      return fallbackValue;
    }

    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : fallbackValue;
    } catch {
      return fallbackValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore storage write failures and continue with in-memory state.
    }
  }, [key, state]);

  return [state, setState];
}

