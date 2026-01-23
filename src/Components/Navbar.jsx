import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_LINKS, SOCIAL_LINKS, NAV_CONFIG } from '../data/navigation';
import { SearchIcon, CartIcon, MenuIcon, CloseIcon } from './Icons';

const Navbar = ({ onOpenAuth, onOpenCart }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > NAV_CONFIG.scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useCallback((e, id) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // If not on home page, navigate to home first then scroll
    if (!isHomePage) {
      navigate('/');
      // Wait for navigation, then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          window.scrollTo({
            top: element.offsetTop - NAV_CONFIG.scrollOffset,
            behavior: 'smooth',
          });
        }
      }, 100);
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - NAV_CONFIG.scrollOffset,
        behavior: 'smooth',
      });
    }
  }, [isHomePage, navigate]);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header>
      {/* Main Navigation */}
      <nav
        className={`
          fixed top-0 left-0 w-full z-[100] transition-all duration-700 
          px-6 py-4 md:px-12 md:py-8
          ${isScrolled ? 'bg-white/80 backdrop-blur-xl py-4 shadow-sm' : 'bg-transparent'}
        `}
        aria-label="Main navigation"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              to="/"
              className="text-2xl md:text-3xl font-serif tracking-[0.2em] font-bold text-stone-900 group"
              aria-label={`${NAV_CONFIG.brandName} - Home`}
            >
              {NAV_CONFIG.brandName}
              <span
                className={`
                  inline-block w-1.5 h-1.5 rounded-full ml-1 bg-amber-600 
                  transition-all duration-500 ${isScrolled ? 'scale-100' : 'scale-0'}
                `}
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <ul className="hidden lg:flex items-center gap-14 text-[10px] uppercase tracking-[0.4em] font-bold text-stone-600">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => scrollToSection(e, link.id)}
                  className="hover:text-amber-800 transition-colors relative group"
                >
                  {link.name}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-800 transition-all duration-500 group-hover:w-full"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>

          {/* Action Icons */}
          <div className="flex-1 flex justify-end items-center gap-6 md:gap-8">
            {/* Search */}
            <button
              className="hidden sm:block text-stone-800 hover:text-amber-800 transition-colors"
              aria-label="Search products"
            >
              <SearchIcon />
            </button>

            {/* Cart */}
            <button 
              onClick={onOpenCart}
              className="relative group" 
              aria-label="Shopping cart, 2 items"
            >
              <CartIcon className="w-5 h-5 text-stone-800" />
              <span
                className="absolute -top-1 -right-1 bg-amber-700 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold"
                aria-hidden="true"
              >
                2
              </span>
            </button>

            {/* Shop Now CTA */}
            <button
              onClick={onOpenAuth}
              className="hidden lg:block px-6 py-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500 rounded-sm"
            >
              Shop Now
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-stone-900 focus:outline-none"
              onClick={openMobileMenu}
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        className={`
          fixed inset-0 z-[110] bg-white transition-all duration-700 
          ease-[cubic-bezier(0.85,0,0.15,1)]
          ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        {/* Close Button */}
        <button
          className="absolute top-8 right-8 text-stone-900 p-2"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>

        {/* Mobile Menu Content */}
        <div className="h-full flex flex-col justify-center items-center px-12 text-center">
          <span className="text-[10px] uppercase tracking-[0.5em] text-stone-400 mb-12">
            {NAV_CONFIG.tagline}
          </span>

          {/* Mobile Nav Links */}
          <nav aria-label="Mobile navigation">
            <ul className="flex flex-col gap-8 mb-20">
              {NAV_LINKS.map((link, index) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(e) => scrollToSection(e, link.id)}
                    className="text-4xl sm:text-5xl font-serif text-stone-900 hover:text-amber-800 transition-colors duration-500"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Shop Now CTA */}
          <button
            onClick={() => {
              closeMobileMenu();
              onOpenAuth();
            }}
            className="mb-16 px-10 py-4 bg-stone-900 text-white text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-amber-900 transition-colors"
          >
            Shop Now
          </button>

          {/* Social Links */}
          <ul className="flex gap-8" aria-label="Social media links">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.abbr}>
                <a
                  href={social.url}
                  className="text-[10px] font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                  aria-label={social.name}
                >
                  {social.abbr}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
