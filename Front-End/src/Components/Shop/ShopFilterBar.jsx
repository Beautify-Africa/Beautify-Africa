import { useState, useRef, useEffect } from 'react';
import { SearchIcon } from '../Shared/Icons';
import ShopExpandedFilters from './ShopExpandedFilters';
import {
    ALL_FILTER_OPTION,
    DEFAULT_PRICE_RANGE,
    FILTER_LABELS,
    SHOP_CONTENT,
    SORT_OPTIONS,
} from './shopConfig';

/**
 * Search bar + inline filter panel + sort dropdown
 */
export default function ShopFilterBar({
    searchQuery, onSearchChange,
    sortOption, onSortChange,
    selectedBrand, onBrandChange,
    selectedSkinType, onSkinTypeChange,
    maxPrice, onMaxPriceChange,
    onClearFilters, resultCount,
    brands = [ALL_FILTER_OPTION],
    skinTypes = [ALL_FILTER_OPTION],
    sortOptions = SORT_OPTIONS,
    priceRange = DEFAULT_PRICE_RANGE,
    filterLabels = FILTER_LABELS,
    searchPlaceholder = SHOP_CONTENT.searchPlaceholder,
}) {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const maxPriceCap = Number.isFinite(priceRange?.max) ? priceRange.max : DEFAULT_PRICE_RANGE.max;
    const brandOptions = Array.isArray(brands) && brands.length > 0 ? brands : [ALL_FILTER_OPTION];
    const skinTypeOptions = Array.isArray(skinTypes) && skinTypes.length > 0 ? skinTypes : [ALL_FILTER_OPTION];
    const sortableOptions = Array.isArray(sortOptions) && sortOptions.length > 0 ? sortOptions : SORT_OPTIONS;

    const hasActiveFilters =
        selectedBrand !== ALL_FILTER_OPTION ||
        selectedSkinType !== ALL_FILTER_OPTION || maxPrice < maxPriceCap;

    const activeFilterCount = [
        selectedBrand !== ALL_FILTER_OPTION,
        selectedSkinType !== ALL_FILTER_OPTION,
        maxPrice < maxPriceCap,
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

    return (
        <div className="mb-10" ref={filterRef}>
            {/* Search row */}
            <div className="flex items-center gap-3 bg-white rounded-lg shadow-md border border-stone-200 px-4 py-3 transition-shadow focus-within:shadow-lg focus-within:border-stone-400">
                <SearchIcon className="w-5 h-5 text-stone-400 flex-shrink-0" aria-hidden="true" />
                <label htmlFor="product-search" className="sr-only">Search products</label>
                <input
                    type="search"
                    id="product-search"
                    placeholder={searchPlaceholder}
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
                        {sortableOptions.map((o) => (
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
            <ShopExpandedFilters
                showFilters={showFilters}
                filterLabels={filterLabels}
                brandOptions={brandOptions}
                selectedBrand={selectedBrand}
                onBrandChange={onBrandChange}
                skinTypeOptions={skinTypeOptions}
                selectedSkinType={selectedSkinType}
                onSkinTypeChange={onSkinTypeChange}
                maxPrice={maxPrice}
                maxPriceCap={maxPriceCap}
                onMaxPriceChange={onMaxPriceChange}
                sortOption={sortOption}
                onSortChange={onSortChange}
                sortableOptions={sortableOptions}
            />
        </div>
    );
}

