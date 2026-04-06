import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import ProductDetailsModal from './ProductDetailsModal';
import PromoBanner from './PromoBanner';
import ShopNavBar from './ShopNavBar';
import ShopFilterBar from './ShopFilterBar';
import ShopCollectionToggle from './ShopCollectionToggle';
import ShopProductGrid from './ShopProductGrid';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useWishlistState } from './hooks/useWishlistState';
import { useShopProducts } from './hooks/useShopProducts';
import { filterAndSortProducts } from './utils/filterAndSortProducts';
import {
  ALL_FILTER_OPTION,
  DEFAULT_PRICE_RANGE,
  FILTER_LABELS,
  SHOP_CONTENT,
  SORT_OPTIONS,
} from './shopConfig';

export default function ShopPage() {
  const { addItem } = useCart();
  const { token, isAuthenticated } = useAuth();
  const { wishlistSet, toggleWishlist } = useWishlistState({ isAuthenticated, token });
  const { products, isLoading, shopCatalog } = useShopProducts();
  const [activeCollection, setActiveCollection] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER_OPTION);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSkinType, setSelectedSkinType] = useState(ALL_FILTER_OPTION);
  const [selectedBrand, setSelectedBrand] = useState(ALL_FILTER_OPTION);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_PRICE_RANGE.max);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const toastTimeoutRef = useRef(null);
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

  const handleSelectCategory = useCallback((label) => {
    setSelectedCategory(label);
    setSelectedSubcategory(null);
  }, []);

  const handleSelectSubcategory = useCallback((categoryLabel, subcategory) => {
    setSelectedCategory(categoryLabel);
    setSelectedSubcategory(subcategory);
  }, []);

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

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const addToCart = useCallback((product) => {
    addItem(product);

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    setToastMessage(`${product.name} added to cart`);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(''), 2500);
  }, [addItem]);

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

  const isSavedCollection = activeCollection === 'saved';

  return (
    <section className="min-h-screen bg-[#faf9f6] pt-24 pb-12" aria-labelledby="shop-heading">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <PromoBanner />

        <header className="mb-6" aria-labelledby="shop-heading">
          <h1 id="shop-heading" className="mb-4 font-serif text-4xl text-stone-900 md:text-5xl">
            {SHOP_CONTENT.heading}
          </h1>
          <p className="max-w-xl font-light leading-relaxed text-stone-700">{SHOP_CONTENT.description}</p>
          <ShopCollectionToggle
            isSavedCollection={isSavedCollection}
            savedProductCount={savedProductCount}
            onShowAll={() => setActiveCollection('all')}
            onShowSaved={() => setActiveCollection('saved')}
          />
        </header>

        <ShopNavBar
          categories={shopCatalog.categories}
          selectedCategory={effectiveSelectedCategory}
          selectedSubcategory={effectiveSelectedSubcategory}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
        />

        <div className="mt-8">
          <ShopFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={effectiveSortOption}
            onSortChange={setSortOption}
            selectedBrand={effectiveSelectedBrand}
            onBrandChange={setSelectedBrand}
            selectedSkinType={effectiveSelectedSkinType}
            onSkinTypeChange={setSelectedSkinType}
            brands={shopCatalog.brands}
            skinTypes={shopCatalog.skinTypes}
            sortOptions={SORT_OPTIONS}
            priceRange={shopCatalog.priceRange}
            filterLabels={FILTER_LABELS}
            searchPlaceholder={SHOP_CONTENT.searchPlaceholder}
            maxPrice={effectiveMaxPrice}
            onMaxPriceChange={setMaxPrice}
            onClearFilters={clearFilters}
            resultCount={displayedProducts.length}
          />

          <ShopProductGrid
            isLoading={isLoading}
            displayedProducts={displayedProducts}
            isSavedCollection={isSavedCollection}
            wishlistSet={wishlistSet}
            onToggleWishlist={toggleWishlist}
            onAddToCart={addToCart}
            onProductClick={setSelectedProduct}
            mode={activeCollection}
            savedProductCount={savedProductCount}
            onClearFilters={clearFilters}
            onShowAllProducts={showAllProducts}
          />
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-sm bg-stone-900 px-6 py-3 text-sm font-medium text-white shadow-xl animate-fade-in"
        >
          {toastMessage}
        </div>
      )}
    </section>
  );
}
