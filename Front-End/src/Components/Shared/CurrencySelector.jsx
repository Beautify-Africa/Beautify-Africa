import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../../hooks/useCurrency';

export default function CurrencySelector({ className = '' }) {
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeCurrency =
    supportedCurrencies.find((c) => c.code === currency) || supportedCurrencies[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code) => {
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Currency selector. Current currency: ${activeCurrency?.code}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-stone-700 backdrop-blur-sm transition-all hover:border-stone-900 hover:text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
      >
        <span className="text-xs" aria-hidden="true">
          {activeCurrency?.flag}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase">{activeCurrency?.code}</span>
        <svg
          className={`h-3 w-3 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Supported currencies"
          className="absolute right-0 mt-2 z-50 w-44 origin-top-right rounded-sm border border-stone-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          {supportedCurrencies.map((item) => {
            const isSelected = item.code === currency;
            return (
              <li
                key={item.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item.code)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-[11px] transition-colors ${
                  isSelected
                    ? 'bg-amber-50 font-bold text-amber-900'
                    : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm" aria-hidden="true">
                    {item.flag}
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-mono text-[10px] text-stone-400 font-bold">{item.code}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
