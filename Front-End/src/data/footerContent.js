/**
 * Footer content and navigation configuration
 * Centralized data for the Footer component
 */

export const FOOTER_BRAND = {
  name: 'BEAUTIFY',
  tagline: 'Masterpieces of elegance.',
  href: '#',
};

export const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com' },
  { name: 'TikTok', href: 'https://tiktok.com' },
  { name: 'Pinterest', href: 'https://pinterest.com' },
  { name: 'YouTube', href: 'https://youtube.com' },
];

export const FOOTER_NAV_SECTIONS = [
  {
    id: 'footer-shop',
    title: 'Shop',
    links: [
      { name: 'Skincare', href: '/shop/skincare' },
      { name: 'Makeup', href: '/shop/makeup' },
      { name: 'Hair Care', href: '/shop/hair-care' },
      { name: 'Tools', href: '/shop/tools' },
      { name: 'Gift Cards', href: '/gift-cards' },
      { name: 'Archive', href: '/archive' },
    ],
  },
  {
    id: 'footer-company',
    title: 'The Company',
    links: [
      { name: 'Our Story', href: '/about' },
      { name: 'Impact', href: '/impact' },
      { name: 'Ingredients', href: '/ingredients' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
  },
  {
    id: 'footer-support',
    title: 'Client Care',
    links: [
      { name: 'Shipping', href: '/shipping' },
      { name: 'Track Order', href: '/track-order' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact', href: '/contact' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  },
];

export const LEGAL_LINKS = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Cookies', href: '/cookies' },
];

export const LOCALE_CONFIG = {
  currentLocale: 'United States (USD)',
  availableLocales: ['United States (USD)', 'United Kingdom (GBP)', 'Europe (EUR)'],
};

export const PAYMENT_METHODS = [
  { name: 'Visa', id: 'visa' },
  { name: 'Mastercard', id: 'mastercard' },
  { name: 'American Express', id: 'amex' },
  { name: 'PayPal', id: 'paypal' },
];

export const COPYRIGHT = {
  year: new Date().getFullYear(),
  company: 'Beautify',
  text: 'All rights reserved.',
};
