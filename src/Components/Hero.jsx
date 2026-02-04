import { useState, useCallback, useMemo, useEffect } from 'react';
import InteractiveButton from './InteractiveButton';
import { StarIcon } from './Icons';
import { HERO_BACKGROUND, HERO_CARDS, HERO_CONFIG } from '../data/heroImages';
import { SCATTERED_REVIEWS } from '../data/heroReviews';
import FadeIn from './FadeIn';

/**
 * Generates gold dust particle data for ambient effect
 */
const generateParticles = (count) => {
  return [...Array(count)].map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * -20,
    duration: Math.random() * 10 + 10,
  }));
};

const HeroSection = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('scroll', handleInteraction, { once: true });
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX - innerWidth / 2) / HERO_CONFIG.parallaxIntensity;
    const y = (clientY - innerHeight / 2) / HERO_CONFIG.parallaxIntensity;
    setMousePos({ x, y });
  }, []);

  const goldDust = useMemo(() => generateParticles(HERO_CONFIG.particleCount), []);

  const parallaxTransform = `translate(${mousePos.x * -HERO_CONFIG.parallaxScale}px, ${mousePos.y * -HERO_CONFIG.parallaxScale}px) scale(1.1)`;

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center bg-[#faf9f6]"
      aria-label="Hero banner"
    >
      {/* Background Layer */}
      <div
        className="absolute inset-0 z-0 scale-110 transition-transform duration-700 ease-out pointer-events-none"
        style={{ transform: parallaxTransform }}
        aria-hidden="true"
      >
        <img
          src={HERO_BACKGROUND.src}
          alt=""
          className="w-full h-full object-cover brightness-[1.05] opacity-30 blur-[3px]"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#faf9f6] via-[#faf9f6]/85 to-transparent" />
        <div className="absolute inset-0 bg-stone-100/10 mix-blend-overlay" />
      </div>

      {/* Gold Dust Particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
        {goldDust.map((particle) => (
          <span
            key={particle.id}
            className="absolute bg-amber-400/30 rounded-full blur-[1px] animate-shimmer"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Image Card Stack - Desktop */}
      <aside className="absolute top-0 right-0 w-[55%] h-full z-20 hidden lg:block pointer-events-none">
        {/* Card 1: Serum Bottle */}
        <figure className="absolute top-[8%] right-[8%] w-[200px] aspect-[3/4] z-20 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:-rotate-2 rotate-[12deg] shadow-2xl pointer-events-auto">
          <div className="w-full h-full overflow-hidden rounded-sm bg-stone-100">
            <img
              src={HERO_CARDS[0].src}
              alt={HERO_CARDS[0].alt}
              className="w-full h-full object-cover opacity-95"
            />
            <div className="absolute inset-0 bg-amber-900/5 mix-blend-multiply" />
          </div>
          <figcaption className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-md px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-stone-900 shadow-sm border border-stone-100">
            {HERO_CARDS[0].label}
          </figcaption>
        </figure>

        {/* Card 2: Cream Texture */}
        <figure className="absolute top-[52%] right-[36%] w-[160px] aspect-square z-10 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:rotate-2 rotate-[-15deg] shadow-xl pointer-events-auto">
          <div className="w-full h-full overflow-hidden rounded-sm bg-stone-200 border-4 border-white shadow-inner">
            <img
              src={HERO_CARDS[1].src}
              alt={HERO_CARDS[1].alt}
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <figcaption className="absolute -top-3 -left-3 bg-stone-900 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest">
            {HERO_CARDS[1].label}
          </figcaption>
        </figure>

        {/* Card 3: Model Portrait (Main) */}
        <figure className="absolute bottom-[8%] right-[6%] w-[340px] aspect-[4/5] z-30 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:rotate-0 rotate-[-5deg] shadow-2xl pointer-events-auto">
          <div className="w-full h-full overflow-hidden rounded-sm bg-white">
            <img
              src={HERO_CARDS[2].src}
              alt={HERO_CARDS[2].alt}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-[2s]"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/10 to-transparent mix-blend-overlay" />
          </div>
          <figcaption className="absolute bottom-6 -left-6 bg-white/95 backdrop-blur-md px-6 py-3 shadow-lg border border-stone-100">
            <span className="block text-[8px] text-stone-400 uppercase tracking-widest mb-1">
              {HERO_CARDS[2].sublabel}
            </span>
            <span className="block text-sm font-serif italic text-stone-900">
              {HERO_CARDS[2].label}
            </span>
          </figcaption>
          <span className="absolute top-6 -right-4 bg-stone-900 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest shadow-sm">
            {HERO_CARDS[2].badge}
          </span>
        </figure>

        {/* Card 4: Gold Oil Texture */}
        <figure className="absolute top-[20%] right-[32%] w-[150px] aspect-[2/3] z-10 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-105 hover:-rotate-3 rotate-[8deg] shadow-lg pointer-events-auto opacity-90">
          <div className="w-full h-full overflow-hidden rounded-sm bg-stone-300">
            <img
              src={HERO_CARDS[3].src}
              alt={HERO_CARDS[3].alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-stone-900/5" />
          </div>
        </figure>

        {/* Card 5: Makeup Powder */}
        <figure className="absolute bottom-[35%] right-[24%] w-[170px] aspect-square z-40 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] hover:z-50 hover:scale-110 hover:rotate-6 rotate-[20deg] shadow-2xl pointer-events-auto">
          <div className="w-full h-full overflow-hidden rounded-sm bg-stone-100 p-1.5 bg-white">
            <div className="w-full h-full overflow-hidden bg-stone-200">
              <img
                src={HERO_CARDS[4].src}
                alt={HERO_CARDS[4].alt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <figcaption className="absolute -top-2 right-4 bg-amber-800/90 text-white px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest">
            {HERO_CARDS[4].label}
          </figcaption>
        </figure>
      </aside>

      {/* Image Carousel - Mobile & Tablet */}
      <aside className={`absolute bottom-32 sm:bottom-24 right-4 w-[45%] sm:w-[40%] lg:hidden pointer-events-none transition-all duration-1000 ease-in-out ${hasInteracted ? 'z-0 opacity-20 scale-90 blur-[1px]' : 'z-20'}`}>
        <div className="relative h-[320px] sm:h-[400px] flex items-center justify-center">
          {/* Main featured card - Model Portrait */}
          <figure className="absolute w-full aspect-[3/4] z-30 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-2xl pointer-events-auto">
            <div className="w-full h-full overflow-hidden rounded-sm bg-white">
              <img
                src={HERO_CARDS[2].src}
                alt={HERO_CARDS[2].alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/10 to-transparent mix-blend-overlay" />
            </div>
            <figcaption className="absolute -bottom-3 -left-3 bg-white/95 backdrop-blur-md px-4 py-2 shadow-lg border border-stone-100">
              <span className="block text-[7px] text-stone-400 uppercase tracking-widest mb-0.5">
                {HERO_CARDS[2].sublabel}
              </span>
              <span className="block text-xs font-serif italic text-stone-900">
                {HERO_CARDS[2].label}
              </span>
            </figcaption>
            <span className="absolute top-4 -right-2 bg-stone-900 text-white px-2 py-1 text-[7px] font-bold uppercase tracking-widest shadow-sm">
              {HERO_CARDS[2].badge}
            </span>
          </figure>

          {/* Secondary card - Serum Bottle (top right, smaller) */}
          <figure className="absolute top-0 -right-4 w-[35%] aspect-[3/4] z-10 rotate-[8deg] shadow-xl pointer-events-auto opacity-90">
            <div className="w-full h-full overflow-hidden rounded-sm bg-stone-100">
              <img
                src={HERO_CARDS[0].src}
                alt={HERO_CARDS[0].alt}
                className="w-full h-full object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-amber-900/5 mix-blend-multiply" />
            </div>
            <figcaption className="absolute -bottom-2 -right-2 bg-white/90 backdrop-blur-md px-2 py-1 text-[7px] font-bold uppercase tracking-widest text-stone-900 shadow-sm border border-stone-100">
              {HERO_CARDS[0].label}
            </figcaption>
          </figure>
        </div>
      </aside>

      {/* Editorial Content */}
      <article className={`relative w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 flex flex-col items-start pt-20 transition-all duration-500 ${hasInteracted ? 'z-30' : 'z-10'}`}>
        <header>
          <FadeIn delay={0.2} direction="up">
            <span
              className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-amber-800 mb-6 block"
            >
              Archive Summer '25 Collection
            </span>
          </FadeIn>

          <FadeIn delay={0.4} direction="up" className="relative mb-10 max-w-6xl">
            <h1 className="font-serif text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] leading-[0.85] text-stone-900 tracking-tighter relative z-20">
              The <br />
              <span className="italic font-normal pl-4 md:pl-20 text-stone-800/90">Radiance</span> <br />
              Report.
            </h1>

            {/* Price Label */}
            <div className="absolute -right-4 md:-right-24 bottom-10 hidden sm:flex flex-col items-end origin-right z-20">
              <span className="text-[9px] uppercase tracking-[0.4em] text-stone-400">Starting At</span>
              <span className="text-2xl font-serif text-stone-900">$42.00</span>
            </div>
          </FadeIn>
        </header>

        <FadeIn delay={0.6} direction="up" className="max-w-xl">
          <p className="text-lg md:text-2xl text-stone-700 font-light leading-relaxed mb-12 relative z-20">
            Merging molecular botanical science with the artistry of velvet pigments. A new standard for the illuminating ritual.
          </p>

          <nav className="flex flex-col sm:flex-row items-center gap-8 relative z-20" aria-label="Hero actions">
            <InteractiveButton label="Shop the Archive" primary />
            <button className="group flex items-center gap-4 py-4 text-[10px] font-bold uppercase tracking-[0.4em] text-stone-900">
              Explore the Lab
              <span className="w-12 h-[1px] bg-stone-300 group-hover:w-20 group-hover:bg-amber-800 transition-all duration-700" aria-hidden="true" />
            </button>
          </nav>
        </FadeIn>
      </article>

      {/* Featured Item Sidebar */}
      <aside
        className="absolute right-12 bottom-12 hidden lg:flex flex-col items-end animate-reveal-up"
        style={{ animationDelay: '1s' }}
        aria-label="Featured product"
      >
        <div className="text-right mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-900">Featured Masterpiece</p>
          <p className="text-sm font-serif italic text-stone-500">The Velvet Botanique No. 4</p>
        </div>
        <div className="w-px h-24 bg-gradient-to-b from-stone-200 to-transparent" aria-hidden="true" />
      </aside>

      {/* Scroll Hint */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40 animate-pulse pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[9px] uppercase tracking-[0.4em] origin-center mb-8">Scroll</span>
        <div className="w-px h-10 bg-stone-400" />
      </div>

      {/* Scattered Reviews - Desktop (absolute positioned) */}
      {SCATTERED_REVIEWS.map((review, idx) => (
        <FadeIn
          key={review.id}
          delay={1.2 + idx * 0.1}
          className="absolute flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-amber-100/50 z-20 hover:scale-105 transition-transform duration-300 cursor-default hidden sm:flex"
          style={{
            top: review.top,
            left: review.left,
          }}
        >
          <img
            src={review.image}
            alt={review.name}
            className="w-8 h-8 rounded-full object-cover border border-stone-100"
          />
          <div className="flex flex-col">
            <div className="flex gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-2.5 h-2.5" filled={true} />
              ))}
            </div>
            <span className="text-[10px] font-bold text-stone-600 leading-none mt-1">{review.name}</span>
          </div>
        </FadeIn>
      ))}

      {/* Reviews - Mobile (horizontal scroll at bottom) */}
      <div className="absolute bottom-24 left-0 right-0 z-20 sm:hidden px-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {SCATTERED_REVIEWS.map((review, idx) => (
            <FadeIn
              key={`mobile-${review.id}`}
              delay={1.2 + idx * 0.1}
              className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-amber-100/50 flex-shrink-0 snap-start"
            >
              <img
                src={review.image}
                alt={review.name}
                className="w-8 h-8 rounded-full object-cover border border-stone-100"
              />
              <div className="flex flex-col">
                <div className="flex gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-2.5 h-2.5" filled={true} />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-stone-600 leading-none mt-1 whitespace-nowrap">{review.name}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;


