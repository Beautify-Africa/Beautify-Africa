import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_LINKS, SOCIAL_LINKS, NAV_CONFIG } from '../../data/navigation';
import { CartIcon, MenuIcon } from './Icons';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import CustomerProfileMenu from '../Auth/CustomerProfileMenu';
import AccountAuthDialog from '../Auth/AccountAuthDialog';
import NavbarBrandLogo from './NavbarBrandLogo';
import NavbarDesktopLinks from './NavbarDesktopLinks';
import NavbarMobileMenu from './NavbarMobileMenu';

const Navbar = ({ onOpenCart }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { cartCount } = useCart();
  const { isAuthenticated, isRestoringSession } = useAuth();

  // Show landing-page items only when NOT on the shop page
  const isShopPage = location.pathname === '/shop';

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

    const isHomePage = location.pathname === '/';
    if (!isHomePage) {
      navigate('/');
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
  }, [location.pathname, navigate]);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openAuthDialog = () => setIsAuthDialogOpen(true);

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false);
  }, []);

  const openAuthDialogFromMobileMenu = useCallback(() => {
    closeMobileMenu();
    setIsAuthDialogOpen(true);
  }, []);

  // Focus trap for mobile menu
  const mobileMenuRef = useFocusTrap(isMobileMenuOpen);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

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
          <NavbarBrandLogo brandName={NAV_CONFIG.brandName} />

          {/* Desktop Navigation Links — visible on landing page only */}
          {!isShopPage && <NavbarDesktopLinks links={NAV_LINKS} onLinkClick={scrollToSection} />}

          {/* Action Icons */}
          <div className="flex-1 flex justify-end items-center gap-6 md:gap-8">
            {isShopPage && (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative group"
                aria-label={`Shopping cart${cartCount ? ` with ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
              >
                <CartIcon className="w-5 h-5 text-stone-800" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 bg-amber-700 text-white text-[8px] min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full font-bold"
                    aria-hidden="true"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {isShopPage && <CustomerProfileMenu />}

            {isShopPage && !isRestoringSession && !isAuthenticated && (
              <button
                type="button"
                onClick={openAuthDialog}
                className="rounded-sm border border-stone-900 bg-stone-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:border-amber-900 hover:bg-amber-900"
              >
                Sign In
              </button>
            )}

            {!isShopPage && !isRestoringSession && !isAuthenticated && (
              <button
                type="button"
                onClick={openAuthDialog}
                className="hidden lg:block rounded-sm border border-stone-900 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors duration-500 hover:border-amber-900 hover:bg-amber-900 hover:text-white"
              >
                Sign In
              </button>
            )}

            {/* Shop Now CTA — visible on landing page only */}
            {!isShopPage && (
              <Link
                to="/shop"
                className="hidden lg:block px-6 py-2 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-900 transition-colors duration-500 rounded-sm"
              >
                Shop Now
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
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

      <NavbarMobileMenu
        isOpen={isMobileMenuOpen}
        mobileMenuRef={mobileMenuRef}
        isShopPage={isShopPage}
        closeMobileMenu={closeMobileMenu}
        onScrollToSection={scrollToSection}
        navLinks={NAV_LINKS}
        socialLinks={SOCIAL_LINKS}
        tagline={NAV_CONFIG.tagline}
        isRestoringSession={isRestoringSession}
        isAuthenticated={isAuthenticated}
        onOpenAuthDialogFromMobileMenu={openAuthDialogFromMobileMenu}
      />

      <AccountAuthDialog isOpen={isAuthDialogOpen} onClose={closeAuthDialog} />
    </header>
  );
};

export default Navbar;

