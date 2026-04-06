import { FOOTER_NAV_SECTIONS } from '../../data/footerContent';
import FadeIn from './FadeIn';
import FooterBottomBar from './Footer/FooterBottomBar';
import FooterBrandSection from './Footer/FooterBrandSection';
import FooterNavColumn from './Footer/FooterNavColumn';

export default function Footer() {
  return (
    <footer
      className="border-t border-stone-900 bg-stone-950 pt-20 pb-8 text-stone-400 md:pt-32 md:pb-12"
      role="contentinfo"
    >
      <FadeIn className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <div className="mb-16 grid grid-cols-1 gap-10 sm:grid-cols-2 md:mb-24 md:gap-12 lg:grid-cols-12 lg:gap-8">
          <FooterBrandSection />

          {FOOTER_NAV_SECTIONS.map((section, index) => (
            <FooterNavColumn key={section.id} section={section} isFirst={index === 0} />
          ))}
        </div>

        <hr className="mb-8 h-[1px] w-full border-0 bg-stone-900 md:mb-10" aria-hidden="true" />

        <FooterBottomBar />
      </FadeIn>
    </footer>
  );
}
