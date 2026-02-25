import { useState, useCallback, useEffect } from 'react';
import InteractiveButton from './InteractiveButton';
import FadeIn from './FadeIn';
import HeroBackground from './HeroBackground';
import HeroCards from './HeroCards';
import HeroReviews from './HeroReviews';
import { HERO_CONFIG, HERO_COPY } from '../data/heroImages';

/**
 * HeroSection — orchestrates background, cards, reviews, and editorial content
 */
const HeroSection = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);

  // Mark interaction on first scroll / click / touch for mobile UX
  useEffect(() => {
    const onInteract = () => setHasInteracted(true);
    window.addEventListener('scroll', onInteract, { once: true });
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('touchstart', onInteract, { once: true });
    return () => {
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('click', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX - window.innerWidth / 2) / HERO_CONFIG.parallaxIntensity;
    const y = (e.clientY - window.innerHeight / 2) / HERO_CONFIG.parallaxIntensity;
    setMousePos({ x, y });
  }, []);

  const parallaxTransform = `translate(${mousePos.x * -HERO_CONFIG.parallaxScale}px, ${mousePos.y * -HERO_CONFIG.parallaxScale}px) scale(1.1)`;

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center"
      aria-label="Hero banner"
    >
      {/* Background + overlay + particles */}
      <HeroBackground parallaxTransform={parallaxTransform} />

      {/* Desktop card stack + mobile carousel */}
      <HeroCards hasInteracted={hasInteracted} />

      {/* Editorial content */}
      <article
        className={`relative w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 flex flex-col items-start pt-20 transition-all duration-500 ${hasInteracted ? 'z-30' : 'z-10'
          }`}
      >
        <header>
          <FadeIn delay={0.2} direction="up">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-amber-800 mb-6 block">
              {HERO_COPY.collectionLabel}
            </span>
          </FadeIn>

          <FadeIn delay={0.4} direction="up" className="relative mb-10 max-w-6xl">
            <h1 className="font-serif text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] leading-[0.85] text-stone-900 tracking-tighter relative z-20">
              {HERO_COPY.headlineParts[0]} <br />
              <span className="italic font-normal pl-4 md:pl-20 text-stone-800/90">
                {HERO_COPY.headlineParts[1]}
              </span>{' '}
              <br />
              {HERO_COPY.headlineParts[2]}
            </h1>

            {/* Price label */}
            <div className="absolute -right-4 md:-right-24 bottom-10 hidden sm:flex flex-col items-end origin-right z-20">
              <span className="text-[9px] uppercase tracking-[0.4em] text-stone-400">
                {HERO_COPY.priceLabel}
              </span>
              <span className="text-2xl font-serif text-stone-900">{HERO_COPY.priceValue}</span>
            </div>
          </FadeIn>
        </header>

        <FadeIn delay={0.6} direction="up" className="max-w-xl">
          <p className="text-lg md:text-2xl text-stone-700 font-light leading-relaxed mb-12 relative z-20">
            {HERO_COPY.subtitle}
          </p>

          <nav className="flex flex-col sm:flex-row items-center gap-8 relative z-20" aria-label="Hero actions">
            <InteractiveButton label={HERO_COPY.primaryCta} primary />
            <button
              className="group flex items-center gap-4 py-4 text-[10px] font-bold uppercase tracking-[0.4em] text-stone-900"
              aria-label={HERO_COPY.secondaryCtaAriaLabel}
            >
              {HERO_COPY.secondaryCta}
              <span
                className="w-12 h-[1px] bg-stone-300 group-hover:w-20 group-hover:bg-amber-800 transition-all duration-700"
                aria-hidden="true"
              />
            </button>
          </nav>
        </FadeIn>
      </article>

      {/* Featured item sidebar */}
      <aside
        className="absolute right-12 bottom-12 hidden lg:flex flex-col items-end animate-reveal-up"
        style={{ animationDelay: '1s' }}
        aria-label="Featured product"
      >
        <div className="text-right mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-900">
            {HERO_COPY.featuredLabel}
          </p>
          <p className="text-sm font-serif italic text-stone-500">{HERO_COPY.featuredProduct}</p>
        </div>
        <div className="w-px h-24 bg-gradient-to-b from-stone-200 to-transparent" aria-hidden="true" />
      </aside>

      {/* Scroll hint */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40 animate-pulse pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[9px] uppercase tracking-[0.4em] origin-center mb-8">
          {HERO_COPY.scrollHint}
        </span>
        <div className="w-px h-10 bg-stone-400" />
      </div>

      {/* Review chips */}
      <HeroReviews />
    </section>
  );
};

export default HeroSection;
