import { useCallback, useEffect, useMemo, useState } from 'react';
import { CurrencyContext } from './currency-context';
import { DEFAULT_CURRENCIES, CURRENCY_STORAGE_KEY } from './currencyConstants';
import { API_URL } from '../services/apiConfig';

function detectInitialCurrency() {
  if (typeof window === 'undefined') return 'USD';

  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && DEFAULT_CURRENCIES[saved.toUpperCase()]) {
      return saved.toUpperCase();
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/Nairobi|Kampala|Dar_es_Salaam/i.test(tz)) return 'KES';
    if (/Lagos/i.test(tz)) return 'NGN';
    if (/Accra/i.test(tz)) return 'GHS';
    if (/Johannesburg/i.test(tz)) return 'ZAR';
    if (/London|Paris|Berlin|Rome|Madrid|Amsterdam/i.test(tz)) return 'EUR';
  } catch {
    // Fall back to USD on any error
  }

  return 'USD';
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(detectInitialCurrency);
  const [rates, setRates] = useState(DEFAULT_CURRENCIES);

  // Refresh live exchange rates on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchRates() {
      try {
        const response = await fetch(`${API_URL}/currency/rates`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data?.data) {
          setRates((prev) => ({ ...prev, ...data.data }));
        }
      } catch {
        // Fallback rates will be used
      }
    }

    fetchRates();
    return () => {
      isMounted = false;
    };
  }, []);

  const setCurrency = useCallback((code) => {
    const upper = String(code || 'USD').toUpperCase();
    if (DEFAULT_CURRENCIES[upper]) {
      setCurrencyState(upper);
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, upper);
      } catch {
        // Ignore localStorage quota or private mode issues
      }
    }
  }, []);

  const formatPrice = useCallback(
    (amountInUSD) => {
      const num = Number(amountInUSD) || 0;
      const meta = rates[currency] || rates.USD;
      const converted = num * meta.rate;

      if (meta.decimals === 0) {
        return `${meta.symbol} ${Math.round(converted).toLocaleString('en-US')}`;
      }

      return `${meta.symbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: meta.decimals,
        maximumFractionDigits: meta.decimals,
      })}`;
    },
    [currency, rates]
  );

  const convertPrice = useCallback(
    (amountInUSD) => {
      const num = Number(amountInUSD) || 0;
      const meta = rates[currency] || rates.USD;
      const factor = Math.pow(10, meta.decimals);
      return Math.round(num * meta.rate * factor) / factor;
    },
    [currency, rates]
  );

  const activeCurrencyMeta = useMemo(() => {
    return rates[currency] || rates.USD;
  }, [rates, currency]);

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      activeCurrencyMeta,
      formatPrice,
      convertPrice,
      supportedCurrencies: Object.values(rates),
    }),
    [currency, setCurrency, rates, activeCurrencyMeta, formatPrice, convertPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
