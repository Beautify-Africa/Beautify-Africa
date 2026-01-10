import React, { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 px-6 py-4 md:px-12 md:py-6 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3 md:py-4' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Top Left of Z-Pattern: The Identity */}
        <div className="flex-1 flex justify-start">
          <a href="#" className="text-2xl md:text-3xl font-serif tracking-[0.15em] font-bold text-stone-900 group flex items-center gap-2">
            ÉCLAT
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mb-2"></span>
          </a>
        </div>

        {/* Center Navigation - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-12 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-600">
          <a href="#" className="hover:text-amber-700 transition-colors relative group">
            Collections
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-700 transition-all group-hover:w-full"></span>
          </a>
          <a href="#" className="hover:text-amber-700 transition-colors relative group">
            Exclusives
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-700 transition-all group-hover:w-full"></span>
          </a>
          <a href="#" className="hover:text-amber-700 transition-colors relative group">
            The Journal
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-700 transition-all group-hover:w-full"></span>
          </a>
        </div>

        {/* Top Right of Z-Pattern: Action Items */}
        <div className="flex-1 flex justify-end items-center gap-6 md:gap-8">
          <button className="text-stone-800 hover:text-amber-700 transition-colors hidden sm:block">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="text-stone-800 hover:scale-110 transition-transform relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 bg-amber-800 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">3</span>
          </button>
          <button className="md:hidden text-stone-800">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8h16M4 16h16" />
             </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
