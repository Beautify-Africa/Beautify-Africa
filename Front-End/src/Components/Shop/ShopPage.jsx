import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import ProductDetailsModal from './ProductDetailsModal';
import PromoBanner from './PromoBanner';
import ShopNavBar from './ShopNavBar';
import ShopFilterBar from './ShopFilterBar';
import { useCart } from '../../hooks/useCart';
import { PRODUCTS, PRICE_RANGE, SHOP_CONTENT } from '../../data/shopData';

function EmptyState({ onClearFilters }) {
  return (
    <div className="py-20 text-center">
      <p className="font-serif text-xl text-stone-500">{SHOP_CONTENT.noResultsMessage}</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 border-b border-stone-900 text-xs font-bold uppercase tracking-widest text-stone-900"
      >
        {SHOP_CONTENT.clearFiltersLabel}
      </button>
    </div>
  );
}

export default function ShopPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSkinType, setSelectedSkinType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(PRICE_RANGE.max);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const toastTimeoutRef = useRef(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const handleSelectCategory = useCallback((label) => {
    setSelectedCategory(label);
    setSelectedSubcategory(null);
  }, []);

  const handleSelectSubcategory = useCallback((categoryLabel, subcategory) => {
    setSelectedCategory(categoryLabel);
    setSelectedSubcategory(subcategory);
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchSubcategory =
        !selectedSubcategory || !product.subcategory || product.subcategory === selectedSubcategory;
      const matchBrand = selectedBrand === 'All' || product.brand === selectedBrand;
      const matchSkinType =
        selectedSkinType === 'All' ||
        product.skinType.includes('All') ||
        product.skinType.includes(selectedSkinType);
      const matchPrice = product.price <= maxPrice;
      const normalizedQuery = deferredSearchQuery.toLowerCase();
      const matchSearch =
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery);

      return matchCategory && matchSubcategory && matchBrand && matchSkinType && matchPrice && matchSearch;
    }).sort((a, b) => {
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
          return Number(b.isNew) - Number(a.isNew);
      }
    });
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedSkinType,
    selectedBrand,
    maxPrice,
    deferredSearchQuery,
    sortOption,
  ]);

  const toggleWishlist = useCallback((id, e) => {
    e.stopPropagation();
    setWishlist((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  }, []);

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
    setSelectedCategory('All');
    setSelectedSubcategory(null);
    setSelectedBrand('All');
    setSelectedSkinType('All');
    setSearchQuery('');
    setMaxPrice(PRICE_RANGE.max);
  }, []);

  return (
    <section className="min-h-screen bg-[#faf9f6] pt-24 pb-12" aria-labelledby="shop-heading">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <PromoBanner />

        <header className="mb-6" aria-labelledby="shop-heading">
          <h1 id="shop-heading" className="mb-4 font-serif text-4xl text-stone-900 md:text-5xl">
            {SHOP_CONTENT.heading}
          </h1>
          <p className="max-w-xl font-light leading-relaxed text-stone-700">{SHOP_CONTENT.description}</p>
        </header>

        <ShopNavBar
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
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            onClearFilters={clearFilters}
            resultCount={filteredProducts.length}
          />

          {filteredProducts.length > 0 ? (
            <div
              className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="Products"
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isInWishlist={wishlist.includes(product.id)}
                  onToggleWishlist={toggleWishlist}
                  onAddToCart={addToCart}
                  onProductClick={setSelectedProduct}
                />
              ))}
            </div>
          ) : (
            <EmptyState onClearFilters={clearFilters} />
          )}
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
