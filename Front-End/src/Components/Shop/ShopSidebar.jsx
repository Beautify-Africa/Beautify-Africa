import { useState, useMemo } from 'react';
import { PRODUCTS, CATEGORIES, BRANDS, SKIN_TYPES, FILTER_LABELS, PRICE_RANGE, SORT_OPTIONS } from '../../data/shopData';

/**
 * Collapsible dropdown section for ShopSidebar
 */
function SidebarDropdown({ title, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-stone-200 pb-4">
            <button
                onClick={() => setIsOpen((p) => !p)}
                className="w-full flex items-center justify-between py-2 group"
                aria-expanded={isOpen}
            >
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900 group-hover:text-amber-800 transition-colors">
                    {title}
                </span>
                <svg
                    className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[400px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                {children}
            </div>
        </div>
    );
}

/**
 * Price range slider reused inside sidebar
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
 * Left-hand product navigation sidebar with collapsible dropdowns
 */
export default function ShopSidebar({
    selectedCategory, setSelectedCategory,
    selectedBrand, setSelectedBrand,
    selectedSkinType, setSelectedSkinType,
    maxPrice, setMaxPrice,
}) {
    const categoryCounts = useMemo(() => {
        const counts = { All: PRODUCTS.length };
        PRODUCTS.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
        return counts;
    }, []);

    const brandCounts = useMemo(() => {
        const counts = { All: PRODUCTS.length };
        PRODUCTS.forEach((p) => { counts[p.brand] = (counts[p.brand] || 0) + 1; });
        return counts;
    }, []);

    return (
        <aside className="w-full lg:w-56 xl:w-64 flex-shrink-0 hidden lg:block" aria-label="Product navigation">
            <div className="sticky top-28 space-y-1 bg-white rounded-lg border border-stone-200 shadow-sm p-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 mb-4">Browse Products</h2>

                <SidebarDropdown title={FILTER_LABELS.category} defaultOpen={true}>
                    <ul className="space-y-0.5">
                        {CATEGORIES.map((cat) => (
                            <li key={cat}>
                                <button
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${selectedCategory === cat
                                            ? 'bg-stone-900 text-white font-medium'
                                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                        }`}
                                    aria-pressed={selectedCategory === cat}
                                >
                                    <span>{cat}</span>
                                    <span className={`text-[10px] font-mono ${selectedCategory === cat ? 'text-stone-300' : 'text-stone-400'}`}>
                                        {categoryCounts[cat] || 0}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </SidebarDropdown>

                <SidebarDropdown title={FILTER_LABELS.brand} defaultOpen={false}>
                    <ul className="space-y-0.5">
                        {BRANDS.map((brand) => (
                            <li key={brand}>
                                <button
                                    onClick={() => setSelectedBrand(brand)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${selectedBrand === brand
                                            ? 'bg-stone-900 text-white font-medium'
                                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                                        }`}
                                    aria-pressed={selectedBrand === brand}
                                >
                                    <span>{brand}</span>
                                    <span className={`text-[10px] font-mono ${selectedBrand === brand ? 'text-stone-300' : 'text-stone-400'}`}>
                                        {brandCounts[brand] || 0}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </SidebarDropdown>

                <SidebarDropdown title={FILTER_LABELS.skinType} defaultOpen={false}>
                    <div className="flex flex-wrap gap-1.5 px-1">
                        {SKIN_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedSkinType(type)}
                                className={`px-3 py-1.5 text-[10px] uppercase rounded-full border transition-all ${selectedSkinType === type
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

                <SidebarDropdown title={FILTER_LABELS.priceRange} defaultOpen={false}>
                    <div className="px-1">
                        <PriceRangeSlider value={maxPrice} max={PRICE_RANGE.max} onChange={setMaxPrice} />
                    </div>
                </SidebarDropdown>
            </div>
        </aside>
    );
}

