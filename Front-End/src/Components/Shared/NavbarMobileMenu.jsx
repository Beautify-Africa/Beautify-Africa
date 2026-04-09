import { Link } from 'react-router-dom';
import { CloseIcon, TrackingIcon } from './Icons';

export default function NavbarMobileMenu({
  isOpen,
  mobileMenuRef,
  isShopPage,
  closeMobileMenu,
  onScrollToSection,
  navLinks,
  socialLinks,
  tagline,
  isRestoringSession,
  isAuthenticated,
  onOpenAuthDialogFromMobileMenu,
}) {
  return (
    <div
      id="mobile-menu"
      ref={mobileMenuRef}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation menu"
      className={`
        fixed inset-0 z-[110] bg-white transition-all duration-700
        ease-[cubic-bezier(0.85,0,0.15,1)]
        ${isOpen ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <button
        type="button"
        className="absolute top-8 right-8 p-2 text-stone-900"
        onClick={closeMobileMenu}
        aria-label="Close menu"
      >
        <CloseIcon />
      </button>

      <div className="flex h-full flex-col items-center justify-center px-12 text-center">
        <span className="mb-12 text-[10px] uppercase tracking-[0.5em] text-stone-400">{tagline}</span>

        {!isShopPage && (
          <nav aria-label="Mobile navigation">
            <ul className="mb-20 flex flex-col gap-8">
              {navLinks.map((link, index) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => onScrollToSection(event, link.id)}
                    className="font-serif text-4xl text-stone-900 transition-colors duration-500 hover:text-amber-800 sm:text-5xl"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {!isShopPage && (
          <Link
            to="/shop"
            onClick={closeMobileMenu}
            className="mb-16 bg-stone-900 px-10 py-4 text-[12px] font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-amber-900"
          >
            Shop Now
          </Link>
        )}

        <Link
          to="/track-orders"
          onClick={closeMobileMenu}
          className={`mb-10 inline-flex items-center gap-3 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
            isShopPage
              ? 'border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white'
              : 'border border-stone-300 text-stone-700 hover:border-stone-900 hover:text-stone-900'
          }`}
        >
          <TrackingIcon className="h-4 w-4" />
          Track Your Order
        </Link>

        {!isRestoringSession && !isAuthenticated && (
          <button
            type="button"
            onClick={onOpenAuthDialogFromMobileMenu}
            className={`px-10 py-4 text-[12px] font-bold uppercase tracking-[0.3em] transition-colors ${
              isShopPage
                ? 'mb-16 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white'
                : 'mb-16 bg-stone-900 text-white hover:bg-amber-900'
            }`}
          >
            Sign In
          </button>
        )}

        <ul className="flex gap-8" aria-label="Social media links">
          {socialLinks.map((social) => (
            <li key={social.abbr}>
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold tracking-widest text-stone-400 transition-colors hover:text-stone-900"
                aria-label={social.name}
              >
                {social.abbr}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
