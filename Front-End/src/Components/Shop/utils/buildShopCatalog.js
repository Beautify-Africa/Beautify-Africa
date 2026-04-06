import { ALL_FILTER_OPTION, DEFAULT_PRICE_RANGE } from '../shopConfig';

function normalizeLabel(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function toId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sortWithAllFirst(values) {
  const uniqueValues = [...new Set(values.filter(Boolean))];

  const nonAllValues = uniqueValues
    .filter((value) => value !== ALL_FILTER_OPTION)
    .sort((a, b) => a.localeCompare(b));

  return [ALL_FILTER_OPTION, ...nonAllValues];
}

function getPriceRangeMax(products) {
  const maxPrice = products.reduce((currentMax, product) => {
    const numericPrice = Number(product?.price);
    if (!Number.isFinite(numericPrice)) return currentMax;
    return Math.max(currentMax, numericPrice);
  }, 0);

  if (maxPrice <= 0) return DEFAULT_PRICE_RANGE.max;
  return Math.max(DEFAULT_PRICE_RANGE.max, Math.ceil(maxPrice / 10) * 10);
}

export function buildShopCatalog(products = []) {
  const categoryMap = new Map();
  const brands = [ALL_FILTER_OPTION];
  const skinTypes = [ALL_FILTER_OPTION];

  products.forEach((product) => {
    const categoryLabel = normalizeLabel(product?.category);
    const subcategoryLabel = normalizeLabel(product?.subcategory);

    if (categoryLabel) {
      if (!categoryMap.has(categoryLabel)) {
        categoryMap.set(categoryLabel, new Set());
      }

      if (subcategoryLabel) {
        categoryMap.get(categoryLabel).add(subcategoryLabel);
      }
    }

    const brandLabel = normalizeLabel(product?.brand);
    if (brandLabel) {
      brands.push(brandLabel);
    }

    const productSkinTypes = Array.isArray(product?.skinType) ? product.skinType : [];
    productSkinTypes.forEach((skinType) => {
      const normalizedSkinType = normalizeLabel(skinType);
      if (normalizedSkinType) {
        skinTypes.push(normalizedSkinType);
      }
    });
  });

  const categories = [
    {
      id: toId(ALL_FILTER_OPTION),
      label: ALL_FILTER_OPTION,
      subcategories: [],
    },
    ...[...categoryMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, subcategories]) => ({
        id: toId(label),
        label,
        subcategories: [...subcategories].sort((a, b) => a.localeCompare(b)),
      })),
  ];

  return {
    categories,
    brands: sortWithAllFirst(brands),
    skinTypes: sortWithAllFirst(skinTypes),
    priceRange: {
      min: DEFAULT_PRICE_RANGE.min,
      max: getPriceRangeMax(products),
    },
  };
}
