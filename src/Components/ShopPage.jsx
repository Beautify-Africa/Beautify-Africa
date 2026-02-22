import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SearchIcon } from './Icons';
import ProductCard from './ProductCard';
import ProductDetailsModal from './ProductDetailsModal';
import PromoBanner from './PromoBanner';
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
 * Collapsible dropdown section for the sidebar
 */
function SidebarDropdown({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-stone-200 pb-4">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-2 group"
        aria-expanded={isOpen}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900 group-hover:text-amber-800 transition-colors">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[400px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Product navigation sidebar with dropdown menus
 */
function ProductSidebar({
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedSkinType,
  setSelectedSkinType,
  maxPrice,
  setMaxPrice,
  products,
}) {
  // Count products per category
  const categoryCounts = useMemo(() => {
    const counts = {};
    PRODUCTS.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    counts['All'] = PRODUCTS.length;
    return counts;
  }, []);

  // Count products per brand
  const brandCounts = useMemo(() => {
    const counts = {};
    PRODUCTS.forEach((p) => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    counts['All'] = PRODUCTS.length;
    return counts;
  }, []);

  return (
    <aside
      className="w-full lg:w-56 xl:w-64 flex-shrink-0 hidden lg:block"
      aria-label="Product navigation"
    >
      <div className="sticky top-28 space-y-1 bg-white rounded-lg border border-stone-200 shadow-sm p-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-4">
          Browse Products
        </h2>

        {/* Category dropdown */}
        <SidebarDropdown title={FILTER_LABELS.category} defaultOpen={true}>
          <ul className="space-y-0.5">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white font-medium'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                  aria-pressed={selectedCategory === cat}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] font-mono ${
                    selectedCategory === cat ? 'text-stone-300' : 'text-stone-400'
                  }`}>
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SidebarDropdown>

        {/* Brand dropdown */}
        <SidebarDropdown title={FILTER_LABELS.brand} defaultOpen={false}>
          <ul className="space-y-0.5">
            {BRANDS.map((brand) => (
              <li key={brand}>
                <button
                  onClick={() => setSelectedBrand(brand)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                    selectedBrand === brand
                      ? 'bg-stone-900 text-white font-medium'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                  aria-pressed={selectedBrand === brand}
                >
                  <span>{brand}</span>
                  <span className={`text-[10px] font-mono ${
                    selectedBrand === brand ? 'text-stone-300' : 'text-stone-400'
                  }`}>
                    {brandCounts[brand] || 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </SidebarDropdown>

        {/* Skin Type dropdown */}
        <SidebarDropdown title={FILTER_LABELS.skinType} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5 px-1">
            {SKIN_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedSkinType(type)}
                className={`px-3 py-1.5 text-[10px] uppercase rounded-full border transition-all ${
                  selectedSkinType === type
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
                aria-pressed={selectedSkinType === type}
              >
                {type}
              </button>
            ))}
          </div>
        </SidebarDropdown>

        {/* Price Range dropdown */}
        <SidebarDropdown title={FILTER_LABELS.priceRange} defaultOpen={false}>
          <div className="px-1">
            <PriceRangeSlider
              value={maxPrice}
              max={PRICE_RANGE.max}
              onChange={setMaxPrice}
            />
          </div>
        </SidebarDropdown>
      </div>
    </aside>
  );
}

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
 * Prominent search bar with inline filter dropdowns
 */
function SearchFilterBar({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  selectedSkinType,
  onSkinTypeChange,
  maxPrice,
  onMaxPriceChange,
  onClearFilters,
  resultCount,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedBrand !== 'All' ||
    selectedSkinType !== 'All' ||
    maxPrice < PRICE_RANGE.max;

  const activeFilterCount = [
    selectedCategory !== 'All',
    selectedBrand !== 'All',
    selectedSkinType !== 'All',
    maxPrice < PRICE_RANGE.max,
  ].filter(Boolean).length;

  // Close filter panel on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  return (
    <div className="mb-10" ref={filterRef}>
      {/* Main search row */}
      <div className="flex items-center gap-3 bg-white rounded-lg shadow-md border border-stone-200 px-4 py-3 transition-shadow focus-within:shadow-lg focus-within:border-stone-400">
        <SearchIcon className="w-5 h-5 text-stone-400 flex-shrink-0" />
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input
          type="text"
          id="product-search"
          placeholder="Search products, brands, categories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm md:text-base text-stone-900 placeholder-stone-400 outline-none"
        />

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className={`relative flex items-center gap-2 px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] border rounded-md transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-500'
          }`}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-amber-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort dropdown */}
        <div className="hidden sm:block border-l border-stone-200 pl-3">
          <label htmlFor="sort-select" className="sr-only">Sort products</label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-stone-700 outline-none cursor-pointer pr-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters summary + result count */}
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="text-xs text-stone-500">
          <span className="font-medium text-stone-700">{resultCount}</span> product{resultCount !== 1 ? 's' : ''} found
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-amber-800 hover:text-stone-900 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Expandable filter panel */}
      <div
        id="filter-panel"
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div className="bg-white rounded-lg shadow-md border border-stone-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category filter */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">
                {FILTER_LABELS.category}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-1.5 text-[10px] sm:text-xs rounded-full border transition-all ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                    aria-pressed={selectedCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand filter */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">
                {FILTER_LABELS.brand}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => onBrandChange(brand)}
                    className={`px-3 py-1.5 text-[10px] sm:text-xs rounded-full border transition-all ${
                      selectedBrand === brand
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                    aria-pressed={selectedBrand === brand}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Type filter */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">
                {FILTER_LABELS.skinType}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => onSkinTypeChange(type)}
                    className={`px-3 py-1.5 text-[10px] sm:text-xs rounded-full border transition-all ${
                      selectedSkinType === type
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                    aria-pressed={selectedSkinType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range filter */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">
                {FILTER_LABELS.priceRange}
              </h3>
              <PriceRangeSlider
                value={maxPrice}
                max={PRICE_RANGE.max}
                onChange={onMaxPriceChange}
              />
            </div>
          </div>

          {/* Mobile sort (visible only on small screens) */}
          <div className="sm:hidden mt-4 pt-4 border-t border-stone-100">
            <label htmlFor="sort-select-mobile" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-2 block">
              Sort by
            </label>
            <select
              id="sort-select-mobile"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-white border border-stone-200 px-3 py-2 text-sm rounded-md outline-none focus:border-stone-900 cursor-pointer text-stone-900"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
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
        {/* Promotional Banners */}
        <PromoBanner />

        {/* Search & Filter Bar */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortOption={sortOption}
          onSortChange={setSortOption}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          selectedSkinType={selectedSkinType}
          onSkinTypeChange={setSelectedSkinType}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          onClearFilters={clearFilters}
          resultCount={filteredProducts.length}
        />

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
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Dropdown Navigation */}
          <ProductSidebar
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedSkinType={selectedSkinType}
            setSelectedSkinType={setSelectedSkinType}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            products={filteredProducts}
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
