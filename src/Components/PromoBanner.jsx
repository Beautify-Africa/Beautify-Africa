import { useState, useEffect, useCallback, useRef } from 'react';
import { PROMO_BANNERS } from '../data/promoBanners';

/**
 * PromoBanner - Auto-rotating advertisement carousel for the shop page
 * Displays promotional banners with images, discount info, and CTAs
 */
export default function PromoBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isTransitioning = useRef(false);

  const totalBanners = PROMO_BANNERS.length;

  const goToSlide = useCallback((index) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setActiveIndex(index);
    setTimeout(() => { isTransitioning.current = false; }, 600);
  }, []);

  const goNext = useCallback(() => {
    goToSlide((activeIndex + 1) % totalBanners);
  }, [activeIndex, totalBanners, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide((activeIndex - 1 + totalBanners) % totalBanners);
  }, [activeIndex, totalBanners, goToSlide]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [goNext, isPaused]);



  return (
    <div
      className="relative w-full mb-10 overflow-hidden rounded-lg shadow-lg select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Promotional offers"
      aria-roledescription="carousel"
    >
      {/* Banner Slides */}
      <div className="relative h-[240px] sm:h-[280px] md:h-[320px]">
        {PROMO_BANNERS.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 bg-stone-900 transition-all duration-500 ease-in-out ${index === activeIndex
              ? 'opacity-100 translate-x-0 z-10'
              : index < activeIndex
                ? 'opacity-0 -translate-x-full z-0'
                : 'opacity-0 translate-x-full z-0'
              }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${totalBanners}: ${banner.headline}`}
            aria-hidden={index !== activeIndex}
          >
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src={banner.image}
                alt=""
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} opacity-80`} />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center px-6 sm:px-10 md:px-14">
              <div className="flex-1 max-w-lg">
                {/* Badge */}
                <span className="inline-block px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] bg-white/20 backdrop-blur-sm text-white rounded-full mb-3 border border-white/10">
                  {banner.badge}
                </span>

                {/* Headline */}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-white leading-tight mb-2">
                  {banner.headline}
                </h2>

                {/* Subtext */}
                <p className="text-xs sm:text-sm text-white/80 font-light mb-4 max-w-md">
                  {banner.subtext}
                </p>

                {/* CTA Button */}
                <a
                  href={banner.ctaLink}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-white text-stone-900 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] hover:bg-amber-50 transition-colors duration-300 rounded-sm"
                >
                  {banner.cta}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>

              {/* Decorative right element */}
              <div className="hidden md:flex flex-col items-end justify-center text-right ml-auto pr-4">
                <span className="text-5xl lg:text-6xl font-serif font-bold text-white/20 leading-none">
                  {String(activeIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 mt-1">
                  / {String(totalBanners).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/15 backdrop-blur-sm hover:bg-white/30 transition-colors rounded-full text-white border border-white/10"
        aria-label="Previous offer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/15 backdrop-blur-sm hover:bg-white/30 transition-colors rounded-full text-white border border-white/10"
        aria-label="Next offer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {PROMO_BANNERS.map((banner, index) => (
          <button
            key={banner.id}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${index === activeIndex
              ? 'w-6 h-1.5 bg-white'
              : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
              }`}
            aria-label={`Go to offer ${index + 1}: ${banner.headline}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-20">
          <div
            className="h-full bg-white/50 animate-banner-progress"
            key={activeIndex}
          />
        </div>
      )}
    </div>
  );
}
