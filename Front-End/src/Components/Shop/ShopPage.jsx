import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProductDetailsModal from './ProductDetailsModal';
import PromoBanner from './PromoBanner';
import ShopNavBar from './ShopNavBar';
import ShopFilterBar from './ShopFilterBar';
import ShopCollectionToggle from './ShopCollectionToggle';
import ShopProductGrid from './ShopProductGrid';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useWishlistState } from './hooks/useWishlistState';
import { useShopCatalog } from './hooks/useShopCatalog';
import { useShopProducts } from './hooks/useShopProducts';
import { useShopFilters } from './hooks/useShopFilters';
import {
  FILTER_LABELS,
  SHOP_CONTENT,
  SORT_OPTIONS,
} from './shopConfig';

export default function ShopPage() {
  const { addItem } = useCart();
  const { token, isAuthenticated } = useAuth();
  const { wishlistSet, toggleWishlist } = useWishlistState({ isAuthenticated, token });
  const { shopCatalog, isCatalogLoading } = useShopCatalog();
  const [paginationState, setPaginationState] = useState({ signature: '', page: 1 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const toastTimeoutRef = useRef(null);
  const {
    activeCollection,
    isSavedCollection,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    selectedSkinType,
    maxPrice,
    searchQuery,
    sortOption,
    requestParams,
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
  } = useShopFilters({ shopCatalog, wishlistSet });

  const requestSignature = useMemo(() => JSON.stringify(requestParams), [requestParams]);
  const currentPage =
    paginationState.signature === requestSignature ? paginationState.page : 1;
  const { products, isLoading, totalCount, totalPages } = useShopProducts({
    currentPage,
    requestParams,
    isSavedCollection,
    savedProductCount,
  });

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

  const handlePageChange = useCallback(
    (nextPage) => {
      setPaginationState({
        signature: requestSignature,
        page: nextPage,
      });
    },
    [requestSignature]
  );

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
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
        />

        <div className="mt-8">
          <ShopFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={sortOption}
            onSortChange={setSortOption}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            selectedSkinType={selectedSkinType}
            onSkinTypeChange={setSelectedSkinType}
            brands={shopCatalog.brands}
            skinTypes={shopCatalog.skinTypes}
            sortOptions={SORT_OPTIONS}
            priceRange={shopCatalog.priceRange}
            filterLabels={FILTER_LABELS}
            searchPlaceholder={SHOP_CONTENT.searchPlaceholder}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            onClearFilters={clearFilters}
            resultCount={totalCount}
          />

          <ShopProductGrid
            isLoading={isLoading || isCatalogLoading}
            displayedProducts={products}
            isSavedCollection={isSavedCollection}
            wishlistSet={wishlistSet}
            onToggleWishlist={toggleWishlist}
            onAddToCart={addToCart}
            onProductClick={setSelectedProduct}
            mode={activeCollection}
            savedProductCount={savedProductCount}
            onClearFilters={clearFilters}
            onShowAllProducts={showAllProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
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
