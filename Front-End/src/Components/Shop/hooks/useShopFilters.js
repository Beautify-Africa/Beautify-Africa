import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { filterAndSortProducts } from '../utils/filterAndSortProducts';
import {
  ALL_FILTER_OPTION,
  DEFAULT_PRICE_RANGE,
  SORT_OPTIONS,
} from '../shopConfig';

export function useShopFilters({ products, shopCatalog, wishlistSet }) {
  const [activeCollection, setActiveCollection] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER_OPTION);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSkinType, setSelectedSkinType] = useState(ALL_FILTER_OPTION);
  const [selectedBrand, setSelectedBrand] = useState(ALL_FILTER_OPTION);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_PRICE_RANGE.max);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const effectiveSelectedCategory = useMemo(() => {
    const hasSelectedCategory = shopCatalog.categories.some(
      (category) => category.label === selectedCategory
    );

    return hasSelectedCategory ? selectedCategory : ALL_FILTER_OPTION;
  }, [shopCatalog.categories, selectedCategory]);

  const effectiveSelectedSubcategory = useMemo(() => {
    if (!selectedSubcategory) return null;

    const activeCategory = shopCatalog.categories.find(
      (category) => category.label === effectiveSelectedCategory
    );

    const hasSelectedSubcategory = activeCategory?.subcategories?.includes(selectedSubcategory);

    return hasSelectedSubcategory ? selectedSubcategory : null;
  }, [shopCatalog.categories, effectiveSelectedCategory, selectedSubcategory]);

  const effectiveSelectedBrand = useMemo(() => {
    return shopCatalog.brands.includes(selectedBrand) ? selectedBrand : ALL_FILTER_OPTION;
  }, [shopCatalog.brands, selectedBrand]);

  const effectiveSelectedSkinType = useMemo(() => {
    return shopCatalog.skinTypes.includes(selectedSkinType)
      ? selectedSkinType
      : ALL_FILTER_OPTION;
  }, [shopCatalog.skinTypes, selectedSkinType]);

  const effectiveMaxPrice = useMemo(() => {
    if (maxPrice === DEFAULT_PRICE_RANGE.max) {
      return shopCatalog.priceRange.max;
    }

    return maxPrice > shopCatalog.priceRange.max ? shopCatalog.priceRange.max : maxPrice;
  }, [maxPrice, shopCatalog.priceRange.max]);

  const effectiveSortOption = useMemo(() => {
    const sortOptionExists = SORT_OPTIONS.some((option) => option.value === sortOption);
    return sortOptionExists ? sortOption : 'newest';
  }, [sortOption]);

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts({
      products,
      selectedCategory: effectiveSelectedCategory,
      selectedSubcategory: effectiveSelectedSubcategory,
      selectedSkinType: effectiveSelectedSkinType,
      selectedBrand: effectiveSelectedBrand,
      maxPrice: effectiveMaxPrice,
      searchQuery: deferredSearchQuery,
      sortOption: effectiveSortOption,
    });
  }, [
    products,
    effectiveSelectedCategory,
    effectiveSelectedSubcategory,
    effectiveSelectedSkinType,
    effectiveSelectedBrand,
    effectiveMaxPrice,
    deferredSearchQuery,
    effectiveSortOption,
  ]);

  const savedProducts = useMemo(
    () => filteredProducts.filter((product) => wishlistSet.has(product._id)),
    [filteredProducts, wishlistSet]
  );

  const savedProductCount = useMemo(
    () => products.filter((product) => wishlistSet.has(product._id)).length,
    [products, wishlistSet]
  );

  const displayedProducts = activeCollection === 'saved' ? savedProducts : filteredProducts;
  const isSavedCollection = activeCollection === 'saved';

  const handleSelectCategory = useCallback((label) => {
    setSelectedCategory(label);
    setSelectedSubcategory(null);
  }, []);

  const handleSelectSubcategory = useCallback((categoryLabel, subcategory) => {
    setSelectedCategory(categoryLabel);
    setSelectedSubcategory(subcategory);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategory(ALL_FILTER_OPTION);
    setSelectedSubcategory(null);
    setSelectedBrand(ALL_FILTER_OPTION);
    setSelectedSkinType(ALL_FILTER_OPTION);
    setSearchQuery('');
    setMaxPrice(shopCatalog.priceRange.max);
  }, [shopCatalog.priceRange.max]);

  const showAllProducts = useCallback(() => {
    setActiveCollection('all');
  }, []);

  return {
    activeCollection,
    isSavedCollection,
    selectedCategory: effectiveSelectedCategory,
    selectedSubcategory: effectiveSelectedSubcategory,
    selectedBrand: effectiveSelectedBrand,
    selectedSkinType: effectiveSelectedSkinType,
    maxPrice: effectiveMaxPrice,
    searchQuery,
    sortOption: effectiveSortOption,
    displayedProducts,
    savedProductCount,
    setSearchQuery,
    setSortOption,
    setSelectedBrand,
    setSelectedSkinType,
    setMaxPrice,
    setActiveCollection,
    handleSelectCategory,
    handleSelectSubcategory,
    clearFilters,
    showAllProducts,
  };
}
