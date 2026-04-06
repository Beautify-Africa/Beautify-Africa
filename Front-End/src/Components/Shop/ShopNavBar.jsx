import { useState, useRef, useEffect, useCallback } from 'react';
import { ALL_FILTER_OPTION } from './shopConfig';

/**
 * Single nav tab button (no dropdown rendered here)
 */
function NavTab({ category, isActive, isOpen, hasDropdown, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-200 whitespace-nowrap border-b-2 ${
        isActive
          ? 'text-stone-900 border-stone-900'
          : 'text-stone-400 border-transparent hover:text-stone-800 hover:border-stone-300'
      }`}
      aria-expanded={hasDropdown ? isOpen : undefined}
      aria-haspopup={hasDropdown ? 'menu' : undefined}
    >
      {category.label}
      {hasDropdown && (
        <svg
          className={`w-2.5 h-2.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
}

/**
 * Subcategory dropdown — absolutely positioned relative to the nav
 */
function SubcategoryDropdown({ category, isOpen, activeSubcategory, onSelectSubcategory, leftOffset }) {
  return (
    <div
      role="menu"
      className={`absolute top-full z-50 bg-white border border-stone-100 shadow-2xl shadow-stone-200/60 rounded-b-xl min-w-[220px] overflow-hidden transition-all duration-200 ${
        isOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      style={{ left: leftOffset }}
    >
      <ul className="py-2">
        {category.subcategories.map((sub) => (
          <li key={sub} role="none">
            <button
              role="menuitem"
              onClick={() => onSelectSubcategory(category.label, sub)}
              className={`w-full text-left px-5 py-2.5 text-[11px] tracking-wide transition-all duration-150 ${
                activeSubcategory === sub
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 hover:pl-7'
              }`}
            >
              {sub}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * ShopNavBar — horizontal sticky category navigation with click-driven dropdowns
 */
export default function ShopNavBar({
  categories = [],
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
}) {
  const [openIndex, setOpenIndex] = useState(null);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const navRef = useRef(null);
  const tabRefs = useRef([]);
  const safeCategories = categories.length > 0
    ? categories
    : [{ id: 'all', label: ALL_FILTER_OPTION, subcategories: [] }];

  const setTabRef = useCallback((el, i) => { tabRefs.current[i] = el; }, []);

  // Compute left offset relative to the nav whenever the open tab changes
  useEffect(() => {
    if (openIndex === null || !tabRefs.current[openIndex] || !navRef.current) return;
    const tabRect = tabRefs.current[openIndex].getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();
    setDropdownLeft(tabRect.left - navRect.left);
  }, [openIndex]);

  // Close any open dropdown on outside click
  useEffect(() => {
    if (openIndex === null) return;
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenIndex(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openIndex]);

  const normalizedOpenIndex =
    openIndex !== null && openIndex < safeCategories.length ? openIndex : null;

  const openCat = normalizedOpenIndex !== null ? safeCategories[normalizedOpenIndex] : null;

  return (
    <nav
      ref={navRef}
      className="relative bg-white border-b border-stone-200 sticky top-16 z-30 -mx-6 md:-mx-12"
      aria-label="Shop categories"
    >
      <div className="px-6 md:px-12 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <ul
          className="flex items-stretch"
          role="menubar"
          aria-label="Product categories"
        >
          {safeCategories.map((cat, i) => {
            const hasDropdown = cat.subcategories.length > 0;
            return (
              <li key={cat.id} ref={(el) => setTabRef(el, i)} className="flex-shrink-0">
                <NavTab
                  category={cat}
                  isActive={selectedCategory === cat.label}
                  isOpen={openIndex === i}
                  hasDropdown={hasDropdown}
                  onClick={() => {
                    onSelectCategory(cat.label);
                    if (hasDropdown) setOpenIndex((prev) => (prev === i ? null : i));
                    else setOpenIndex(null);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Dropdown rendered outside the scrollable container, anchored by leftOffset */}
      {openCat && openCat.subcategories.length > 0 && (
        <SubcategoryDropdown
          category={openCat}
          isOpen={openIndex !== null}
          activeSubcategory={selectedSubcategory}
          leftOffset={dropdownLeft}
          onSelectSubcategory={(catLabel, sub) => {
            onSelectSubcategory(catLabel, sub);
            setOpenIndex(null);
          }}
        />
      )}
    </nav>
  );
}
