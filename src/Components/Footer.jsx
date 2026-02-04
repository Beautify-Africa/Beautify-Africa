import {
  FOOTER_BRAND,
  SOCIAL_LINKS,
  FOOTER_NAV_SECTIONS,
  LEGAL_LINKS,
  LOCALE_CONFIG,
  PAYMENT_METHODS,
  COPYRIGHT,
} from '../data/footerContent';
import FadeIn from './FadeIn';

/**
 * Brand section with logo, tagline, and social links
 */
function BrandSection() {
  return (
    <div className="lg:col-span-4 flex flex-col items-start lg:pr-12">
      <a
        href={FOOTER_BRAND.href}
        className="text-4xl md:text-5xl font-serif text-[#faf9f6] tracking-widest mb-4 md:mb-6 block hover:text-stone-300 transition-colors duration-500"
        aria-label={`${FOOTER_BRAND.name} - Go to homepage`}
      >
        {FOOTER_BRAND.name}
      </a>
      <p className="font-serif italic text-lg md:text-xl text-stone-500 mb-8 md:mb-12 font-light">
        {FOOTER_BRAND.tagline}
      </p>
      <nav aria-label="Social media links">
        <ul className="flex flex-wrap items-center gap-6 md:gap-8">
          {SOCIAL_LINKS.map((social) => (
            <li key={social.name}>
              <a
                href={social.href}
                className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#faf9f6] transition-colors relative group"
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.name}
                <span
                  className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#faf9f6] transition-all duration-300 group-hover:w-full"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Navigation column with heading and links
 */
function NavColumn({ section, isFirst }) {
  const columnClass = isFirst
    ? 'lg:col-span-2 lg:col-start-6'
    : 'lg:col-span-2';

  return (
    <nav
      className={columnClass}
      aria-labelledby={section.id}
    >
      <h4
        id={section.id}
        className="text-[#faf9f6] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 md:mb-10"
      >
        {section.title}
      </h4>
      <ul className="grid grid-cols-2 sm:grid-cols-1 gap-3 md:gap-5">
        {section.links.map((link) => (
          <li key={link.name}>
            <a
              href={link.href}
              className="text-[13px] md:text-sm font-light hover:text-[#faf9f6] hover:pl-2 transition-all duration-300 inline-block"
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Legal links section
 */
function LegalLinks() {
  return (
    <nav
      className="flex flex-wrap justify-center gap-4 sm:gap-8 order-2"
      aria-label="Legal information"
    >
      {LEGAL_LINKS.map((link) => (
        <a
          key={link.name}
          href={link.href}
          className="hover:text-stone-400 transition-colors"
        >
          {link.name}
        </a>
      ))}
    </nav>
  );
}

/**
 * Locale selector button
 */
function LocaleSelector() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 hover:text-stone-300 transition-colors border border-stone-800 px-4 py-1.5 rounded-full hover:border-stone-600"
      aria-label={`Change region, currently ${LOCALE_CONFIG.currentLocale}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-stone-500"
        aria-hidden="true"
      />
      <span>{LOCALE_CONFIG.currentLocale}</span>
    </button>
  );
}

/**
 * Payment method icons (placeholder)
 */
function PaymentIcons() {
  return (
    <div
      className="flex gap-2 opacity-20 grayscale"
      role="img"
      aria-label={`Accepted payment methods: ${PAYMENT_METHODS.map(p => p.name).join(', ')}`}
    >
      {PAYMENT_METHODS.map((method) => (
        <div
          key={method.id}
          className="w-7 h-4 bg-stone-800 rounded-[1px] border border-stone-700"
          aria-hidden="true"
          title={method.name}
        />
      ))}
    </div>
  );
}

/**
 * Footer bottom bar with copyright, legal, and locale
 */
function BottomBar() {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8 text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-stone-600 font-medium text-center lg:text-left">
      <p className="order-3 lg:order-1">
        © {COPYRIGHT.year} {COPYRIGHT.company}. {COPYRIGHT.text}
      </p>

      <LegalLinks />

      <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 order-1 lg:order-3">
        <LocaleSelector />
        <PaymentIcons />
      </div>
    </div>
  );
}

/**
 * Footer - Site footer with navigation, brand info, and legal links
 */
export default function Footer() {
  return (
    <footer
      className="bg-stone-950 text-stone-400 pt-20 md:pt-32 pb-8 md:pb-12 border-t border-stone-900"
      role="contentinfo"
    >
      <FadeIn className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">
        {/* Main footer navigation grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-8 mb-16 md:mb-24">
          <BrandSection />

          {FOOTER_NAV_SECTIONS.map((section, index) => (
            <NavColumn
              key={section.id}
              section={section}
              isFirst={index === 0}
            />
          ))}
        </div>

        {/* Divider */}
        <hr
          className="w-full border-0 h-[1px] bg-stone-900 mb-8 md:mb-10"
          aria-hidden="true"
        />

        {/* Bottom bar */}
        <BottomBar />
      </FadeIn>
    </footer>
  );
}
