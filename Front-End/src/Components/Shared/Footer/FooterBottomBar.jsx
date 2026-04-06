import {
  LEGAL_LINKS,
  LOCALE_CONFIG,
  PAYMENT_METHODS,
  COPYRIGHT,
} from '../../../data/footerContent';
import AppLink from '../AppLink';

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

export default function FooterBottomBar() {
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
