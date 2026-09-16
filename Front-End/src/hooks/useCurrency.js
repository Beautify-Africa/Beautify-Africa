import { useContext } from 'react';
import { CurrencyContext } from '../context/currency-context';

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
