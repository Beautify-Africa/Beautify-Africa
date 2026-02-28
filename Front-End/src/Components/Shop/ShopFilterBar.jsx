import { useState, useRef, useEffect } from 'react';
import { SearchIcon } from '../Shared/Icons';
import { CATEGORIES, BRANDS, SKIN_TYPES, SORT_OPTIONS, PRICE_RANGE, FILTER_LABELS } from '../../data/shopData';

/**
 * Price range slider used inside the filter panel
 */
function PriceRangeSlider({ value, max, onChange }) {
    return (
        <div>
            <input
                type="range" min="0" max={max} value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full accent-stone-900 h-1 bg-stone-300 rounded-lg appearance-none cursor-pointer"
                aria-label="Maximum price"
                aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
            />
            <div className="flex justify-between text-xs text-stone-600 mt-2 font-mono">
                <span>$0</span>
                <span>${value}</span>
            </div>
        </div>
    );
}

/**
 * Search bar + inline filter panel + sort dropdown
 */
export default function ShopFilterBar({
    searchQuery, onSearchChange,
    sortOption, onSortChange,
    selectedCategory, onCategoryChange,
    selectedBrand, onBrandChange,
    selectedSkinType, onSkinTypeChange,
    maxPrice, onMaxPriceChange,
    onClearFilters, resultCount,
}) {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);

    const hasActiveFilters =
        selectedCategory !== 'All' || selectedBrand !== 'All' ||
        selectedSkinType !== 'All' || maxPrice < PRICE_RANGE.max;

    const activeFilterCount = [
        selectedCategory !== 'All',
        selectedBrand !== 'All',
        selectedSkinType !== 'All',
        maxPrice < PRICE_RANGE.max,
    ].filter(Boolean).length;

    // Close panel on outside click
    useEffect(() => {
        if (!showFilters) return;
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showFilters]);

    const chipClass = (active) =>
        `px-3 py-1.5 text-[10px] sm:text-xs rounded-full border transition-all ${active
            ? 'bg-stone-900 text-white border-stone-900'
            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
        }`;

    return (
        <div className="mb-10" ref={filterRef}>
            {/* Search row */}
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-md border border-stone-200 px-4 py-3 transition-shadow focus-within:shadow-lg focus-within:border-stone-400">
                <SearchIcon className="w-5 h-5 text-stone-400 flex-shrink-0" aria-hidden="true" />
                <label htmlFor="product-search" className="sr-only">Search products</label>
                <input
                    type="search"
                    id="product-search"
                    placeholder="Search products, brands, categories..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 bg-transparent text-sm md:text-base text-stone-900 placeholder-stone-400 outline-none"
                    aria-label="Search products"
                />

                {/* Filter toggle */}
                <button
                    onClick={() => setShowFilters((p) => !p)}
                    className={`relative flex items-center gap-2 px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] border rounded-md transition-all ${showFilters || hasActiveFilters
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 text-stone-700 border-stone-300 hover:border-stone-500'
                        }`}
                    aria-expanded={showFilters}
                    aria-controls="filter-panel"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-amber-500 text-white rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Sort */}
                <div className="hidden sm:block border-l border-stone-200 pl-3">
                    <label htmlFor="sort-select" className="sr-only">Sort products</label>
                    <select
                        id="sort-select"
                        value={sortOption}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="bg-transparent text-xs font-medium text-stone-700 outline-none cursor-pointer pr-2"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Result count + clear */}
            <div className="flex items-center justify-between mt-3 px-1">
                <p className="text-xs text-stone-500">
                    <span className="font-medium text-stone-700">{resultCount}</span>{' '}
                    product{resultCount !== 1 ? 's' : ''} found
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
                className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                    }`}
                aria-hidden={!showFilters}
            >
                <div className="bg-white rounded-lg shadow-md border border-stone-200 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Category */}
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">{FILTER_LABELS.category}</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {CATEGORIES.map((cat) => (
                                    <button key={cat} onClick={() => onCategoryChange(cat)}
                                        className={chipClass(selectedCategory === cat)} aria-pressed={selectedCategory === cat}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Brand */}
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">{FILTER_LABELS.brand}</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {BRANDS.map((brand) => (
                                    <button key={brand} onClick={() => onBrandChange(brand)}
                                        className={chipClass(selectedBrand === brand)} aria-pressed={selectedBrand === brand}>
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Skin Type */}
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">{FILTER_LABELS.skinType}</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {SKIN_TYPES.map((type) => (
                                    <button key={type} onClick={() => onSkinTypeChange(type)}
                                        className={chipClass(selectedSkinType === type)} aria-pressed={selectedSkinType === type}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Price Range */}
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 mb-3">{FILTER_LABELS.priceRange}</h3>
                            <PriceRangeSlider value={maxPrice} max={PRICE_RANGE.max} onChange={onMaxPriceChange} />
                        </div>
                    </div>

                    {/* Mobile sort */}
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
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

