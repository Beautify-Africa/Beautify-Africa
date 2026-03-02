import { useState, useEffect } from 'react';
import {
  FOOTER_BRAND,
  SOCIAL_LINKS,
  FOOTER_NAV_SECTIONS,
  LEGAL_LINKS,
  LOCALE_CONFIG,
  PAYMENT_METHODS,
  COPYRIGHT,
  ROTATING_SOCIAL_SENTENCE,
  SOCIAL_ROTATION_CONFIG,
} from '../../data/footerContent';
import FadeIn from './FadeIn';
import {
  InstagramIcon,
  TikTokIcon,
  PinterestIcon,
  YouTubeIcon,
  FacebookIcon,
  XIcon,
} from './Icons';

const ICON_MAP = [InstagramIcon, TikTokIcon, PinterestIcon, YouTubeIcon, FacebookIcon, XIcon];

const SOCIAL_ICONS = SOCIAL_LINKS.map((link, i) => ({ ...link, Icon: ICON_MAP[i] }));

function RotatingSocialSentence() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SOCIAL_ICONS.length);
        setVisible(true);
      }, SOCIAL_ROTATION_CONFIG.transitionMs);
    }, SOCIAL_ROTATION_CONFIG.intervalMs);
    return () => clearInterval(interval);
  }, []);

  const current = SOCIAL_ICONS[index];
  const { Icon } = current;

  return (
    <p className="font-serif italic text-base md:text-lg text-stone-400 leading-relaxed">
      {ROTATING_SOCIAL_SENTENCE.prefix}{' '}
      <a
        href={current.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Follow us on ${current.name}`}
        className="inline-flex items-center justify-center relative align-middle mx-1 group"
      >
        <span
          style={{
            color: current.color,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.7)',
            transition: 'opacity 0.4s ease, transform 0.4s ease, filter 0.3s ease',
            display: 'inline-flex',
            filter: 'drop-shadow(0 0 6px currentColor)',
          }}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6 transition-colors duration-300" />
        </span>
        <span
          className="absolute -bottom-0.5 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full"
          style={{ backgroundColor: current.color }}
          aria-hidden="true"
        />
      </a>
      {' '}{ROTATING_SOCIAL_SENTENCE.suffix}
    </p>
  );
}

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
      <RotatingSocialSentence />
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

