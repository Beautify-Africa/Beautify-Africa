import { MARQUEE_TEXT, MARQUEE_CONFIG } from '../data/marqueeContent';
import FadeIn from './FadeIn';

/**
 * Generates repeated text content with separators
 */
const generateContentBlock = () => {
  return [...Array(MARQUEE_CONFIG.repeatCount)].map((_, index) => (
    <span key={index} className="inline-flex items-center">
      {MARQUEE_TEXT}
      <span className="inline-block mx-6 text-amber-700 text-2xl" aria-hidden="true">
        {MARQUEE_CONFIG.separator}
      </span>
    </span>
  ));
};

const MarqueeText = () => {
  const contentBlock = generateContentBlock();

  const textStyles = `
    flex items-center text-4xl md:text-6xl lg:text-7xl font-serif font-bold 
    text-transparent bg-clip-text bg-gradient-to-r from-stone-200 via-amber-100 to-stone-400 
    opacity-90 tracking-tight
  `;

  return (
    <section
      className="relative bg-stone-900 py-16 overflow-hidden border-y border-stone-800 z-20"
      aria-label="Brand values marquee"
    >
      {/* Gradient fade overlays for depth effect */}
      <div
        className="absolute top-0 left-0 w-24 md:w-48 h-full bg-gradient-to-r from-stone-900 to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-0 w-24 md:w-48 h-full bg-gradient-to-l from-stone-900 to-transparent z-10 pointer-events-none"
        aria-hidden="true"
      />

      <FadeIn delay={0.2} className="relative z-20">
        {/* Scrolling marquee content */}
        <div
          className="flex whitespace-nowrap animate-marquee w-fit"
          style={{ '--marquee-duration': MARQUEE_CONFIG.animationDuration }}
          role="marquee"
          aria-live="off"
        >
          {/* Render multiple blocks for seamless looping */}
          {[...Array(MARQUEE_CONFIG.blockCount)].map((_, index) => (
            <p key={index} className={textStyles}>
              {contentBlock}
            </p>
          ))}
        </div>
      </FadeIn>
    </section>
  );
};

export default MarqueeText;
