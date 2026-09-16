export const DEFAULT_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸', decimals: 2 },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    rate: 130.0,
    flag: '🇰🇪',
    decimals: 0,
  },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 1500.0, flag: '🇳🇬', decimals: 0 },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 15.5, flag: '🇬🇭', decimals: 2 },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    rate: 18.5,
    flag: '🇿🇦',
    decimals: 2,
  },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', decimals: 2 },
};

export const CURRENCY_STORAGE_KEY = 'beautify_currency';
