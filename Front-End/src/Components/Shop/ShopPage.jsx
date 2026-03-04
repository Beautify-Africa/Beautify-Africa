import { useState, useMemo, useCallback } from 'react';
import ProductCard from './ProductCard';
import ProductDetailsModal from './ProductDetailsModal';
import PromoBanner from './PromoBanner';
import ShopNavBar from './ShopNavBar';
import ShopFilterBar from './ShopFilterBar';
import {
  PRODUCTS, PRICE_RANGE, SHOP_CONTENT,
} from '../../data/shopData';

/** Empty state when no products match filters */
function EmptyState({ onClearFilters }) {
  return (
    <div className="py-20 text-center">
      <p className="font-serif text-xl text-stone-500">{SHOP_CONTENT.noResultsMessage}</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-900"
      >
        {SHOP_CONTENT.clearFiltersLabel}
      </button>
    </div>
  );
}

/**
 * ShopPage — orchestrates filters, sidebar, filter bar, and product grid
 */
export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedSkinType, setSelectedSkinType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(PRICE_RANGE.max);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleSelectCategory = useCallback((label) => {
    setSelectedCategory(label);
    setSelectedSubcategory(null);
  }, []);

  const handleSelectSubcategory = useCallback((categoryLabel, sub) => {
    setSelectedCategory(categoryLabel);
    setSelectedSubcategory(sub);
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSub = !selectedSubcategory || !p.subcategory || p.subcategory === selectedSubcategory;
      const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      const matchSkin = selectedSkinType === 'All' || p.skinType.includes('All') || p.skinType.includes(selectedSkinType);
      const matchPrice = p.price <= maxPrice;
      const q = searchQuery.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      return matchCategory && matchSub && matchBrand && matchSkin && matchPrice && matchSearch;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'best-selling': return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        default: return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      }
    });
  }, [selectedCategory, selectedSubcategory, selectedSkinType, selectedBrand, maxPrice, searchQuery, sortOption]);

  const toggleWishlist = useCallback((id, e) => {
    e.stopPropagation();
    setWishlist((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }, []);

  const [toastMessage, setToastMessage] = useState('');

  const addToCart = useCallback((id) => {
    setToastMessage('Added to cart');
    setTimeout(() => setToastMessage(''), 2500);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setSelectedSubcategory(null);
    setSelectedBrand('All');
    setSelectedSkinType('All');
    setSearchQuery('');
    setMaxPrice(PRICE_RANGE.max);
  }, []);

  return (
    <section className="pt-24 pb-12 min-h-screen bg-[#faf9f6]" aria-labelledby="shop-heading">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <PromoBanner />

        <header className="mb-6" aria-labelledby="shop-heading">
          <h1 id="shop-heading" className="font-serif text-4xl md:text-5xl text-stone-900 mb-4">
            {SHOP_CONTENT.heading}
          </h1>
          <p className="text-stone-700 font-light max-w-xl leading-relaxed">{SHOP_CONTENT.description}</p>
        </header>

        <ShopNavBar
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
        />

        <div className="mt-8">
          <ShopFilterBar
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            sortOption={sortOption} onSortChange={setSortOption}
            selectedBrand={selectedBrand} onBrandChange={setSelectedBrand}
            selectedSkinType={selectedSkinType} onSkinTypeChange={setSelectedSkinType}
            maxPrice={maxPrice} onMaxPriceChange={setMaxPrice}
            onClearFilters={clearFilters}
            resultCount={filteredProducts.length}
          />

          {filteredProducts.length > 0 ? (
            <div
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10"
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

      {/* Toast notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-sm shadow-xl animate-fade-in"
        >
          {toastMessage}
        </div>
      )}
    </section>
  );
}

