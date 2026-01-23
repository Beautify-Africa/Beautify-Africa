import { useState, useMemo, useCallback } from 'react';
import { SearchIcon } from './Icons';
import ProductCard from './ProductCard';
import ProductDetailsModal from './ProductDetailsModal';
import {
  PRODUCTS,
  CATEGORIES,
  BRANDS,
  SKIN_TYPES,
  SORT_OPTIONS,
  PRICE_RANGE,
  SHOP_CONTENT,
  FILTER_LABELS,
} from '../data/shopData';

/**
 * Filter sidebar section
 */
function FilterSection({ title, children }) {
  return (
    <div>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Filter button list (for categories, brands)
 */
function FilterButtonList({ items, selected, onSelect }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item}>
          <button
            onClick={() => onSelect(item)}
            className={`text-sm hover:text-amber-800 transition-colors ${
              selected === item ? 'text-amber-800 font-medium' : 'text-stone-600'
            }`}
            aria-pressed={selected === item}
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Skin type filter chips
 */
function SkinTypeChips({ types, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`px-3 py-1 text-[10px] uppercase border transition-all ${
            selected === type
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-transparent text-stone-600 border-stone-300 hover:border-stone-500'
          }`}
          aria-pressed={selected === type}
        >
          {type}
        </button>
      ))}
    </div>
  );
}

/**
 * Price range slider
 */
function PriceRangeSlider({ value, max, onChange }) {
  return (
    <div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-stone-900 h-1 bg-stone-300 rounded-lg appearance-none cursor-pointer"
        aria-label="Maximum price"
      />
      <div className="flex justify-between text-xs text-stone-600 mt-2 font-mono">
        <span>$0</span>
        <span>${value}</span>
      </div>
    </div>
  );
}

/**
 * Search and sort controls
 */
function SearchSortControls({ searchQuery, onSearchChange, sortOption, onSortChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
      <div className="relative group">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          type="text"
          id="product-search"
          placeholder={SHOP_CONTENT.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-64 bg-white border border-stone-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-stone-900 transition-colors placeholder-stone-400 text-stone-900"
        />
        <SearchIcon className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
      </div>
      <div>
        <label htmlFor="sort-select" className="sr-only">
          Sort products
        </label>
        <select
          id="sort-select"
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-white border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:border-stone-900 cursor-pointer text-stone-900"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Sidebar filters
 */
function Sidebar({
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedSkinType,
  setSelectedSkinType,
  maxPrice,
  setMaxPrice,
}) {
  return (
    <aside
      className="w-full lg:w-64 flex-shrink-0 space-y-8"
      aria-label="Product filters"
    >
      <FilterSection title={FILTER_LABELS.category}>
        <FilterButtonList
          items={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </FilterSection>

      <FilterSection title={FILTER_LABELS.brand}>
        <FilterButtonList
          items={BRANDS}
          selected={selectedBrand}
          onSelect={setSelectedBrand}
        />
      </FilterSection>

      <FilterSection title={FILTER_LABELS.skinType}>
        <SkinTypeChips
          types={SKIN_TYPES}
          selected={selectedSkinType}
          onSelect={setSelectedSkinType}
        />
      </FilterSection>

      <FilterSection title={FILTER_LABELS.priceRange}>
        <PriceRangeSlider
          value={maxPrice}
          max={PRICE_RANGE.max}
          onChange={setMaxPrice}
        />
      </FilterSection>
    </aside>
  );
}

/**
 * Empty state when no products match
 */
function EmptyState({ onClearFilters }) {
  return (
    <div className="py-20 text-center">
      <p className="font-serif text-xl text-stone-500">
        {SHOP_CONTENT.noResultsMessage}
      </p>
      <button
        onClick={onClearFilters}
        className="mt-4 text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-900"
      >
        {SHOP_CONTENT.clearFiltersLabel}
      </button>
    </div>
  );
}

/**
 * ShopPage - Main product catalog with filtering
 */
export default function ShopPage() {
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSkinType, setSelectedSkinType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(PRICE_RANGE.max);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // UI state
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Memoized filtered & sorted products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchBrand =
        selectedBrand === 'All' || product.brand === selectedBrand;
      const matchSkin =
        selectedSkinType === 'All' ||
        product.skinType.includes('All') ||
        product.skinType.includes(selectedSkinType);
      const matchPrice = product.price <= maxPrice;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchBrand && matchSkin && matchPrice && matchSearch;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'best-selling':
          return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        default: // newest
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      }
    });
  }, [selectedCategory, selectedSkinType, selectedBrand, maxPrice, searchQuery, sortOption]);

  const toggleWishlist = useCallback((id, e) => {
    e.stopPropagation();
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const addToCart = useCallback((id) => {
    // TODO: Integrate with cart context/state
    console.log(`Added product ${id} to cart`);
    alert('Added to cart');
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedSkinType('All');
    setSearchQuery('');
    setMaxPrice(PRICE_RANGE.max);
  }, []);

  return (
    <section
      className="pt-24 pb-12 min-h-screen bg-[#faf9f6]"
      aria-labelledby="shop-heading"
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div>
            <h1
              id="shop-heading"
              className="font-serif text-4xl md:text-5xl text-stone-900 mb-4"
            >
              {SHOP_CONTENT.heading}
            </h1>
            <p className="text-stone-700 font-light max-w-xl leading-relaxed">
              {SHOP_CONTENT.description}
            </p>
          </div>
          <SearchSortControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <Sidebar
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedSkinType={selectedSkinType}
            setSelectedSkinType={setSelectedSkinType}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
          />

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
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
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </section>
  );
}
