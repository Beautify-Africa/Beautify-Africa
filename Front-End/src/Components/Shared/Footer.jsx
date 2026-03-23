import { useEffect, useState } from 'react';
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
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import FadeIn from './FadeIn';
import AppLink from './AppLink';
import {
  InstagramIcon,
  TikTokIcon,
  PinterestIcon,
  YouTubeIcon,
  FacebookIcon,
  XIcon,
} from './Icons';

const ICON_MAP = [InstagramIcon, TikTokIcon, PinterestIcon, YouTubeIcon, FacebookIcon, XIcon];
const SOCIAL_ICONS = SOCIAL_LINKS.map((link, index) => ({ ...link, Icon: ICON_MAP[index] }));

function RotatingSocialSentence() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    let transitionTimeoutId;
    const intervalId = window.setInterval(() => {
      setVisible(false);

      transitionTimeoutId = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % SOCIAL_ICONS.length);
        setVisible(true);
      }, SOCIAL_ROTATION_CONFIG.transitionMs);
    }, SOCIAL_ROTATION_CONFIG.intervalMs);

    return () => {
      window.clearInterval(intervalId);
      if (transitionTimeoutId) {
        window.clearTimeout(transitionTimeoutId);
      }
    };
  }, [prefersReducedMotion]);

  const current = SOCIAL_ICONS[index];
  const { Icon } = current;

  return (
    <p className="font-serif italic text-base leading-relaxed text-stone-400 md:text-lg">
      {ROTATING_SOCIAL_SENTENCE.prefix}{' '}
      <a
        href={current.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Follow us on ${current.name}`}
        className="group relative mx-1 inline-flex items-center justify-center align-middle"
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
          <Icon className="h-5 w-5 transition-colors duration-300 md:h-6 md:w-6" />
        </span>
        <span
          className="absolute -bottom-0.5 left-0 h-[1px] w-0 transition-all duration-300 group-hover:w-full"
          style={{ backgroundColor: current.color }}
          aria-hidden="true"
        />
      </a>{' '}
      {ROTATING_SOCIAL_SENTENCE.suffix}
    </p>
  );
}

function BrandSection() {
  return (
    <div className="flex flex-col items-start lg:col-span-4 lg:pr-12">
      <AppLink
        href={FOOTER_BRAND.href}
        className="mb-4 block text-4xl font-serif tracking-widest text-[#faf9f6] transition-colors duration-500 hover:text-stone-300 md:mb-6 md:text-5xl"
        aria-label={`${FOOTER_BRAND.name} - Go to homepage`}
      >
        {FOOTER_BRAND.name}
      </AppLink>
      <p className="mb-8 font-serif text-lg font-light italic text-stone-500 md:mb-12 md:text-xl">
        {FOOTER_BRAND.tagline}
      </p>
      <RotatingSocialSentence />
    </div>
  );
}

function NavColumn({ section, isFirst }) {
  const columnClass = isFirst ? 'lg:col-span-2 lg:col-start-6' : 'lg:col-span-2';

  return (
    <nav className={columnClass} aria-labelledby={section.id}>
      <h4
        id={section.id}
        className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#faf9f6] md:mb-10 md:text-xs"
      >
        {section.title}
      </h4>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-1 md:gap-5">
        {section.links.map((link) => (
          <li key={link.name}>
            <AppLink
              href={link.href}
              className="inline-block text-[13px] font-light transition-all duration-300 hover:pl-2 hover:text-[#faf9f6] md:text-sm"
            >
              {link.name}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function LegalLinks() {
  return (
    <nav className="order-2 flex flex-wrap justify-center gap-4 sm:gap-8" aria-label="Legal information">
      {LEGAL_LINKS.map((link) => (
        <AppLink key={link.name} href={link.href} className="transition-colors hover:text-stone-400">
          {link.name}
        </AppLink>
      ))}
    </nav>
  );
}

function LocaleSelector() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-stone-800 px-4 py-1.5 transition-colors hover:border-stone-600 hover:text-stone-300"
      aria-label={`Change region, currently ${LOCALE_CONFIG.currentLocale}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-stone-500" aria-hidden="true" />
      <span>{LOCALE_CONFIG.currentLocale}</span>
    </button>
  );
}

function PaymentIcons() {
  return (
    <div
      className="flex gap-2 opacity-20 grayscale"
      role="img"
      aria-label={`Accepted payment methods: ${PAYMENT_METHODS.map((method) => method.name).join(', ')}`}
    >
      {PAYMENT_METHODS.map((method) => (
        <div
          key={method.id}
          className="h-4 w-7 rounded-[1px] border border-stone-700 bg-stone-800"
          aria-hidden="true"
          title={method.name}
        />
      ))}
    </div>
  );
}

function BottomBar() {
  return (
    <div className="flex flex-col items-center justify-between gap-6 text-center text-[9px] font-medium uppercase tracking-[0.1em] text-stone-600 lg:flex-row lg:text-left md:gap-8 md:text-[10px]">
      <p className="order-3 lg:order-1">
        Copyright {COPYRIGHT.year} {COPYRIGHT.company}. {COPYRIGHT.text}
      </p>

      <LegalLinks />

      <div className="order-1 flex flex-col items-center gap-4 sm:flex-row md:gap-6 lg:order-3">
        <LocaleSelector />
        <PaymentIcons />
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      className="border-t border-stone-900 bg-stone-950 pt-20 pb-8 text-stone-400 md:pt-32 md:pb-12"
      role="contentinfo"
    >
      <FadeIn className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <div className="mb-16 grid grid-cols-1 gap-10 sm:grid-cols-2 md:mb-24 md:gap-12 lg:grid-cols-12 lg:gap-8">
          <BrandSection />

          {FOOTER_NAV_SECTIONS.map((section, index) => (
            <NavColumn key={section.id} section={section} isFirst={index === 0} />
          ))}
        </div>

        <hr className="mb-8 h-[1px] w-full border-0 bg-stone-900 md:mb-10" aria-hidden="true" />

        <BottomBar />
      </FadeIn>
    </footer>
  );
}
