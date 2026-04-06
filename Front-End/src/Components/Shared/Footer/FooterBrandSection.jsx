import { FOOTER_BRAND } from '../../../data/footerContent';
import AppLink from '../AppLink';
import RotatingSocialSentence from './RotatingSocialSentence';

export default function FooterBrandSection() {
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
