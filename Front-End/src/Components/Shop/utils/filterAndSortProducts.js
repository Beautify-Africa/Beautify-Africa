import { ALL_FILTER_OPTION } from '../shopConfig';

export function filterAndSortProducts({
  products,
  selectedCategory,
  selectedSubcategory,
  selectedSkinType,
  selectedBrand,
  maxPrice,
  searchQuery,
  sortOption,
}) {
  const normalizedQuery = searchQuery.toLowerCase();

  return products
    .filter((product) => {
      const productCategory = typeof product.category === 'string' ? product.category : '';
      const productSubcategory = typeof product.subcategory === 'string' ? product.subcategory : '';
      const productBrand = typeof product.brand === 'string' ? product.brand : '';
      const productName = typeof product.name === 'string' ? product.name : '';
      const productSkinTypes = Array.isArray(product.skinType)
        ? product.skinType
        : [ALL_FILTER_OPTION];
      const productPrice = Number(product.price);

      const matchCategory =
        selectedCategory === ALL_FILTER_OPTION || productCategory === selectedCategory;
      const matchSubcategory =
        !selectedSubcategory || !productSubcategory || productSubcategory === selectedSubcategory;
      const matchBrand = selectedBrand === ALL_FILTER_OPTION || productBrand === selectedBrand;
      const matchSkinType =
        selectedSkinType === ALL_FILTER_OPTION ||
        productSkinTypes.includes(ALL_FILTER_OPTION) ||
        productSkinTypes.includes(selectedSkinType);
      const matchPrice = Number.isFinite(productPrice) && productPrice <= maxPrice;
      const matchSearch =
        productName.toLowerCase().includes(normalizedQuery) ||
        productBrand.toLowerCase().includes(normalizedQuery) ||
        productCategory.toLowerCase().includes(normalizedQuery);

      return (
        matchCategory &&
        matchSubcategory &&
        matchBrand &&
        matchSkinType &&
        matchPrice &&
        matchSearch
      );
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'best-selling':
          return Number(b.isBestSeller) - Number(a.isBestSeller);
        default:
          return Number(b.isNewProduct ?? b.isNew) - Number(a.isNewProduct ?? a.isNew);
      }
    });
}
